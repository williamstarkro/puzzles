# Claude Code Instructions

## Project Overview

This is a collection of mathematical puzzle games inspired by Wordle. Each game challenges players with a different mathematical concept. The project emphasizes strategic depth, mathematical elegance, and a polished dark-mode UI inspired by Teenage Engineering.

## Key Documents

- `game_philosophy.md` - What makes a puzzle game great (mechanics, strategy, fun)
- `DESIGN_PHILOSOPHY.md` - UI/visual design principles (colors, typography, components)
- `puzzles.md` - Complete game specifications and mechanics

## Skills

---

### /game-philosophy

Evaluate a puzzle game design against the game philosophy principles. Use when:
- Designing a new puzzle game
- Evaluating whether an existing game is fun/engaging
- Debugging why a game feels "off" or boring
- Deciding whether to keep or cut a game

**Prompt:**
Read `game_philosophy.md` and analyze the game against its principles:

**The Three Fatal Flaws (game FAILS if any present):**

1. **Dominant Strategy** - Is there a fixed algorithm? Can experts disagree on first move?
2. **Target-Independent Strategy** - Does approach change based on the hidden answer?
3. **Systematic Solvability** - Can a simple flowchart always win?

**The Three Required Properties (ALL must be present):**

1. **Target-Dependent Strategy** - Different targets create different optimal play
2. **Meaningful Uncertainty** - Decisions before certainty, risk/reward tradeoffs
3. **Constraint Interaction** - Information compounds non-linearly

**Additional Checks:**
- Search space in sweet spot (200-5000)?
- Feedback type appropriate (Binary/Scalar/Structured/Noisy)?
- Cost/benefit tradeoffs in queries?
- Skill ceiling with week 1 vs week 50 improvement?

**Red Flags:** "I just do X every time", "Didn't matter what answer was", "I can write a bot"

**Output:** PASS/FAIL/NEEDS-WORK verdict with specific recommendations

---

### /ui-style

Review code against the visual design philosophy. Use when:
- Creating new UI components
- Modifying game interfaces
- Adding styling or visual elements
- Reviewing for design consistency

**Prompt:**
Read `DESIGN_PHILOSOPHY.md` and check for:

