/**
 * LocalStorage wrapper for game statistics
 */

const STORAGE_PREFIX = 'mathwordle_';

export const Storage = {
    /**
     * Get stats for a specific game
     */
    getStats(gameId) {
        const key = `${STORAGE_PREFIX}stats_${gameId}`;
        const data = localStorage.getItem(key);
        if (!data) {
            return this.getDefaultStats();
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            return this.getDefaultStats();
        }
    },

    /**
     * Update stats for a specific game
     */
    updateStats(gameId, updates) {
        const current = this.getStats(gameId);
        const updated = { ...current, ...updates };
        const key = `${STORAGE_PREFIX}stats_${gameId}`;
        localStorage.setItem(key, JSON.stringify(updated));
        return updated;
    },

    /**
     * Record a game result
     */
    recordGame(gameId, won, guesses = null, efficiency = null) {
        const stats = this.getStats(gameId);
        
        stats.gamesPlayed++;
        if (won) {
            stats.gamesWon++;
            stats.currentStreak++;
            if (stats.currentStreak > stats.maxStreak) {
                stats.maxStreak = stats.currentStreak;
            }
            if (guesses !== null) {
                if (!stats.guessDistribution[guesses]) {
                    stats.guessDistribution[guesses] = 0;
                }
                stats.guessDistribution[guesses]++;
            }
            if (efficiency !== null) {
                stats.totalEfficiency = (stats.totalEfficiency * (stats.gamesWon - 1) + efficiency) / stats.gamesWon;
            }
        } else {
            stats.currentStreak = 0;
        }
        
        return this.updateStats(gameId, stats);
    },

    /**
     * Get default stats structure
     */
    getDefaultStats() {
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: {},
            totalEfficiency: 0
        };
    },

    /**
     * Check if today's puzzle has been completed
     */
    isTodayCompleted(gameId) {
        const key = `${STORAGE_PREFIX}completed_${gameId}_${this.getTodayKey()}`;
        return localStorage.getItem(key) === 'true';
    },

    /**
     * Mark today's puzzle as completed
     */
    markTodayCompleted(gameId) {
        const key = `${STORAGE_PREFIX}completed_${gameId}_${this.getTodayKey()}`;
        localStorage.setItem(key, 'true');
    },

    /**
     * Get today's date key (YYYY-MM-DD)
     */
    getTodayKey() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    },

    /**
     * Clear all stats (for testing/debugging)
     */
    clearAll() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(STORAGE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
};

