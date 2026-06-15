/**
 * Game Registry
 * All 8 mathematical Wordle variations
 */

import { EditGame } from './edit.js?v=5';
import { CipherGame } from './cipher.js?v=2';
import { PartitionGame } from './partition.js';
// import { RecurrenceGame } from './recurrence.js';  // Disabled - fatal flaw: sequence type classification is a fixed algorithm
import { SubsetGame } from './subset.js';
// TODO: Network game disabled - force-directed layout needs work to properly
// fill the container width. The nodes cluster instead of spreading out.
// import { NetworkGame } from './network.js';
import { OrbitGame } from './orbit.js?v=2';
import { FossilGame } from './fossil.js';
import { TriadGame } from './triad.js';
import { FlipGame } from './flip.js';
import { CensusGame } from './census.js';
// import { CascadeGame } from './cascade.js';
// Disabled - fatal flaw: a single de Bruijn initial condition (e.g. 00010111...)
// contains all 8 neighborhoods, so one fixed query identifies any rule.
// Systematically solvable; needs a redesign (e.g. constrained ICs or noisy cells).
// import { ConvexGame } from './convex.js';  // TODO: Disabled - needs better touch/mobile support
// import { BijectionGame } from './bijection.js';  // Disabled - fatal flaw: constraint propagation is target-independent
// import { DerivativeGame } from './derivative.js';
// Disabled - fatal flaw: querying f(0), f(1), f(-1), f(2) and interpolating
// always wins within budget. A fixed flowchart; needs a redesign
// (e.g. sign-only feedback or noisy evaluations).

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
        id: 'fossil',
        name: 'FOSSIL',
        tagline: 'The Excavation Game',
        description: 'A fossil is buried in the grid. Probe for distance, scan rows for counts, then stake your claim on its exact cells.',
        category: 'geometry',
        difficulty: 'Medium',
        game: FossilGame
    },
    {
        id: 'triad',
        name: 'TRIAD',
        tagline: 'The Median Logic Game',
        description: 'Reconstruct a hidden ranking by querying trios of items—each query reveals only the median of the three.',
        category: 'combinatorics',
        difficulty: 'Medium-High',
        game: TriadGame
    },
    {
        id: 'flip',
        name: 'FLIP',
        tagline: 'The Triangulation Game',
        description: 'A hidden triangulation of a polygon—one of Catalan-many. Query diagonals to learn crossing counts; zero means you found one.',
        category: 'geometry',
        difficulty: 'Medium-High',
        game: FlipGame
    },
    {
        id: 'census',
        name: 'CENSUS',
        tagline: 'The Graph Reconstruction Game',
        description: 'Rebuild a hidden graph you can never see, buying only global subgraph counts: edges, triangles, claws, cycles.',
        category: 'graph-theory',
        difficulty: 'High',
        game: CensusGame
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
    // {
    //     id: 'derivative',
    //     name: 'DERIVATIVE',
    //     tagline: 'The Polynomial Interrogation Game',
    //     description: 'Identify a hidden polynomial by querying its value or derivatives at chosen points, with derivatives costing more.',
    //     category: 'algebra',
    //     difficulty: 'Medium-High',
    //     game: DerivativeGame
    // }
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
