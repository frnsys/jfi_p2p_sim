const nodeTypes = {
  'peer': '🖥️',
  'sybil': '😈',
  'target': '🎯',
  'source': '📍'
};

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
    this.width = width;
    this.height = height;
  }

  addNode(type, x, y) {
    this.ctx.fillText(nodeTypes[type], x, y);
  }

  reset() {
    this.ctx.clearRect(0, 0, this.element.width, this.element.height);
  }
}

export default Canvas;
