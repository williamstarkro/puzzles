# Mathematical Wordle Variations
## Complete Game Specification v4.1

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Edit](#game-1-edit) - *6 modes including cyclic variants*
3. [Network](#game-2-network) - *Disabled*
4. [Cipher](#game-3-cipher)
5. [Partition](#game-4-partition)
6. [Orbit](#game-5-orbit)
7. [Subset](#game-6-subset)
8. [Cascade](#game-7-cascade)
9. [Derivative](#game-8-derivative)
10. [Shared Systems](#shared-systems)

---

## Design Principles

### Core Requirements

Every game must satisfy these properties:

| Principle | Definition | Test |
|-----------|------------|------|
| **No Dominant Strategy** | Multiple valid opening moves; different playstyles succeed | Can two experts disagree on optimal first move? |
| **Partial Information** | Each query narrows but doesn't determine | Does any single query solve the puzzle? |
| **Constraint Interaction** | Learning X changes the meaning of Y | Do early moves affect late-game strategy? |
| **Mental Tractability** | Humans can reason without a calculator | Can a skilled player compete with a computer? |
| **Skill Gradient** | Beginners can play; experts can optimize | Is there room for mastery over months? |
| **Bounded Luck** | Variance exists but skill dominates | Does the better player usually win? |

### Feedback Design Philosophy

Good feedback has these properties:
- **Partial**: Reveals something, but not everything
- **Relational**: Depends on multiple aspects of the hidden state
- **Composable**: Multiple feedbacks interact non-trivially

### Difficulty Calibration

For each game, difficulty modes are tuned so that:
- **Standard**: A skilled player wins ~70% with good strategy
- **Hard**: An expert wins ~50% with optimal play

Network uniquely retains an **Easy** mode (static target) to teach graph reasoning before introducing movement.

---

## Game 1: Edit

*The Distance Triangulation Game*

### Concept

Find a hidden word using only edit distance feedback. No positional hints—just a single number telling you how "far" your guess is from the target. Triangulate through the space of words.

### Mathematical Foundation

**Levenshtein distance** counts the minimum number of single-character edits (insertions, deletions, substitutions) to transform one string into another.

Examples:
- distance(CRANE, CRONE) = 1 (substitute A→O)
- distance(CRANE, CORN) = 3 (multiple edits needed)
- distance(CRANE, CRANE) = 0

The "space" of words under edit distance has complex, irregular geometry—words cluster in unexpected ways based on their letter patterns.

### Core Mechanics

#### Setup
- **Hidden target**: A 5-letter word from dictionary
- **Guess limit**: 8 guesses

#### Player Action
Submit any valid 5-letter word as a guess.

#### Feedback
A single number: the Levenshtein edit distance from your guess to the target.

| Distance | Meaning |
|----------|---------|
| 0 | Exact match — you win |
| 1 | One edit away |
| 2 | Two edits away |
| 3+ | Far |

That's it. No colors, no positional information.

#### Worked Example

**Target**: GHOST (hidden)

| Guess | Distance | Reasoning |
|-------|----------|-----------|
| CRANE | 5 | Very far — almost no overlap |
| LEAST | 4 | Still far |
| TOAST | 2 | Getting close! Shares _O_ST pattern? |
| ROAST | 2 | Also 2... both share ?OAST |
| COAST | 2 | Hmm, still 2. Not *OAST then |
| GHOST | 0 | **WIN** |

### Why This Has Target-Dependent Strategy

**Different targets create different distance landscapes:**

- **QUEUE**: Words with QU are rare. Distance from QUEUE to most words is 4-5. You need to find the QU cluster.

- **APPLE**: Double letters behave strangely. distance(APPLE, AMPLE) = 1, but distance(APPLE, APPLY) = 1 too.

- **GHOST**: The GH combination is unusual. Words close to GHOST (ROAST, TOAST, HOST) don't share the G.

**Triangulation is non-trivial:**
- If distance(A, target) = 2 and distance(B, target) = 2, what's the intersection?
- Depends entirely on what A and B are and how they relate to each other
- No simple formula—you build intuition through play

**The "neighborhood" of each word is different:**
- CRANE has many distance-1 neighbors (CRONE, CRAZE, CRAVE...)
- QUEUE has very few distance-1 neighbors
- This affects strategy fundamentally

### Strategic Depth

**Opening Strategy:**
- Start with common-letter words to establish baseline
- Words like SLATE, CRANE give you a "reference point"
- A distance of 5 means almost no overlap; distance of 2-3 means you're in the right neighborhood

**Triangulation:**
- Two distance readings constrain possibilities
- Three readings can often narrow significantly
- But human intuition about "what words exist" matters enormously

**Cluster Hopping:**
- If all your guesses are distance 4-5, you're in the wrong cluster
- Jump to a very different word (different starting letter, different vowel pattern)
- The word space has distinct "neighborhoods"

**Endgame:**
- At distance 1-2, think about which single edits produce valid words
- This is where vocabulary knowledge dominates
- "I'm at distance 1 from something... what words are one edit from TOAST?"

### Invariants

1. Target is always a valid 5-letter dictionary word
2. Guesses must be valid 5-letter dictionary words
3. Edit distance is standard Levenshtein (substitution, insertion, deletion each cost 1)
4. Distance 0 = win
5. No partial information—just the distance number

### Difficulty Settings

| Mode | Guess Limit | Distance Type | Notes |
|------|-------------|---------------|-------|
| **Standard** | 8 | Levenshtein | Classic edit distance triangulation |
| **Hard** | 6 | Levenshtein | Tighter guess budget |

**Balancing Notes**:
- Standard mode: 8 guesses is enough for systematic triangulation with common words
- Hard mode: Fewer guesses punishes inefficient search

### Cyclic Distance Variants

Four additional modes use **cyclic (circular alphabet) distance** where the alphabet wraps around (Z is adjacent to A). Each letter has a shortest-arc distance to any other letter (0-13).

#### Clockwork Mode
**Dual feedback: Magnitude + Spin**

Each guess returns TWO numbers:
- **Magnitude**: Sum of absolute cyclic distances at each position (0-65)
- **Spin**: Net signed rotation (positive = clockwise, negative = counter-clockwise)

```
Target: GHOST, Guess: FANZS
Position distances: G→F=-1, H→A=-7, O→N=-1, S→Z=+7, T→S=-1
Magnitude: 1+7+1+7+1 = 17
Spin: -1-7-1+7-1 = -3 (slightly counter-clockwise)
```

**Strategic insight**: Same magnitude with different spin reveals whether letter shifts are canceling or reinforcing. If spin equals magnitude, all shifts are in the same direction.

| Guesses | Notes |
|---------|-------|
| 8 | Dual feedback compensates for cyclic complexity |

#### Residue Mode
**Distance mod 13 (deliberate ambiguity)**

Returns total cyclic distance **modulo 13**. A result of "4" could mean actual distance 4, 17, 30, 43...

```
Actual distance 17 → shows "4"
Actual distance 4 → shows "4"
```

**Strategic insight**: Creates number-theoretic puzzles. Must triangulate across multiple guesses to resolve the mod-13 ambiguity. Winning requires matching the exact word, not just getting residue 0.

| Guesses | Notes |
|---------|-------|
| 10 | Extra guesses for the ambiguity |

#### Primes Mode
**Position-weighted by primes (2, 3, 5, 7, 11)**

Each position's cyclic distance is multiplied by a prime weight:
- Position 1: ×2
- Position 2: ×3
- Position 3: ×5
- Position 4: ×7
- Position 5: ×11

```
Cyclic distances: [4, 10, 12, 5, 11]
Weighted: 4×2 + 10×3 + 12×5 + 5×7 + 11×11 = 8+30+60+35+121 = 254
```

**Strategic insight**: Last positions matter exponentially more. A wrong final letter contributes up to 143 points (13×11) vs 26 points (13×2) for position 1. Endgame strategy focuses on late positions.

| Guesses | Range | Notes |
|---------|-------|-------|
| 8 | 0-364 | Heavy penalty for late-position errors |

#### Torus Mode
**Euclidean distance on 5-dimensional torus**

Returns √(d₁² + d₂² + d₃² + d₄² + d₅²) where each dᵢ is the cyclic distance at position i.

```
Cyclic distances: [4, 10, 12, 5, 11]
Torus distance: √(16+100+144+25+121) = √406 ≈ 20.1
```

**Strategic insight**: Large errors dominate (squared effect). A single position 13 away contributes √169 = 13, while five positions each 5 away contribute √125 ≈ 11.2. Unlike sum-based metrics, one outlier is very expensive.

| Guesses | Range | Notes |
|---------|-------|-------|
| 8 | 0-29.1 | Shows 1 decimal place |

### UI Elements

1. **Guess input**: Word entry field with dictionary validation
2. **Distance display**: Large, prominent number showing distance
3. **Guess history**: List of (guess, distance) pairs
4. **Distance trajectory**: Visual showing your distances over time (are you getting closer?)
5. **Neighborhood hint** (optional): Shows count of valid words at distance 1 from your guess

### Share Format

```
Edit #142
5 → 4 → 2 → 2 → 2 → 0
Solved in 6/8!
```

---

## Game 2: Network - Not Included for now. Needs work.

*The Graph Exploration Game — Fog of War Edition*

### Concept

Find a hidden target node in a graph you can't fully see. Pinging nodes reveals their distance to the target and unveils nearby structure. In Standard and Hard modes, the target moves after each ping, turning static triangulation into a dynamic hunt.

### Mathematical Foundation

Graph distance and local structure. The game leverages:
- **BFS-style reasoning**: Distance constrains possible target locations
- **Graph topology**: Connectivity patterns help triangulate
- **Explore/exploit tradeoff**: Classic optimization tension
- **Probability clouds** (Standard/Hard): Target movement creates uncertainty that compounds over time

### Core Mechanics

#### Setup
- **Hidden**: A connected graph G with n nodes, one designated as target T
- **Initial view**: Player sees only a single starting node S (not the target)
- **Known information**: Total node count, total edge count, guarantee that graph is connected

#### Fog of War Rules

The graph exists in "fog". Nodes and edges are hidden until revealed.

**Revelation Rule**: When you ping node X:
1. You learn distance(X, T) *at the moment of ping*
2. All nodes within distance ≤ 2 from X become visible
3. All edges between visible nodes become visible

#### Moving Target (Standard/Hard Modes)

After each ping, the target may move:

| Mode | Movement Probability | Movement Visibility |
|------|---------------------|---------------------|
| Easy | 0% (static) | N/A |
| Standard | 40% per ping | Shown ("Target moved") |
| Hard | 50% per ping | Hidden (no notification) |

**Movement Rules**:
- Target moves to a uniformly random adjacent node
- Target cannot move to a node you've already pinged (it "avoids" known locations)
- If all adjacent nodes are pinged, target stays put

**Implication**: A ping showing "Distance 2" means the target WAS at distance 2. After movement, it could now be at distance 1, 2, or 3.

#### Player Actions

| Action | Effect | Cost |
|--------|--------|------|
| **Ping** | Learn distance to target + reveal neighborhood + trigger potential movement | 1 ping |
| **Guess** | Declare a visible node as the target | Ends game |

#### Distance Feedback

| Distance | Display |
|----------|---------|
| 0 | 🎯 (auto-win if you ping the target) |
| 1 | 🔥 (adjacent) |
| 2 | 🌡️ (close) |
| 3+ | ❄️ with number |

#### Worked Example (Standard Mode with Movement)

```
Initial: You see node A, everything else is fog.
Graph has 12 nodes, 15 edges. Target moves 40% of the time.

Ping A → Distance 4, reveals A's neighborhood:
    [A]---[B]---???
     |
    [C]---???
"Target moved!" (now distance could be 3, 4, or 5 from A)

Ping B → Distance 2 (🌡️), reveals more:
    [A]---[B]---[D]---???
     |         |
    [C]       [E]---[F]
No movement notification.

Ping E → Distance 1 (🔥!), reveals:
    ... [E]---[F]
              |
             [G]
"Target moved!"

Now: Target WAS adjacent to E. It moved. Could now be at:
- F (was distance 1 from E, moved away)
- G (was distance 1 from E, moved to G)
- Back toward D (distance 2 from E now)

Ping F → Distance 1 (🔥!)
No movement.

Guess G → ✅ Correct! (Target was at G, didn't move)
```

### Strategic Depth

**Explore vs. Exploit Tension**:
- **Exploring** (pinging distant/new nodes): Reveals more graph structure
- **Exploiting** (pinging near known hot spots): Narrows target location

**Corralling Strategy** (Standard/Hard):
- Ping "bridge" nodes to cut off escape routes
- Create a net of pinged nodes the target cannot enter
- Graph topology (cut vertices, articulation points) becomes tactically critical

**Probability Cloud Reasoning** (Hard):
- Without movement notifications, you must track *possible* target locations
- Each ping updates your mental probability distribution
- Old distance readings become increasingly unreliable

**Graph Topology Reasoning**:
- High-degree nodes reveal more structure but might be "central" (far from leaves)
- Low-degree nodes might be near the periphery where targets hide
- Bridges and cut vertices are strategically important for corralling

**Triangulation vs. Corralling**:
- Easy mode: Pure triangulation (2-3 distance readings locate target)
- Standard/Hard: Triangulation gives stale data; must corral instead

### Invariants

1. Graph is always connected (target is reachable)
2. Starting node is never the target
3. Revealing respects distance ≤ 2 strictly (not "2 hops in the visible subgraph")
4. Pinging the target auto-wins (distance 0), even if it would have moved
5. Edges between visible nodes are always shown (no hidden edges in visible region)
6. Target movement happens AFTER distance is reported
7. Target cannot move to previously-pinged nodes

### Graph Generation

Graphs are generated to ensure interesting gameplay:

```
function generateGraph(n, density, seed):
    1. Create spanning tree (ensures connectivity)
    2. Add random edges until target density reached
    3. Place target at node with graph-theoretic "hiding score":
       - Not too central (eccentricity > median)
       - Not a leaf (degree > 1)
       - Has multiple escape routes (degree ≥ 2)
    4. Place start node at distance ≥ diameter/2 from target
```

### Difficulty Settings

| Mode | Nodes | Edges | Pings | Movement | Movement Visible |
|------|-------|-------|-------|----------|------------------|
| **Easy** | 12 | 15-18 | 8 | None (static) | N/A |
| **Standard** | 16 | 20-24 | 9 | 40% per ping | Yes |
| **Hard** | 20 | 26-32 | 9 | 50% per ping | No |

**Balancing Notes**:
- Easy mode: Static target; pure triangulation puzzle; good for learning graph reasoning
- Standard mode: Movement adds uncertainty but notifications let you track; corralling emerges as strategy
- Hard mode: Hidden movement forces probabilistic reasoning; must balance exploration with containment

### UI Elements

1. **Graph visualization**: Force-directed layout with fog overlay
2. **Pinged nodes**: Show distance badge (with "stale" indicator for old pings in moving modes)
3. **Fog boundary**: Visible edges fade into mist
4. **Ping counter**: Remaining pings
5. **Node selector**: Click to ping or guess (modal choice)
6. **Movement indicator** (Standard): Flash notification when target moves
7. **Probability overlay** (Optional/Hard): Heat map of likely target locations

### Share Format

```
Network #89 🕸️
Mode: Standard (Moving Target)
Pings: 6/9
Moves: 3
🔍❄️4→❄️2🏃→🔥→🔥🏃→🎯
Solved!
```

(🏃 indicates target moved after that ping)

---

## Game 3: Cipher

*The Noisy Channel Game*

### Concept

Recover a hidden 5-letter word from multiple corrupted "intercepts". Each intercept is the true word with random letter corruptions. Aggregate the noisy signals to deduce the original.

### Mathematical Foundation

This is error-correcting codes made playable:
- **Redundancy**: Multiple intercepts provide overlapping information
- **Majority voting**: Most common letter at each position is probably correct
- **Bayesian reasoning**: Prior word probability matters when signals conflict

### Core Mechanics

#### Setup
- **Hidden target**: A valid 5-letter word from Wordle-style dictionary
- **Noise level**: Probability p that each letter is corrupted
- **Intercepts available**: K noisy copies

#### Corruption Model

For each intercept, each position independently:
- With probability (1-p): Show correct letter
- With probability p: Show uniformly random letter (a-z)

#### Player Actions

| Action | Effect | Cost |
|--------|--------|------|
| **Request intercept** | Receive one noisy copy | 1 intercept |
| **Submit guess** | Declare your answer | Ends game |

#### Information Display

For each position, after receiving intercepts:
- **Strong signal** (≥70% agreement): Show most common letter in green
- **Weak signal** (40-69% agreement): Show most common letter in yellow
- **Noise** (<40% agreement): Show "?" or top-2 candidates

#### Worked Example

**Target**: CRANE (hidden)
**Noise level**: 25%
**Intercepts available**: 6

Intercept 1: CRANE (lucky—no corruption)
Intercept 2: CRZNE (position 3 corrupted)
Intercept 3: XRANE (position 1 corrupted)
Intercept 4: CRANE (no corruption)
Intercept 5: CRYNE (position 3 corrupted)
Intercept 6: CRANP (position 5 corrupted)

**Aggregated signal after 4 intercepts**:
- Position 1: C(3), X(1) → 75% C → 🟩C
- Position 2: R(4) → 100% R → 🟩R
- Position 3: A(2), Z(1), Y(1) → 50% A → 🟨A
- Position 4: N(4) → 100% N → 🟩N
- Position 5: E(4) → 100% E → 🟩E

Player submits CRANE → **WIN**

### Strategic Depth

**Intercept Timing**:
- Request more intercepts → Higher confidence, but uses resources
- Guess early → Saves intercepts, but might be wrong

**Positional Uncertainty**:
- Some positions converge quickly; others stay ambiguous
- Focus deduction effort on uncertain positions

**Word Prior Knowledge**:
- "CRANE" and "CRAVE" differ by one letter
- If signals show CR_NE, word frequency matters
- This is where human intuition beats pure statistics

**Signal Processing**:
- Experts track exact counts, compute confidence intervals
- Beginners use "gut feel" on which letters look right
- Both can succeed with different approaches

### Invariants

1. Target is always a valid dictionary word
2. Each intercept is generated independently
3. Corruption is per-letter, not per-word
4. Corrupted letters are uniformly random (not weighted by keyboard proximity)
5. Player can request intercepts one at a time or in batches

### Difficulty Settings

| Mode | Noise | Min Corruptions | Intercepts | Word Pool |
|------|-------|-----------------|------------|-----------|
| **Standard** | 30% | 2 per intercept | 6 | Standard Wordle dictionary |
| **Hard** | 40% | 3 per intercept | 5 | Extended dictionary |

**Balancing Notes**:
- Standard mode: Minimum 2 corrupted positions per intercept guarantees challenge; 4-5 intercepts typically needed
- Hard mode: Minimum 3 corruptions + higher noise creates significant ambiguity; must reason about word likelihood

### UI Elements

1. **Intercept display**: Each intercept shown as a row of letters
2. **Consensus view**: Aggregated signal with confidence coloring
3. **Position breakdown**: Hover to see letter frequency per position
4. **Intercept counter**: Remaining intercepts available
5. **Dictionary hint**: (Optional) Show number of words consistent with current signal

### Share Format

```
Cipher #47 📡
Noise: 25%
Intercepts: 4/6
🟩🟩🟨🟩🟩 → CRANE
Solved with 2 to spare!
```

---

## Game 4: Partition

*The Integer Partition Game*

### Concept

Deduce a hidden integer partition using Wordle-style feedback on parts. The feedback treats partitions as sorted sequences and applies standard green/yellow/gray logic.

### Mathematical Foundation

A partition of n is a way to write n as a sum of positive integers (order doesn't matter). Standard form is descending: [5, 3, 2, 1, 1] for 5+3+2+1+1 = 12.

Partition counts grow rapidly: p(20) = 627, p(30) = 5,604.

### Core Mechanics

#### Setup
- **Target N**: A fixed number (e.g., 20)
- **Hidden partition**: One of the p(N) ways to partition N
- **Guess limit**: 6 attempts

#### Player Action
Submit a valid partition of N (parts must sum to exactly N).

#### Feedback System (Wordle-Exact)

Partitions are compared as sorted descending lists. Standard Wordle duplicate-handling applies:

**Phase 1**: Mark exact positional matches as 🟩 (consumes those parts)
**Phase 2**: For unmatched positions, mark 🟨 if that value exists unmatched in target
**Phase 3**: Everything else is ⬛

#### Worked Example

**Target**: [6, 5, 4, 3, 2] (partition of 20, hidden)

**Guess 1**: [7, 7, 3, 2, 1]
- Pos 1: 7 vs 6 → 7 not in target → ⬛
- Pos 2: 7 vs 5 → 7 not in target → ⬛
- Pos 3: 3 vs 4 → 3 IS in target (pos 4) → 🟨
- Pos 4: 2 vs 3 → 2 IS in target (pos 5) → 🟨
- Pos 5: 1 vs 2 → 1 not in target → ⬛
- Feedback: ⬛⬛🟨🟨⬛

**Guess 2**: [8, 5, 4, 2, 1]
- Pos 1: 8 vs 6 → ⬛
- Pos 2: 5 vs 5 → 🟩 (consumes 5)
- Pos 3: 4 vs 4 → 🟩 (consumes 4)
- Pos 4: 2 vs 3 → 2 IS in target → 🟨
- Pos 5: 1 vs 2 → ⬛
- Feedback: ⬛🟩🟩🟨⬛

**Guess 3**: [6, 5, 4, 3, 2]
- Feedback: 🟩🟩🟩🟩🟩 → **WIN**

### Strategic Depth

**Opening Strategy**:
- **Spread guess** (e.g., [5, 4, 4, 3, 2, 2]): Tests many values, learns which parts exist
- **Distinct parts** (e.g., [7, 6, 4, 2, 1]): Tests more unique values
- **Extreme guess** (e.g., [20] or [1,1,1,...,1]): Learns target length quickly

**Length Deduction**: The target's length is hidden. You infer it from feedback patterns. A guess with more parts than target will have "extra" parts that must be gray (unless they appear elsewhere).

**Duplicate Reasoning**: If you guess [4, 4, 3] and get 🟩🟨⬛, you know:
- Position 1 has a 4
- There's another 4 somewhere (yellow)
- No 3 in target

### Hard Mode: Conjugate Feedback

The **conjugate** of a partition swaps rows and columns in its Young diagram. For [4, 2, 1] → conjugate is [3, 2, 1, 1].

**Hard mode rule**: Feedback includes one additional piece of information—how many parts your guess shares with the **conjugate** of the target.

This adds a duality dimension: you're simultaneously solving two related puzzles.

### Invariants

1. All partitions must sum to exactly N
2. Partitions are always sorted descending
3. Feedback uses exact Wordle duplicate semantics
4. Empty parts (zeros) are not allowed; [5, 5, 0] is invalid
5. The number of parts in target is not directly revealed

### Difficulty Settings

| Mode | N | Partition Count | Guesses | Special Rules |
|------|---|-----------------|---------|---------------|
| **Standard** | 20 | 627 | 6 | No hints |
| **Hard** | 25 | 1,958 | 6 | Conjugate feedback |

**Balancing Notes**:
- Standard mode: Core gameplay; 627 possibilities requires systematic narrowing
- Hard mode: Conjugate adds second constraint axis; experts only

### UI Elements

1. **Partition builder**: Add/remove parts, running sum displayed
2. **Young diagram**: Visual representation of current guess
3. **Feedback grid**: Variable-width rows (partitions have different lengths)
4. **Part tracker**: Which numbers 1-N have been confirmed/eliminated
5. **Conjugate view**: (Hard mode) Shows conjugate of your guess

### Share Format

```
Partition #42 (N=20)
⬛⬛🟨🟨⬛
⬛🟩🟩🟨⬛
🟩🟩🟩🟩🟩
Solved in 3/6!
[6,5,4,3,2]
```

---

## Game 5: Orbit

*The Permutation Composition Game*

### Concept

Deduce a hidden permutation by probing it with test permutations and observing the cycle type of the composition.

### Mathematical Foundation

A permutation σ on {1,...,n} can be composed with another permutation τ to get τ∘σ. The **cycle type** of a permutation is the multiset of its cycle lengths.

For example, if τ∘σ = (1 3 5)(2 4)(6), the cycle type is [3, 2, 1] (a 3-cycle, a 2-cycle, a fixed point).

Cycle type is a **coarse invariant**: many permutations share the same cycle type. This creates the partial-information property.

### Core Mechanics

#### Setup
- **Hidden target**: A permutation σ on {1, 2, ..., n}
- **Query limit**: K queries
- **Guess limit**: 1 final guess (or unlimited guesses cost points)

#### Player Action

**Query**: Submit a permutation τ. Learn the cycle type of τ∘σ.

**Guess**: Submit a permutation as your answer for σ.

#### Feedback: Cycle Type

The cycle type is returned as a sorted list. For n=6:
- [6]: single 6-cycle (cyclic permutation)
- [3, 3]: two 3-cycles
- [2, 2, 1, 1]: two transpositions + two fixed points
- [1, 1, 1, 1, 1, 1]: identity

#### Worked Example

**Target**: σ = (1 2 3)(4 5) on {1,2,3,4,5} (a 3-cycle and a 2-cycle)

**Query 1**: τ = identity
- τ∘σ = σ
- Cycle type: [3, 2]
- You learn: σ has a 3-cycle and a 2-cycle (but not WHICH elements)

**Query 2**: τ = (1 2) (transpose first two elements)
- τ∘σ = (1 2)∘(1 2 3)(4 5) = (1 3)(2)(4 5) = (1 3)(4 5)
- Cycle type: [2, 2, 1]
- Interpretation: Composing with (1 2) "broke" the 3-cycle, so 1 and 2 were in the same cycle of σ

**Query 3**: τ = (1 4) (transpose elements from different cycles)
- τ∘σ = (1 4)∘(1 2 3)(4 5) = (1 2 3 4 5) = single 5-cycle
- Cycle type: [5]
- Interpretation: Connecting cycles merges them

### Strategic Depth

**Cycle Structure Probing**:
- Identity probe immediately reveals target's cycle type
- Transposition probes test if two elements are in the same cycle
- Strategic transpositions can isolate cycle membership

**Conjugacy Classes**: Permutations with the same cycle type are conjugate. Your queries effectively narrow down the conjugacy class, then pinpoint within it.

**Efficiency vs. Safety**:
- Sparse probes (identity, single transpositions): Easy to interpret, slow to converge
- Complex probes (longer permutations): More information per query, harder to interpret

**Group Theory Intuition**: Understanding how composition affects cycle structure gives a significant edge. But pattern-matching over repeated play also works.

### Invariants

1. Target is always a valid permutation (bijection on {1,...,n})
2. Query permutations must also be valid permutations
3. Cycle type is always sorted descending
4. The identity query always reveals the target's own cycle type
5. Composition order is τ∘σ (apply σ first, then τ)

### Difficulty Settings

| Mode | n | Queries | Target Constraints |
|------|---|---------|-------------------|
| **Standard** | 6 | 5 | Any permutation |
| **Hard** | 7 | 5 | Any permutation |

**Balancing Notes**:
- Standard mode: 6! = 720 permutations; full complexity; cycle analysis rewards practice
- Hard mode: 7! = 5040 permutations; same query budget means tighter play required

### UI Elements

1. **Permutation builder**: Visual interface to construct τ (drag-and-drop or cycle notation)
2. **Query history**: Table of (τ submitted, cycle type returned)
3. **Cycle visualizer**: Shows composition result as a cycle diagram
4. **Candidate counter**: (Optional) How many permutations match all constraints

### Share Format

```
Orbit #73 🔄
n = 6
Queries: 4/5
[3,2,1] → [2,2,1,1] → [4,1,1] → [3,2,1]
✅ Found: (1 2 3)(4 5)
```

---

## Game 6: Subset

*The Set Intersection Game*

### Concept

Find a hidden subset by probing with test sets and learning intersection sizes. Each probe reveals how many of your selected elements are in the target—probe the exact target set to win!

### Mathematical Foundation

The hidden set S is a k-element subset of {1, 2, ..., n}. Each query Q returns |S ∩ Q|, which partitions the remaining candidates based on their intersection with Q.

For Standard mode: C(12,4) = **495 possible targets**.

### Core Mechanics

#### Setup
- **Universe**: {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}
- **Hidden target**: A subset S with exactly 4 elements
- **Query limit**: 8 queries

#### Win Condition

**Probe the exact target set to win!** If your query matches the target exactly (same size, same elements), you win immediately.

#### Player Action

**Probe**: Select any subset Q of the universe and click PROBE.

**Feedback**: The intersection size |S ∩ Q| (an integer from 0 to min(4, |Q|))

**Win**: When |S ∩ Q| = |S| = |Q| = 4, you've found it!

#### Worked Example

**Target**: S = {2, 5, 9, 11} (hidden)
**Queries**: 8 allowed

| # | Query | Result | Reasoning |
|---|-------|--------|-----------|
| 1 | {1,2,3,4,5,6} | 2 | "Two in lower half" |
| 2 | {7,8,9,10,11,12} | 2 | "Two in upper half" |
| 3 | {1,3,5} | 1 | "One odd in lower half" |
| 4 | {2,4,6} | 1 | "One even in lower half" |
| 5 | {5} | 1 | "5 confirmed in!" |
| 6 | {2} | 1 | "2 confirmed in!" |
| 7 | {9,11} | 2 | "Both 9 and 11 are in!" |
| 8 | {2,5,9,11} | 4 | ✅ **WIN** - Exact match! |

### Strategic Depth

**Probe Types**:

| Strategy | Information | Best For |
|----------|-------------|----------|
| **Bisection** (6 elements) | Reveals count in each half | Finding which region |
| **Parity** (6 elements) | Tests even/odd pattern | Detecting patterns |
| **Singletons** (1 element) | Binary—in or out | Confirming specific elements |
| **Exact guess** (4 elements) | Win if correct! | When confident |

**Key Insight**: You don't need to narrow down to 100% certainty before trying—if you think you know the answer, just probe it! A correct probe wins immediately.

### Invariants

1. Target always has exactly k elements (4 in Standard, 5 in Hard)
2. Queries can be any size
3. Intersection count is exact (no noise)
4. Win by probing the exact target (same elements, same count)

### Difficulty Settings

| Mode | Universe | Target Size | Max Queries |
|------|----------|-------------|-------------|
| **Standard** | 12 elements | 4 | 8 |
| **Hard** | 15 elements | 5 | 6 |

### UI Elements

1. **Universe display**: Numbers 1-12 in a grid, toggleable for selection
2. **Query counter**: Shows queries used / max queries
3. **Query history**: List of (query set → intersection size)
4. **Element tracker**: Green = confirmed in, Red = confirmed out, Gray = unknown
5. **Selection indicator**: Shows how many elements currently selected

### Share Format

```
Subset #203
Queries: 6/8
🔍6→2 🔍6→2 🔍3→1 🔍1→1 🔍1→1 🔍4→4
Found: {2,5,9,11}
Solved!
```

---

## Game 7: Cascade

*The Cellular Automaton Inference Game*

### Concept

Deduce which cellular automaton rule governs a 1D grid by observing how different initial conditions evolve.

### Mathematical Foundation

Elementary cellular automata (ECA) are 1D systems where each cell's next state depends on its current state and its two neighbors. With 2 states (0/1) and 3-cell neighborhoods, there are 2^(2³) = 256 possible rules.

Rules are numbered by their "rule table" as a binary number. Rule 110, for example, is famous for being Turing-complete.

### Core Mechanics

#### Setup
- **Hidden target**: One of the 256 ECA rules
- **Grid width**: W cells (with wraparound boundary)
- **Evolution steps**: Each query shows T timesteps
- **Query budget**: K initial conditions

#### Player Action

**Query**: Submit an initial condition (a binary string of length W).

**Feedback**: The evolution of that initial condition for T timesteps.

```
Initial: 0001000
Step 1:  0011100
Step 2:  0110010
Step 3:  1101111
...
```

**Guess**: Name the rule number (0-255).

#### Worked Example

**Target**: Rule 110 (hidden)

**Query 1**: Single cell (0000100000)
```
Step 0: 0000100000
Step 1: 0001100000
Step 2: 0011100000
Step 3: 0110100000
Step 4: 1101100000
```

From this evolution, you can deduce:
- 001 → 1 (top of the growing pattern)
- 011 → 1 (middle growth)
- 110 → 1 (left edge)
- 100 → 0 (right edge)

**Query 2**: Two adjacent cells (0001100000)
```
Step 0: 0001100000
Step 1: 0011100000
Step 2: 0110100000
...
```

This reveals behavior of 111 → ? and confirms other rules.

After 3-4 strategic queries, all 8 input patterns have been observed.

### Strategic Depth

**Pattern Coverage**: You need to observe all 8 possible neighborhoods (000, 001, ..., 111). Strategic ICs create many different neighborhoods quickly.

**Information Density**:
- Single-cell IC: Clean, predictable, but limited neighborhood coverage
- Random IC: High coverage, but complex to interpret
- Structured IC (e.g., alternating): Tests specific patterns

**Rule Classes**: Rules fall into 4 behavioral classes (Wolfram's classification):
- Class 1: Evolves to uniform state (easy to identify)
- Class 2: Evolves to periodic patterns
- Class 3: Chaotic/random-looking
- Class 4: Complex structures (like Rule 110)

Recognizing the class helps narrow down quickly.

**Edge Cases**: Some rules have identical behavior on many ICs (e.g., Rule 0 always goes to all-zeros). These require specific ICs to distinguish.

### Invariants

1. Target is always one of the 256 ECA rules
2. Grid uses wraparound (circular) boundary conditions
3. Evolution is deterministic given rule and IC
4. All 8 neighborhood patterns uniquely determine a rule
5. T steps are always shown (player can't request more)

### Difficulty Settings

| Mode | Grid Width | Steps Shown | Queries | Rule Pool |
|------|------------|-------------|---------|-----------|
| **Standard** | 11 | 6 | 4 | All 256 rules |
| **Hard** | 11 | 6 | 3 | All 256 rules |

**Balancing Notes**:
- Standard mode: Full rule space; 4 queries usually suffices with good pattern coverage strategy
- Hard mode: Tight query budget; must maximize pattern coverage per initial condition

### UI Elements

1. **IC builder**: Toggle cells on/off, preset patterns (single cell, random, etc.)
2. **Evolution display**: Grid showing T timesteps with row 0 as IC
3. **Rule table tracker**: 8 entries showing which patterns have been observed and their outputs
4. **Rule eliminator**: Shows how many rules match observations (starts at 256)
5. **Rule reference**: (Optional) Look up any rule's behavior

### Share Format

```
Cascade #55 🔬
Queries: 3/4
Pattern coverage: 8/8
Identified: Rule 110
[Spacetime diagram thumbnail]
```

---

## Game 8: Derivative

*The Polynomial Interrogation Game*

### Concept

Identify a hidden polynomial by querying its value or derivatives at chosen points, with derivatives costing more.

### Mathematical Foundation

A degree-d polynomial is determined by d+1 coefficients. By Lagrange interpolation, d+1 value queries at distinct points suffice. But derivatives give different information—they reveal local behavior.

The tradeoff: values are cheap, derivatives are expensive but might disambiguate faster in certain cases.

### Core Mechanics

#### Setup
- **Hidden**: A polynomial f(x) of degree ≤ d with integer coefficients
- **Coefficient range**: Each coefficient is in [-C, C]
- **Budget**: B points

#### Player Actions

| Query | Input | Output | Cost |
|-------|-------|--------|------|
| **Value** | x | f(x) | 1 point |
| **First derivative** | x | f'(x) | 2 points |
| **Second derivative** | x | f''(x) | 3 points |

**Guess**: Declare the polynomial (list of coefficients).

#### Worked Example

**Hidden**: f(x) = 2x³ - 3x² + x - 5 (degree 3, coefficients [2, -3, 1, -5])

**Query 1**: f(0) = -5 (cost: 1) → constant term is -5
**Query 2**: f(1) = 2 - 3 + 1 - 5 = -5 (cost: 1)
**Query 3**: f(-1) = -2 - 3 - 1 - 5 = -11 (cost: 1)
**Query 4**: f(2) = 16 - 12 + 2 - 5 = 1 (cost: 1)

With 4 values at x = 0, 1, -1, 2, Lagrange interpolation uniquely determines f.

**Alternative approach**:
**Query 1**: f(0) = -5 (cost: 1)
**Query 2**: f'(0) = 1 (cost: 2) → linear coefficient is 1
**Query 3**: f''(0) = -6 (cost: 3) → f''(x) = 12x - 6, so quadratic coefficient is -3

With derivatives at 0, we get coefficients directly (Taylor series), but it cost 6 points vs. 4 for values.

### Strategic Depth

**Value vs. Derivative Tradeoff**:
- Values at "nice" points (0, 1, -1) are easy to interpret
- Derivatives at 0 give coefficients directly via Taylor series
- For high-degree polynomials, derivatives might be more efficient

**Point Selection**:
- x = 0: Gives constant term directly; derivatives give higher coefficients
- x = 1: f(1) = sum of all coefficients
- x = -1: Alternating sum of coefficients
- Large x: Dominated by leading term

**Mental Math Considerations**: Evaluating f(3) requires computing 3^d, which is harder than f(1). The game rewards players who can do mental arithmetic efficiently.

**Degree Uncertainty**: If degree is unknown (only upper bound given), some queries might reveal that high-degree coefficients are 0.

### Invariants

1. All coefficients are integers in [-C, C]
2. Degree is at most d (could be less if leading coefficient is 0)
3. Derivative costs are: f costs 1, f' costs 2, f'' costs 3, etc.
4. Query points can be any real number (not just integers)
5. All arithmetic is exact (no floating-point errors)

### Difficulty Settings

| Mode | Degree | Coeff Range | Budget | Notes |
|------|--------|-------------|--------|-------|
| **Standard** | 3 | [-10, 10] | 8 | Cubic; 4 values minimum; mental math required |
| **Hard** | 4 | [-10, 10] | 9 | Quartic; derivative strategy may help |

**Balancing Notes**:
- Standard mode: Cubics need 4 values minimum; budget allows some exploration but not waste
- Hard mode: Quartics at the edge of mental tractability; forces efficiency and strategic point selection

### UI Elements

1. **Query builder**: Select query type (value/derivative), input x
2. **Query history**: Table of (x, query type, result, cost)
3. **Budget meter**: Remaining points
4. **Polynomial builder**: Coefficient input fields
5. **Graph preview**: (Optional) Plot of current best-fit polynomial

### Share Format

```
Derivative #83 📈
Degree: 3
Budget: 6/8
f(0), f(1), f(-1), f(2)
Found: 2x³ - 3x² + x - 5
```

---

## Shared Systems

### Daily Puzzle Generation

All games use deterministic seeding for reproducibility:

```javascript
function generateDailyPuzzle(gameId, date, difficulty) {
    const seed = hash(gameId + date.toISOString().slice(0, 10));
    const rng = new SeededRandom(seed);
    return generatePuzzle(gameId, difficulty, rng);
}
```

This ensures:
- Everyone plays the same puzzle on the same day
- Puzzles can be regenerated for verification
- Streak tracking is meaningful

### Statistics Tracking

For each game, track per player:

| Stat | Description |
|------|-------------|
| Games played | Total attempts |
| Games won | Successful solves |
| Current streak | Consecutive days won |
| Max streak | Best streak ever |
| Average efficiency | Mean (queries used / budget) |
| Guess distribution | Histogram of solve lengths |

### Share Format Template

```
[Game Name] #[day number] [emoji]
[Difficulty indicator if applicable]
[Feedback visualization]
[Result summary]
```

### Cross-Game Achievements

| Achievement | Requirement |
|-------------|-------------|
| **Polymath** | Win all 8 active games in one day |
| **Streak Master** | 7-day streak on any game |
| **Speedrunner** | Solve in minimum possible queries (per game) |
| **Perfectionist** | Complete a game with optimal play (verified) |

---

## Summary Table

### Active Games

| Game | Core Mechanic | Key Tension | Mental Challenge | Difficulty Range |
|------|---------------|-------------|------------------|------------------|
| Edit | Edit distance triangulation | Cluster navigation | Vocabulary + spatial intuition | Medium |
| Cipher | Noisy word recovery | Intercepts vs. confidence | Statistical aggregation | Medium |
| Partition | Integer partition matching | Part values vs. positions | Combinatorial intuition | Medium |
| Orbit | Permutation cycle types | Sparse vs. dense probes | Group structure reasoning | High |
| Subset | Set intersection probing | Query size vs. information | Set reasoning + triangulation | Medium |
| Cascade | CA rule inference | Pattern coverage per IC | Rule behavior recognition | Medium |
| Derivative | Polynomial identification | Values vs. derivatives | Mental arithmetic | Medium-High |

### Disabled Games (In Development)

| Game | Status | Issue |
|------|--------|-------|
| Network | Disabled | Force-directed layout needs work to fill container width |
| Recurrence | Disabled | Needs improvement to game mechanics |
| Bijection | Disabled | Needs improvement |
| Convex | Disabled | Needs better touch/mobile support |

---

*Document Version 4.1*
*Complete specification for mathematical puzzle games*
*Active: 8 games (Edit has 6 modes) | Disabled: 4 games*