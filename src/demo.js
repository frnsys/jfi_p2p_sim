import Canvas from './canvas';

function getInputValue(id) {
  let el = document.getElementById(id);
  return el.checkValidity() ? parseInt(el.value) : null;
}

function setupDemo(id, social) {
  let element = document.getElementById(id);
  let view = new Canvas(element.querySelector('.stage'));
  let inputs = [...element.querySelectorAll('.opts input')].reduce((acc, inp) => {
    acc[inp.name] = inp;
    return acc;
  }, {});
  let result = element.querySelector('.result');
  let runButton = element.querySelector('.run');
  let worker = new Worker('/assets/worker.js');

  let ready = true;

  worker.onmessage = (e) => {
    const d = e.data;
    switch (d.message) {
      // Visualize new network and run initial query
      case 'created':
        view.renderNetwork(d.network);
        worker.postMessage({ message: 'query', id: d.id });
        ready = false;
        runButton.disabled = true;
        break;

      // Visualize query search
      case 'queried':
        view.annotate(d.results.targetNode, 'target');
        view.annotate(d.results.sourceNode, 'source');

        let animation = setInterval(() => {
          let step = d.results.searchSequence.shift();
          if (!step) {
            ready = true;
            runButton.disabled = false;
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

  runButton.addEventListener('click', () => {
    if (ready) {
      let opts = Object.keys(inputs).reduce((acc, k) => {
        let inp = inputs[k];
        acc[k] = inp.checkValidity() ? (inp.step == '0.1' ? parseFloat(inp.value): parseInt(inp.value)) : null;
        return acc;
      }, {});

      let valid = Object.values(opts).every((v) => v !== null);
      if (!valid) return;

      let nMalicious = opts.nMalicious ? opts.nMalicious : Math.floor(opts.budget/opts.cost);
      let config = {
        social: social,
        n: opts.n,
        nMalicious: nMalicious,
        attemptFriendPercent: 0.2,     // Percent of nonmalicious peers a malicious peer tries to friend
        gullibility: opts.gullibility, // Probability a nonmalicious peer accepts a malicious peer
        initRandom: 2                  // Initial nodes to ping
      }

      result.innerText = 'Running...';
      result.style.background = '#aaaaaa';
      worker.postMessage({ message: 'new', id, config });
    }
  });
}

export default setupDemo;
