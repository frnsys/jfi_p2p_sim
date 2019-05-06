// Simplified version of Kademlia
// for demo purposes
// - Only lookup nodes, can't lookup values
// - Nodes are presumed not to leave the network
// - We don't use IP addresses or ports, we work with node objects directly

const config = {
  k: 20,            // Bucket size
  alpha: 3,         // Simultaneous lookups
  idBits: 16,       // ID bits
  n: 200,           // Number of nodes
  pMalicious: 0.05, // Proportion of malicious nodes
  initRandom: 20,   // Initial nodes to ping
  nTrials: 200      // Number of trials
};

function randomBits() {
  let u;
  switch (config.idBits) {
    case 8:
      u = new Uint8Array(1);
      break;
    case 16:
      u = new Uint16Array(1);
      break;
    case 32:
      u = new Uint32Array(1);
      break;
  }
  return crypto.getRandomValues(u)[0];
}

function bitsToHex(bits) {
  let str = bits.toString(16).toUpperCase();
  let base = [...Array(config.idBits/4)].map((_) => '0').join('');
  return base.slice(str.length) + str;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sortDistance(nodes, peer) {
  nodes.sort((a, b) => distance(peer.id, a.id) - distance(peer.id, b.id));
  return nodes;
}

function distance(nodeA, nodeB) {
  // bitwise XOR
  return nodeA ^ nodeB;
}

function largestDifferingBit(nodeA, nodeB) {
  let d = distance(nodeA, nodeB);
  let length = -1;
  while (d > 0) {
    d >>= 1;
    length += 1;
  }
  return Math.max(0, length);
}

class BucketSet {
  constructor() {
    this.buckets = [...Array(config.idBits)].map((_) => []);
  }

  insert(peer) {
    let bucketId = largestDifferingBit(this.id, peer.id);
    let bucket = this.buckets[bucketId];

    if (bucket.includes(peer)) {
      bucket.splice(bucket.indexOf(peer), 1);
    } else if (bucket.length >= config.k) {
      bucket.shift();
    }
    bucket.push(peer);
  }

  nearest(peer, n) {
    let peers = this.buckets.reduce((acc, bucket) => acc.concat(bucket), []);
    peers = sortDistance(peers, peer);
    return n ? peers.slice(0, n) : peers;
  }
}

class Peer {
  constructor(id, malicious) {
    this.id = id || randomBits();
    this.rpc = new RPC(this, malicious);
    this.buckets = new BucketSet();

    // Address is just for identifying
    // fake vs real peers
    this.address = randomBits();
  }

  bootstrap(peer) {
    // Insert bootstrap peer into bucket
    // and insert self into bootstrap peer's bucket
    this.buckets.insert(peer);
    peer.rpc.ping(this);
  }

  find(peer) {
    let start = this.buckets.nearest(peer, config.alpha);
    let results = start.map((neighb) => {
      let best = [];
      let candidates = neighb.rpc.find(this, peer);
      candidates = sortDistance(candidates, peer).slice(0, config.k);

      // Iterate until best results are stable
      // This is a hacky method for array equality,
      // but should be fine here
      while (JSON.stringify(candidates.map(c => c.id)) !== JSON.stringify(best.map(c => c.id))) {
        best = candidates;
        candidates = candidates
          .map((c) => c.rpc.find(this, peer))
          .flat();
        candidates = [...new Set(candidates)];
        candidates = sortDistance(candidates, peer).slice(0, config.k);
      }
      return best;
    }).flat();
    results = sortDistance(results, peer).slice(0, config.k);
    results = results.filter((p) => p.id == peer.id);

    // There may be malicious results
    // Take the majority result
    let counts = results.reduce((acc, p) => {
      acc[p.address] = (acc[p.address] || 0) + 1;
      return acc;
    }, {});
    let result = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    return result;
  }
}

// Mock RPCs
class RPC {
  constructor(parentPeer, malicious) {
    this.peer = parentPeer;
    this.malicious = malicious || false;
  }

  ping(requestingPeer) {
    this.peer.buckets.insert(requestingPeer);
    requestingPeer.rpc.pong(this.peer);
  }

  pong(requestingPeer) {
    this.peer.buckets.insert(requestingPeer);
  }

  find(requestingPeer, targetPeer) {
    this.peer.buckets.insert(requestingPeer);

    if (this.malicious) {
      let peer = new Peer(targetPeer.id);
      peer.address = 'FAKE';
      return [peer];
    }

    if (targetPeer == this.peer) return [this.peer];
    let peers = this.peer.buckets.nearest(targetPeer).concat([this.peer]);
    return sortDistance(peers, targetPeer).slice(0, config.k);
  }
}

const nodes = [];
const nonmalicious = [];
const bootstrapNode = new Peer();

[...Array(config.n)].forEach((_) => {
  let peer = Math.random() <= config.pMalicious ? new Peer(null, true) : new Peer();
  peer.bootstrap(bootstrapNode);

  if (!peer.malicious) {
    nonmalicious.push(peer);
  }

  // Connect to other random nodes
  if (nodes.length > 0) {
    [...Array(config.initRandom)].forEach((_) => {
      let node = randomChoice(nodes);
      node.rpc.ping(peer);
    });
  }
  nodes.push(peer);
});

let successes = [...Array(config.nTrials)].reduce((acc, _) => {
  let sourceNode = randomChoice(nonmalicious);
  let targetNode = randomChoice(nonmalicious);
  while (targetNode == sourceNode) {
    targetNode = randomChoice(nonmalicious);
  }
  let result = sourceNode.find(targetNode) !== 'FAKE' ? 1 : 0;
  return acc + result;
}, 0);
console.log(`${((successes/100) * 100).toFixed(1)}%`);

export default {};
