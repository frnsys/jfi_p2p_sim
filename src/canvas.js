const nodeTypes = {
  'peer': '🖥️',
  'sybil': '👹',
  'target': '🎯',
  'source': '📍'
};
const fontSize = 16;

function randomRangeFloat(min, max) {
  return (Math.random() * (max - min)) + min;
}

class Canvas {
  constructor(id) {
    this.element = document.getElementById(id);
    let width = this.element.width;
    let height = this.element.height;
    let dpr = window.devicePixelRatio || 1;
    this.element.width = width * dpr;
    this.element.height = height * dpr;
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
    this.ctx = this.element.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.ctx.lineWidth = 0.2;
    this.ctx.textAlign = 'center';
    this.width = width;
    this.height = height;

    this.annoElement = document.getElementById('annotations');
    this.annoElement.width = width * dpr;
    this.annoElement.height = height * dpr;
    this.annoElement.style.width = `${width}px`;
    this.annoElement.style.height = `${height}px`;
    this.annoCtx = this.annoElement.getContext('2d');
    this.annoCtx.scale(dpr, dpr);
    this.annoCtx.lineWidth = 0.2;
    this.annoCtx.textAlign = 'center';
  }

  addNode(type, x, y) {
    this.ctx.font = `normal ${fontSize}px Arial`;
    this.ctx.fillText(nodeTypes[type], x, y);
  }

  annotate(node, text) {
    let s = 6;
    let {x, y} = this.nodes[node.id];
    y -= fontSize/2;
    this.annoCtx.fillStyle = '#000';
    this.annoCtx.beginPath();
    this.annoCtx.moveTo(x, y);
    this.annoCtx.lineTo(x-s, y-s);
    this.annoCtx.lineTo(x+s, y-s);
    this.annoCtx.fill();

    let size = 12;
    let padding = 4;
    let textWidth = this.annoCtx.measureText(text).width + padding*2;
    this.annoCtx.fillRect(x-textWidth/2, y-6-size, textWidth, size);
    this.annoCtx.fillStyle = '#fff';
    this.annoCtx.font = `normal ${size}px Arial`;
    this.annoCtx.fillText(text, x, y-6-2);
  }

  renderNetwork(network) {
    this.reset();
    this.nodes = {};
    this.nodesByAddress = {};

    // Construct graph
    let graph = new Springy.Graph();
    network.nodes.forEach((n) => {
      if (!(n.id in this.nodes)) {
        this.nodesByAddress[n.address] = n.id;
        this.nodes[n.id] = {
          node: n,
          graphNode: graph.newNode({id: n.id})
        };
      }
      let peers = n.buckets.buckets.reduce((acc, bucket) => acc.concat(bucket), []);
      peers.forEach((n_) => {
        if (!(n_.id in this.nodes)) {
          this.nodesByAddress[n_.address] = n_.id;
          this.nodes[n_.id] = {
            node: n_,
            graphNode: graph.newNode({id: n_.id})
          };
        }
        graph.newEdge(
          this.nodes[n.id].graphNode,
          this.nodes[n_.id].graphNode);
      });
    });

    // Compute layout
    let layout = new Springy.Layout.ForceDirected(
      graph,
      400.0, // Spring stiffness
      400.0, // Node repulsion
      0.5 // Damping
    );

    // Adjust node positions
    layout.eachNode((node, point) => {
      let id = node.data.id;
      let n = this.nodes[id].node;
      let {x, y} = point.p;
      x *= 36;
      y *= 36;
      x += this.width/2;
      y += this.height/2;
      this.nodes[id].x = x;
      this.nodes[id].y = y;
    });

    // Draw edges
    this.ctx.strokeStyle = '#cccccc';
    network.nodes.forEach((n) => {
      let peers = n.buckets.buckets.reduce((acc, bucket) => acc.concat(bucket), []);
      let node = this.nodes[n.id];
      peers.forEach((n_) => {
        let node_ = this.nodes[n_.id];
        this.ctx.beginPath();
        this.ctx.moveTo(node.x, node.y);
        this.ctx.lineTo(node_.x, node_.y);
        this.ctx.stroke();
      });
    });

    // Draw nodes
    network.nodes.forEach((n) => {
      n = this.nodes[n.id];
      let type = n.node.malicious ? 'sybil' : 'peer';
      this.addNode(type, n.x, n.y);
    });
  }

  reset() {
    this.ctx.clearRect(0, 0, this.element.width, this.element.height);
    this.annoCtx.clearRect(0, 0, this.annoElement.width, this.annoElement.height);
  }
}

export default Canvas;
