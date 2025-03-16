import { html, render } from '../lib/uhtml.js';

/**
 * Resizable splitter component
 * @extends HTMLElement
 */
class Splitter extends HTMLElement {
    constructor() {
        super();
        this.state = {
            isDragging: false,
            startX: 0,
            startWidth: 0
        };
    }

    connectedCallback() {
        this.render();
    }

    handleEvent(e) {
        const action = e.type;
        if (this[`handle${action}`]) {
            this[`handle${action}`](e);
        }
    }

    handlemousedown(e) {
        this.state.isDragging = true;
        this.state.startX = e.pageX;
        this.state.startWidth = this.previousElementSibling.offsetWidth;
        this.classList.add('dragging');
        
        // Add temporary event listeners
        document.addEventListener('mousemove', this);
        document.addEventListener('mouseup', this);
        
        // Prevent text selection
        e.preventDefault();
    }

    handlemousemove(e) {
        if (!this.state.isDragging) return;
        
        const diff = e.pageX - this.state.startX;
        const newWidth = Math.max(200, this.state.startWidth + diff);
        
        this.dispatchEvent(new CustomEvent('split-resize', {
            detail: { width: newWidth },
            bubbles: true
        }));
    }

    handlemouseup() {
        this.state.isDragging = false;
        this.classList.remove('dragging');
        
        // Remove temporary event listeners
        document.removeEventListener('mousemove', this);
        document.removeEventListener('mouseup', this);
    }

    render() {
        render(this, html`
            <div class="splitter-bar" 
                 @mousedown="${this}">
            </div>
        `);
    }
}

customElements.define('split-handle', Splitter);
export { Splitter };