import { render, html } from '../lib/uhtml.js';

/**
 * Dialog component for creating new timeline tracks
 * Configures track name and supported event types
 * @extends HTMLElement
 * @fires {CustomEvent} trackcreated - When a new track is created
 */
export class NewTrackDialog extends HTMLElement {
    /**
     * Initialize dialog with default event types
     */
    constructor() {
        super();       
        this.eventTypes = ['event1', 'event2'];
    }

    /**
     * Show dialog when component is mounted
     * @override
     */
    connectedCallback() {
        this.render();
    }

    /**
     * Route events to specific handlers
     * @param {Event} e - DOM event
     */
    handleEvent(e) {
        const action = e.target.dataset.action;
        if (action && this[`handle${action}`]) {
            this[`handle${action}`](e);
        }
    }

    /**
     * Add new event type to list
     * @private
     */
    handleadd() {
        this.eventTypes.push('');
        this.render();
    }

    /**
     * Handle form field updates
     * @param {Event} e - Change event
     * @private
     */
    handlechange(e) {
        const index = parseInt(e.target.dataset.index);
        this.eventTypes[index] = e.target.value;
    }

    /**
     * Remove event type at specified index
     * @private
     * @param {Event} e - Click event
     */
    handleremove(e) {
        const index = parseInt(e.target.dataset.index);
        this.eventTypes.splice(index, 1);
        this.render();
    }

    /**
     * Close dialog without creating track
     * @private
     */
    handlecancel() {
        this.querySelector('#dialog').close('cancel');
    }

    /**
     * Create new track with specified configuration
     * @private
     * @fires CustomEvent#trackcreated
     */
    handleconfirm() {
        const dialog = this.querySelector('#dialog');
        const name = dialog.querySelector('#track-name').value;
        if (!name) return;
        
        const eventTypes = this.eventTypes.filter(type => type.trim() !== '');
        
        this.dispatchEvent(new CustomEvent('trackcreated', {
            detail: { 
                name,
                eventTypes 
            }
        }));
        
        dialog.close('confirm');
    }

    /**
     * Render dialog content
     * @private
     */
    render() {
        render(this, html`
            <dialog id="dialog" class="new-track-dialog">
                <form method="dialog">
                    <h3>Create New Track</h3>
                    <div class="form-group">
                        <label for="track-name">Track Name:</label>
                        <input type="text" id="track-name"/>
                    </div>
                    <div class="form-group">
                        <label>Event Types:</label>
                        ${this.eventTypes.map((type, index) => html`
                            <div class="event-type-row">
                                <input type="text" 
                                    .value=${type}
                                    data-action="change"
                                    data-index=${index}
                                    @change=${this}/>
                                <button type="button" 
                                    data-action="remove"
                                    data-index=${index}
                                    @click=${this}>
                                    Remove
                                </button>
                            </div>
                        `)}
                        <button type="button" 
                            data-action="add"
                            @click=${this}>
                            Add Event Type
                        </button>
                    </div>
                    <div class="dialog-buttons">
                        <button type="button" data-action="cancel" @click=${this}>Cancel</button>
                        <button type="button"  data-action="confirm" @click=${this}>
                            Create Track
                        </button>
                    </div>
                </form>
            </dialog>
        `);

        const dialog = this.querySelector('#dialog');
        dialog.showModal();
    }
}

customElements.define('new-track-dialog', NewTrackDialog);