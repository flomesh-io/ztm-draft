import db from './db.js'

//
// Data sources:
//   Local storage:
//     Meshes, Ports, Service (self)
//   The hub:
//     Endpoints, Services
//

function allMeshes() {
  var all = db.allMeshes()
  all.forEach(m => m.status = 'OK')
  return all
}

function getMesh(name) {
  var obj = db.getMesh(name)
  obj.status = 'OK'
  return obj
}

function setMesh(name, mesh) {
  db.setMesh(name, mesh)
  return db.getMesh(name)
}

function delMesh(name) {
  db.delMesh(name)
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
