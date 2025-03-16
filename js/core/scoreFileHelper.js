/**
 * Helper for timeline sequence file operations
 * Handles saving and loading sequence data
 */
export class ScoreFileHelper {
    /**
     * Save sequence data to JSON file
     * @param {Object} scoreData - Sequence data to save
     * @param {string} [suggestedName='score.json'] - Default filename
     * @returns {Promise<boolean>} True if save successful
     */
    static async saveScore(scoreData, suggestedName = 'score.json') {
        try {
            const jsonString = JSON.stringify(scoreData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = suggestedName;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);

            return true;
        } catch (err) {
            console.error('Error saving score:', err);
            return false;
        }
    }

    /**
     * Load sequence data from JSON file
     * @returns {Promise<Object|null>} Loaded data or null if failed
     */
    static async loadScore() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            
            const file = await new Promise((resolve) => {
                input.onchange = () => resolve(input.files[0]);
                input.click();
            });

            if (!file) return null;

            const contents = await file.text();
            return JSON.parse(contents);
        } catch (err) {
            console.error('Error loading score:', err);
            return null;
        }
    }
}