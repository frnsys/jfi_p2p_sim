import Canvas from './canvas';

function getInputValue(id) {
  let el = document.getElementById(id);
  return el.checkValidity() ? parseInt(el.value) : null;
}

function setupDemo(id) {
  let element = document.getElementById(id);
  let view = new Canvas(element.querySelector('.stage'));
  let inputs = [...element.querySelectorAll('.opts input')].reduce((acc, inp) => {
    acc[inp.name] = inp;
    return acc;
  }, {});
  let result = element.querySelector('.result');
  let worker = new Worker('/assets/worker.js');

  worker.onmessage = (e) => {
    const d = e.data;
    switch (d.message) {
      // Visualize new network and run initial query
      case 'created':
        view.renderNetwork(d.network);
        worker.postMessage({ message: 'query', id: d.id });
        break;

      // Visualize query search
      case 'queried':
        view.annotate(d.results.targetNode, 'target');
        view.annotate(d.results.sourceNode, 'source');

        let animation = setInterval(() => {
          let step = d.results.searchSequence.shift();
          if (!step) {
            clearInterval(animation);
            view.annotate(d.results.foundNode, 'found');
            result.innerText = d.results.success ? 'Success' : 'Failure';
            result.style.background = d.results.success ? '#0eb553' : '#ef2626';
          } else {
            let node = view.nodes[view.nodesByAddress[step.from]];
            step.to.forEach((n) => {
              let id = view.nodesByAddress[n.address];
              let node_ = view.nodes[id];
              view.drawEdge(node, node_, '#065114', '#63ed7c', 0.8);
            });
          }
        }, 100);
        break;
    }
  };

  element.querySelector('.run').addEventListener('click', () => {
    let opts = Object.keys(inputs).reduce((acc, k) => {
      let inp = inputs[k];
      acc[k] = inp.checkValidity() ? parseInt(inp.value) : null;
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

    result.innerText = 'Running...';
    result.style.background = '#aaaaaa';
    worker.postMessage({ message: 'new', id, config });
  });
}

export default setupDemo;
