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
            <p>Recover a hidden 5-letter word. You have one shared budget of <strong>actions</strong>—each action is either an intercept or a guess. The game ends when you guess the word exactly, or run out of actions.</p>

            <h3>Two Kinds of Actions</h3>
            <ul>
                <li><strong>Intercept (−1 action)</strong>: A noisy copy of the word. Each letter may be corrupted.</li>
                <li><strong>Guess (−1 action)</strong>: A real dictionary word. Exact match wins. A wrong guess reveals which positions were correct (green)—exact information, but it costs the same as an intercept.</li>
            </ul>
            <p>Your last action is always reserved for a guess.</p>

            <h3>Signal Confidence</h3>
            <ul>
                <li><strong>Green (≥70%)</strong>: High agreement—probably correct</li>
                <li><strong>Yellow (40-69%)</strong>: Uncertain—use word knowledge</li>
                <li><strong>Red (&lt;40%)</strong>: Noisy—multiple candidates</li>
            </ul>

            <h3>The Core Tension</h3>
            <p>More intercepts = better statistics, but fewer chances to test words. An early guess of the consensus word can confirm several positions at once—often worth more than another noisy sample. When two words fit the signal (CRANE vs CRAVE), a guess settles it; an intercept might not.</p>

            <h3>Strategy Tips</h3>
            <ul>
                <li>Start with 2-3 intercepts to establish a baseline</li>
                <li>Use word knowledge to disambiguate: if signals show _ATCH, think BATCH, CATCH, WATCH...</li>
                <li>Guess a plausible word while uncertainty is concentrated in 1-2 positions—the greens lock in the rest</li>
                <li>Don't burn every action on intercepts; exact feedback compounds</li>
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

            <h3>Free Information</h3>
            <p>σ's own cycle type is shown from the start (the old "identity probe" is free). Every query should go after structure the cycle type doesn't reveal: <em>which</em> elements share cycles, and the order within them.</p>

            <h3>Key Probing Strategies</h3>
            <ul>
                <li><strong>Transposition (i j)</strong>: If i,j are in same cycle of σ, the cycle splits; if in different cycles, they merge</li>
                <li><strong>Longer probes</strong>: More information per query, but harder to interpret</li>
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
                <li>σ has cycle type [3,2] (given)</li>
                <li>Probe (1 2) → If result is [4,1], then 1,2 were in different cycles (now merged)</li>
                <li>Probe (1 3) → If result is [2,2,1], then 1,3 were in same 3-cycle (now split)</li>
                <li>Continue to map out which elements share cycles</li>
            </ol>

            <h3>Strategy Tips</h3>
            <ul>
                <li>With only 4 queries you cannot test every pair—let the known cycle type guide which tests matter</li>
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

    fossil: {
        title: 'Fossil - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>A connected fossil of cells is buried somewhere in the grid. Find its <em>exact</em> shape and position, then stake your claim.</p>

            <h3>Actions</h3>
            <ul>
                <li><strong>⛏ Probe (−1 budget)</strong>: Tap a cell. Learn the Manhattan distance to the nearest fossil cell. 0 = you hit the fossil.</li>
                <li><strong>📡 Scan (−2 budget)</strong>: Tap ▶ or ▼ on the grid edge. Learn how many fossil cells lie in that row or column.</li>
                <li><strong>🚩 Claim (free, but limited)</strong>: Select exactly the fossil's cells and stake your claim. A wrong claim reveals how many cells were right.</li>
            </ul>

            <h3>Reading a Probe</h3>
            <p>Distance 3 means: nothing within 2 steps (those cells are auto-marked as ruled out), and at least one fossil cell exactly 3 steps away—somewhere on that diamond ring.</p>

            <h3>The Fossil is Connected</h3>
            <p>Every fossil cell touches another edge-to-edge. One confirmed hit plus connectivity is a powerful constraint—a 5-cell fossil can't stray far from any of its cells.</p>

            <h3>Strategy Tips</h3>
            <ul>
                <li><strong>Locate, then map</strong>: Triangulate with 2-3 probes, then trace the shape</li>
                <li><strong>Scans shine mid-game</strong>: Once roughly located, a row count can rule out whole shapes at once</li>
                <li><strong>Don't over-dig</strong>: If only a few shapes remain possible, a claim is information too—you have a spare in Standard</li>
                <li>A scan of 0 clears an entire line for 2 budget—sometimes the cheapest information available</li>
            </ul>
        `
    },

    triad: {
        title: 'Triad - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>The items have a hidden strict ranking. You know which item is #1. Query any three items to learn which of them is the <strong>median</strong>—the middle-ranked of the trio. Declare the full ranking to win.</p>

            <h3>Actions</h3>
            <ul>
                <li><strong>🔺 Query</strong>: Pick 3 items, learn the median. Limited queries.</li>
                <li><strong>🏁 Declare</strong>: Submit a complete ranking. A wrong declaration reveals how many items you placed correctly. Limited declarations.</li>
            </ul>

            <h3>Reading a Median</h3>
            <p>"Median of {B, E, G} is E" means exactly one of B, G ranks above E and the other below. You never learn which—that's the puzzle.</p>

            <h3>The Anchor Trick</h3>
            <p>Include the known #1 item: median(★, x, y) is simply the <em>higher</em> of x and y, because ★ outranks both. This turns a query into a clean pairwise comparison—easy to read, but it extracts less information than a query among three unknowns.</p>

            <h3>The Core Tension</h3>
            <p>Sorting purely by anchor comparisons needs more queries than you have. Raw three-way medians carry more information but leave ambiguity. Winning play mixes both—and knows when the remaining candidates are few enough to gamble a declaration.</p>

            <h3>Strategy Tips</h3>
            <ul>
                <li>Reuse items across queries—overlapping trios compound information</li>
                <li>An item that is never a median in several queries is likely near the top or bottom</li>
                <li>Track what each answer rules out, not just what it suggests</li>
                <li>A failed declaration's "k placed correctly" is strong evidence—plan to use it</li>
            </ul>
        `
    },

    flip: {
        title: 'Flip - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>A convex polygon has been triangulated in secret—one of <em>Catalan-many</em> possibilities (429 for the 9-gon). Find every diagonal of the hidden triangulation and declare it.</p>

            <h3>Actions</h3>
            <ul>
                <li><strong>📐 Query (−1)</strong>: Tap two vertices to test a diagonal. You learn how many hidden diagonals it <em>crosses</em>.</li>
                <li><strong>🚩 Declare (free, limited)</strong>: Select a complete non-crossing set of diagonals. Wrong declarations reveal how many were right.</li>
            </ul>

            <h3>The Beautiful Theorem</h3>
            <p>A triangulation is a <em>maximal</em> non-crossing set of diagonals. So any diagonal NOT in the target must cross at least one target diagonal. Therefore:</p>
            <p><strong>crossing count 0 ⟺ your diagonal is in the target.</strong></p>

            <h3>Reading Crossing Counts</h3>
            <ul>
                <li>A long "central" diagonal can cross many target diagonals—high counts mean lots of target structure passes through that region</li>
                <li>Short diagonals (skipping one vertex) cross few—cheap, low-information tests</li>
                <li>Every confirmed diagonal eliminates ALL diagonals that cross it</li>
            </ul>

            <h3>Strategy Tips</h3>
            <ul>
                <li><strong>Fans vs snakes</strong>: a triangulation fanning from one vertex versus zig-zagging gives totally different crossing landscapes—figure out which kind you're in</li>
                <li>High crossing counts are information too: a diagonal crossing 4 of 6 pins down a lot</li>
                <li>Each polygon "ear" (triangle using two sides) forces nearby structure—hunt for ears</li>
                <li>You rarely need to confirm all diagonals by query—declare when the remainder is forced</li>
            </ul>

            <h3>The Math</h3>
            <p>Triangulations of an (n+2)-gon are counted by the Catalan number C(n) and form the vertices of the <em>associahedron</em>; two triangulations are adjacent when they differ by one "flip". You're searching a Catalan-sized space with crossing-number feedback.</p>
        `
    },

    census: {
        title: 'Census - Reference Guide',
        content: `
            <h3>How to Play</h3>
            <p>A hidden graph exists, but you can never see it. You can only purchase <strong>census data</strong>: global counts of small patterns inside it. Rebuild the graph in the editor and declare. You win if your graph is <em>isomorphic</em> to the target—vertex labels don't matter.</p>

            <h3>The Census Menu</h3>
            <ul>
                <li><strong>─ Edges (1)</strong>: total edges</li>
                <li><strong>∧ Cherries (1)</strong>: paths of 2 edges = Σ C(deg,2)</li>
                <li><strong>△ Triangles (2)</strong>: triangles</li>
                <li><strong>✶ Claws (2)</strong>: stars K₁,₃ = Σ C(deg,3)</li>
                <li><strong>⌁ Paths (3)</strong>: paths of 3 edges</li>
                <li><strong>◻ 4-Cycles (3)</strong>: cycles of length 4</li>
                <li><strong>𝚫 Degrees (4)</strong>: the full sorted degree sequence—expensive luxury</li>
            </ul>
            <p>You can't afford them all. Choose the counts that distinguish YOUR remaining candidates.</p>

            <h3>Deduction Toolkit</h3>
            <ul>
                <li>Edges fix the sum of degrees (= 2·edges)</li>
                <li>Cherries fix Σ C(deg,2) — together these heavily constrain the degree sequence</li>
                <li>Triangles vs cherries: a high triangle/cherry ratio means clustered structure</li>
                <li>0 triangles with many edges suggests bipartite-like structure; check 4-cycles</li>
            </ul>

            <h3>Strategy Tips</h3>
            <ul>
                <li>Start cheap: edges + cherries for 2 budget narrows enormously</li>
                <li>Buy expensive counts only when your candidates disagree on them</li>
                <li>A failed declaration's "best alignment" tells you how close your shape was</li>
                <li>Build the degree sequence first, then place triangles, then verify with a parity check you haven't bought yet</li>
            </ul>

            <h3>The Math</h3>
            <p>Lovász proved that a graph is determined by its homomorphism counts from all graphs. This game asks: how few counts do you actually need? That's the modern field of graph reconstruction—and your daily puzzle.</p>
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
