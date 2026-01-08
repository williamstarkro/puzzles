/**
 * Seeded Random Number Generator
 * Simple LCG (Linear Congruential Generator) for deterministic randomness
 */
export class SeededRNG {
    constructor(seed) {
        this.seed = seed;
        this.state = seed;
    }

    /**
     * Generate next random number [0, 1)
     */
    next() {
        // LCG parameters (from Numerical Recipes)
        this.state = (this.state * 1664525 + 1013904223) % Math.pow(2, 32);
        return (this.state >>> 0) / Math.pow(2, 32);
    }

    /**
     * Generate random integer in range [min, max] (inclusive)
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Generate random float in range [min, max)
     */
    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }

    /**
     * Choose random element from array
     */
    choice(array) {
        return array[this.nextInt(0, array.length - 1)];
    }

    /**
     * Shuffle array (Fisher-Yates)
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * Sample from normal distribution (Box-Muller transform)
     */
    nextGaussian(mean = 0, stdDev = 1) {
        if (this._spare !== undefined) {
            const spare = this._spare;
            this._spare = undefined;
            return spare * stdDev + mean;
        }
        
        const u1 = this.next();
        const u2 = this.next();
        const mag = stdDev * Math.sqrt(-2.0 * Math.log(u1));
        const z0 = mag * Math.cos(2.0 * Math.PI * u2);
        const z1 = mag * Math.sin(2.0 * Math.PI * u2);
        
        this._spare = z1;
        return z0 * stdDev + mean;
    }
}

/**
 * Simple hash function for string to number
 */
export function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

