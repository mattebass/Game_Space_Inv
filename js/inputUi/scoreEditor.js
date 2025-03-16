import { html, render } from '../lib/uhtml.js';
import { ScoreManager } from '../core/scoreManager.js';
import { NewEventDialog } from './newEventDialog.js';
import { NewTrackDialog } from './newTrackDialog.js';
import { NewScoreDialog } from './newScoreDialog.js';

/**
 * Timeline editor component for managing event sequences
 * Provides UI for creating, editing, and managing events on multiple tracks
 * with support for time-based positioning and event type configuration
 * @fires {CustomEvent} editorselectionchange - When an event is selected
 * @fires {CustomEvent} newevent - When a new event is created
 * @fires {CustomEvent} deleteevent - When an event is deleted
 * @fires {CustomEvent} clearevents - When all events are cleared
 * @fires {CustomEvent} updateevent - When an event is modified
 * @fires {CustomEvent} eventsoffset - When events are shifted in time
 * @fires {CustomEvent} newtrack - When a new track is created
 * @fires {CustomEvent} deletetrack - When a track is deleted
 * @fires {CustomEvent} scorechanged - When the sequence data changes
 * @extends HTMLElement
 */
class ScoreEditor extends HTMLElement {
    /**
     * Initialize editor state and event handlers
     */
    constructor() {
        super();   
        this.initState();
    }

    /**
     * Initialize component state with default values
     * @private
     */
    initState() {
        this.state = {
            cursorPosition: 0,          // Current timeline cursor position in frames
            highlightedEventId: null,   // Currently highlighted event
            selectedEventId: null,      // Currently selected event
            viewByTrack: false,        // Whether to group events by track
            offsetFrames: null          // Number of frames to offset all events
        };
    }
 
    /**
     * Update editor data and reset state
     * Preserves view preferences while clearing selection and offset
     * @param {Object} scoreData Timeline sequence data
     */
    setData(scoreData) {
        const viewByTrack = this.state?.viewByTrack || false;
        this.state = {
            cursorPosition: 0,
            highlightedEventId: null,
            selectedEventId: null,
            viewByTrack,
            offsetFrames: null
        };
        this.render();
    }

    /**
     * Get current timeline sequence data
     * @returns {Object|null} Current sequence data or null if none loaded
     */
    getData() {
        return ScoreManager.getActiveScore()?.getData();
    }

    /**
     * Convert time string to frame number
     * @param {string} timeStr Time in MM:SS:FF format (minutes:seconds:frames)
     * @returns {number} Absolute frame number
     * @private
     */
    parseTime(timeStr) {
        const [minutes, seconds, frames] = timeStr.split(':').map(Number);
        const score = ScoreManager.getActiveScore();
        return frames + (seconds * score.data.frequency) + 
               (minutes * 60 * score.data.frequency);
    }

