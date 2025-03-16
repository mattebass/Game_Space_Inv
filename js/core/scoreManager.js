import { SeqEvent } from "./seqEvent.js";
import { SeqTrack } from "./seqTrack.js";
import { SeqScore } from "./seqScore.js";
import { ScoreFileHelper } from './scoreFileHelper.js';

/**
 * Static manager for timeline sequence operations
 * Provides centralized access to timeline data and operations
 */
export class ScoreManager {
    /** @type {SeqScore} Active timeline sequence */
    static #activeScore = null;

    /**
     * Set active sequence
     * @param {SeqScore} score - Sequence to activate
     */
    static setActiveScore(score) {
        ScoreManager.#activeScore = score;
    }

    /**
     * Get active sequence
     * @returns {SeqScore|null} Current sequence or null
     */
    static getActiveScore() {
        return ScoreManager.#activeScore;
    }

    // Score operations
    static createScore() {
        return new SeqScore();
    }

    // Track operations
    static addTrack(name, eventTypes = []) {
        if (!ScoreManager.#activeScore) return null;
        
        const track = new SeqTrack();
        // Ensure unique track name if none provided
        const trackName = name || `Track ${ScoreManager.#activeScore.data.tracks.length + 1}`;
        
        track.setData({
            name: trackName,
            eventTypes: eventTypes.length ? eventTypes : [`${name}-event`], // Default event types
            events: []
        });
        ScoreManager.#activeScore.data.tracks.push(track);
        return track;
    }

    static removeTrack(trackId) {
        if (!ScoreManager.#activeScore) return;
        ScoreManager.#activeScore.data.tracks = ScoreManager.#activeScore.data.tracks
            .filter(track => track.id !== +trackId);
    }

    // Event operations
    static addEvent(trackId, eventData) {
        const track = ScoreManager.findTrack(trackId);
        if (!track) return null;

        const event = new SeqEvent();
        event.setData(eventData);
        
       
       
            track.addEvent(event);
            return event;
       
    }

    static addEventAtFrame(trackId, frame, eventData) {
        const track = ScoreManager.findTrack(trackId);
        if (!track) return null;

        const event = new SeqEvent();
        event.setData({
            ...eventData,
            frame: frame
        });
        track.addEvent(event);
        return event;
    }

    static removeEvent(trackId, eventId) {
        const track = ScoreManager.findTrack(trackId);
        if (!track) return;
        
        const event = track.data.events.find(e => e.id === +eventId);
        if (event) {
            track.removeEvent(event);
        }
    }

    // Utility methods
    static findTrack(trackId) {
        if (!ScoreManager.#activeScore) return null;
        return ScoreManager.#activeScore.data.tracks.find(track => track.id === +trackId);
    }

    static shiftTrackEvents(trackId, frames) {
        const track = ScoreManager.findTrack(trackId);
        if (track) {
            track.shiftEvents(frames);
        }
    }

    static getTrackEvents(trackId) {
        const track = ScoreManager.findTrack(trackId);
        return track ? track.data.events : [];
    }

    static getAllEvents() {
        if (!ScoreManager.#activeScore) return [];
        return ScoreManager.#activeScore.data.tracks.flatMap(track => track.data.events);
    }

    static getEventsByTimeRange(startFrame, endFrame) {
        return ScoreManager.getAllEvents().filter(event => 
            event.data.frame >= startFrame && 
            event.data.frame <= endFrame
        );
    }

    static getEventById(eventId) {
        if (!ScoreManager.#activeScore) return null;
        for (const track of ScoreManager.#activeScore.data.tracks) {
            const event = track.data.events.find(event => event.id === +eventId);
            if (event) return event;
        }
        return null;
    }

    static getTrackById(trackId) {
        if (!ScoreManager.#activeScore) return null;
        return ScoreManager.#activeScore.data.tracks.find(track => track.id === +trackId);
    }

    static getEventTrack(eventId) {
        if (!ScoreManager.#activeScore) return null;
        return ScoreManager.#activeScore.data.tracks.find(track => 
            track.data.events.some(event => event.id === +eventId)
        );
    }

    // File operations
    static generateDefaultFilename() {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        return `score_${date}_${time}.json`;
    }

    static async saveScore(suggestedName = null) {
        if (!ScoreManager.#activeScore) return false;
        
        // Use timestamp-based filename if none provided
        const filename = suggestedName || ScoreManager.generateDefaultFilename();
        
        // Get score data
        const scoreData = ScoreManager.#activeScore.getData();
        
        // Let user choose save location with suggested filename
        return ScoreFileHelper.saveScore(scoreData, filename);
    }

    static async loadScore() {
        const data = await ScoreFileHelper.loadScore();
        if (!data) return false;

        const score = ScoreManager.createScore();
        score.setData(data);
        ScoreManager.setActiveScore(score);
        return true;
    }

  
}