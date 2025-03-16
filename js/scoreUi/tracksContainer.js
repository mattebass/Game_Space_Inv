import { html, render } from '../lib/uhtml.js';
import { TrackControls } from './trackControls.js';
import { TimeScale } from './timeScale.js';
import { Track } from './track.js';
import { PositionDisplay } from './positionDisplay.js';

/**
 * Visual timeline container for event tracks
 * Manages track display, playback, zooming, and scrolling
 * @extends HTMLElement
 * @fires {CustomEvent} guiselectionchange - When an event is selected in the timeline
 * @listens {CustomEvent} eventselect - When an event is selected in a track
 * @listens {CustomEvent} cursorchange - When timeline cursor position changes
 * @listens {CustomEvent} play - When playback is started
 * @listens {CustomEvent} pause - When playback is paused
 * @listens {CustomEvent} stop - When playback is stopped
 * @listens {CustomEvent} zoom - When zoom level changes
 */
class TracksContainer extends HTMLElement {
    /**
     * Initialize timeline state
     * @private
     */
    constructor() {
        super();
        this.state = {
            score: {},           // Score data object
            cursorPosition: 0,   // Current timeline position in frames
            viewportSize: 1000,  // Visible width in pixels
            viewportOffset: 0,   // Horizontal scroll offset
            zoomFactor: 1,       // Zoom level multiplier
            isPlaying: false,    // Playback state
            selectedEventId: null, // Currently selected event
            totalLength: 0       // Total length of the timeline
        };
    }

    /**
     * Update timeline with new score data
     * @param {Object} scoreData - Score data to display
     */
    setData(scoreData) {
        this.state.score = scoreData;
        this.state.totalLength = this.calculateTotalLength();
        this.render();
    }

    /**
     * Calculate total length of the timeline
     * @returns {number} Total length in frames
     * @private
     */
    calculateTotalLength() {
        if (!this.state.score?.data?.tracks) return 0;
        return Math.max(...this.state.score.data.tracks.flatMap(track => 
            track.data.events.map(event => 
                event.data.frame + event.data.duration
            )
        ), 0);
    }

    /**
     * Set up resize observer when component mounts
     * @override
     */
    connectedCallback() {
        // Create ResizeObserver to handle viewport resizing
        this.resizeObserver = new ResizeObserver(() => {
            this.calculateViewportSize();
        });

        this.resizeObserver.observe(this);

        // Initial render
        //  this.render();
    }

    /**
     * Clean up resize observer when component unmounts
     * @override
     */
    disconnectedCallback() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    /**
     * Central event handler that routes events to specific handlers
     * @param {Event} e - DOM event object
     */
    handleEvent(e) {
        const type = e.type;
        if (this[`handle${type}`]) {
            this[`handle${type}`](e);
        }
        const action = e.target?.dataset?.action;
        if (action && this[`handle${action}`]) {
            this[`handle${action}`](e);
        }

    }

    /**
     * Handle event selection in timeline
     * @param {CustomEvent} e - Selection event
     * @param {Object} e.detail - Event details
     * @param {number} e.detail.id - ID of selected event
     * @fires {CustomEvent} guiselectionchange
     * @private
     */
    handleeventselect(e) {
        const eventId = e.detail.id;
        this.setSelectedEventId(eventId);       

        this.dispatchEvent(new CustomEvent('guiselectionchange', {
            detail: { selectedEventId: eventId },
            bubbles: true
        }));
       
    }

    /**
     * Handle viewport scroll changes
     * @param {CustomEvent} e - Viewport event
     * @param {Object} e.detail - Viewport details
     * @param {number} e.detail.viewportOffset - New scroll position
     * @private
     */
    handleviewportChange(e) {
        this.state.viewportOffset = e.detail.viewportOffset;
        this.render();
    }

    /**
     * Get frame number of last event in timeline
     * @returns {number} Last event end frame
     * @private
     */
    getLastEventFrame() {
        if (!this.state.score.data?.tracks) return 0;

        return Math.max(0, ...this.state.score.data.tracks.flatMap(track =>
            track.data.events.map(event =>
                event.data.frame + event.data.duration
            )
        ));
    }

    /**
     * Handle cursor position changes
     * @param {CustomEvent} e - Cursor event
     * @param {Object} e.detail - Cursor details
     * @param {number} e.detail.position - New cursor position in frames
     * @private
     */
    handlecursorchange(e) {
        const position = Math.max(0, e.detail.position);
        // Remove lastFrame check and constraint
        this.state.cursorPosition = position;

        this.adjustViewport();
        this.render();
    }

    /**
     * Adjust viewport to keep cursor visible
     * @private
     */
    adjustViewport() {
        const margin = 100; // pixels margin from edges
        const cursorPixelPosition = this.state.cursorPosition * this.state.zoomFactor;
        const effectivePosition = cursorPixelPosition - this.state.viewportOffset;

        // Scroll left if cursor too close to left edge
        if (effectivePosition < margin) {
            this.state.viewportOffset = Math.max(0, cursorPixelPosition - margin);
        }

        // Scroll right if cursor too close to right edge
        if (effectivePosition > this.state.viewportSize - margin) {
            this.state.viewportOffset = cursorPixelPosition - this.state.viewportSize + margin;
        }
    }

