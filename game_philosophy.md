# What Makes a Puzzle Game Great
## Design Principles for Mathematical Wordle Variants

---

## The Core Question

**Why is Wordle fun but Sudoku on a computer isn't?**

Both are constraint-satisfaction puzzles. But Wordle creates *moments*—tension, surprise, relief, triumph. Sudoku (digitally) is just... execution.

The difference is **strategic uncertainty**. In Wordle, you don't know if CRANE or SLATE is better until you see the feedback. Your choice *matters*. In Sudoku, the optimal next move is always determinable—it's just pattern-matching.

---

## The Three Fatal Flaws

Games fail when they have any of these:

### 1. Dominant Strategy
**Symptom**: Every game plays the same way. Players discover "the algorithm" and execute it.

**Examples of failure**:
- Primal: Always guess 210, then refine exponents
- Balance: The 12-coin algorithm is fixed
- Recurrence: Classify sequence type → guess coefficients

**Test**: Can two experts disagree on the optimal first move? If not, dominant strategy exists.

### 2. Target-Independent Strategy
**Symptom**: Your approach doesn't change based on what you're looking for.

**Examples of failure**:
- Bijection: Constraint propagation works identically for any hidden matching
- Threshold: Probe singletons then coalitions, regardless of actual weights
- Primal: Same prime-probing sequence regardless of target

**Test**: Does knowing the target was {1,2,3,4} vs {3,6,9,12} vs {2,5,8,11} change how you SHOULD have played? If not, strategy is target-independent.

### 3. Systematic Solvability
**Symptom**: A mechanical procedure always works in bounded steps.

**Examples of failure**:
- Balance: Decision tree is fixed
- Basis (cut early): Two linear equations, two unknowns
- Recurrence: 49 coefficient pairs, just enumerate

**Test**: Can you write a simple flowchart that always wins? If yes, it's systematically solvable.

---

## The Three Required Properties

Great games have ALL of these:

### 1. Target-Dependent Strategy
**Definition**: The optimal approach *changes* based on the hidden target.

**Wordle example**: 
- QUEUE requires finding the rare QU cluster
- APPLE requires handling double letters
- GHOST has unusual GH opening

Each word creates a different "landscape" of clues.

**Subset example**:
- {1,2,3,4} (clustered) → bisection works fast
- {3,6,9,12} (patterned) → modular probe reveals immediately
- {2,5,8,11} (spread) → bisection gives 2-2 splits, need different approach

### 2. Meaningful Uncertainty
**Definition**: You must make decisions before you have enough information to be certain.

**Good uncertainty**:
- "Should I guess now with 3 possibilities, or spend another query?"
- "This could be pattern A or pattern B—which do I test for?"
- "I'm 80% sure it's GHOST, do I risk the guess?"

**Bad uncertainty**:
- Random chance determining success (pure luck)
- Hidden information that can't be deduced (unfair)

### 3. Constraint Interaction
**Definition**: Information compounds non-linearly. Learning X changes what Y means.

**Wordle example**: A yellow E in position 3 means:
- E is in the word (information about letters)
- E is NOT in position 3 (information about positions)
- Combined with other yellows, narrows dramatically

**Subset example**: 
- Query {1,2,3,4,5,6} → 2
- Query {1,2,3} → 0
- Therefore: Both elements are in {4,5,6} (interaction!)

---

## The Spectrum of Feedback

Different feedback types create different games:

| Feedback Type | Example | Strategic Depth |
|---------------|---------|-----------------|
| Binary | WIN/LOSE, YES/NO | Low—1 bit per query |
| Scalar | Edit distance, intersection size | Medium—multiple bits |
| Structured | Wordle colors, cycle types | High—bits + relationships |
| Noisy | Cipher intercepts | High—requires aggregation |

**Key insight**: Richer feedback isn't always better. Edit distance (scalar) creates deeper gameplay than Wordle colors would for the same task.

---

## The Search Space Sweet Spot

| Too Small | Sweet Spot | Too Large |
|-----------|------------|-----------|
| <100 possibilities | 200-5000 possibilities | >10000 possibilities |
| Enumerable by brute force | Requires intelligent narrowing | Requires luck or computers |
| Feels trivial | Feels like a puzzle | Feels impossible |

**Examples**:
- Wordle: ~2300 common words ✓
- Subset C(12,4): 495 sets ✓
- Partition p(20): 627 partitions ✓
- Edit (5 letters): ~12000 words (upper bound) ✓

---

## The Information Economy

**Query Budget Design**:

Every game has a tension between **query cost** and **information gained**.

**Flat cost** (every query costs 1):
- Simple, but no interesting tradeoffs
- Can lead to dominant "always use max-information query" strategy

**Scaled cost** (cost depends on query type):
- Creates risk/reward decisions
- "Do I pay 6 points for a big query or 2 points for a small one?"
- Different games emerge from different cost structures

**Examples**:
- Derivative: f(x) costs 1, f'(x) costs 2, f''(x) costs 3
- Convex: Point probe costs 1, ray probe costs 2
- Subset: Cost = query size (1-12)
- Network: Pings cost 1, but movement creates information decay

---

## The Skill Ceiling

A great game has **depth without opacity**.

| Property | Good | Bad |
|----------|------|-----|
| Learnability | Beginner can stumble to victory | Beginner can't start |
| Mastery | Expert wins more consistently | Expert has no edge |
| Intuition | Hunches sometimes beat calculation | Pure calculation dominates |
| Improvement | You get better over weeks | Skill plateaus after 1 hour |

**The "Week One to Week Fifty" test**: Does a player at week 50 reliably beat themselves at week 1? If not, there's no skill gradient.

---

## The Social Element

Wordle's daily puzzle creates **shared experience**:
- Everyone solves the same puzzle
- Shareable results without spoilers (🟩🟨⬛ grid)
- Water cooler conversation

**Design implications**:
- Daily puzzle must be deterministically seeded
- Share format must be compact and visually distinctive  
- Results should be comparable (queries used, efficiency score)

---

## Red Flags During Playtesting

| Observation | Likely Problem |
|-------------|----------------|
| "I just do X every time" | Dominant strategy |
| "Didn't matter what the answer was" | Target-independent |
| "I can write a bot for this" | Systematically solvable |
| "That felt unfair" | Insufficient information available |
| "I didn't learn anything from that query" | Feedback too weak |
| "I knew the answer 3 queries ago" | Feedback too strong |
| "I have no idea what to try" | Search space too large |
| "Well, obviously try X" | Search space too small |

---

## Summary: The Checklist

Before finalizing a game, verify:

**Must Have**:
- [ ] Target-dependent strategy (different targets → different approaches)
- [ ] No dominant first move (experts can disagree)
- [ ] Constraint interaction (information compounds)
- [ ] Unique solution (puzzle is well-defined)
- [ ] Achievable with skill (not pure luck)

**Should Have**:
- [ ] Cost/benefit tradeoffs in queries
- [ ] Multiple viable strategies
- [ ] Skill gradient (improvement over time)
- [ ] Satisfying "aha" moments
- [ ] Compact shareable format

**Must Not Have**:
- [ ] Fixed algorithm that always works
- [ ] Strategy that ignores target structure
- [ ] Unsolvable instances
- [ ] Pure guessing required

---

*Document Version 1.0*
*Design principles distilled from iterative game development*