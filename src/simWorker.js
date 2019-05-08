import P2PNetwork from './network';

let networks = {};

onmessage = function(e) {
  const d = e.data;

  let network = networks[d.id];
  switch (d.message) {
    case 'new':
      network = new P2PNetwork(d.config);
      postMessage({
        id: d.id,
        message: 'created',
        network: network
      });
      networks[d.id] = network;
      break;
    case 'query':
      if (network) {
        let results = network.randomQuery();
        postMessage({
          id: d.id,
          message: 'queried',
          results: results
        });
      }
      break;
  }
}
