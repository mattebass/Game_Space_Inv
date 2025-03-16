import { render, html } from '../lib/uhtml.js';
import { ScoreManager } from '../core/scoreManager.js';

/**
 * Dialog component for creating new timeline events
 * Allows positioning events on tracks with specific durations
 * @extends HTMLElement
 * @fires {CustomEvent} event-created - When a new event is created
 */
export class NewEventDialog extends HTMLElement {
    /**
     * Initialize dialog state
     */
    constructor() {
        super();
        this.cursorPosition = 0;
        this.score = null;
    }

    connectedCallback() {
        this.render();
    }

    handleEvent(e) {
        const action = e.target.dataset.action;
        if (action && this[`handle${action}`]) {
            this[`handle${action}`](e);
        }
    }

    /**
     * Set initial values for event creation
     * @param {number} cursorPosition - Timeline position in frames
     */
    setInitialValues(cursorPosition) {
        this.cursorPosition = cursorPosition;
        this.score = ScoreManager.getActiveScore();
    }

    handlecancel() {
        this.querySelector('#dialog').close('cancel');
    }

    /**
     * Create new event with specified parameters
     * @private
     * @fires CustomEvent#event-created
     */
    handleconfirm() {
        const dialog = this.querySelector('#dialog');
        const trackId = dialog.querySelector('#track-select').value;
        const position = this.parseTime(dialog.querySelector('#position').value);
        const duration = this.parseTime(dialog.querySelector('#duration').value);
        const type = dialog.querySelector('#event-type').value;
            
        this.dispatchEvent(new CustomEvent('event-created', {
            detail: { 
                trackId,
                eventData: {
                    frame: position,
                    duration: duration,
                    type: type
                }
            }
        }));
        
        dialog.close('confirm');
    }

    /**
     * Parse time string to frame number
     * @param {string} timeStr - Time in MM:SS:FF format
     * @returns {number} Frame number
     * @private
     */
    parseTime(timeStr) {
        const [minutes, seconds, frames] = timeStr.split(':').map(Number);
        return frames + (seconds * this.score.data.frequency) + 
               (minutes * 60 * this.score.data.frequency);
    }

    /**
     * Format frame number as time string
     * @param {number} frames - Frame number
     * @returns {string} Time in MM:SS:FF format
     * @private
     */
    formatTime(frames) {
        const frequency = this.score.data.frequency;
        const totalSeconds = Math.floor(frames / frequency);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const remainingFrames = Math.floor(frames % frequency);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${remainingFrames.toString().padStart(2, '0')}`;
    }

    render() {
        const tracks = this.score?.data.tracks || [];
        const selectedTrack = tracks.find(track => 
            track.id === parseInt(this.querySelector('#track-select')?.value || tracks[0]?.id)
        );
        const eventTypes = selectedTrack?.data.eventTypes || [];
        
        render(this, html`
            <dialog id="dialog" class="new-event-dialog">
                <form method="dialog">
                    <h3>Create New Event</h3>
                    <div class="form-group">
                        <label for="track-select">Track:</label>
                        <select id="track-select" @change=${this}>
                            ${tracks.map(track => html`
                                <option value=${track.id}>${track.data.name}</option>
                            `)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="event-type">Event Type:</label>
                        <select id="event-type">
                            ${eventTypes.map(type => html`
                                <option value=${type}>${type}</option>
                            `)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="position">Position:</label>
                        <input type="text" id="position" 
                            .value=${this.formatTime(this.cursorPosition)} 
                            placeholder="MM:SS:FF"/>
                    </div>
                    <div class="form-group">
                        <label for="duration">Duration:</label>
                        <input type="text" id="duration" 
                            .value=${this.formatTime(this.score?.data.frequency || 0)} 
                            placeholder="MM:SS:FF"/>
                    </div>
                    <div class="dialog-buttons">
                        <button type="button" data-action="cancel" @click=${this}>Cancel</button>
                        <button type="button"  data-action="confirm" @click=${this}>
                            Create Event
                        </button>
                    </div>
                </form>
            </dialog>
        `);

        const dialog = this.querySelector('#dialog');
        dialog.showModal();
    }
}

customElements.define('new-event-dialog', NewEventDialog);