**Color System:**
- Uses CSS variables (--color-*) not hardcoded colors
- Orange (#ff6b35) only for action/focus states
- Semantic colors (success/warning/error) used appropriately
- No pure white text - use #e0e0e0

**Typography:**
- Monospace (--font-mono) for numbers, data, mathematical expressions
- System fonts (--font-ui) for buttons, labels, navigation
- Size hierarchy: 0.75rem → 0.875rem → 1rem → 1.125rem → 1.25rem

**Spacing:**
- Uses spacing scale (--space-xs through --space-3xl)
- 8px base unit (0.25rem multiples)
- Generous but not wasteful

**Components:**
- Game boxes: --color-surface bg, 2px border, subtle shadow
- Inputs: --color-surface-elevated bg, orange focus ring (20% opacity)
- Buttons: Orange bg (#ff6b35), white text, scale(0.98) on active
- Tables: Monospace, compact, subtle row borders

**Interactions:**
- 200ms transitions with cubic-bezier(0.4, 0, 0.2, 1)
- Hover: translateY(-2px), border color change
- Focus: 2px orange ring at 20% opacity
- No bounce/spring animations

**Accessibility:**
- Contrast meets WCAG AA (4.5:1)
- Keyboard navigable with visible focus
- No color-only indicators (use shapes too)
- ARIA labels for icon buttons

**Philosophy:**
- Teenage Engineering aesthetic (industrial minimalism, contained spaces)
- Clarity over decoration
- Dark mode only
- Mathematical precision

**Output:** List violations with line numbers, suggestions, pass/needs-work/fail assessment

---

### /new-game

Guide for creating a new puzzle game from scratch. Use when:
- Brainstorming new game ideas
- Implementing a new game from concept
- Converting a mathematical concept into a game

**Prompt:**
Reference both `game_philosophy.md` and `puzzles.md` to guide new game creation:

**Phase 1: Concept Validation**
Before writing code, answer:
1. What is the hidden target? (word, number, structure, etc.)
2. What queries can players make?
3. What feedback do they receive?
4. What's the search space size? (aim for 200-5000)
5. Why is this NOT systematically solvable?

**Phase 2: Fatal Flaw Check**
- Can you describe a dominant opening strategy? If yes, redesign.
- Does strategy change based on target type? If no, redesign.
- Can you write a simple bot? If yes, add uncertainty or complexity.

**Phase 3: Mechanics Design**
Following puzzles.md patterns:
- Define difficulty settings (Standard/Hard)
- Design query cost structure (flat vs scaled)
- Specify feedback format (binary/scalar/structured/noisy)
- Plan share format for social element

**Phase 4: Implementation**
Following existing game structure in `scripts/games/`:
- Extend game class pattern from other games
- Use game-engine.js for RNG, results, completion tracking
- Use ui-helpers.js for createElement
- Follow renderGame() / renderControls() / showShareSection() pattern

**Phase 5: UI Implementation**
Following DESIGN_PHILOSOPHY.md:
- Use game-box containers with headers
- Monospace for all numerical/data display
- Orange accent for primary actions only
- Include guess/query history display
- Budget/remaining counter if applicable

**Output:** Step-by-step implementation plan with specific code patterns to follow

---

### /game-spec

Review or create a game specification. Use when:
- Documenting a new game's mechanics
- Reviewing game balance
- Checking specification completeness

**Prompt:**
Reference `puzzles.md` format. A complete spec needs:

**Required Sections:**
1. **Concept** - One-sentence hook + 2-3 sentence explanation
2. **Mathematical Foundation** - What math concept underlies the game
3. **Core Mechanics**
   - Setup (hidden target, constraints)
   - Player Actions (what can they do)
   - Feedback (what do they learn)
4. **Worked Example** - Step-by-step sample game
5. **Strategic Depth** - Why it's interesting, different approaches
6. **Invariants** - Rules that never change
7. **Difficulty Settings** - Table with Standard/Hard parameters
8. **UI Elements** - Required interface components
9. **Share Format** - Compact spoiler-free result format

**Balance Checks:**
- Standard mode: ~70% win rate for skilled player
- Hard mode: ~50% win rate for expert
- Query budget forces meaningful tradeoffs
- Not solvable by brute enumeration

**Output:** Complete or annotated specification following puzzles.md format

---

### /accessibility

Check accessibility compliance. Use when:
- Adding new UI components
- Reviewing existing interfaces
- Before major releases

**Prompt:**
Check against DESIGN_PHILOSOPHY.md accessibility standards:

**Color Contrast (WCAG AA):**
- [ ] Primary text on background: 4.5:1 minimum
- [ ] Large text (18px+): 3:1 minimum
- [ ] Interactive elements: 3:1 minimum
- [ ] Verify with contrast checker tool

**Keyboard Navigation:**
- [ ] All interactive elements focusable via Tab
- [ ] Logical tab order
- [ ] Focus indicators visible (orange ring)
- [ ] No keyboard traps
- [ ] Enter/Space activates buttons

**Screen Readers:**
- [ ] Semantic HTML (proper headings h1-h6)
- [ ] Form inputs have labels
- [ ] ARIA labels for icon-only buttons
- [ ] Alt text for images
- [ ] Live regions for dynamic updates

**Color Blindness:**
- [ ] Never color-only indicators
- [ ] Use shapes + colors (checkmark + green, X + red)
- [ ] Pattern differentiation where needed
- [ ] Works in grayscale

**Motion:**
- [ ] Respects prefers-reduced-motion
- [ ] No essential information in animation
- [ ] Animations < 5 seconds or pausable

**Output:** Checklist with pass/fail for each item, specific fixes needed

---

### /share-format

Design a shareable result format for a game. Use when:
- Creating share functionality for new game
- Improving existing share formats
- Ensuring spoiler-free sharing

**Prompt:**
Create a share format following these principles from puzzles.md:

**Requirements:**
1. **Compact** - Fits in a tweet/message (< 280 chars ideal)
2. **Spoiler-free** - Shows performance, not answer
3. **Visually distinctive** - Recognizable at a glance
4. **Comparable** - Others can gauge your performance

**Format Template:**
```
[Game Name] #[puzzle number] [game emoji]
[Mode/difficulty if applicable]
[Visual feedback representation]
[Result summary]
```

**Examples from existing games:**
```
Edit #142
5 → 4 → 2 → 2 → 2 → 0
Solved in 6/8!
```

```
Cipher #47 📡
Noise: 25%
Intercepts: 4/6
🟩🟩🟨🟩🟩 → CRANE
Solved!
```

```
Partition #42 (N=20)
⬛⬛🟨🟨⬛
⬛🟩🟩🟨⬛
🟩🟩🟩🟩🟩
Solved in 3/6!
```

**Emoji Conventions:**
- 🟩 Green = correct/exact
- 🟨 Yellow = partial/present
- ⬛ Gray = wrong/absent
- Use game-specific emoji (📡 cipher, 🔄 orbit, 🕸️ network, etc.)

**Output:** Proposed share format with examples for win/loss cases

---

### /playtest

Analyze a game based on playtesting observations. Use when:
- Getting feedback on a game
- Diagnosing why a game isn't fun
- Iterating on game design

**Prompt:**
Reference game_philosophy.md red flags table:

| Observation | Likely Problem | Solution Direction |
|-------------|----------------|-------------------|
| "I just do X every time" | Dominant strategy | Add randomness or multiple viable openings |
| "Didn't matter what answer was" | Target-independent | Make feedback depend on target structure |
| "I can write a bot for this" | Systematically solvable | Add uncertainty or larger decision space |
| "That felt unfair" | Insufficient information | Ensure answer is always deducible |
| "I didn't learn anything from that query" | Feedback too weak | Increase information per query |
| "I knew the answer 3 queries ago" | Feedback too strong | Reduce information per query |
| "I have no idea what to try" | Search space too large | Constrain possibilities or add hints |
| "Well, obviously try X" | Search space too small | Expand target space |

**Analysis Steps:**
1. What did players actually do? (not what you expected)
2. Did different players use different strategies?
3. Did strategy change based on the specific puzzle?
4. Were there "aha moments" or just grinding?
5. Did players want to play again?

**Output:** Diagnosis of issues and specific mechanic changes to try

---

## Code Patterns

### Game Class Structure
All games in `scripts/games/` follow this pattern:
```javascript
export class GameName {
    constructor(container, controls, shareSection) { ... }
    init() { ... }           // Setup with RNG from gameEngine
    render() { ... }         // Call renderGame + renderControls
    renderGame() { ... }     // Main game display
    renderControls() { ... } // Input controls
    submitGuess(guess) { ... }
    showShareSection() { ... }
    renderSettingsModal() { ... }
    setDifficulty(mode) { ... }
}
```

### Game Registration
Add to `scripts/games/index.js`:
```javascript
{
    id: 'gamename',
    name: 'GAMENAME',
    tagline: 'The Subtitle Game',
    description: 'One sentence description.',
    category: 'algebra|combinatorics|geometry|graph-theory',
    difficulty: 'Medium|Medium-High|High',
    game: GameNameClass
}
```

### UI Helpers
```javascript
import { createElement } from '../utils/ui-helpers.js';

// Create elements with classes and properties
const box = createElement('div', { className: 'game-box mb-4' });
const header = createElement('div', { className: 'game-box-header' });
```
