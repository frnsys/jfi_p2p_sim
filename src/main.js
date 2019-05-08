import Canvas from './canvas';

let view = new Canvas('canvas');

function getInputValue(id) {
  let el = document.getElementById(id);
  return el.checkValidity() ? parseInt(el.value) : null;
}

if (window.Worker) {
  const worker = new Worker('/assets/worker.js');
  worker.onmessage = (e) => {
    const d = e.data;
    switch (d.message) {
      case 'kademlia:created':
        view.renderNetwork(d.network);
        worker.postMessage({ message: 'kademlia:query', id: d.id });
        break;
      case 'kademlia:queried':
        view.annotate(d.results.targetNode, 'target');
        view.annotate(d.results.sourceNode, 'source');
        view.ctx.lineWidth = 0.8;
        let animation = setInterval(() => {
          let step = d.results.searchSequence.shift();
          if (!step) {
            clearInterval(animation);
            view.annotate(d.results.foundNode, 'found');
            let resultEl = document.getElementById('result');
            resultEl.innerText = d.results.success ? 'Success' : 'Failure';
            resultEl.style.background = d.results.success ? '#0eb553' : '#ef2626';
          } else {
            let node = view.nodes[step.from];
            step.to.forEach((n) => {
              let id = view.nodesByAddress[n.address];
              let node_ = view.nodes[id];
              var grad= view.ctx.createLinearGradient(node.x, node.y, node_.x, node_.y);
              grad.addColorStop(0, '#065114');
              grad.addColorStop(1, '#63ed7c');
              view.ctx.strokeStyle = grad;
              view.ctx.beginPath();
              view.ctx.moveTo(node.x, node.y);
              view.ctx.lineTo(node_.x, node_.y);
              view.ctx.stroke();
            });
          }
        }, 100);
        break;
    }
  };

  document.getElementById('run').addEventListener('click', () => {
    let id = 'main-example';
    let keys = ['n', 'cost', 'budget'];
    let opts = keys.reduce((acc, k) => {
      acc[k] = getInputValue(k);
      return acc;
    }, {});

    let valid = Object.values(opts).every((v) => v !== null);
    if (!valid) return;

    let nMalicious = Math.floor(opts.budget/opts.cost);
    let config = {
      n: opts.n,
      nMalicious: nMalicious,
      initRandom: 2     // Initial nodes to ping
    }
    console.log(config);

    let resultEl = document.getElementById('result');
    resultEl.innerText = 'Running...';
    resultEl.style.background = '#aaaaaa';
    worker.postMessage({ message: 'kademlia:new', id, config });
  });
}
