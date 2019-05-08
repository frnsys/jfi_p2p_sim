import Canvas from './canvas';
import { ProgressBar } from './ui';

const config = {
  n: 100,           // Number of nodes
  pMalicious: 0.01, // Proportion of malicious nodes
  initRandom: 20,   // Initial nodes to ping

  nRuns: 50,        // Number of runs
  nTrials: 25      // Number of trials per run
};

let nodeidx = {};
let oldnode = {};

let view = new Canvas('canvas');

function onRunStart(nodes) {
  view.reset();
  nodes.forEach((n) => {
    let type = n.malicious ? 'sybil' : 'peer';
    let x = randomRangeFloat(bounds.x[0], bounds.x[1]);
    let y = randomRangeFloat(bounds.y[0], bounds.y[1]);
    view.addNode(type, x, y);
  });
}

function onTrialStart(targetNode) {
  // if (Object.keys(oldnode).length > 0) {
  //   let node = nodeidx[oldnode.id];
  //   if (node) {
  //     node.type = oldnode.type;
  //   }
  // }
  // let node = nodeidx[targetNode.id];
  // oldnode.id = targetNode.id;
  // oldnode.type = node.baseType;
  // node.type = 'target';
}

function toPercent(n, total) {
  return `${(n/total * 100).toFixed(1)}%`;
}

const frame = document.getElementById('sim');

if (window.Worker) {
  const worker = new Worker('/assets/worker.js');
  const progressBar = new ProgressBar();
  frame.appendChild(progressBar.element);
  worker.onmessage = (e) => {
    const d = e.data;
    switch (d.message) {
      case 'kademliaRunComplete':
        progressBar.width = (d.i+1)/config.nRuns * 100;
        progressBar.meta = `Run ${d.i+1} (${toPercent(d.successes, config.nTrials)})`;
        nodeidx = {};
        break;
      case 'kademliaRunStart':
        onRunStart(d.nodes);
        break;
      case 'kademliaTrialStart':
        onTrialStart(d.targetNode);
        break;
    }
  };
  worker.postMessage({ message: 'kademlia', config });
}


const padding = 10;
let bounds = {
  x: [padding, view.width-padding],
  y: [padding, view.height-padding]
};

function randomRangeFloat(min, max) {
  return (Math.random() * (max - min)) + min;
}
