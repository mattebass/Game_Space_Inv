import { html, render } from '../lib/uhtml.js';

/**
 * Dialog component for creating new event sequences
 * Configures basic timeline parameters like frequency and title
 * @extends HTMLElement
 * @fires {CustomEvent} scorecreated - When a new sequence is created
 */
export class NewScoreDialog extends HTMLElement {
    /**
     * Initialize dialog with default sequence parameters
     */
    constructor() {
        super();
        this.state = {
            title: '',           // Sequence title
            frequency: 60        // Events per second (timeline frequency)
        };
    }

    /**
     * Show dialog on component mount
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
     * Close dialog without creating sequence
     * @private
     */
    handlecancel() {
        this.querySelector('#dialog').close('cancel');
    }

    /**
     * Create new sequence with specified parameters
     * @private
     * @fires CustomEvent#scorecreated
     */
    handleconfirm() {
        const dialog = this.querySelector('#dialog');
        const title = dialog.querySelector('#score-title').value;
        const frequency = parseInt(dialog.querySelector('#score-frequency').value);

        this.dispatchEvent(new CustomEvent('scorecreated', {
            detail: {
                title: title || 'Untitled Sequence',
                frequency: Math.max(1, frequency || 60),
                timeScale: 1.0
            }
        }));

        dialog.close('confirm');
    }

    /**
     * Update state when form fields change
     * @private
     * @param {Event} e - Change event
     */
    handlechange(e) {
        this.state[e.target.name] = e.target.value;
    }

    /**
     * Render dialog UI
     * @private
     */
    render() {
        render(this, html`
            <dialog id="dialog">
                <form method="dialog">
                    <h3>Create New Score</h3>
                    
                    <div class="form-group">
                        <label for="score-title">Title:</label>
                        <input type="text" 
                            id="score-title"
                            name="title"
                            .value=${this.state.title}
                            data-action="change"
                            @change=${this}
                            placeholder="Score Title"/>
                    </div>
                    
                    <div class="form-group">
                        <label for="score-frequency">Frequency (FPS):</label>
                        <input type="number"
                            id="score-frequency"
                            name="frequency"
                            min="1"
                            .value=${this.state.frequency}
                            data-action="change"
                            @change=${this}/>
                    </div>
                    
                    <div class="dialog-buttons">
                        <button type="button" data-action="cancel" @click=${this}>Cancel</button>
                        <button type="button" data-action="confirm" @click=${this}>Create Score</button>
                    </div>
                </form>
            </dialog>
        `);

        const dialog = this.querySelector('#dialog');
        dialog.showModal();
    }
}

customElements.define('new-score-dialog', NewScoreDialog);