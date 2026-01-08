/**
 * Reference Guides for each game
 * Content based on puzzles.md v3.0
 */

export const REFERENCE_GUIDES = {
    edit: {
        title: 'Edit - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>Find a hidden 5-letter word using only edit distance feedback. No colors, no positional hints—just a single number telling you how "far" your guess is.</p>

            <h3>Core Mechanics</h3>
            <ul>
                <li>Submit any valid 5-letter word as a guess</li>
                <li>Receive the <strong>Levenshtein edit distance</strong>: minimum edits (insert, delete, substitute) to transform your guess into the target</li>
                <li>Distance 0 = exact match = win!</li>
                <li>You have 8 guesses to find the word</li>
            </ul>

            <h3>Example</h3>
            <p>Target: GHOST (hidden)</p>
            <ul>
                <li>CRANE → Distance 5 (very far)</li>
                <li>TOAST → Distance 2 (close! shares _O_ST)</li>
                <li>ROAST → Distance 2 (also 2...)</li>
                <li>GHOST → Distance 0 (WIN!)</li>
            </ul>

            <h3>Strategy Tips</h3>
            <ul>
                <li><strong>Start broad</strong>: Common words like SLATE or CRANE establish a baseline</li>
                <li><strong>Triangulate</strong>: Two distance readings constrain possibilities</li>
                <li><strong>Cluster hop</strong>: If distances stay high (4-5), try a very different word</li>
                <li><strong>Endgame</strong>: At distance 1-2, think about what single edits produce real words</li>
            </ul>
        `
    },

    network: {
        title: 'Network - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>Find a target node in a hidden graph with fog of war. In Standard/Hard modes, the target may move after each ping!</p>

            <h3>Core Mechanics</h3>
            <ul>
                <li>Start with one visible node (not the target)</li>
                <li>Ping a node to learn its distance from target</li>
                <li>Pinging reveals nodes within distance 2</li>
                <li><strong>Moving target</strong>: After each ping, target may move to an adjacent node</li>
            </ul>

            <h3>Difficulty Modes</h3>
            <ul>
                <li><strong>Easy</strong>: Static target (pure triangulation)</li>
                <li><strong>Standard</strong>: 40% chance to move, you're notified when it moves</li>
                <li><strong>Hard</strong>: 50% chance to move, movement is hidden</li>
            </ul>

            <h3>Strategy Tips</h3>
            <ul>
                <li><strong>Easy mode</strong>: Triangulate using distance readings</li>
                <li><strong>Moving modes</strong>: Corral the target by pinging "bridge" nodes to cut off escape routes</li>
                <li>Balance exploration (reveal graph) vs. exploitation (find target)</li>
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

            <h3>Core Mechanics</h3>
            <ul>
                <li>Hidden target: A permutation σ on {1,...,n}</li>
                <li>Submit a probe permutation τ</li>
                <li>Learn the cycle type of τ∘σ (e.g., [3,2,1] = one 3-cycle, one 2-cycle, one fixed point)</li>
            </ul>

            <h3>Key Insight</h3>
            <p>The identity probe immediately reveals the target's own cycle type. Transposition probes test if two elements are in the same cycle.</p>

            <h3>Strategy Tips</h3>
            <ul>
                <li>Start with identity to learn target's cycle structure</li>
                <li>Use transpositions (1 2) to test cycle membership</li>
                <li>Connecting elements from different cycles merges them</li>
            </ul>
        `
    },

    threshold: {
        title: 'Threshold - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>Discover hidden voter weights by probing coalitions. Larger coalitions cost more points.</p>

            <h3>Core Mechanics</h3>
            <ul>
                <li>5 voters with hidden positive integer weights</li>
                <li>Threshold T (typically majority)</li>
                <li>Query a coalition → WIN (sum ≥ T) or LOSE (sum &lt; T)</li>
                <li>Cost scales with coalition size</li>
            </ul>

            <h3>Query Costs</h3>
            <ul>
                <li>1 voter: 1 point</li>
                <li>2 voters: 2 points</li>
                <li>3 voters: 4 points</li>
                <li>4+ voters: increasingly expensive</li>
            </ul>

            <h3>Strategy Tips</h3>
            <ul>
                <li><strong>Micro approach</strong>: Many cheap singleton queries</li>
                <li><strong>Macro approach</strong>: Few expensive coalition queries</li>
                <li>WIN gives lower bound, LOSE gives upper bound—propagate constraints!</li>
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

    convex: {
        title: 'Convex - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>Discover a hidden convex polygon by probing with points and rays.</p>

            <h3>Probe Types</h3>
            <ul>
                <li><strong>Point probe (cost 1)</strong>: Is (x,y) INSIDE, OUTSIDE, or on BOUNDARY?</li>
                <li><strong>Ray probe (cost 2)</strong>: Distance from (x,y) in direction θ to boundary</li>
            </ul>

            <h3>Goal</h3>
            <p>Identify all vertices of the hidden polygon exactly.</p>

            <h3>Strategy Tips</h3>
            <ul>
                <li><strong>Binary search</strong>: Use inside/outside to narrow down edges</li>
                <li><strong>Radial sweep</strong>: From inside, ray-probe in all directions</li>
                <li>Vertices are where boundary direction changes sharply</li>
                <li>Convexity helps: if A is inside and B is outside, the boundary is between them</li>
            </ul>
        `
    },

    recurrence: {
        title: 'Recurrence - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>Deduce a hidden linear recurrence relation: aₙ = c₁·aₙ₋₁ + c₂·aₙ₋₂. You see the first 3 terms and can probe for more.</p>

            <h3>Core Mechanics</h3>
            <ul>
                <li>You see the first 3 terms of the sequence</li>
                <li>Probe additional terms (up to 5 probes)</li>
                <li>Guess the coefficients [c₁, c₂] (up to 3 attempts)</li>
                <li>Coefficients are integers from -3 to 3</li>
            </ul>

            <h3>Common Patterns</h3>
            <ul>
                <li><strong>[1, 1]</strong>: Fibonacci-like → ratio approaches 1.618...</li>
                <li><strong>[2, -1]</strong>: Arithmetic sequence → constant differences</li>
                <li><strong>[2, 0]</strong>: Geometric (×2) → exact doubling</li>
                <li><strong>[0, -1]</strong>: Oscillating → period 4</li>
            </ul>

            <h3>The Twist</h3>
            <p>Multiple recurrences can produce the same sequence! For example, 1, 2, 4, 8... matches both [2, 0] AND [3, -2]. The puzzle is finding the <em>hidden</em> recurrence.</p>

            <h3>Strategy Tips</h3>
            <ul>
                <li><strong>Compute ratios</strong>: aₙ₊₁/aₙ reveals geometric behavior</li>
                <li><strong>Compute differences</strong>: aₙ₊₁ - aₙ reveals arithmetic behavior</li>
                <li><strong>Probe far</strong>: Large n reveals asymptotic behavior</li>
            </ul>
        `
    },

    bijection: {
        title: 'Bijection - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>Discover a hidden bijection (perfect matching) between two sets by probing pairs with yes/no queries.</p>

            <h3>Core Mechanics</h3>
            <ul>
                <li>Sets A = {a₁,...,aₙ} and B = {b₁,...,bₙ}</li>
                <li>Hidden bijection σ: A → B</li>
                <li>Query: "Does σ(aᵢ) = bⱼ?" → YES or NO</li>
                <li>Find all n matches within query budget</li>
            </ul>

            <h3>Information Value</h3>
            <ul>
                <li><strong>YES</strong>: Highly valuable! Confirms one edge definitively</li>
                <li><strong>NO</strong>: Less valuable, but eliminates one possibility</li>
            </ul>

            <h3>Strategy Tips</h3>
            <ul>
                <li>Constraint propagation: If row i is found, column j is eliminated for other rows</li>
                <li>Look for forced moves in the endgame</li>
                <li>Balance systematic search vs. hunting for YES answers</li>
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
    }
};
