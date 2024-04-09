export default function (agent, bootstraps) {
  var services = []

  //
  // Class Hub
  // Management of the interaction with a single hub instance
  //

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
        .connect(address, {
          onState: function (ob) {
            if (ob.state === 'connected' && serviceList) {
              updateServiceList(serviceList)
            }
          }
        })
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

    // Establish a pull session to the hub
    reverseServer.spawn()

    var serviceList = null
    var serviceListUpdateMsg = null

    function updateServiceList(list) {
      serviceList = list
      var isSending = Boolean(serviceListUpdateMsg)
      serviceListUpdateMsg = new Message(
        {
          method: 'POST',
          path: `/api/services`,
        },
        JSON.encode(list)
      )
      if (!isSending) sendServiceList()
    }

    function sendServiceList() {
      if (serviceListUpdateMsg) {
        requestHub.spawn(serviceListUpdateMsg).then(
          function (res) {
            if (res && res.head.status === 201) {
              serviceListUpdateMsg = null
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

    function findEndpoint(ep) {
      return requestHub.spawn(
        new Message({ method: 'GET', path: `/api/endpoints/${ep}`})
      ).then(
        function (res) {
          if (res && res.head.status === 200) {
            return JSON.decode(res.body)
          } else {
            return null
          }
        }
      )
    }

    function findService(svc) {
      return requestHub.spawn(
        new Message({ method: 'GET', path: `/api/services/${svc}`})
      ).then(
        function (res) {
          if (res && res.head.status === 200) {
            return JSON.decode(res.body)
          } else {
            return null
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
      findEndpoint,
      findService,
      status,
      leave,
    }

  } // End of class Hub

  var matchServices = new http.Match('/api/services/{proto}/{svc}')
  var response200 = new Message({ status: 200 })
  var response404 = new Message({ status: 404 })

  var $requestedService
  var $selectedEp
  var $selectedHub

  // Agent serving requests from the hubs
  var agentService = pipeline($=>$
    .demuxHTTP().to($=>$
      .pipe(
        function (evt) {
          if (evt instanceof MessageStart) {
            if (evt.head.method === 'CONNECT') {
              var params = matchServices(evt.head.path)
              if (params) return proxyToLocal
            }
            return notFound
          }
        }
      )
    )
  )

  // Agent proxying to local services: mesh -> local
  var proxyToLocal = pipeline($=>$
    .acceptHTTPTunnel(
      function (req) {
        var params = matchServices(req.head.path)
        if (params) {
          var protocol = params.proto
          var name = params.svc
          $requestedService = services.find(s => s.protocol === protocol && s.name === name)
          if ($requestedService) return response200
        }
        return response404
      }
    ).to($=>$
      .connect(() => `${$requestedService.host}:${$requestedService.port}`)
    )
  )

  // Agent proxying to remote services: local -> mesh
  var proxyToMesh = (proto, svc, ep) => pipeline($=>$
    .onStart(() => {
      if (ep) {
        return selectHub(svc, ep).then(hub => {
          $selectedEp = ep
          $selectedHub = hub
        })
      } else {
        return selectEndpoint(svc).then(ep => {
          $selectedEp = ep
          return selectHub(svc, ep)
        }).then(hub => { $selectedHub = hub })
      }
    })
    .connectHTTPTunnel(() => (
      new Message({
        method: 'CONNECT',
        path: `/api/endpoints/${$selectedEp}/services/${proto}/${svc}`,
      })
    )).to($=>$
      .muxHTTP(() => 1, { version: 2 }).to($=>$
        .connect(() => $selectedHub)
      )
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

  function selectEndpoint(svc) {
    return hubs[0].findService(svc).then(
      function (service) {
        if (!service) return null
        var ep = service.endpoints[0]
        return ep ? ep.id : null
      }
    )
  }

  function selectHub(svc, ep) {
    return hubs[0].findEndpoint(ep).then(
      function (endpoint) {
        if (!endpoint) return null
        var hubs = endpoint.hubs
        return hubs ? hubs[0] : null
      }
    )
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

  function openPort(ip, port, protocol, service, endpoint) {
    switch (protocol) {
      case 'tcp':
        pipy.listen(`${ip}:${port}`, proxyToMesh(protocol, service, endpoint))
        break
      default: throw `Invalid protocol: ${protocol}`
    }
  }

  function closePort(ip, port, protocol) {
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
    openPort,
    closePort,
    status,
    leave,
  }
}
