import { ScoreManager } from '../core/scoreManager.js';

/**
 * Records and processes timeline events in real-time
 * Manages event buffering, track assignment and event duration calculation
 */
export class SequiturRecorder {
    /**
     * Initialize recorder with empty buffer and score
     */
    constructor() {
        this.recordBuffer = [];     // Temporary storage for recorded events
        this.score = null;          // Active score instance
        this.initScore();
    }

    /**
     * Load and initialize score from template or create empty
     * @throws {Error} If template loading fails
     * @private
     * @async
     */
    async initScore() {
        try {
            const templateData = await this.loadTemplate();
            this.score = ScoreManager.createScore();
            this.score.setData(templateData);
        } catch (error) {
            console.error('Failed to load record template:', error);
            this.createEmptyScore();
        }
    }

    /**
     * Load score template from JSON file
     * @returns {Promise<Object>} Score template data
     * @throws {Error} If template fetch fails
     * @private
     * @async
     */
    async loadTemplate() {
        const response = await fetch('./data/recordScoreTemplate.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    /**
     * Create empty score with default track
     * @private
     */
    createEmptyScore() {
        this.score = ScoreManager.createScore();
        ScoreManager.setActiveScore(this.score);
        this.getOrCreateOrphanTrack();
    }

    /**
     * Record event occurrence with timing information
     * @param {number} frame - Frame number when event occurred
     * @param {string} eventType - Type of event
     * @param {boolean} startStop - True for event start, false for end
     */
    recordEvent(frame, eventType, startStop) {
        this.recordBuffer.push({ frame, eventType, startStop });
    }

    /**
     * Get or create default track for unmatched events
     * @returns {Object} Orphan track instance
     * @private
     */
    getOrCreateOrphanTrack() {
        let orphanTrack = this.score.data.tracks.find(t => t.data.name === 'Orphaned Events');
        if (!orphanTrack) {
            orphanTrack = ScoreManager.addTrack('Orphaned Events', []);
        }
        return orphanTrack;
    }

    /**
     * Find tracks that support given event type
     * @param {string} eventType - Event type to match
     * @returns {Array<Object>} Matching track instances
     * @private
     */
    findMatchingTracks(eventType) {
        return this.score.data.tracks.filter(track => 
            track.data.eventTypes.includes(eventType) && 
            track.data.name !== 'Orphaned Events'
        );
    }

    /**
     * Add event to track with duration
     * @param {Object} track - Target track instance
     * @param {number} frame - Start frame
     * @param {string} eventType - Event type
     * @param {number} duration - Event duration in frames
     * @returns {Object} Created event instance
     * @private
     */
    addEventToTrack(track, frame, eventType, duration) {
        if (!track.data.eventTypes.includes(eventType)) {
            track.data.eventTypes.push(eventType);
        }
        return ScoreManager.addEventAtFrame(track.id, frame, {
            type: eventType,
            duration
        });
    }

    /**
     * Process single event and add to appropriate track
     * @param {number} frame - Event end frame
     * @param {string} eventType - Event type
     * @param {number} startFrame - Event start frame
     * @private
     */
    processEvent(frame, eventType, startFrame) {
        const duration = startFrame ? frame - startFrame : 60; // Default 1 second at 60fps
        const matchingTracks = this.findMatchingTracks(eventType);

        if (matchingTracks.length > 0) {
            matchingTracks.forEach(track => 
                this.addEventToTrack(track, startFrame || frame, eventType, duration)
            );
        } else {
            const orphanTrack = this.getOrCreateOrphanTrack();
            this.addEventToTrack(orphanTrack, startFrame || frame, eventType, duration);
        }
    }

    /**
     * Process all recorded events and add to tracks
     * Handles paired start/stop events and unpaired starts
     */
    processRecordedEvents() {
        if (!this.recordBuffer.length) return;
        console.log('Processing recorded events:', this.recordBuffer);
        this.recordBuffer.sort((a, b) => a.frame - b.frame);
        ScoreManager.setActiveScore(this.score);

        const startEvents = new Map();
        // Find the last end event frame
        const lastEndFrame = Math.max(...this.recordBuffer
            .filter(event => !event.startStop)
            .map(event => event.frame));

        this.recordBuffer.forEach(({frame, eventType, startStop}) => {
            if (startStop) {
                startEvents.set(eventType, frame);
            } else {
                const startFrame = startEvents.get(eventType);
                if (startFrame !== undefined) {
                    this.processEvent(frame, eventType, startFrame);
                    startEvents.delete(eventType);
                }
            }
        });

        // Handle unpaired start events - end them at the last end event frame
        startEvents.forEach((startFrame, eventType) => {
            this.processEvent(lastEndFrame, eventType, startFrame);
        });

        this.recordBuffer = [];
    }

    /**
     * Generate timestamped filename for recording
     * @returns {string} Filename in format score_YYYY-MM-DD_HH-MM-SS.json
     * @private
     */
    generateDefaultFilename() {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        return `score_${date}_${time}.json`;
    }

    /**
     * Save recorded events to file
     * @returns {Promise<boolean>} True if save successful
     * @async
     */
    async saveRecording() {
        if (!this.score) return false;
        
        this.processRecordedEvents();
        ScoreManager.setActiveScore(this.score);
        return ScoreManager.saveScore(this.generateDefaultFilename());
    }

    /**
     * Get current score instance
     * @returns {Object|null} Current score or null if not initialized
     */
    getScore() {
        return this.score;
    }
}