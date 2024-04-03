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
      return notFound
    },
  },

  '/api/services': {
    'GET': function () {
      return notFound
    },

    'POST': function () {
      return agentPublish
    },
  },

  '/api/status': {
    'POST': function () {
      return notFound
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

var $agent = null
var $params = null

pipy.listen(opt['--listen'], $=>$
  .onStart(
    function () {
      $agent = {}
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
  .replaceMessage(new Message({ status: 404 }))
)

var notSupported = pipeline($=>$
  .replaceData()
  .replaceMessage(new Message({ status: 405 }))
)

var agentSession = pipeline($=>$
  .acceptHTTPTunnel(
    function () {
      $agent.id = $params.ep
      console.info('Agent session established with ID =', $agent.id)
      return new Message({ status: 200 })
    }
  ).to($=>$

  )
)

var agentPublish = pipeline($=>$
  .replaceMessage(
    function (req) {
      var list = JSON.decode(req.body)
      println(list)
      return new Message({ status: 201 })
    }
  )
)