    /**
     * Start timeline playback
     * @private
     */
    handleplay() {
        this.state.isPlaying = true;
        this.startPlayback();
        this.dispatchEvent(new CustomEvent('cursorchange', {
            detail: { position: this.state.cursorPosition },
            bubbles: true
        }));
        this.render();
    }

    /**
     * Pause timeline playback
     * @private
     */
    handlepause() {
        this.state.isPlaying = false;
        this.render();
    }

    /**
     * Stop playback and reset cursor
     * @private
     */
    handlestop() {
        this.state.isPlaying = false;
        this.state.cursorPosition = 0;
        this.dispatchEvent(new CustomEvent('cursorchange', {
            detail: { position: 0 },
            bubbles: true
        }));
        this.render();
    }

  
    /**
     * Update timeline zoom level
     * @param {CustomEvent} e - Zoom event
     * @param {Object} e.detail - Zoom details
     * @param {number} e.detail.zoomLevel - New zoom factor
     * @private
     */
    handlezoom() {
        const zoomLevel = parseFloat(event.detail.zoomLevel);
        this.state.zoomFactor = zoomLevel;
        this.render();
    }

    /**
     * Animate timeline playback
     * Uses requestAnimationFrame for smooth animation
     * @private
     */
    startPlayback() {
        if (!this.state.isPlaying) return;

        const startTime = performance.now();
        const startFrame = this.state.cursorPosition;
        const frequency = this.state.score.data?.frequency || 60;

        const animate = (timestamp) => {
            if (!this.state.isPlaying) return;

            const elapsed = timestamp - startTime;
            const newPosition = startFrame + Math.floor(elapsed * frequency / 1000);

            this.state.cursorPosition = newPosition;
            this.dispatchEvent(new CustomEvent('cursorchange', {
                detail: { position: newPosition },
                bubbles: true
            }));

            this.adjustViewport();
            this.render();

            if (this.state.isPlaying) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Calculate and update viewport dimensions
     * @private
     */
    calculateViewportSize() {
        const container = this.querySelector('.tracks-container');
        if (!container) return;

        // Get the total width of the container
        const totalWidth = container.clientWidth;
        // Subtract the fixed width of track controls (200px)
        const viewportSize = totalWidth - 200;

        if (this.state.viewportSize !== viewportSize) {
            this.state.viewportSize = viewportSize;
            this.render();
        }
    }

    /**
     * Update selected event
     * @param {number} value - ID of event to select
     */
    setSelectedEventId(value) {
        if (this.state.selectedEventId !== value) {
            this.state.selectedEventId = value;
            this.render();
        }
    }

    /**
     * Render track components
     * @returns {TemplateResult} Track elements
     * @private
     */
    renderTracks() {
        const tracks = this.state.score.data?.tracks ?? [];
        const trackElements = tracks.length ? tracks.map((track, index) => {
            return html`
                <div class="track-row" data-trackindex="${index}">
                    <div class="track-controls">
                        <span class="track-name">${track.data?.name ?? ''}</span>
                    </div>
                    <track-component .events="${(track.data?.events ?? []).map(event => ({
                                start: event.data?.frame ?? 0,
                                duration: event.data?.duration ?? 0,
                                type: event.data?.type ?? '',
                                id: event.id ?? index
                            }))}" .cursorPosition="${this.state.cursorPosition}" .viewportSize="${this.state.viewportSize}"
                        .zoomFactor="${this.state.zoomFactor}" .viewportOffset="${this.state.viewportOffset}"
                        .selectedEventId="${this.state.selectedEventId}">
                    </track-component>
                </div>
            `;
        }) : html`<div class="no-tracks">No tracks available</div>`;

        return trackElements;
    }

    /**
     * Render timeline container
     * @private
     */
    render() {
        const totalLength = this.getLastEventFrame();
        
        render(this, html`
            <div class="tracks-container">
                <div class="controls-row">
                    <track-controls 
                        .isPlaying="${this.state.isPlaying}" 
                        .zoomFactor="${this.state.zoomFactor}" 
                        @play="${this}"
                        @pause="${this}" 
                        @stop="${this}" 
                        @zoom="${this}">
                    </track-controls>
                    <position-display
                        .cursorPosition="${this.state.cursorPosition}"
                        .totalLength="${this.state.totalLength}">
                    </position-display>
                </div>
                <div class="timeline-container">
                    <div class="timeline-spacer"></div>
                    <div class="scrollable-content">
                        <timescale-component .cursorPosition="${this.state.cursorPosition}"
                            .viewportSize="${this.state.viewportSize}" .zoomFactor="${this.state.zoomFactor}"
                            .viewportOffset="${this.state.viewportOffset}" @cursorchange=${this}>
                        </timescale-component>
                    </div>
                </div>
                <div class="scrollable-content"  @eventselect="${this}">
                    ${this.renderTracks()}
                </div>
            </div>
        `);
    }
}

customElements.define('tracks-container', TracksContainer);
export { TracksContainer };