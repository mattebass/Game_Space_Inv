/**
 * Provides unique numeric identifiers
 * Uses timestamp-based initialization for uniqueness
 */
class IdProvider {
    /**
     * Get next available unique ID
     * @returns {number} Unique identifier
     */
    static getNextId() {
        if(!IdProvider.id) {
            IdProvider.id = Date.now();
        }
        return IdProvider.id++;
    }
}
export{IdProvider};