    /**
     * Convert frame number to time string
     * @param {number} frames Absolute frame number
     * @returns {string} Time in MM:SS:FF format (minutes:seconds:frames)
     * @private
     */
    formatTime(frames) {
        const score = ScoreManager.getActiveScore();
        const frequency = score.data.frequency;
        const totalSeconds = Math.floor(frames / frequency);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const remainingFrames = Math.floor(frames % frequency);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${remainingFrames.toString().padStart(2, '0')}`;
    }

    /**
     * Central event handler that routes events to specific handlers based on data-action
     * @param {Event} e DOM event object
     */
    handleEvent(e) {
        const action=e.target.dataset.action;
        if (action && this[`handle${action}`]) this[`handle${action}`](e);       
    }

    /**
     * Delete event from timeline
     * @fires {CustomEvent} deleteevent
     * @private
     */
    handledelete(e) {
        const eventId = e.target.closest('.event-row').dataset.eventid;
        const trackId = e.target.closest('.event-row').dataset.trackid;
        
        this.dispatchEvent(new CustomEvent('deleteevent', { 
            detail: { trackId: parseInt(trackId), eventId: parseInt(eventId) },
            bubbles: true
        }));
    }

    /**
     * Delete all events from all tracks
     * @fires {CustomEvent} clearevents
     * @private
     */
    handledeleteall() {
        const score = ScoreManager.getActiveScore();
        if (!score?.data.tracks.length) return;

        const confirmDelete = window.confirm('Are you sure you want to delete all events?');
        if (!confirmDelete) return;
        // Reset selection state
        this.state.selectedEventId = 0;
        this.state.highlightedEventId = null;
        this.dispatchEvent(new CustomEvent('clearevents',{bubbles: true}));
        
       
        
        this.render();
    }

    /**
     * Delete track and all its events
     * @fires {CustomEvent} deletetrack
     * @private
     */
    handledeletetrack(e) {
        const trackId = e.target.closest('.track-header').dataset.trackid;
        
        const confirmDelete = window.confirm('Are you sure you want to delete this track and all its events?');
        if (!confirmDelete) return;

        this.dispatchEvent(new CustomEvent('track-delete', { 
            detail: { trackId: parseInt(trackId) },
            bubbles: true
        }));
    }

    /**
     * Create new event at current cursor position
     * @fires {CustomEvent} newevent
     * @private
     */
    handlenew() {
        const score = ScoreManager.getActiveScore();
        if (!score?.data.tracks.length) return;

        const dialog = new NewEventDialog();
        dialog.setInitialValues(this.state.cursorPosition);
        
        dialog.addEventListener('event-created', (e) => {
            this.dispatchEvent(new CustomEvent('newevent', {
                detail: e.detail,
                bubbles: true
            }));
        });

        document.body.appendChild(dialog);
    }

    /**
     * Update event data (time, duration, type)
     * @fires {CustomEvent} updateevent
     * @private
     */
    handleeventdatachange(e) {
        const score = ScoreManager.getActiveScore();
        if (!score) return;

        const eventId = parseInt(e.target.closest('.event-row').dataset.eventid);
        const trackId = parseInt(e.target.closest('.event-row').dataset.trackid);
        let field = e.target.name;
        let value = e.target.value;

        // Convert time input to frame value
        if (field === 'time') {
            value = this.parseTime(value);
            field = 'frame'; // Map 'time' field to 'frame' in data
        } else if (field === 'duration') {
            value = this.parseTime(value);
        }

        const event = ScoreManager.getEventById(eventId);
        if (event) {
            this.dispatchEvent(new CustomEvent('updateevent', {
                detail: { 
                    trackId,
                    eventId,
                    eventData: {
                        ...event.getData(),
                        [field]: value
                    }
                },
                bubbles: true
            }));
        }
    }

    /**
     * Toggle between track-grouped and time-ordered views
     * @private
     */
    handleviewbytrack(e) {
        this.state.viewByTrack = e.target.checked;
        this.render();
    }

    /**
     * Offset all events by specified number of frames
     * @fires {CustomEvent} eventsoffset
     * @private
     */
    handleoffset() {
        const score = ScoreManager.getActiveScore();
        if (!score?.data.tracks.length) return;
        
        this.dispatchEvent(new CustomEvent('eventsoffset', {  // Changed from events-shift
            detail: { frames: parseInt(this.state.offsetFrames) },
            bubbles: true
        }));

        // Reset offset value
        this.state.offsetFrames = 0;
        this.render();
    }

    /**
     * Update offset value when input changes
     * @private
     */
    handleoffsetchange(e) {
        this.state.offsetFrames = e.target.value;
    }

    /**
     * Remove empty time before first event
     * @fires {CustomEvent} eventsoffset
     * @private
     */
    handletrim() {
        const score = ScoreManager.getActiveScore();
        if (!score?.data.tracks.length) return;

        // Find the earliest event frame across all tracks
        const minFrame = Math.min(
            ...score.data.tracks.flatMap(track => 
                track.data.events.map(event => event.data.frame)
            )
        );

        // Only offset if we're not already at 0
        if (minFrame > 0) {
            this.dispatchEvent(new CustomEvent('eventsoffset', {
                detail: { frames: -minFrame },
                bubbles: true
            }));
            this.render();
        }
    }

    /**
     * Create new track for events
     * @fires {CustomEvent} newtrack
     * @private
     */
    handlenewtrack() {
        const dialog = new NewTrackDialog();
        
        dialog.addEventListener('trackcreated', (e) => {
            this.dispatchEvent(new CustomEvent('newtrack', {
                detail: e.detail,
                bubbles: true
            }));
        });

        document.body.appendChild(dialog);
    }

    /**
     * Create new empty sequence
     * @fires {CustomEvent} scorechanged
     * @private
     */
    handlenewscore() {
        const dialog = new NewScoreDialog();
        
        dialog.addEventListener('scorecreated', (e) => {
            const score = ScoreManager.createScore();
            score.setData(e.detail);
            ScoreManager.setActiveScore(score);
            this.setData();
            this.dispatchEvent(new CustomEvent('scorechanged', {
                bubbles: true
            }));
        });

        document.body.appendChild(dialog);
    }

    /**
     * Load sequence from file
     * @fires {CustomEvent} scorechanged
     * @private
     */
    handleload() {
        ScoreManager.loadScore().then(success => {
            if (success) {
                // Reset state and render
                this.setData();
                this.dispatchEvent(new CustomEvent('scorechanged', {
                    bubbles: true
                }));
            }
        });
    }

    /**
     * Save current sequence to file
     * @private
     */
    handlesave() {
        ScoreManager.saveScore();
    }

    /**
     * Programmatically select an event
     * @param {number} value Event ID to select
     */
    setSelectedEventId(value) {
        if (this.state.selectedEventId !== value) {
            this.state.selectedEventId = value;
            this.render();
            if (value) {
                this.scrollToSelectedEvent(value);
            }
        }
    }

    /**
     * Handle event selection from UI
     * @fires {CustomEvent} editorselectionchange
     * @private
     */
    handleeventselect(e) {
        const eventId = e.detail?.id || parseInt(e.target?.value);
        if (eventId) {
            this.state.selectedEventId = eventId;
            this.render();
            this.scrollToSelectedEvent(eventId);
            this.dispatchEvent(new CustomEvent('editorselectionchange', {
                detail: { selectedEventId: eventId },
                bubbles: true
            }));
        }
    }

    /**
     * Scroll selected event into view
     * @param {number} eventId ID of event to scroll to
     * @private
     */
    scrollToSelectedEvent(eventId) {
        requestAnimationFrame(() => {
            const row = this.querySelector(`tr[data-eventid="${eventId}"]`);
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    /**
     * Scroll to the event nearest to the given cursor position
     * @param {number} cursorPosition - Position in frames
     */
    scrollToNearestEvent(cursorPosition) {
        const score = ScoreManager.getActiveScore();
        if (!score) return;

        // Find the event closest to cursor position
        let closestEvent = null;
        let minDistance = Infinity;

        score.data.tracks.forEach(track => {
            track.data.events.forEach(event => {
                const distance = Math.abs(event.data.frame - cursorPosition);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestEvent = event;
                }
            });
        });

        if (closestEvent) {
            requestAnimationFrame(() => {
                const row = this.querySelector(`tr[data-eventid="${closestEvent.id}"]`);
                if (row) {
                    row.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center'
                    });
                }
            });
        }
    }

    scrollToNearestEvent(cursorPosition, smooth = false) {
        const score = ScoreManager.getActiveScore();
        if (!score) return;

        let closestEvent = null;
        let minDistance = Infinity;

        score.data.tracks.forEach(track => {
            track.data.events.forEach(event => {
                const distance = Math.abs(event.data.frame - cursorPosition);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestEvent = event;
                }
            });
        });

        if (closestEvent) {
            const row = this.querySelector(`tr[data-eventid="${closestEvent.id}"]`);
            if (row) {
                row.scrollIntoView({ 
                    behavior: smooth ? 'smooth' : 'auto',
                    block: 'center'
                });
            }
        }
    }

    render() {
        const score = ScoreManager.getActiveScore();
        if (!score) return;

        // Calculate allEvents first so it's available for both display modes
        const allEvents = score.data.tracks.flatMap((track, trackIndex) => 
            track.data.events.map(event => ({
                event,
                trackIndex,
                trackTypes: track.data.eventTypes
            }))
        );

        let eventRows;
        
        if (this.state.viewByTrack) {
            // Group events by track
            eventRows = score.data.tracks.map((track, trackIndex) => {
                const trackEvents = track.data.events.map(event => ({
                    event,
                    trackIndex,
                    trackTypes: track.data.eventTypes
                })).sort((a, b) => a.event.data.frame - b.event.data.frame);

                return html`
                    <tr class="track-header" data-trackid=${track.id}>
                        <td colspan="4">
                            <h3>Track: ${track.data.name}</h3>
                        </td>
                        <td>
                            <button  
                                data-action="deletetrack" 
                                @click=${this}>
                                Delete Track
                            </button>
                        </td>
                    </tr>
                    ${trackEvents.map(({event, trackTypes}) => 
                        this.renderEventRow(event, trackIndex, trackTypes))}
                `;
            });
        } else {
            // Sort all events by time
            eventRows = allEvents
                .sort((a, b) => a.event.data.frame - b.event.data.frame)
                .map(({event, trackIndex, trackTypes}) => 
                    this.renderEventRow(event, trackIndex, trackTypes)
                );
        }

        render(this, html`
            <div class="header">
                <div class="controls">
                    <div class="main-controls">
                        <button data-action="newscore" @click=${this}>New Score</button>                        
                        <button data-action="newtrack" @click=${this}>New Track</button>
                        <button data-action="new" @click=${this}>New Event</button>
                        <button data-action="deleteall" @click=${this}>Delete All Events</button>
                        <div class="file-controls">
                            <button data-action="load" @click=${this}>Load Score</button>
                            <button data-action="save" @click=${this}>Save Score</button>
                        </div>
                        <label>
                            <input type="checkbox" name="viewByTrack" 
                                data-action="viewbytrack" @change=${this}/> View by track
                        </label>
                    </div>
                    <div class="offset-controls">
                        <input type="number" 
                            name="offset" 
                            .value=${this.state.offsetFrames}
                            title="Positive values offset forward, negative values offset backward"
                            data-action="offsetchange"
                            @change=${this}/>
                        <button data-action="offset" @click=${this}>Offset Events</button>
                        <button data-action="trim" @click=${this}>Trim</button>
                    </div>
                </div>
                <div class="score-info">
                    <span>Score Info:</span>
                    <span>Total Tracks: ${score.data.tracks.length}</span>
                    <span>Total Events: ${allEvents.length}</span>
                    <span>Frequency: ${score.data.frequency}</span>
                    <span>Timescale: ${score.data.timeScale.toFixed(2)}</span>
                </div>
            </div>
            <div class="score-editor-timeline">
            <table>
                <thead>
                    <tr>
                        <th>Track</th>
                        <th>Event Type</th>
                        <th>Time (MM:SS:FF)</th>
                        <th>Duration (MM:SS:FF)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${eventRows}
                </tbody>
            </table>
        </div>
        `);
    }

    renderEventRow(event, trackIndex, trackTypes) {
        const isSelected = event.id === this.state.selectedEventId;
        const score = ScoreManager.getActiveScore();
        
        return html`
            <tr class=${`event-row ${isSelected ? 'highlighted' : ''}`}
                data-eventid=${event.id}
                data-trackid=${score.data.tracks[trackIndex].id}>
                <td>
                    <input type="radio" 
                        name="eventselectradio" 
                        .value=${event.id} 
                        .checked=${isSelected}
                        data-action="eventselect"
                        @change=${this}/>
                    ${!this.state.viewByTrack ? score.data.tracks[trackIndex].data.name : ''}
                </td>
                <td>
                    ${isSelected 
                        ? html`
                            <select name="type" 
                                .value=${event.data.type} 
                                data-action="eventdatachange" 
                                @change=${this}>
                                ${trackTypes.map(type => html`
                                    <option value=${type} 
                                        ?selected=${type === event.data.type}>${type}</option>
                                `)}
                            </select>
                        `
                        : html`<span class="readonly-value">${event.data.type}</span>`
                    }
                </td>
                <td>
                    ${isSelected 
                        ? html`
                            <input type="text" name="time" 
                                .value=${this.formatTime(event.data.frame)} 
                                data-action="eventdatachange" @change=${this}/>
                        `
                        : html`<span class="readonly-value">${this.formatTime(event.data.frame)}</span>`
                    }
                </td>
                <td>
                    ${isSelected 
                        ? html`
                            <input type="text" name="duration" 
                                .value=${this.formatTime(event.data.duration)} 
                                data-action="eventdatachange" @change=${this}/>
                        `
                        : html`<span class="readonly-value">${this.formatTime(event.data.duration)} (${event.data.duration} frames)</span>`
                    }
                </td>
                <td>
                    <button data-action="delete" @click=${this}>Delete</button>
                </td>
            </tr>
        `;
    }
}

customElements.define('score-editor', ScoreEditor);
export { ScoreEditor };