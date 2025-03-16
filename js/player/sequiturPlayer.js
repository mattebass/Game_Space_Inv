import { ScoreManager } from '../core/scoreManager.js';

/**
 * SequiturPlayer plays back recorded score events by managing event timing and observer states.
 * Observers can subscribe to track events and have their properties updated based on event state.
 */
export class SequiturPlayer {
    constructor() {
        /** Map of track ID to array of observers */
        this.observers = new Map();
        /** Currently loaded score */
        this.score = null;
        /** Current playback frame */
        this.currentFrame = 0;
        /** Playback state */
        this.isPlaying = false;
        /** Set of currently active events */
        this.activeEvents = new Set();
        /** Set of upcoming events */
        this.upcomingEvents = new Set();
    }

    /**
     * Loads a score and resets playback state
     * @param {Object} score - Score data to load
     */
    loadScore(score) {
        if (!score) return;
        console.log('Loading score:', score);
        this.score = score;
        this.currentFrame = 0;
        this.resetEvents();
    }

    /**
     * Registers an object to observe events from a specific track
     * @param {Object} object - Object to receive event updates
     * @param {string} trackName - Name of track to observe
     */
    observe(object, trackName) {
        if (!this.score || !object) return;

        const track = this.score.data.tracks.find(t => t.data.name === trackName);
        if (!track) return;

        this.initializeTrackObserver(track, object);
        this.resetEvents();
    }

    /**
     * Initializes an observer for a track's event types
     * @private
     */
    initializeTrackObserver(track, object) {
        if (!this.observers.has(track.id)) {
            this.observers.set(track.id, []);
        }

        track.data.eventTypes.forEach(eventType => {
            this.observers.get(track.id).push({ object, eventType });
            if (!(eventType in object)) {
                object[eventType] = false;
            }
        });
    }

    /**
     * Resets event collections and initializes upcoming events
     * @private
     */
    resetEvents() {
        this.activeEvents.clear();
        this.upcomingEvents.clear();

        if (!this.score) return;

        this.score.data.tracks.forEach(track => {
            track.data.events
                .filter(event => event.data.frame >= this.currentFrame)
                .forEach(event => this.upcomingEvents.add(event));
        });
    }

    /**
     * Advances playback by one frame
     * @private
     */
    step() {
        if (!this.score || !this.isPlaying) return;

        console.log('Frame:', this.currentFrame);
        console.log('Active events:', this.activeEvents.size);
        console.log('Upcoming events:', this.upcomingEvents.size);

        this.processEndingEvents();
        this.processStartingEvents();
        this.currentFrame++;
    }

    /**
     * Processes events that should end in the current frame
     * @private
     */
    processEndingEvents() {
        for (const event of this.activeEvents) {
            if (event.data.frame + event.data.duration <= this.currentFrame) {
                this.activeEvents.delete(event);
                this.updateObservers(event, false);
            }
        }
    }

    /**
     * Processes events that should start in the current frame
     * @private
     */
    processStartingEvents() {
        for (const event of this.upcomingEvents) {
            if (event.data.frame <= this.currentFrame) {
                console.log('Starting event:', event);
                this.activeEvents.add(event);
                this.upcomingEvents.delete(event);
                this.updateObservers(event, true);
            }
        }
    }

    /**
     * Updates all observers of an event with its new state
     * @private
     */
    updateObservers(event, value) {
        const track = this.score.data.tracks.find(t => 
            t.data.events.includes(event)
        );
        if (!track || !this.observers.has(track.id)) {
            console.log('No observers found for track:', track?.id);
            return;
        }

        this.observers.get(track.id)
            .filter(observer => observer.eventType === event.data.type)
            .forEach(observer => {
                console.log('Updating observer:', observer.eventType, value);
                observer.object[event.data.type] = value;
            });
    }

    /**
     * Starts playback from the beginning
     */
    play() {
        if (!this.score) return;
        
        // Always start from beginning
        this.currentFrame = 0;
        this.resetEvents();
        
        // Reset all observers to initial state
        this.observers.forEach(observers => {
            observers.forEach(({ object, eventType }) => {
                object[eventType] = false;
            });
        });
        
        this.isPlaying = true;
    }

    /**
     * Stops playback
     */
    stop() {
        this.isPlaying = false;
    }
}
