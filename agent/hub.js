export default function ({
  node,     // Agent name
  cert,     // Agent certificate
  key,      // Agent private key
  address,  // Hub address
  admin,    // Admin service pipeline
}) {

  var services = {}

  var session = pipeline($=>$
    .muxHTTP(() => '', { version: 2 }).to($=>$
      .connectTLS({
        certificate: { cert, key },
      }).to($=>$
        .connect(address)
      )
    )
  )

  var $response = null

  var request = pipeline($=>$
    .onStart(msg => msg)
    .pipe(session)
    .handleMessage(msg => $response = msg)
    .onEnd(() => $response)
  )

  var reApiServices = new RegExp('^/api/services/(.*)$')

  var $service

  var connectAdmin = pipeline($=>$
    .pipe(admin)
  )

  var connectPort = pipeline($=>$
    .connect(() => `${$service.host}:${$service.port}`)
  )

  var acceptTunnel = pipeline($=>$
    .acceptHTTPTunnel(
      function (req) {
        var tok = reApiServices.exec(req.path)
        if (tok === null) return new Message({ status: 405 })
        $service = services[tok[1]]
        if (!$service) return new Message({ status: 404 })
        return new Message({ status: 200 })
      }
    ).to($=>$
      .pipe(
        function () {
          return connectPort
        }
      )
    )
  )

  var notFound = pipeline($=>$
    .replaceMessage(
      new Message({ status: 404 })
    )
  )

  var reverseServer = pipeline($=>$
    .onStart(new Data)
    .repeat(() => new Timeout(5).wait().then(true)).to($=>$
      .loop($=>$
        .connectHTTPTunnel(
          new Message({
            method: 'CONNECT',
            path: `/api/nodes/${node}`,
          })
        )
        .pipe(session)
        .demuxHTTP().to($=>$
          .pipe(
            function (evt) {
              if (evt instanceof MessageStart) {
                if (evt.head.method === 'CONNECT') return acceptTunnel
                return notFound
              }
            }
          )
        )
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
        path: `/api/nodes/${node}/services`,
      },
      JSON.encode(Object.values(services).map(
        ({ name, protocol }) => ({ name, protocol })
      ))
    )
    if (!isUpdating) sendServiceList()
  }

  function sendServiceList() {
    if (serviceListUpdate) {
      request.spawn(serviceListUpdate).then(
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

  function discoverNodes() {
    request.spawn(
      new Message({ method: 'GET', path: '/api/nodes' })
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

  function discoverServices(node) {
    request.spawn(
      new Message({ method: 'GET', path: `/api/nodes/${node}/services`})
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

  return {
    discoverNodes,
    discoverServices,
    publishService,
    deleteService,
  }
}
