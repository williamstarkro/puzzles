/**
 * Game Engine - Daily puzzle generation and shared game logic
 */

import { SeededRNG, hashString } from './utils/rng.js';
import { Storage } from './utils/storage.js';

export class GameEngine {
    constructor() {
        this.currentGame = null;
        this.currentRNG = null;
    }

    /**
     * Initialize a game for today
     */
    initGame(gameId) {
        const today = Storage.getTodayKey();
        const seed = hashString(`${gameId}_${today}`);
        this.currentRNG = new SeededRNG(seed);
        this.currentGame = gameId;
        return this.currentRNG;
    }

    /**
     * Get today's puzzle number (days since epoch)
     */
    getPuzzleNumber() {
        const epoch = new Date('2024-01-01');
        const today = new Date();
        const diffTime = today - epoch;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    /**
     * Get RNG for current game
     */
    getRNG() {
        if (!this.currentRNG) {
            throw new Error('Game not initialized. Call initGame() first.');
        }
        return this.currentRNG;
    }

    /**
     * Record game result
     */
    recordResult(gameId, won, guesses = null, efficiency = null) {
        return Storage.recordGame(gameId, won, guesses, efficiency);
    }

    /**
     * Get stats for a game
     */
    getStats(gameId) {
        return Storage.getStats(gameId);
    }

    /**
     * Check if today's puzzle is completed
     */
    isTodayCompleted(gameId) {
        return Storage.isTodayCompleted(gameId);
    }

    /**
     * Mark today's puzzle as completed
     */
    markCompleted(gameId) {
        Storage.markTodayCompleted(gameId);
    }
}

// Singleton instance
export const gameEngine = new GameEngine();

