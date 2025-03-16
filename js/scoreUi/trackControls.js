import { html, render } from '../lib/uhtml.js';

/**
 * Timeline playback and zoom controls component
 * Provides standard media controls and zoom level adjustment
 * @extends HTMLElement
 * @fires {CustomEvent} play - When playback is started
 * @fires {CustomEvent} pause - When playback is paused
 * @fires {CustomEvent} stop - When playback is stopped
 * @fires {CustomEvent} zoom - When zoom level changes
 */
class TrackControls extends HTMLElement {
    /**
     * Initialize control state
     * @private
     */
    constructor() {
        super();
        this.state = {
            isPlaying: false,    // Current playback state
            zoomFactor: 1,       // Current zoom level
            minZoom: 0.1,        // Minimum zoom constraint
            maxZoom: 10         // Maximum zoom constraint
        };
    }

    /**
     * Update playback state
     * @param {boolean} value - New playback state
     */
    set isPlaying(value) {
        this.state.isPlaying = value;
        this.render();
    }

    /**
     * Update zoom level
     * @param {number} value - New zoom factor
     */
    set zoomFactor(value) {
        this.state.zoomFactor = value;
        this.render();
    }

    /**
     * Set minimum and maximum zoom constraints
     * @param {number} min - Minimum zoom factor
     * @param {number} max - Maximum zoom factor
     */
    setZoomConstraints(min, max) {
        this.state.minZoom = min;
        this.state.maxZoom = max;
        
        // Constrain current zoom if needed
        this.state.zoomFactor = Math.min(max, Math.max(min, this.state.zoomFactor));
        
        this.render();
    }

    /**
     * Initialize component when mounted
     * @override
     */
    connectedCallback() {
        this.render();
    }

    /**
     * Route events to specific handlers
     * @param {Event} e - DOM event
     * @private
     */
    handleEvent(e) {
        const action = e.target.dataset.action;
        if (action && this[`handle${action}`]) {
            this[`handle${action}`](e);
        }
    }

    /**
     * Start timeline playback
     * @fires {CustomEvent} play
     * @private
     */
    handleplay() {
        this.dispatchEvent(new CustomEvent('play', { 
            bubbles: true, 
            composed: true 
        }));
    }

    /**
     * Pause timeline playback
     * @fires {CustomEvent} pause
     * @private
     */
    handlepause() {
        this.dispatchEvent(new CustomEvent('pause', { 
            bubbles: true, 
            composed: true 
        }));
    }

    /**
     * Stop playback and reset position
     * @fires {CustomEvent} stop
     * @private
     */
    handlestop() {
        this.dispatchEvent(new CustomEvent('stop', { 
            bubbles: true, 
            composed: true 
        }));
    }

  

    /**
     * Update timeline zoom level
     * @param {Event} e - Input event from zoom slider
     * @fires {CustomEvent} zoom
     * @private
     */
    handlezoom(e) {
        const zoomLevel = parseFloat(e.target.value);
        if (!isNaN(zoomLevel)) {
            this.state.zoomFactor = zoomLevel;
            this.dispatchEvent(new CustomEvent('zoom', { 
                detail: { zoomLevel },
                bubbles: true
            }));
        }
    }

    /**
     * Render control interface
     * @private
     */
    render() {
        render(this, html`
            <style>
                .controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                button {
                    padding: 10px;
                    font-size: 16px;
                    cursor: pointer;
                }
                .slider-container {
                    display: flex;
                    align-items: center;
                }
                .slider-container label {
                    margin-right: 10px;
                }
            </style>
            <div class="controls">              
                <button data-action="${this.state.isPlaying ? 'pause' : 'play'}" @click="${this}">
                    ${this.state.isPlaying ? '⏸️' : '▶️'}
                </button>
                <button data-action="stop" @click="${this}">⏹️</button>
                <div class="slider-container">
                    <label for="zoom-slider">Zoom:</label>
                    <input type="range" 
                           id="zoom-slider"
                           min="${this.state.minZoom || 0.1}"
                           max="${this.state.maxZoom || 10}"
                           step="0.1"
                           .value="${this.state.zoomFactor}"
                           data-action="zoom"
                           @input="${this}">
                </div>
            </div>
        `);
    }
}

customElements.define('track-controls', TrackControls);
export { TrackControls };