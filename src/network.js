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
    this.config = config;
    const nodes = [];
    const bootstrapNode = new Peer();
    const maliciousBootstrapNode = new Peer(null, true);

    [...Array(config.n + config.nMalicious).keys()].forEach((i) => {
      let peer = new Peer(null, i < config.nMalicious);
      nodes.push(peer);
    });

    shuffleArray(nodes);

    nodes.forEach((peer) => {
      if (config.social && peer.malicious) {
        peer.bootstrap(maliciousBootstrapNode);
      } else {
        peer.bootstrap(bootstrapNode);
      }

      // Connect to other random nodes
      [...Array(config.initRandom)].forEach((_) => {
        let node;
        if (config.social) {
          let malicious = nodes.filter((n) => n.malicious);
          let nonmalicious = nodes.filter((n) => !n.malicious);
          if (peer.malicious) {
            // Roll for gullible nonmalicious peers
            let nAttempts = Math.floor(nonmalicious.length * config.attemptFriendPercent);
            [...Array(nAttempts)].forEach((_) => {
              if (Math.random() < config.gullibility) {
                let n= randomChoice(nonmalicious);
                n.rpc.ping(peer);
              }
            });

            // Connect to other malicious peers
            node = randomChoice(malicious);
          } else {
            node = randomChoice(nonmalicious);
          }

        } else {
          node = randomChoice(nodes);
        }
        node.rpc.ping(peer);
      });
    });

    nodes.push(bootstrapNode);
    nodes.push(maliciousBootstrapNode);
    this.nodes = nodes;
  }

  randomQuery() {
    let nonmalicious = this.nodes.filter((n) => !n.malicious);
    let sourceNode = randomChoice(nonmalicious);
    let targetNode = randomChoice(nonmalicious);

    // Ensure the target and source aren't the same node
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
