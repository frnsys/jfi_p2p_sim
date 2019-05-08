export class ProgressBar {
  constructor() {
    this.element = document.createElement('div');

    const progressBar = document.createElement('div');
    progressBar.style.height = '20px';
    progressBar.style.width = '100%';
    progressBar.style.background = '#dddddd';

    const progressBarFill = document.createElement('div');
    progressBarFill.style.width = 0;
    progressBarFill.style.height = '20px';
    progressBarFill.style.background = '#0000ff';
    progressBar.appendChild(progressBarFill);

    const progressMeta = document.createElement('div');

    this.progressBarFill = progressBarFill;
    this.progressMeta = progressMeta;

    this.element.appendChild(progressBar);
    this.element.appendChild(progressMeta);
  }

  set meta(text) {
    this.progressMeta.innerText = text;
  }

  set width(width) {
    this.progressBarFill.style.width = `${width}%`;
  }
}
