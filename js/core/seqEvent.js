import { IdProvider } from "./idProvider.js";

/**
 * Represents a single event in the timeline
 * Contains timing information and type classification
 */
class SeqEvent {
    /**
     * Create new event with default values
     */
    constructor() {
        this.id = IdProvider.getNextId();
        this.data = {
            type: '0',    // Event classification
            frame: 0,     // Start position in timeline
            duration: 1   // Length in frames
        }
    }

    /**
     * Update event properties
     * @param {Object} data - Event configuration
     * @param {string} [data.type='0'] - Event classification
     * @param {number} [data.frame=0] - Start position (>= 0)
     * @param {number} [data.duration=1] - Event duration (>= 1)
     */
    setData(data) {
        if (!data) return;

        this.data.type = data.type?.toString() || '0';
        this.data.frame = Math.max(0, +data.frame || 0);
        this.data.duration = Math.max(1, +data.duration || 1);
    }

    /**
     * Get event properties
     * @returns {Object} Event data
     * @property {string} type - Event classification
     * @property {number} frame - Start position
     * @property {number} duration - Event duration
     */
    getData() {
        return {
            type: this.data.type,
            frame: this.data.frame,
            duration: this.data.duration
        }
    }
}
export { SeqEvent };