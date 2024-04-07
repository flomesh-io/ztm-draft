#!/usr/bin/env -S pipy --skip-unknown-arguments

import options from './options.js'

var opt = options({
  defaults: {
    '--help': false,
    '--listen': '0.0.0.0:8888',
  },
  shorthands: {
    '-h': '--help',
    '-l': '--listen',
  },
})

if (options['--help']) {
  println('Options:')
  println('  -h, --help      Show available options')
  println('  -l, --listen    Port number to listen (default: 0.0.0.0:8888)')
  return
}

var routes = Object.entries({

  '/api/endpoints/{ep}': {
    'CONNECT': function () {
      return agentSession
    },
  },

  '/api/endpoints': {
    'GET': function () {
      return getEndpoints
    },
  },

  '/api/endpoints/{ep}/services': {
    'GET': function () {
      return getServices
    },
  },

  '/api/services': {
    'GET': function () {
      return getServices
    },

    'POST': function () {
      return findEndpoint() ? postServices : noSession
    },
  },

  '/api/status': {
    'POST': function () {
      return findEndpoint() ? postStatus : noSession
    },
  },

}).map(
  function ([path, methods]) {
    var match = new http.Match(path)
    var handler = function (params, req) {
      var f = methods[req.head.method]
      if (f) return f(params, req)
      return notSupported
    }
    return { match, handler }
  }
)

var endpoints = {}

var $agent = null
var $params = null
var $endpoint = null

pipy.listen(opt['--listen'], $=>$
  .onStart(
    function (ib) {
      $agent = {
        ip: ib.remoteAddress,
        port: ib.remotePort,
      }
    }
  )
  .demuxHTTP().to($=>$
    .pipe(
      function (evt) {
        if (evt instanceof MessageStart) {
          var path = evt.head.path
          var route = routes.find(r => Boolean($params = r.match(path)))
          if (route) return route.handler($params, evt)
          return notFound
        }
      }
    )
  )
)

var notFound = pipeline($=>$
  .replaceData()
  .replaceMessage(response(404))
)

var notSupported = pipeline($=>$
  .replaceData()
  .replaceMessage(response(405))
)

var noSession = pipeline($=>$
  .replaceData()
  .replaceMessage(response(404, 'No agent session established yet'))
)

var agentSession = pipeline($=>$
  .acceptHTTPTunnel(
    function () {
      $agent.id = $params.ep
      console.info('Agent session established with ID =', $agent.id)
      return response(200)
    }
  ).to($=>$
  )
)

var getEndpoints = pipeline($=>$
  .replaceData()
  .replaceMessage(
    () => response(200, Object.values(endpoints).map(
      ep => ({
        id: ep.id,
        name: ep.name,
        certificate: ep.certificate,
        ip: ep.ip,
        port: ep.port,
        heartbeat: ep.heartbeat,
        status: 'OK',
      })
    ))
  )
)

var getServices = pipeline($=>$
  .replaceData()
  .replaceMessage(
    function () {
      var services = []
      var collect = (ep) => {
        ep.services?.forEach?.(
          function (svc) {
            var name = svc.name
            var protocol = svc.protocol
            var s = services.find(s => s.name === name && s.protocol === protocol)
            if (!s) services.push(s = { name, protocol, endpoints: [] })
            s.endpoints.push({ id: ep.id, name: ep.name })
          }
        )
      }
      if ($params.ep) {
        var ep = endpoints[$params.ep]
        if (ep) collect(ep)
      } else {
        Object.values(endpoints).forEach(collect)
      }
      return response(200, services)
    }
  )
)

var postServices = pipeline($=>$
  .replaceMessage(
    function (req) {
      $endpoint.services = JSON.decode(req.body)
      return new Message({ status: 201 })
    }
  )
)

var postStatus = pipeline($=>$
  .replaceMessage(
    function (req) {
      var info = JSON.decode(req.body)
      Object.assign(
        $endpoint, {
          name: info.name,
          heartbeat: Date.now(),
        }
      )
      return new Message({ status: 201 })
    }
  )
)

function findEndpoint() {
  if (!$agent.id) return false
  $endpoint = (endpoints[$agent.id] ??= { ...$agent })
  return true
}

function response(status, body) {
  if (!body) return new Message({ status })
  if (typeof body === 'string') return responseCT(status, 'text/plain', body)
  return responseCT(status, 'application/json', JSON.encode(body))
}

function responseCT(status, ct, body) {
  return new Message(
    {
      status,
      headers: { 'content-type': ct }
    },
    body
  )
}
