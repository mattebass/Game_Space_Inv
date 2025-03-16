import { IdProvider } from "./idProvider.js";
import { SeqTrack } from "./seqTrack.js";

/**
 * Top-level container for timeline sequence
 * Manages tracks and global timeline properties
 */
class SeqScore {
    /**
     * Create new score with default settings
     */
    constructor() {
        this.id = IdProvider.getNextId();
        this.data = {
            title: "",           // Sequence name
            frequency: 60,       // Frames per second
            timeScale: 1.0,      // Time display scale
            tracks: []          // Event tracks
        }
    }

    /**
     * Update score properties and tracks
     * @param {Object} data - Score configuration
     * @param {string} [data.title=""] - Sequence name
     * @param {number} [data.frequency=60] - Frames per second (>= 1)
     * @param {number} [data.timeScale=1.0] - Time display scale (>= 0.1)
     * @param {Array<Object>} [data.tracks=[]] - Track configurations
     */
    setData(data) {
        if (!data) return;
        
        this.data.title = data.title || "";
        this.data.frequency = Math.max(1, +data.frequency || 60);
        this.data.timeScale = Math.max(0.1, +data.timeScale || 1.0);
        this.data.tracks = Array.isArray(data.tracks) 
            ? data.tracks.map(trackData => {
                const track = new SeqTrack();
                track.setData(trackData);
                return track;
              })
            : [];
    }

    /**
     * Get score properties and track data
     * @returns {Object} Score data
     * @property {string} title - Sequence name
     * @property {number} frequency - Frames per second
     * @property {number} timeScale - Time display scale
     * @property {Array<Object>} tracks - Track data
     */
    getData() {
        return {
            title: this.data.title,
            frequency: this.data.frequency,
            timeScale: this.data.timeScale,
            tracks: this.data.tracks.map(track => track.getData())
        }
    }
}
export{SeqScore};