import { svg, render } from '../lib/uhtml.js';

/**
 * Timeline ruler component with draggable cursor and time markers
 * Provides visual time reference with zoom-dependent scale markers
 * @extends HTMLElement
 * @fires {CustomEvent} cursorchange - When cursor position changes through drag or click
 */
class TimeScale extends HTMLElement {
    /**
     * Initialize ruler state
     * @private
     */
    constructor() {
        super();
        this.state = {
            cursorPosition: 0,    // Current timeline position in frames
            viewportSize: 1000,   // Visible width in pixels
            zoomFactor: 1,        // Scale factor for time display
            isDragging: false,    // Cursor drag state
            viewportOffset: 0,    // Horizontal scroll position
        };
    }

    /**
     * Update cursor position
     * @param {number} value - Position in frames
     */
    set cursorPosition(value) {
        this.state.cursorPosition = value;
        this.render();
    }

    /**
     * Update viewport width
     * @param {number} value - Width in pixels
     */
    set viewportSize(value) {
        this.state.viewportSize = value;
        this.render();
    }

    /**
     * Update zoom level
     * @param {number} value - Zoom multiplier
     */
    set zoomFactor(value) {
        this.state.zoomFactor = value;
        this.render();
    }

    /**
     * Update scroll position
     * @param {number} value - Horizontal offset in pixels
     */
    set viewportOffset(value) {
        this.state.viewportOffset = value;
        this.render();
    }

    /**
     * Route events to specific handlers
     * @param {Event} e - DOM event
     * @private
     */
    handleEvent(e) {
        if (this['handle' + e.type]) {
            this['handle' + e.type](e);
        }
    }

    /**
     * Start cursor drag operation
     * @param {MouseEvent} e - Mouse down event
     * @private
     */
    handlemousedown(e) {
        if (e.button === 0) {
            this.state.isDragging = true;
            document.addEventListener('mousemove', this);
            document.addEventListener('mouseup', this);
            this.handlecursor(e);
            e.preventDefault();
        }
    }

    /**
     * Handle cursor drag movement
     * @param {MouseEvent} e - Mouse move event
     * @private
     */
    handlemousemove(e) {
        if (this.state.isDragging) {
            this.handlecursor(e);
        }
    }

    /**
     * End cursor drag operation
     * @private
     */
    handlemouseup() {
        this.state.isDragging = false;
        document.removeEventListener('mousemove', this);
        document.removeEventListener('mouseup', this);
    }

    /**
     * Update cursor position from mouse coordinates
     * @param {MouseEvent} e - Mouse event
     * @fires {CustomEvent} cursorchange
     * @private
     */
    handlecursor(e) {
        const rect = this.querySelector('svg').getBoundingClientRect();
        const position = ((e.clientX - rect.left + this.state.viewportOffset) / this.state.zoomFactor);
        this.dispatchEvent(new CustomEvent('cursorchange', { 
            detail: { position: Math.max(0, position) },
            bubbles: true
        }));
    }

    /**
     * Get marker configuration based on zoom level
     * @returns {Object} Marker spacing and format settings
     * @property {number} spacing - Distance between markers in frames
     * @property {Function} format - Function to format marker labels
     * @private
     */
    getMarkerConfig() {
        const { zoomFactor } = this.state;
        
        // Adjust spacing based on zoom level
        if (zoomFactor >= 5) {
            return { 
                spacing: 10,  // 10 frames
                format: f => `${f}f` // Show frame numbers
            };
        } else if (zoomFactor >= 2) {
            return {
                spacing: 30,  // 0.5 seconds
                format: f => `${f/60}s`
            };
        } else if (zoomFactor >= 0.5) {
            return {
                spacing: 60,  // 1 second
                format: f => `${f/60}s`
            };
        } else {
            return {
                spacing: 300,  // 5 seconds
                format: f => `${f/60}s`
            };
        }
    }

    /**
     * Get maximum frame position from score data
     * @returns {number} Maximum frame number or default
     * @private
     */
    getMaxFrame() {
        // Get the last frame from score data or use a default
        const score = this.closest('tracks-container')?.state?.score;
        if (!score) return 1000; // Default if no score

        return Math.max(1000, ...score.data.tracks.flatMap(track => 
            track.data.events.map(event => 
                event.data.frame + event.data.duration
            )
        ));
    }

    /**
     * Render ruler with markers and cursor
     * @private
     */
    render() {
        const { cursorPosition, viewportSize, zoomFactor, viewportOffset = 0 } = this.state;
        const { spacing, format } = this.getMarkerConfig();

        // Calculate visible frame range
        const startFrame = Math.floor(viewportOffset / zoomFactor);
        const firstMarker = Math.floor(startFrame / spacing) * spacing;
        const endFrame = Math.ceil((viewportOffset + viewportSize) / zoomFactor);

        const markers = [];
        for (let frame = firstMarker; frame <= endFrame; frame += spacing) {
            const x = (frame * zoomFactor) - viewportOffset;
            
            if (x >= 0 && x <= viewportSize) {
                if (zoomFactor >= 2 && frame < endFrame - spacing) {
                    const minorFrame = frame + spacing/2;
                    const minorX = (minorFrame * zoomFactor) - viewportOffset;
                    markers.push(svg`
                        <line x1="${minorX}" y1="20" x2="${minorX}" y2="25" 
                              stroke="#666" stroke-width="0.5" />
                    `);
                }
                
                markers.push(svg`
                    <line x1="${x}" y1="15" x2="${x}" y2="25" 
                          stroke="#666" stroke-width="1" />
                    <text x="${x}" y="12" 
                          text-anchor="middle" 
                          font-size="${zoomFactor >= 2 ? '10' : '8'}">${format(frame)}</text>
                `);
            }
        }

        // Adjust cursor position for viewport offset
        const cursorX = (cursorPosition * zoomFactor) - viewportOffset;

        render(this, svg`
            <svg width="${viewportSize}" height="30" @click="${this}" @mousedown="${this}">
                <line x1="0" y1="20" x2="${viewportSize}" y2="20" 
                      stroke="#666" stroke-width="1"/>
                ${markers}
                <line x1="${cursorX}" y1="0" x2="${cursorX}" y2="30" 
                      stroke="red" stroke-width="2"/>
            </svg>
        `);
    }
}

customElements.define('timescale-component', TimeScale);
export { TimeScale };

