import Peer from './kademlia';

// Choose random element in array
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

class P2PNetwork {
  constructor(config) {
    const nodes = [];
    const bootstrapNode = new Peer();

    [...Array(config.n + config.nMalicious).keys()].forEach((i) => {
      let peer = new Peer(null, i < config.nMalicious);
      nodes.push(peer);
    });

    shuffleArray(nodes);

    nodes.forEach((peer) => {
      peer.bootstrap(bootstrapNode);
      // Connect to other random nodes
      if (nodes.length > 0) {
        [...Array(config.initRandom)].forEach((_) => {
          let node = randomChoice(nodes);
          node.rpc.ping(peer);
        });
      }
    });

    this.nodes = nodes;
  }

  randomQuery() {
    let nonmalicious = this.nodes.filter((n) => !n.malicious);
    let sourceNode = randomChoice(nonmalicious);
    let targetNode = randomChoice(nonmalicious);

    while (targetNode == sourceNode) {
      targetNode = randomChoice(nonmalicious);
    }

    let {address, searchSequence} = sourceNode.find(targetNode);
    let success = address == targetNode.address;
    let foundNode = this.nodes.filter((n) => n.address == address)[0];
    return {
      searchSequence: searchSequence,
      sourceNode: sourceNode,
      targetNode: targetNode,
      foundNode: foundNode,
      success: success,
      address: address
    };
  }
}

export default P2PNetwork;
