import { IdProvider } from "./idProvider.js";
import { SeqEvent } from "./seqEvent.js";

/**
 * Container for related timeline events
 * Manages event ordering and supported event types
 */
class SeqTrack {
    /**
     * Create empty track
     */
    constructor() {
        this.id = IdProvider.getNextId();
        this.data = {
            name: '',          // Track identifier
            eventTypes: [],    // Supported event types
            events: []         // Timeline events
        }
    }

    /**
     * Update track properties and events
     * @param {Object} data - Track configuration
     * @param {string} [data.name] - Track name
     * @param {Array<string>} [data.eventTypes=[]] - Supported event types
     * @param {Array<Object>} [data.events=[]] - Event configurations
     */
    setData(data) {
        if (!data) return;

        this.data.name = data.name || `Track ${this.id}`;
        this.data.eventTypes = Array.isArray(data.eventTypes) ? [...data.eventTypes] : [];
        this.data.events = Array.isArray(data.events) 
            ? data.events
                .filter(eventData => eventData) // Filter out null/undefined
                .map(eventData => {
                    const event = new SeqEvent();
                    event.setData(eventData);
                    return event;
                })
            : [];
    }

    /**
     * Get track properties and events
     * @returns {Object} Track data
     * @property {string} name - Track name
     * @property {Array<string>} eventTypes - Supported event types
     * @property {Array<Object>} events - Event data
     */
    getData() {
        return {
            name: this.data.name,
            eventTypes: [...this.data.eventTypes],
            events: this.data.events.map(event => event.getData())
        }
    }

    /**
     * Offset all events by frame count
     * @param {number} frame - Frames to shift (negative shifts left)
     */
    shiftEvents(frame) {
        if (typeof frame !== 'number') return;
        this.data.events.forEach(event => {
            event.data.frame = Math.max(0, event.data.frame - frame);
        });
    }

    /**
     * Sort events by start frame
     * @private
     */
    reorderEvents() {
        this.data.events.sort((a, b) => a.data.frame - b.data.frame);
    }

    /**
     * Add event to track and maintain order
     * @param {SeqEvent} event - Event to add
     */
    addEvent(event) {
        if (!event) return;
        this.data.events.push(event);
        this.reorderEvents();
    }

    /**
     * Remove event from track
     * @param {SeqEvent} event - Event to remove
     */
    removeEvent(event) {
        if (!event) return;
        this.data.events = this.data.events.filter(e => e !== event);
    }
}

export { SeqTrack };