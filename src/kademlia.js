// Simplified version of Kademlia
// for demo purposes
// - Only lookup nodes, can't lookup values
// - Nodes are presumed not to leave the network
// - We don't use IP addresses or ports, we work with node objects directly

const config = {
  k: 5,             // Bucket size
  alpha: 3,         // Simultaneous lookups
  idBits: 16        // ID bits
};

// Assume bits <= 32
function randomBits(bits) {
  let u = new Uint32Array(1);
  return crypto.getRandomValues(u)[0] % 2**bits;
}

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function bitsToHex(bits) {
  let str = bits.toString(16).toUpperCase();
  let base = [...Array(config.idBits/4)].map((_) => '0').join('');
  return base.slice(str.length) + str;
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
  constructor(peer) {
    this.peer = peer;
    this.buckets = [...Array(config.idBits)].map((_) => []);
  }

  peers() {
    return this.buckets.reduce((acc, bucket) => acc.concat(bucket), []);
  }

  insert(peer) {
    let bucketId = largestDifferingBit(this.peer.id, peer.id);
    let bucket = this.buckets[bucketId];

    if (bucket.includes(peer)) {
      bucket.splice(bucket.indexOf(peer), 1);
    } else if (bucket.length >= config.k) {
      bucket.shift();
    }
    bucket.push(peer);
  }

  nearest(peer, n) {
    let peers = this.peers();
    peers = sortDistance(peers, peer);
    return n ? peers.slice(0, n) : peers;
  }

  refresh() {
    this.buckets.forEach((bucket, i) => {
      if (bucket.length == 0) {
        let randId;
        if (i == 0) {
          randId = Math.round(Math.random());
        } else {
          randId = randomRange(2**i, 2**(i+1));
        }
        let dummyPeer = new Peer(randId);
        this.peer.findNearest(dummyPeer);
      }
    });
  }
}

class Peer {
  constructor(id, malicious) {
    this.malicious = malicious === undefined ? false : malicious;
    this.id = id || randomBits(config.idBits);
    this.rpc = new RPC(this);
    this.buckets = new BucketSet(this);

    // Address is just for identifying
    // fake vs real peers
    this.address = bitsToHex(randomBits(config.idBits));
  }

  bootstrap(peer) {
    // Insert bootstrap peer into bucket
    // then do a self-lookup
    this.buckets.insert(peer);
    this.find(this);

    // This slows down the simulation considerably,
    // so disabling
    // this.buckets.refresh();
  }

  findNearest(peer) {
    let start = this.buckets.nearest(peer, config.alpha);
    let searchSequence = [{
      from: this.address,
      to: start.map((p) => ({id: p.id, address: p.address}))
    }];

    let results = start.map((neighb) => {
      let best = [];
      let candidates = neighb.rpc.find(this, peer);
      candidates = sortDistance(candidates, peer).slice(0, config.k);
      searchSequence.push({
        from: neighb.address,
        to: candidates.map((p) => ({id: p.id, address: p.address}))
      });

      // Iterate until best results are stable
      // This is a hacky method for array equality,
      // but should be fine here
      while (JSON.stringify(candidates.map(c => c.id)) !== JSON.stringify(best.map(c => c.id))) {
        best = candidates;
        candidates = candidates
          .map((c) => {
            let peers = c.rpc.find(this, peer);
            searchSequence.push({
              from: c.address,
              to: [...new Set(peers.map((p) => ({id: p.id, address: p.address})))]
            });
            return peers;
          })
          .flat();
        candidates = [...new Set(candidates)];
        candidates = sortDistance(candidates, peer).slice(0, config.k);
      }
      return best;
    }).flat();
    return {
      peers: sortDistance(results, peer).slice(0, config.k),
      searchSequence
    };
  }

  find(peer) {
    let results = this.findNearest(peer);
    let searchSequence = results.searchSequence;
    results = results.peers.filter((p) => p.id == peer.id);

    // There may be malicious results
    // Take the majority result
    let counts = results.reduce((acc, p) => {
      acc[p.address] = (acc[p.address] || 0) + 1;
      return acc;
    }, {});
    let address = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    return {address, searchSequence};
  }
}

// Mock RPCs
class RPC {
  constructor(parentPeer) {
    this.peer = parentPeer;
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

    if (this.peer.malicious) {
      // TODO this isn't quite working, b/c the peer uses the id, not the address
      let peer = new Peer(targetPeer.id, true);
      peer.address = this.peer.address;
      return [peer];
    }

    if (targetPeer == this.peer) return [this.peer];
    let peers = this.peer.buckets.nearest(targetPeer).concat([this.peer]);
    return sortDistance(peers, targetPeer).slice(0, config.k);
  }
}

export default Peer;
