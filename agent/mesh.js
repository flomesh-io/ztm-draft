export default function (agent, bootstraps) {

  var services = []
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
}

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

  function updateServiceList() {
    var isUpdating = Boolean(serviceListUpdate)
    serviceListUpdate = new Message(
      {
        method: 'POST',
        path: `/api/services`,
      },
      JSON.encode(Object.values(services).map(
        ({ name, protocol }) => ({ name, protocol })
      ))
    )
    if (!isUpdating) sendServiceList()
  }

  function sendServiceList() {
    if (serviceListUpdate) {
      requestHub.spawn(serviceListUpdate).then(
        function (res) {
          if (res && res.head.status === 200) {
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
    requestHub.spawn(
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

  function discoverServices() {
    requestHub.spawn(
      new Message({ method: 'GET', path: `/api/services`})
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

  function publishService(service) {
    services[service.name] = service
    updateServiceList()
  }

  function deleteService(name) {
    delete services[name]
    updateServiceList()
  }

  function status() {
    return 'OK'
  }

  function leave() {
  }

  return {
    heartbeat,
    discoverEndpoints,
    discoverServices,
    publishService,
    deleteService,
    status,
    leave,
  }
}
