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

function init() {
  db.allMeshes().forEach(
    function (mesh) {
      meshes[mesh.name] = Mesh(mesh.agent, mesh.bootstraps)
    }
  )

  db.allServices().forEach(
    function (svc) {
      Object.values(meshes).forEach(
        mesh => mesh.publishService(svc)
      )
    }
  )
}

function allMeshes() {
  var all = db.allMeshes()
  all.forEach(
    function (obj) {
      var mesh = meshes[obj.name]
      if (mesh) {
        obj.status = mesh.status()
      } else {
        obj.status = 'Unknown'
      }
    }
  )
  return all
}

function getMesh(name) {
  var obj = db.getMesh(name)
  obj.status = 'OK'
  return obj
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
  return mesh
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
  return [getEndpoint(mesh)]
}

function getEndpoint(mesh, id) {
  return {
    id: '88888888-8888-8888-8888-888888888888',
    name: 'test-node',
    isLocal: true,
    certificate: '',
    ip: '127.0.0.1',
    port: 12345,
    heartbeat: Date.now(),
    status: 'OK',
  }
}

function allServices(mesh, ep) {
  return db.allServices()
}

function getService(mesh, ep, proto, name) {
  return db.getService(proto, name)
}

function setService(mesh, ep, proto, name, service) {
  db.setService(proto, name, service)
  return db.getService(proto, name, service)
}

function delService(mesh, ep, proto, name) {
  db.delService(proto, name)
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
  db.setPort(ip, proto, port, obj)
  return db.getPort(ip, proto, port)
}

function delPort(mesh, ep, ip, proto, port) {
  db.delPort(ip, proto, port)
}

export default {
  init,
  allMeshes,
  getMesh,
  setMesh,
  delMesh,
  allEndpoints,
  getEndpoint,
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
