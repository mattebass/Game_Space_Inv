import { html, render } from './lib/uhtml.js';
import { ScoreEditor } from './inputUi/scoreEditor.js';
import { TracksContainer } from './scoreUi/tracksContainer.js';
import { SeqTrack } from './core/seqTrack.js';
import { SeqScore } from './core/seqScore.js';
import { ScoreManager } from './core/scoreManager.js';

/**
 * Main sequencer application component
 * Coordinates timeline editor and visual track display for event sequence management
 * @extends HTMLElement
 * @fires {CustomEvent} tracks-update - When tracks data is modified
 * @listens {CustomEvent} editorselectionchange - When an event is selected in editor
 * @listens {CustomEvent} guiselectionchange - When an event is selected in timeline
 * @listens {CustomEvent} newevent - When a new event is created
 * @listens {CustomEvent} deleteevent - When an event is deleted
 * @listens {CustomEvent} clearevents - When all events are cleared
 * @listens {CustomEvent} updateevent - When an event is modified
 * @listens {CustomEvent} eventsoffset - When events are shifted in time
 * @listens {CustomEvent} newtrack - When a new track is created
 * @listens {CustomEvent} deletetrack - When a track is deleted
 * @listens {CustomEvent} scorechanged - When sequence data changes
 */
class Sequitur extends HTMLElement {
    /**
     * Initialize sequencer state and components
     * @private
     */
    constructor() {
        super();
        this.state = {
            selectedEventId: null
        };
    }

    /**
     * Initialize component when added to DOM
     * Sets up data, UI components and event handlers
     * @throws {Error} If score data cannot be loaded
     * @async
     */
    async connectedCallback() {
        try {
            await this.initData();
            this.initScoreEditor();
            this.initTracksContainer();
            this.render();
        } catch (error) {
            console.error('Error loading score data:', error);
            this.renderError(error.message);
        }

        this.setupEventListeners();
    }

    /**
     * Load initial sequence data from JSON
     * @throws {Error} If data cannot be loaded or is invalid
     * @private
     * @async
     */
    async initData() {
        const response = await fetch('./data/score.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data) {
            throw new Error('Invalid score data format');
        }

        this.score = ScoreManager.createScore();
        this.score.setData(data);
        ScoreManager.setActiveScore(this.score);
    }

    /**
     * Initialize event list editor component
     * @private
     */
    initScoreEditor() {
        this.scoreEditor = new ScoreEditor();
        this.scoreEditor.setData(this.score);
    }

    /**
     * Initialize visual timeline component
     * @private
     */
    initTracksContainer() {
        this.tracksContainer = new TracksContainer();
        this.tracksContainer.setData(this.score);
    }

    /**
     * Render error state when initialization fails
     * @param {string} message Error message to display
     * @private
     */
    renderError(message) {
        render(this, html`
            <style>
                .error {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                }
            
                h2 {
                    color: red;
                }
            
                button {
                    padding: 10px;
                    margin-top: 10px;
                    cursor: pointer;
                }
            </style>
            <div class="error">
                <h2>Error Loading Sequencer</h2>
                <p>${message}</p>
                <button @click=${() => location.reload()}>Retry</button>
            </div>
        `);
    }

    /**
     * Central event handler that routes events to specific handlers
     * @param {Event} e DOM event object
     * @private
     */
    handleEvent(e) {
        const type = e.type;
        const action = e.target?.dataset?.action;
        if (this[`handle${type}`]) {
            this[`handle${type}`](e);
        }

        if (action && this[`handle${action}`]) {
            this[`handle${action}`](e);
        }
    }

    /**
     * Handle selection from timeline view
     * Updates editor selection state
     * @param {CustomEvent} e Selection event
     * @param {Object} e.detail Event details
     * @param {number} e.detail.selectedEventId ID of selected event
     * @private
     */
    handleguiselectionchange(e) {
        const eventId = e.detail.selectedEventId;
        this.state.selectedEventId = eventId;
        this.scoreEditor.setSelectedEventId(eventId);
    }

    /**
     * Handle selection from editor view
     * Updates timeline selection state
     * @param {CustomEvent} e Selection event
     * @param {Object} e.detail Event details
     * @param {number} e.detail.selectedEventId ID of selected event
     * @private
     */
    handleeditorselectionchange(e) {
        const eventId = e.detail.selectedEventId;
        this.state.selectedEventId = eventId;
        this.tracksContainer.setSelectedEventId(eventId);
    }

    /**
     * Create new event in timeline
     * @param {CustomEvent} e Event creation details
     * @param {Object} e.detail Event configuration
     * @param {number} e.detail.trackId ID of track to add event to
     * @param {Object} e.detail.eventData Event properties
     * @private
     */
    handlenewevent(e) {
        const { trackId, eventData } = e.detail;
        ScoreManager.addEvent(trackId, eventData);
        this.updateViews();
    }

