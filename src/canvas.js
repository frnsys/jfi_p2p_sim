const nodeTypes = {
  'peer': '🖥️',
  'sybil': '👹'
};
const fontSize = 16;
const scale = 36;
const dpr = window.devicePixelRatio || 1;

function randomRangeFloat(min, max) {
  return (Math.random() * (max - min)) + min;
}

class Canvas {
  constructor(stageElement) {
    this.stage = stageElement;
    this.width = this.stage.clientWidth;
    this.height = this.stage.clientHeight;

    this.layers = {
      graph: this.initLayer(),
      annos: this.initLayer()
    };
  }

  initLayer() {
    let canvas = document.createElement('canvas');
    canvas.width = this.width * dpr;
    canvas.height = this.height * dpr;
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;
    let ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.textAlign = 'center';
    this.stage.appendChild(canvas);
    return ctx;
  }

  drawNode(type, x, y) {
    this.layers.graph.font = `normal ${fontSize}px Arial`;
    this.layers.graph.fillText(nodeTypes[type], x, y);
  }

  drawEdge(from, to, fromColor, toColor, width) {
    let ctx = this.layers.graph;
    let grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
    grad.addColorStop(0, fromColor);
    grad.addColorStop(1, toColor);
    ctx.lineWidth = width;
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  annotate(node, text) {
    let s = 6;
    let ctx = this.layers.annos;
    let {x, y} = this.nodes[node.id];
    y -= fontSize/2;

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x-s, y-s);
    ctx.lineTo(x+s, y-s);
    ctx.fill();

    let size = 12;
    let padding = 4;
    let textWidth = ctx.measureText(text).width + padding*2;
    ctx.fillRect(x-textWidth/2, y-6-size, textWidth, size);
    ctx.fillStyle = '#fff';
    ctx.font = `normal ${size}px Arial`;
    ctx.fillText(text, x, y-6-2);
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
      400.0,  // Spring stiffness
      400.0,  // Node repulsion
      0.5     // Damping
    );

    // Adjust node positions
    layout.eachNode((node, point) => {
      let id = node.data.id;
      let n = this.nodes[id].node;
      let {x, y} = point.p;
      x *= scale;
      y *= scale;
      x += this.width/2;
      y += this.height/2;
      this.nodes[id].x = x;
      this.nodes[id].y = y;
    });

    // Draw edges
    network.nodes.forEach((n) => {
      let peers = n.buckets.buckets.reduce((acc, bucket) => acc.concat(bucket), []);
      let node = this.nodes[n.id];
      peers.forEach((n_) => {
        let node_ = this.nodes[n_.id];
        this.drawEdge(node, node_, '#aaaaaa', '#eeeeee', 0.2);
      });
    });

    // Draw nodes
    network.nodes.forEach((n) => {
      n = this.nodes[n.id];
      let type = n.node.malicious ? 'sybil' : 'peer';
      this.drawNode(type, n.x, n.y);
    });
  }

  reset() {
    Object.values(this.layers).forEach((ctx) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    });
  }
}

export default Canvas;
