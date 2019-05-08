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

// One run of the simulation;
// create a new peer network,
// then do config.nTrials lookups
function run(config, onRunStart, onTrialStart) {
  const nodes = [];
  const nonmalicious = [];
  const bootstrapNode = new Peer();
  const nMalicious = Math.max(1, Math.round(config.n * config.pMalicious));

  [...Array(config.n).keys()].forEach((i) => {
    let peer = new Peer(null, i < nMalicious);

    if (!peer.malicious) {
      nonmalicious.push(peer);
    }
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

  onRunStart(nodes);

  let successes = [...Array(config.nTrials)].reduce((acc, _) => {
    let sourceNode = randomChoice(nonmalicious);
    let targetNode = randomChoice(nonmalicious);

    while (targetNode == sourceNode) {
      targetNode = randomChoice(nonmalicious);
    }
    onTrialStart(targetNode);
    let address = sourceNode.find(targetNode);
    let result = address == targetNode.address ? 1 : 0;
    return acc + result;
  }, 0);
  return successes;
}

// Run the simulation config.nRuns times
function simulate(config, onRunFinish, onRunStart, onTrialStart) {
  [...Array(config.nRuns).keys()].map((i) => {
    let successes = run(config, onRunStart, onTrialStart);
    onRunFinish(i, successes);
    return successes;
  });
}

export default simulate;