    /**
     * Delete event from timeline
     * @param {CustomEvent} e Event deletion details
     * @param {Object} e.detail Event identifier
     * @param {number} e.detail.trackId ID of track containing event
     * @param {number} e.detail.eventId ID of event to delete
     * @private
     */
    handledeleteevent(e) {
        const { trackId, eventId } = e.detail;
        ScoreManager.removeEvent(trackId, eventId);
        if (eventId === this.state.selectedEventId) {
            this.state.selectedEventId = null;
            this.scoreEditor.selectedEventId = null;
            this.tracksContainer.selectedEventId = null;
        }
        this.updateViews();
    }

    /**
     * Clear all events from timeline
     * @private
     */
    handleclearevents(e) {
        const score = ScoreManager.getActiveScore();
        score.data.tracks.forEach(track => {
            track.data.events.forEach(event => {
                ScoreManager.removeEvent(track.id, event.id);
            });
        });
        this.updateViews();
    }

    /**
     * Update existing event properties
     * @param {CustomEvent} e Event update details
     * @param {Object} e.detail Updated event data
     * @param {number} e.detail.trackId ID of track containing event
     * @param {number} e.detail.eventId ID of event to update
     * @param {Object} e.detail.eventData New event properties
     * @private
     */
    handleupdateevent(e) {
        const { trackId, eventId, eventData } = e.detail;
        const event = ScoreManager.getEventById(eventId);
        if (event) {
            event.setData(eventData);
            this.updateViews();
        }
    }

    /**
     * Handle score data changes
     * Updates all views with new data
     * @param {CustomEvent} e Score change event
     * @private
     */
    handlescorechanged(e){
        this.updateViews();
    }

    /**
     * Shift all events by frame offset
     * @param {CustomEvent} e Offset event
     * @param {Object} e.detail Offset configuration
     * @param {number} e.detail.frames Number of frames to shift
     * @private
     */
    handleeventsoffset(e) {
        const { frames } = e.detail;
        const score = ScoreManager.getActiveScore();

        // Shift all events in all tracks
        score.data.tracks.forEach(track => {
            ScoreManager.shiftTrackEvents(track.id, -frames);
        });

        this.updateViews();
    }

    /**
     * Create new track in timeline
     * @param {CustomEvent} e Track creation details
     * @param {Object} e.detail Track configuration
     * @param {string} e.detail.name Track name
     * @param {string[]} e.detail.eventTypes Supported event types
     * @private
     */
    handlenewtrack(e) {
        const { name, eventTypes } = e.detail;
        const track = ScoreManager.addTrack(name, eventTypes);
        if (track) {
            // Ensure the score reference is updated
            this.score = ScoreManager.getActiveScore();
            this.updateViews();
        }
    }

    /**
     * Delete track and its events
     * @param {CustomEvent} e Track deletion details
     * @param {Object} e.detail Track identifier
     * @param {number} e.detail.trackId ID of track to delete
     * @private
     */
    handledeletetrack(e) {
        const { trackId } = e.detail;
        ScoreManager.removeTrack(trackId);
        const selectedEvent = ScoreManager.getEventById(this.state.selectedEventId);
        if (selectedEvent && selectedEvent.trackId === trackId) {
            this.state.selectedEventId = null;
            this.scoreEditor.setSelectedEventId(null);
            this.tracksContainer.setSelectedEventId(null);
        }
        this.updateViews();
    }

    /**
     * Handle cursor position changes from timeline
     * @param {CustomEvent} e Cursor change event
     * @private
     */
    handlecursorchange(e) {
        const position = e.detail.position;
        if (this.scoreEditor) {
            // Use smooth scrolling only for manual timeline clicks
            const smooth = e.type === 'click';
            this.scoreEditor.scrollToNearestEvent(position, smooth);
        }
    }

    /**
     * Set up event listeners for component communication
     */
    setupEventListeners() {
        // Score editor events


        // Tracks container events
        this.addEventListener('tracks-update', (e) => {
            this.tracks = e.detail;
            this.render();
        });
    }

    /**
     * Update UI components with latest data
     * Maintains selection state across updates
     * @private
     */
    updateViews() {
        // Get latest score from ScoreManager
        this.score = ScoreManager.getActiveScore();
        // Update both components with fresh score data
        this.scoreEditor.setData(this.score);
        this.tracksContainer.setData(this.score);
        // Maintain selection state when updating views
        this.scoreEditor.setSelectedEventId(this.state.selectedEventId);
        this.tracksContainer.setSelectedEventId(this.state.selectedEventId);
    }

    /**
     * Render main component layout
     * Sets up event listeners for child components
     * @private
     */
    render() {
        render(this, html`
            <div class="score-editor"
                @editorselectionchange=${this} 
                @newtrack=${this} 
                @deletetrack=${this} 
                @newevent=${this}
                @deleteevent=${this}
                @clearevents=${this}
                @updateevent=${this}
                @eventsoffset=${this}
                @scorechanged=${this}>
                ${this.scoreEditor}
            </div>
            <div class="tracks-container" 
                @guiselectionchange=${this}
                @cursorchange=${this}>
                ${this.tracksContainer}
            </div>
        `);
    }
}

// Register the web component
customElements.define('sequitur-app', Sequitur);
export { Sequitur };
