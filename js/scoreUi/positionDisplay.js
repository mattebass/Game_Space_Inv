import { html, render } from '../lib/uhtml.js';

class PositionDisplay extends HTMLElement {
    constructor() {
        super();
        this._cursorPosition = 0;
        this._totalLength = 0;
    }

    set cursorPosition(value) {
        this._cursorPosition = value;
        this.render();
    }

    set totalLength(value) {
        this._totalLength = value;
        this.render();
    }

    formatTime(frames) {
        if (!frames) return "0:00:00";
        const seconds = Math.floor(frames / 60);
        const minutes = Math.floor(seconds / 60);
        const remainingFrames = frames % 60;
        return `${minutes}:${String(seconds % 60).padStart(2, '0')}:${String(remainingFrames).padStart(2, '0')}`;
    }

    render() {
        render(this, html`            
            <div class="position-display">
                <span>${this.formatTime(this._cursorPosition)}</span>
                <span>/</span>
                <span>${this.formatTime(this._totalLength)}</span>
            </div>
        `);
    }

    connectedCallback() {
        this.render();
    }
}

customElements.define('position-display', PositionDisplay);
export { PositionDisplay };