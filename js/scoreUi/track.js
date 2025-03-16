import { svg, render } from '../lib/uhtml.js';

/**
 * Visual timeline track component that displays events as interactive rectangles
 * Events are organized in lanes based on their type, with support for scrolling and zooming
 * @extends HTMLElement
 * @fires {CustomEvent} eventselect - When an event rectangle is clicked
 */
class Track extends HTMLElement {
    /**
     * Initialize track visualization state
     * @private
     */
    constructor() {
        super();
        this.state = {
            events: [],          // Array of track events
            cursorPosition: 0,   // Current timeline position
            viewportSize: 1000,  // Width of visible area in pixels
            zoomFactor: 1,       // Scale factor for event display
            laneHeight: 30,      // Height of each event lane
            laneGap: 5,         // Vertical spacing between lanes
            types: [],          // Unique event types in track
            numLanes: 10,       // Maximum number of visible lanes
            viewportOffset: 0,  // Horizontal scroll position
            selectedEventId: null // Currently selected event
        };
    }

    connectedCallback() {
        this.render();
    }

    /**
     * Public setters for track properties
     */

    /**
     * Update track events
     * @param {Array<Object>} value - Array of event objects
     * @param {number} value[].id - Unique event identifier
     * @param {number} value[].start - Start position in frames
     * @param {number} value[].duration - Duration in frames
     * @param {string} value[].type - Event type determining lane
     */
    set events(value) {
        this.state.events = value;
        this.updateTypes();
        this.render();
    }

    /**
     * Update cursor position
     * @param {number} value - Current position in frames
     */
    set cursorPosition(value) {
        this.state.cursorPosition = value;
        this.render();
    }

    /**
     * Update viewport width
     * @param {number} value - Visible width in pixels
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
     * Update selected event
     * @param {number|null} value - ID of selected event or null
     */
    set selectedEventId(value) {   
        this.state.selectedEventId = value;
        this.render();   
    }

    /**
     * Update unique event types from current events
     * @private
     */
    updateTypes() {
        this.state.types = [...new Set(
            this.state.events.map(event => event.type)
        )];
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
     * Handle event selection from UI
     * @param {Event} e - Click event
     * @fires {CustomEvent} eventselect
     * @private
     */
    handleeventselect(e) {
        const eventId = parseInt(e.target.dataset.id);
        if (eventId) {
            this.state.selectedEventId = eventId;
            this.dispatchEvent(new CustomEvent('eventselect', { 
                detail: { id: eventId },
                bubbles: true
            }));
        }
    }

    /**
     * Render track visualization
     * @private
     */
    render() {
        const { events, cursorPosition, viewportSize, zoomFactor, laneHeight, laneGap, types, numLanes, viewportOffset = 0 } = this.state;
        const totalHeight = (laneHeight + laneGap) * Math.min(types.length, numLanes);

        // Filter events visible in current viewport
        const visibleEvents = events.filter(event => {
            const startX = (event.start * zoomFactor) - viewportOffset;
            const endX = startX + (event.duration * zoomFactor);
            return endX >= 0 && startX <= viewportSize;
        });

        // Create lanes background
        const lanes = types.slice(0, numLanes).map((type, i) => svg`
            <g>
                <line x1="0" y1="${i * (laneHeight + laneGap)}"
                    x2="${viewportSize}" y2="${i * (laneHeight + laneGap)}"
                    stroke="#ddd" stroke-width="1"/>
            </g>
        `);

        // Create event rectangles adjusted for viewport
        const rectangles = visibleEvents.map(event => {
            const laneIndex = types.indexOf(event.type);
            if (laneIndex === -1 || laneIndex >= numLanes) return null;
            
            const x = (event.start * zoomFactor) - viewportOffset;
            const isSelected = event.id === this.state.selectedEventId;
            
            return svg`
                <rect x="${x}" y="${laneIndex * (laneHeight + laneGap)}"
                    width="${event.duration * zoomFactor}"
                    height="${laneHeight}"
                    fill="${this.getEventColor(laneIndex)}"
                    stroke="${isSelected ? '#000' : 'none'}"
                    stroke-width="${isSelected ? '2' : '0'}"
                    data-id="${event.id}"
                    data-action="eventselect"
                    @click="${this}"/>
            `;
        }).filter(Boolean);

        // Create lane labels that will be rendered on top
        const laneLabels = types.slice(0, numLanes).map((type, i) => svg`
            <g class="lane-label">
                <rect x="0" y="${i * (laneHeight + laneGap)}" 
                    width="60" height="20" 
                    fill="white" fill-opacity="0.5"/>
                <text x="5" y="${i * (laneHeight + laneGap) + 15}"
                    fill="#666" font-size="14px" font-weight="bold">${type}</text>
            </g>
        `);

        // Adjust cursor for viewport
        const cursorX = (cursorPosition * zoomFactor) - viewportOffset;

        render(this, svg`
            <svg width="${viewportSize}" height="${totalHeight}">
                ${lanes}
                ${rectangles}
                <line x1="${cursorX}" y1="0" x2="${cursorX}" y2="${totalHeight}"
                    stroke="red" stroke-width="2"/>
                ${laneLabels}
            </svg>
        `);
    }

    /**
     * Get color for event based on lane index
     * @param {number} type - Lane index
     * @returns {string} Color hex code
     * @private
     */
    getEventColor(type = 0) {
        const colors = [
            '#4285f4', // blue
            '#ea4335', // red
            '#fbbc05', // yellow
            '#34a853', // green
            '#ff6d01', // orange
            '#46bdc6', // cyan
            '#7c4dff', // purple
            '#795548', // brown
            '#9e9e9e', // grey
            '#607d8b'  // blue-grey
        ];
        return colors[type % colors.length];
    }
}

customElements.define('track-component', Track);
export { Track };