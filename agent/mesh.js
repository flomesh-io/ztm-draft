export default function (name, self, bootstraps) {
  var me = self.node
  var cert = new crypto.Certificate(self.certificate)
  var key = new crypto.PrivateKey(self.privateKey)

  var nodes = {}

  function allNodes() {
    return Object.values(nodes)
  }

  function updateNode(node) {
  }

  function findHub(node, service) {
  }
}
