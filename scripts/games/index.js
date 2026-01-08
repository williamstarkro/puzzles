/**
 * Game Registry
 * All 8 mathematical Wordle variations
 */

import { EditGame } from './edit.js';
import { CipherGame } from './cipher.js';
import { PartitionGame } from './partition.js';
// import { RecurrenceGame } from './recurrence.js';  // TODO: Disabled - needs improvement
import { SubsetGame } from './subset.js';
// TODO: Network game disabled - force-directed layout needs work to properly
// fill the container width. The nodes cluster instead of spreading out.
// import { NetworkGame } from './network.js';
import { OrbitGame } from './orbit.js';
import { CascadeGame } from './cascade.js';
// import { ConvexGame } from './convex.js';  // TODO: Disabled - needs better touch/mobile support
// import { BijectionGame } from './bijection.js';  // TODO: Disabled - needs improvement
import { DerivativeGame } from './derivative.js';

// Game definitions with metadata
export const GAMES = [
    {
        id: 'edit',
        name: 'EDIT',
        tagline: 'The Distance Triangulation Game',
        description: 'Find a hidden word using only edit distance feedback. No colors—just a number telling you how far your guess is.',
        category: 'combinatorics',
        difficulty: 'Medium',
        game: EditGame
    },
    // {
    //     id: 'network',
    //     name: 'NETWORK',
    //     tagline: 'The Graph Exploration Game',
    //     description: 'Find a hidden target node in a graph with fog of war. The target may move after each ping!',
    //     category: 'graph-theory',
    //     difficulty: 'Medium-High',
    //     game: NetworkGame
    // },
    {
        id: 'cipher',
        name: 'CIPHER',
        tagline: 'The Noisy Channel Game',
        description: 'Recover a hidden 5-letter word from multiple corrupted intercepts. Each intercept has random letter corruptions.',
        category: 'combinatorics',
        difficulty: 'Medium',
        game: CipherGame
    },
    {
        id: 'partition',
        name: 'PARTITION',
        tagline: 'The Integer Partition Game',
        description: 'Deduce a hidden integer partition using Wordle-style feedback on parts. Find how a number is expressed as a sum.',
        category: 'combinatorics',
        difficulty: 'Medium',
        game: PartitionGame
    },
    {
        id: 'orbit',
        name: 'ORBIT',
        tagline: 'The Permutation Composition Game',
        description: 'Deduce a hidden permutation by probing with test permutations and observing the cycle type of the composition.',
        category: 'algebra',
        difficulty: 'High',
        game: OrbitGame
    },
    {
        id: 'cascade',
        name: 'CASCADE',
        tagline: 'The Cellular Automaton Game',
        description: 'Deduce which cellular automaton rule governs a 1D grid by observing how different initial conditions evolve.',
        category: 'combinatorics',
        difficulty: 'Medium',
        game: CascadeGame
    },
    {
        id: 'subset',
        name: 'SUBSET',
        tagline: 'The Set Intersection Game',
        description: 'Find a hidden subset by probing with test sets. Each probe reveals the intersection size—deduce and match the target exactly to win.',
        category: 'combinatorics',
        difficulty: 'Medium',
        game: SubsetGame
    },
    // {
    //     id: 'convex',
    //     name: 'CONVEX',
    //     tagline: 'The Hidden Polygon Game',
    //     description: 'Discover a hidden convex polygon by probing with points and rays. Point probes tell inside/outside; ray probes give distance.',
    //     category: 'geometry',
    //     difficulty: 'Medium',
    //     game: ConvexGame
    // },
    // {
    //     id: 'recurrence',
    //     name: 'RECURRENCE',
    //     tagline: 'The Sequence Inference Game',
    //     description: 'Deduce a hidden linear recurrence from sequence terms. Multiple recurrences can produce the same sequence!',
    //     category: 'algebra',
    //     difficulty: 'Medium',
    //     game: RecurrenceGame
    // },
    // {
    //     id: 'bijection',
    //     name: 'BIJECTION',
    //     tagline: 'The Hidden Matching Game',
    //     description: 'Discover a hidden bijection between two sets by probing specific pairs with yes/no queries.',
    //     category: 'combinatorics',
    //     difficulty: 'Medium',
    //     game: BijectionGame
    // },
    {
        id: 'derivative',
        name: 'DERIVATIVE',
        tagline: 'The Polynomial Interrogation Game',
        description: 'Identify a hidden polynomial by querying its value or derivatives at chosen points, with derivatives costing more.',
        category: 'algebra',
        difficulty: 'Medium-High',
        game: DerivativeGame
    }
];

// Get games by category
export function getGamesByCategory(category) {
    if (category === 'all') return GAMES;
    return GAMES.filter(g => g.category === category);
}

// Get available (implemented) games
export function getAvailableGames() {
    return GAMES.filter(g => g.game !== null);
}
