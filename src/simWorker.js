import simulate from './simulation';

onmessage = function(e) {
  const d = e.data;

  switch (d.message) {
    case 'kademlia':
      simulate(d.config, (i, successes) => {
        postMessage({
          message: 'kademliaRunComplete',
          i, successes});
      }, (nodes) => {
        postMessage({
          message: 'kademliaRunStart', nodes });
      }, (targetNode) => {
        postMessage({
          message: 'kademliaTrialStart', targetNode });
      });
      break;
  }
}
