import db from './db.js'
import Mesh from './mesh.js'

//
// Data sources:
//   Local storage:
//     - Meshes
//     - Services (self)
//     - Ports
//   Mesh:
//     - Endpoints
//     - Services (others)
//

var meshes = {}

function findMesh(name) {
  var m = meshes[name]
  if (m) return m
  throw `Mesh not found: ${name}`
}

function init() {
  db.allMeshes().forEach(
    function (mesh) {
      meshes[mesh.name] = Mesh(mesh.name, mesh.agent, mesh.bootstraps)
    }
  )

  db.allServices().forEach(
    function (s) {
      var mesh = meshes[s.mesh]
      mesh.publishService(s)
    }
  )

  db.allPorts().forEach(
    function (p) {
      var listen = p.listen
      var target = p.target
      var mesh = meshes[p.mesh]
      mesh.openPort(listen.ip, listen.port, p.protocol, target.service, target.endpoint)
    }
  )
}

function allMeshes() {
  return Object.entries(meshes).map(
    ([name, mesh]) => ({
      name,
      agent: { ...mesh.agent },
      bootstraps: [ ...mesh.bootstraps ],
      status: mesh.status(),
    })
  )
}

function getMesh(name) {
  var mesh = meshes[name]
  if (mesh) {
    return {
      name,
      agent: { ...mesh.agent },
      bootstraps: [ ...mesh.bootstraps ],
      status: mesh.status(),
    }
  }
  return null
}

function setMesh(name, mesh) {
  db.setMesh(name, mesh)
  var old = meshes[name]
  if (old) {
    old.leave()
    delete meshes[name]
  }
  mesh = db.getMesh(name)
  meshes[name] = Mesh(mesh.agent, mesh.bootstraps)
  return getMesh(name)
}

function delMesh(name) {
  db.delMesh(name)
  var old = meshes[name]
  if (old) {
    old.leave()
    delete meshes[name]
  }
}

function allEndpoints(mesh) {
  mesh = meshes[mesh]
  if (!mesh) return Promise.resolve([])
  var id = mesh.agent.id
  return mesh.discoverEndpoints().then(
    list => list.map(ep => ({ ...ep, isLocal: (ep.id === id) }))
  )
}

function allServices(mesh, ep) {
  var m = findMesh(mesh)
  if (!m) return Promise.resolve([])
  if (ep && ep !== m.agent.id) {
    return m.remoteQueryServices(ep)
  } else {
    return m.discoverServices(ep).then(
      function (list) {
        list.forEach(svc => {
          svc.isDiscovered = true
          svc.isLocal = false
        })
        if (!ep || ep === m.agent.id) {
          db.allServices().forEach(
            function (local) {
              var name = local.name
              var protocol = local.protocol
              var svc = list.find(s => s.name === name && s.protocol === protocol)
              if (svc) {
                svc.isLocal = true
                svc.host = local.host
                svc.port = local.port
              } else {
                list.push({
                  name,
                  protocol,
                  endpoints: [{
                    id: m.agent.id,
                    name: m.agent.name,
                  }],
                  isDiscovered: false,
                  isLocal: true,
                  host: local.host,
                  port: local.port,
                })
              }
            }
          )
        }
        var id = m.agent.id
        list.forEach(svc => (
          svc.endpoints.forEach(ep => {
            if (ep.id === id) ep.isLocal = true
          })
        ))
        return list
      }
    )
  }
}

function getService(mesh, ep, proto, name) {
  return allServices(mesh, ep).then(
    list => list.find(svc => svc.name === name && svc.protocol === proto)
  )
}

function setService(mesh, ep, proto, name, service) {
  var m = findMesh(mesh)
  if (ep && ep !== m.agent.id) {
    return m.remotePublishService(ep, proto, name, service)
  } else {
    m.publishService({ ...service, name, protocol: proto })
    db.setService(mesh, proto, name, service)
    return getService(mesh, ep, proto, name)
  }
}

function delService(mesh, ep, proto, name) {
  var m = findMesh(mesh)
  if (ep && ep !== m.agent.id) {
    return m.remoteDeleteService(ep, proto, name)
  } else {
    m.deleteService(proto, name)
    db.delService(mesh, proto, name)
    return Promise.resolve()
  }
}

function allUsers(mesh, ep, svc) {
}

function getUser(mesh, ep, svc, name) {
}

function setUser(mesh, ep, svc, name, user) {
}

function delUser(mesh, ep, svc, name) {
}

function allPorts(mesh, ep) {
  return db.allPorts(mesh)
}

function getPort(mesh, ep, ip, proto, port) {
  return db.getPort(mesh, ip, proto, port)
}

function setPort(mesh, ep, ip, proto, port, obj) {
  findMesh(mesh).openPort(ip, port, proto, obj.target.service, obj.target.endpoint)
  db.setPort(mesh, ip, proto, port, obj)
  return db.getPort(mesh, ip, proto, port)
}

function delPort(mesh, ep, ip, proto, port) {
  findMesh(mesh).closePort(ip, port, proto)
  db.delPort(mesh, ip, proto, port)
}

export default {
  init,
  allMeshes,
  getMesh,
  setMesh,
  delMesh,
  allEndpoints,
  allServices,
  getService,
  setService,
  delService,
  allUsers,
  getUser,
  setUser,
  delUser,
  allPorts,
  getPort,
  setPort,
  delPort,
}
