/**
 * Reference Guides for each game
 * Content based on puzzles.md v3.0
 */

export const REFERENCE_GUIDES = {
    edit: {
        title: 'Edit - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>Find a hidden 5-letter word using distance feedback. No colors, no positional hints—just numbers telling you how "far" your guess is.</p>

            <h3>Game Modes</h3>
            <p>Choose your distance metric in Settings:</p>
            <ul>
                <li><strong>Standard</strong>: Classic Levenshtein edit distance (8 guesses)</li>
                <li><strong>Hard</strong>: Same as Standard but only 6 guesses</li>
                <li><strong>Clockwork</strong>: Cyclic alphabet distance with magnitude + spin</li>
                <li><strong>Residue</strong>: Cyclic distance mod 13 (ambiguous!)</li>
                <li><strong>Primes</strong>: Position-weighted by primes (2, 3, 5, 7, 11)</li>
                <li><strong>Torus</strong>: Euclidean distance on circular alphabet</li>
            </ul>

            <h3>Standard/Hard Mode (Levenshtein)</h3>
            <ul>
                <li>Distance = minimum edits (insert, delete, substitute) to transform guess → target</li>
                <li>Distance 0 = exact match = win!</li>
                <li><strong>Key insight</strong>: Distance 5 means ALL letters are wrong at their positions</li>
            </ul>

            <h3>Clockwork Mode</h3>
            <ul>
                <li>Alphabet wraps: A→B→...→Z→A (like a clock)</li>
                <li><strong>Magnitude</strong>: Total arc distance across all 5 positions</li>
                <li><strong>Spin</strong>: Net rotation (+ = clockwise, − = counter-clockwise)</li>
                <li>Example: A→C = +2 (clockwise), A→Y = −2 (counter-clockwise shorter)</li>
            </ul>

            <h3>Residue Mode</h3>
            <ul>
                <li>Shows cyclic distance mod 13</li>
                <li><strong>Ambiguous</strong>: Distance 0 could mean 0, 13, 26, or 39 actual distance!</li>
                <li>Forces probabilistic reasoning—multiple targets consistent with feedback</li>
            </ul>

            <h3>Primes Mode</h3>
            <ul>
                <li>Cyclic letter distance weighted by position: 2×, 3×, 5×, 7×, 11×</li>
                <li>Last positions matter most! Position 5 is weighted 11×</li>
                <li>Use this to prioritize which letters to fix first</li>
            </ul>

            <h3>Torus Mode</h3>
            <ul>
                <li>Euclidean distance: √(d₁² + d₂² + d₃² + d₄² + d₅²)</li>
                <li>Each dᵢ is cyclic distance at position i</li>
                <li>Large errors in one position dominate (squared)</li>
            </ul>

            <h3>Letter Tracker</h3>
            <p>When you get distance 5 in Standard/Hard mode, all letters are marked as eliminated at their positions. Watch for the Letter Tracker panel to see which letters are ruled out where!</p>

            <h3>Strategy Tips</h3>
            <ul>
                <li><strong>Start broad</strong>: Words like SLATE or CRANE test common letters</li>
                <li><strong>Triangulate</strong>: Two distance readings constrain possibilities</li>
                <li><strong>Distance 5</strong>: Great info! Eliminates 5 letter-position pairs</li>
                <li><strong>Cyclic modes</strong>: Think about alphabet neighbors (T is near S and U)</li>
            </ul>
        `
    },

    cipher: {
        title: 'Cipher - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>Recover a hidden 5-letter word from multiple corrupted "intercepts". Each intercept has random letter corruptions.</p>

            <h3>Core Mechanics</h3>
            <ul>
                <li>Request intercepts (noisy copies of the target word)</li>
                <li>Each letter has 25% chance of corruption</li>
                <li>Aggregate signals to find the most likely letters</li>
                <li>Submit your guess when confident</li>
            </ul>

            <h3>Signal Confidence</h3>
            <ul>
                <li><strong>Green (≥70%)</strong>: High agreement—probably correct</li>
                <li><strong>Yellow (40-69%)</strong>: Uncertain—use word knowledge</li>
                <li><strong>Red (&lt;40%)</strong>: Noisy—multiple candidates</li>
            </ul>

            <h3>Strategy Tips</h3>
            <ul>
                <li>Request more intercepts for higher confidence</li>
                <li>Use word knowledge to disambiguate: if signals show _ATCH, think BATCH, CATCH, WATCH...</li>
                <li>Early guessing saves intercepts but risks being wrong</li>
            </ul>
        `
    },

    partition: {
        title: 'Partition - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>Deduce a hidden integer partition using Wordle-style feedback on parts.</p>

            <h3>Core Mechanics</h3>
            <ul>
                <li>Target is a partition of N (e.g., [6,5,4,3,2] for N=20)</li>
                <li>Submit a valid partition (must sum to N)</li>
                <li><strong>🟩 Green</strong>: Correct part in correct position</li>
                <li><strong>🟨 Yellow</strong>: Part exists but in wrong position</li>
                <li><strong>⬛ Gray</strong>: Part not in target</li>
            </ul>

            <h3>Key Insight</h3>
            <p>The target's length is hidden! You must deduce it from feedback patterns.</p>

            <h3>Strategy Tips</h3>
            <ul>
                <li><strong>Spread guess</strong>: Try [5,4,3,2,1] to test many values</li>
                <li><strong>Extreme guess</strong>: Try [N] or [1,1,...,1] to learn length</li>
                <li>Duplicates create complex deductions—track carefully</li>
            </ul>
        `
    },

    orbit: {
        title: 'Orbit - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>Deduce a hidden permutation by probing with test permutations and observing the cycle type of the composition.</p>

            <h3>What is a Permutation?</h3>
            <p>A permutation rearranges elements. For example, on {1,2,3,4,5}:</p>
            <ul>
                <li><strong>Identity</strong>: 1→1, 2→2, 3→3, 4→4, 5→5 (nothing moves)</li>
                <li><strong>(1 2)</strong>: Swap 1↔2, others stay fixed</li>
                <li><strong>(1 2 3)</strong>: 1→2→3→1 (a 3-cycle)</li>
            </ul>

            <h3>Cycle Notation</h3>
            <p>Every permutation decomposes into disjoint cycles:</p>
            <ul>
                <li><strong>(1 3 5)(2 4)</strong>: A 3-cycle and a 2-cycle</li>
                <li><strong>Cycle type [3,2]</strong>: Describes the structure without specific elements</li>
                <li>Fixed points (1-cycles) are often omitted: [3,2] on 6 elements implies one fixed point</li>
            </ul>

            <h3>Core Mechanics</h3>
            <ul>
                <li>Hidden target σ: A permutation on {1,...,n}</li>
                <li>Submit a probe permutation τ</li>
                <li>Learn the <strong>cycle type</strong> of τ∘σ (composition: first σ, then τ)</li>
                <li>Goal: Deduce the exact target permutation</li>
            </ul>

            <h3>Key Probing Strategies</h3>
            <ul>
                <li><strong>Identity probe</strong>: Reveals σ's own cycle type immediately</li>
                <li><strong>Transposition (i j)</strong>: If i,j are in same cycle of σ, the cycle splits; if in different cycles, they merge</li>
                <li><strong>Single swap test</strong>: (1 2) on σ tells you if 1 and 2 are in the same cycle</li>
            </ul>

            <h3>Reading Results</h3>
            <ul>
                <li><strong>[5]</strong>: One 5-cycle (all elements in one orbit)</li>
                <li><strong>[3,2]</strong>: A 3-cycle and a 2-cycle</li>
                <li><strong>[2,2,1]</strong>: Two 2-cycles and one fixed point</li>
                <li><strong>[1,1,1,1,1]</strong>: Identity (all fixed points)</li>
            </ul>

            <h3>Example Strategy</h3>
            <ol>
                <li>Probe identity → Learn σ has cycle type [3,2]</li>
                <li>Probe (1 2) → If result is [4,1], then 1,2 were in different cycles (now merged)</li>
                <li>Probe (1 3) → If result is [2,2,1], then 1,3 were in same 3-cycle (now split)</li>
                <li>Continue to map out which elements share cycles</li>
            </ol>

            <h3>Strategy Tips</h3>
            <ul>
                <li>Start with identity to learn the cycle structure</li>
                <li>Use transpositions systematically to discover cycle membership</li>
                <li>Track which elements you've confirmed are in the same/different cycles</li>
                <li>Once you know cycle membership, determine the order within each cycle</li>
            </ul>
        `
    },

    cascade: {
        title: 'Cascade - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>Deduce which cellular automaton rule governs a 1D grid by observing how different initial conditions evolve.</p>

            <h3>Core Mechanics</h3>
            <ul>
                <li>Hidden: One of 256 elementary CA rules</li>
                <li>Submit an initial condition (binary string)</li>
                <li>See how it evolves for several steps</li>
                <li>Guess the rule number (0-255)</li>
            </ul>

            <h3>Key Insight</h3>
            <p>A rule is fully determined by its 8 neighborhood outputs (000→?, 001→?, ..., 111→?). Strategic ICs reveal all 8 patterns quickly.</p>

            <h3>Strategy Tips</h3>
            <ul>
                <li><strong>Single cell</strong>: Clean pattern, limited coverage</li>
                <li><strong>Random IC</strong>: High coverage, complex to interpret</li>
                <li>Rule classes: uniform (Class 1), periodic (Class 2), chaotic (Class 3), complex (Class 4)</li>
            </ul>
        `
    },

    subset: {
        title: 'Subset - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>Find a hidden subset of size k from a universe of n elements by probing with test sets. Each probe tells you the intersection size with the target.</p>

            <h3>Core Mechanics</h3>
            <ul>
                <li>Select any subset of elements and click PROBE</li>
                <li>Learn how many of your selected elements are in the target</li>
                <li>If you probe the exact target set, you win!</li>
                <li>Limited number of queries to find it</li>
            </ul>

            <h3>Reading Probe Results</h3>
            <ul>
                <li><strong>Result = 0</strong>: None of your selected elements are in target</li>
                <li><strong>Result = k</strong>: All your elements are in target (if you probed k elements)</li>
                <li><strong>Result = target size</strong>: You found all target elements (but may have extras)</li>
            </ul>

            <h3>Strategy Tips</h3>
            <ul>
                <li><strong>Singleton probes</strong>: Probe one element to confirm/eliminate it</li>
                <li><strong>Large probes</strong>: Probe many elements to quickly narrow down</li>
                <li><strong>Use confirmed info</strong>: Green = in target, Red = not in target</li>
                <li>Win by probing exactly the target set (no extras, no missing)</li>
            </ul>
        `
    },

    derivative: {
        title: 'Derivative - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>Identify a hidden polynomial by querying its value or derivatives at chosen points.</p>

            <h3>Query Types</h3>
            <ul>
                <li><strong>f(x)</strong>: Value at x (cost: 1 point)</li>
                <li><strong>f'(x)</strong>: First derivative at x (cost: 2 points)</li>
                <li><strong>f''(x)</strong>: Second derivative at x (cost: 3 points)</li>
            </ul>

            <h3>Key Insight</h3>
            <p>A degree-d polynomial needs d+1 values to determine. But derivatives at 0 give coefficients directly via Taylor series!</p>

            <h3>Useful Points</h3>
            <ul>
                <li><strong>x = 0</strong>: f(0) = constant term; f'(0) = linear coefficient</li>
                <li><strong>x = 1</strong>: f(1) = sum of all coefficients</li>
                <li><strong>x = -1</strong>: Alternating sum of coefficients</li>
            </ul>

            <h3>Strategy Tips</h3>
            <ul>
                <li>Values are cheap but require interpolation</li>
                <li>Derivatives are expensive but more direct</li>
                <li>Balance based on polynomial degree and budget</li>
            </ul>
        `
    },

};
