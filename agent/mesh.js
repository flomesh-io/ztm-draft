export default function (agent, bootstraps) {
  var services = []

  function Hub(
    agent,    // Agent { id, name, certificate, privateKey }
    address,  // Hub address
    serve,    // Agent service pipeline
  ) {

    //
    //    requestHub ---\
    //                   \-->
    //                        hubSession <---> Hub
    //                   /---
    // reverseServer <--/
    //

    var $response

    // Agent-to-hub connection, multiplexed with HTTP/2
    var hubSession = pipeline($=>$
      .muxHTTP(() => '', { version: 2 }).to($=>$
        .connect(address)
      )
    )

    // Send a request to the hub
    var requestHub = pipeline($=>$
      .onStart(msg => msg)
      .pipe(hubSession)
      .handleMessage(msg => $response = msg)
      .replaceMessage(new StreamEnd)
      .onEnd(() => $response)
    )

    // Hook up to the hub and receive orders
    var reverseServer = pipeline($=>$
      .onStart(new Data)
      .repeat(() => new Timeout(5).wait().then(true)).to($=>$
        .loop($=>$
          .connectHTTPTunnel(
            new Message({
              method: 'CONNECT',
              path: `/api/endpoints/${agent.id}`,
            })
          )
          .to(hubSession)
          .pipe(serve)
        )
      )
    )

    reverseServer.spawn()

    var serviceListUpdate = null

    function updateServiceList(list) {
      var isSending = Boolean(serviceListUpdate)
      serviceListUpdate = new Message(
        {
          method: 'POST',
          path: `/api/services`,
        },
        JSON.encode(list)
      )
      if (!isSending) sendServiceList()
    }

    function sendServiceList() {
      if (serviceListUpdate) {
        requestHub.spawn(serviceListUpdate).then(
          function (res) {
            if (res && res.head.status === 201) {
              serviceListUpdate = null
            } else {
              new Timeout(5).wait().then(sendServiceList)
            }
          }
        )
      }
    }

    function heartbeat() {
      requestHub.spawn(
        new Message(
          { method: 'POST', path: '/api/status' },
          JSON.encode({ name: agent.name })
        )
      )
    }

    function discoverEndpoints() {
      return requestHub.spawn(
        new Message({ method: 'GET', path: '/api/endpoints' })
      ).then(
        function (res) {
          if (res && res.head.status === 200) {
            return JSON.decode(res.body)
          } else {
            return []
          }
        }
      )
    }

    function discoverServices(ep) {
      return requestHub.spawn(
        new Message({ method: 'GET', path: ep ? `/api/endpoints/${ep}/services` : '/api/services' })
      ).then(
        function (res) {
          if (res && res.head.status === 200) {
            return JSON.decode(res.body)
          } else {
            return []
          }
        }
      )
    }

    function status() {
      return 'OK'
    }

    function leave() {
    }

    return {
      heartbeat,
      updateServiceList,
      discoverEndpoints,
      discoverServices,
      status,
      leave,
    }
  }

  var response200 = new Message({ status: 200 })
  var response404 = new Message({ status: 404 })
  var matchServices = new http.Match('/api/services/{proto}/{svc}')

  // Agent serving requests from the hub
  var agentService = pipeline($=>$
    .demuxHTTP().to($=>$
      .pipe(
        function (evt) {
          if (evt instanceof MessageStart) {
            if (evt.head.method === 'CONNECT') {
              var params = matchServices(eve.head.path)
              if (params) return 
              return agentAccept
            }
            return notFound
          }
        }
      )
    )
  )

  // Agent accepting tunnels to its services
  var agentAccept = pipeline($=>$
    .acceptHTTPTunnel(
      function (req) {
        var params = matchServices(req.path)
        if (params) {
          var protocol = params.proto
          var name = params.svc
          $service = services.find(s => s.protocol === protocol && s.name === name)
          if ($service) return response200
        }
        return response404
      }
    ).to($=>$
      .connect(() => `${$service.host}:${$service.port}`)
    )
  )

  // Connect to all hubs
  var hubs = bootstraps.map(
    addr => Hub(agent, addr, agentService)
  )

  // Start sending heartbeats
  heartbeat()
  function heartbeat() {
    hubs.forEach(h => h.heartbeat())
    new Timeout(15).wait().then(heartbeat)
  }

  function discoverEndpoints() {
    return hubs[0].discoverEndpoints()
  }

  function discoverServices(ep) {
    return hubs[0].discoverServices(ep)
  }

  function publishService(service) {
    var protocol = service.protocol
    var name = service.name
    var host = service.host
    var port = service.port
    var old = services.find(s => s.protocol == protocol && s.name === name)
    if (old) {
      old.host = host
      old.port = port
    } else {
      services.push({
        protocol,
        name,
        host,
        port,
      })
    }
    updateServiceList()
  }

  function deleteService(protocol, name) {
    var old = services.find(s => s.protocol == protocol && s.name === name)
    if (old) {
      services.splice(services.indexOf(old), 1)
      updateServiceList()
    }
  }

  function updateServiceList() {
    var list = services.map(({ name, protocol }) => ({ name, protocol }))
    hubs.forEach(hub => hub.updateServiceList(list))
  }

  function status() {
    return hubs[0].status()
  }

  function leave() {
    hubs.forEach(hub => hub.leave())
  }

  return {
    agent,
    bootstraps,
    discoverEndpoints,
    discoverServices,
    publishService,
    deleteService,
    status,
    leave,
  }
}
