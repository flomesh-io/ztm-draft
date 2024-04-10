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
      meshes[mesh.name] = Mesh(mesh.agent, mesh.bootstraps)
    }
  )

  db.allServices().forEach(
    function (s) {
      var mesh = meshes[s.mesh]
      mesh.publishService(s)
    }
  )

  db.allPorts().forEach(
    function ({ protocol, listen, target }) {
      var mesh = meshes[target.mesh]
      mesh.openPort(listen.ip, listen.port, protocol, target.service, target.endpoint)
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
  mesh = meshes[mesh]
  if (!mesh) return Promise.resolve([])
  return mesh.discoverServices(ep).then(
    function (list) {
      list.forEach(svc => {
        svc.isDiscovered = true
        svc.isLocal = false
      })
      if (!ep || ep === mesh.agent.id) {
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
                  id: mesh.agent.id,
                  name: mesh.agent.name,
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
      return list
    }
  )
}

function getService(mesh, ep, proto, name) {
  return allServices(mesh, ep).then(
    list => list.find(svc => svc.name === name && svc.protocol === proto)
  )
}

function setService(mesh, ep, proto, name, service) {
  findMesh(mesh).publishService({ ...service, name, protocol: proto })
  db.setService(mesh, proto, name, service)
  return getService(mesh, ep, proto, name)
}

function delService(mesh, ep, proto, name) {
  findMesh(mesh).deleteService(proto, name)
  db.delService(mesh, proto, name)
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
  return db.allPorts()
}

function getPort(mesh, ep, ip, proto, port) {
  return db.getPort(ip, proto, port)
}

function setPort(mesh, ep, ip, proto, port, obj) {
  findMesh(mesh).openPort(ip, port, proto, obj.target.service, obj.target.endpoint)
  db.setPort(ip, proto, port, obj)
  return db.getPort(ip, proto, port)
}

function delPort(mesh, ep, ip, proto, port) {
  findMesh(mesh).closePort(ip, port, proto)
  db.delPort(ip, proto, port)
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
