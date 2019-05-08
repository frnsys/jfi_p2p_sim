import Node from './node';
import Scene from './scene';
import { ProgressBar } from './ui';

const config ={
  n: 200,           // Number of nodes
  pMalicious: 0.01, // Proportion of malicious nodes
  initRandom: 20,   // Initial nodes to ping

  nRuns: 50,        // Number of runs
  nTrials: 25      // Number of trials per run
};

let nodeidx = {};
let oldnode = {};

function onRunStart(nodes) {
  view.reset();
  nodes.forEach((n) => {
    let node = new Node(n.malicious ? 'sybil' : 'peer');
    let x = randomRangeFloat(bounds.x[0], bounds.x[1]);
    let y = randomRangeFloat(bounds.y[0], bounds.y[1]);
    node.mesh.position.set(x, y, 0);
    view.scene.add(node.mesh);
    nodeidx[n.id] = node;
  });
}

function onTrialStart(targetNode) {
  if (Object.keys(oldnode).length > 0) {
    let node = nodeidx[oldnode.id];
    if (node) {
      node.type = oldnode.type;
    }
  }
  let node = nodeidx[targetNode.id];
  oldnode.id = targetNode.id;
  oldnode.type = node.baseType;
  node.type = 'target';
}

function toPercent(n, total) {
  return `${(n/total * 100).toFixed(1)}%`;
}

class View {
  constructor(element) {
    this.element = element;
    this.width = element.clientWidth;
    this.height = element.clientHeight;
    this.scene = new Scene({
      width: this.width,
      height: this.height
    });
    this.element.appendChild(this.scene.renderer.domElement);
  }

  render() {
    this.scene.render();
    requestAnimationFrame(this.render.bind(this));
  }

  reset() {
    this.scene.reset();
  }
}

const frame = document.getElementById('sim');
const view = new View(frame);

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


let bounds = {
  x: [-100, 100],
  y: [-100, 100]
};

function randomRangeFloat(min, max) {
  return (Math.random() * (max - min)) + min;
}

view.render();
