/**
 * Recurrence - The Sequence Inference Game
 * Deduce a hidden linear recurrence relation by probing sequence terms.
 * Multiple recurrences can produce the same sequence!
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';

const DIFFICULTY = {
    standard: {
        coeffMin: -3,
        coeffMax: 3,
        maxProbes: 5,
        maxGuesses: 3,
        initialTerms: 3
    },
    hard: {
        coeffMin: -5,
        coeffMax: 5,
        maxProbes: 4,
        maxGuesses: 2,
        initialTerms: 3
    }
};

// Interesting recurrence patterns to sample from
// Each has [c1, c2] and good initial values
const RECURRENCE_TEMPLATES = [
    // Classic patterns
    { coeffs: [1, 1], name: 'Fibonacci-like' },
    { coeffs: [2, -1], name: 'Arithmetic' },
    { coeffs: [2, 0], name: 'Geometric (x2)' },
    { coeffs: [3, 0], name: 'Geometric (x3)' },
    { coeffs: [0, -1], name: 'Oscillating' },
    { coeffs: [1, -1], name: 'Period-6' },
    // Trickier patterns
    { coeffs: [3, -2], name: 'Hidden geometric' },
    { coeffs: [2, 1], name: 'Fast growth' },
    { coeffs: [-1, 1], name: 'Alternating Fibonacci' },
    { coeffs: [1, 2], name: 'Super Fibonacci' },
    { coeffs: [0, 1], name: 'Swap' },
    { coeffs: [-1, 0], name: 'Alternating sign' },
    { coeffs: [2, -2], name: 'Doubled oscillation' },
    { coeffs: [1, -2], name: 'Damped' },
    { coeffs: [-2, 1], name: 'Wild oscillation' }
];

export class RecurrenceGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];
        this.probes = [];
        this.guessHistory = [];
        this.gameOver = false;
        this.won = false;

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();

        // Pick a random recurrence template
        const template = rng.choice(RECURRENCE_TEMPLATES);
        this.coeffs = [...template.coeffs];

        // Generate nice initial conditions
        this.sequence = this.generateSequence(rng);

        // Store what terms the player has seen
        this.knownTerms = new Map();
        for (let i = 0; i < this.config.initialTerms; i++) {
            this.knownTerms.set(i, this.sequence[i]);
        }

        this.render();
    }

    /**
     * Generate initial conditions that produce a "nice" sequence
     * (no huge numbers in first 10 terms)
     */
    generateSequence(rng) {
        const [c1, c2] = this.coeffs;

        // Try different initial conditions until we get a nice sequence
        for (let attempt = 0; attempt < 50; attempt++) {
            // Small integer initial values
            const a0 = Math.floor(rng.next() * 5) + 1; // 1-5
            const a1 = Math.floor(rng.next() * 7) + 1; // 1-7

            const seq = [a0, a1];

            // Generate enough terms to check
            let overflow = false;
            for (let i = 2; i < 20; i++) {
                const next = c1 * seq[i - 1] + c2 * seq[i - 2];
                if (Math.abs(next) > 10000) {
                    overflow = true;
                    break;
                }
                seq.push(next);
            }

            // Accept if no overflow and sequence has some variation
            if (!overflow && new Set(seq.slice(0, 6)).size >= 3) {
                return seq;
            }
        }

        // Fallback: simple sequence
        return [1, 2, this.coeffs[0] * 2 + this.coeffs[1] * 1];
    }

    /**
     * Compute term at position n using the recurrence
     */
    computeTerm(n) {
        if (n < this.sequence.length) {
            return this.sequence[n];
        }

        // Extend sequence if needed
        while (this.sequence.length <= n) {
            const len = this.sequence.length;
            const next = this.coeffs[0] * this.sequence[len - 1] +
                        this.coeffs[1] * this.sequence[len - 2];
            this.sequence.push(next);
        }

        return this.sequence[n];
    }

    probeTermAt(n) {
        if (this.gameOver) return;
        if (this.probes.length >= this.config.maxProbes) return;
        if (n < this.config.initialTerms) return; // Can't probe initial terms
        if (this.knownTerms.has(n)) return; // Already know this term

        const value = this.computeTerm(n);
        this.knownTerms.set(n, value);
        this.probes.push(n);

        this.render();
    }

    submitGuess(c1, c2) {
        if (this.gameOver) return;
        if (this.guessHistory.length >= this.config.maxGuesses) return;

        const guess = [c1, c2];
        const correct = c1 === this.coeffs[0] && c2 === this.coeffs[1];

        this.guessHistory.push({ coeffs: guess, correct });

        if (correct) {
            this.won = true;
            this.gameOver = true;
            gameEngine.recordResult('recurrence', true, this.probes.length);
            gameEngine.markCompleted('recurrence');
        } else if (this.guessHistory.length >= this.config.maxGuesses) {
            this.gameOver = true;
            gameEngine.recordResult('recurrence', false);
            gameEngine.markCompleted('recurrence');
        }

        this.render();

        if (this.gameOver) {
            this.showShareSection();
        }
    }

    render() {
        this.renderGame();
        this.renderControls();
    }

    renderGame() {
        this.container.innerHTML = '';

        // Sequence display
        const seqBox = createElement('div', { className: 'game-box mb-4' });
        const seqHeader = createElement('div', { className: 'game-box-header' });
        seqHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: 'SEQUENCE'
        }));
        seqHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-secondary);',
            textContent: `aₙ = c₁·aₙ₋₁ + c₂·aₙ₋₂`
        }));
        seqBox.appendChild(seqHeader);

        // Show known terms
        const termDisplay = createElement('div', {
            className: 'flex gap-3 flex-wrap justify-center',
            style: 'padding: var(--space-4) 0;'
        });

        // Sort known terms by index
        const sortedTerms = [...this.knownTerms.entries()].sort((a, b) => a[0] - b[0]);

        let lastIndex = -1;
        sortedTerms.forEach(([idx, value]) => {
            // Add ellipsis if there's a gap
            if (lastIndex >= 0 && idx > lastIndex + 1) {
                const ellipsis = createElement('span', {
                    className: 'text-mono',
                    style: 'color: var(--color-text-tertiary); align-self: center;'
                });
                ellipsis.textContent = '...';
                termDisplay.appendChild(ellipsis);
            }

            const termBox = createElement('div', {
                style: `
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 8px 12px;
                    background: ${idx < this.config.initialTerms ? 'var(--color-surface)' : 'var(--color-accent-dim)'};
                    border-radius: 4px;
                    border: 1px solid ${idx < this.config.initialTerms ? 'var(--color-border)' : 'var(--color-accent)'};
                `
            });

            const indexLabel = createElement('span', {
                className: 'text-mono text-xs',
                style: 'color: var(--color-text-tertiary);'
            });
            indexLabel.textContent = `a${this.subscript(idx)}`;

            const valueLabel = createElement('span', {
                className: 'text-mono',
                style: 'font-size: 1.25rem; font-weight: bold;'
            });
            valueLabel.textContent = value;

            termBox.appendChild(indexLabel);
            termBox.appendChild(valueLabel);
            termDisplay.appendChild(termBox);

            lastIndex = idx;
        });

        seqBox.appendChild(termDisplay);
        this.container.appendChild(seqBox);

        // Analysis helpers
        if (sortedTerms.length >= 2) {
            const analysisBox = createElement('div', { className: 'game-box mb-4' });
            const analysisHeader = createElement('div', { className: 'game-box-header' });
            analysisHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'ANALYSIS'
            }));
            analysisBox.appendChild(analysisHeader);

            const analysisContent = createElement('div', {
                className: 'flex gap-6 justify-center',
                style: 'padding: var(--space-3) 0;'
            });

            // Ratios
            const ratioCol = createElement('div', { className: 'text-center' });
            const ratioLabel = createElement('div', {
                className: 'text-mono text-xs',
                style: 'color: var(--color-text-tertiary); margin-bottom: 4px;'
            });
            ratioLabel.textContent = 'RATIOS';
            ratioCol.appendChild(ratioLabel);

            const consecutiveTerms = sortedTerms.filter((t, i) =>
                i > 0 && t[0] === sortedTerms[i - 1][0] + 1
            );

            consecutiveTerms.slice(0, 4).forEach(([idx, val], i) => {
                const prevVal = this.knownTerms.get(idx - 1);
                if (prevVal !== 0) {
                    const ratio = (val / prevVal).toFixed(2);
                    const ratioItem = createElement('div', { className: 'text-mono text-sm' });
                    ratioItem.textContent = `a${this.subscript(idx)}/a${this.subscript(idx - 1)} = ${ratio}`;
                    ratioCol.appendChild(ratioItem);
                }
            });

            if (consecutiveTerms.length === 0) {
                const noRatio = createElement('div', {
                    className: 'text-mono text-xs',
                    style: 'color: var(--color-text-tertiary);'
                });
                noRatio.textContent = 'Need consecutive terms';
                ratioCol.appendChild(noRatio);
            }

            analysisContent.appendChild(ratioCol);

            // Differences
            const diffCol = createElement('div', { className: 'text-center' });
            const diffLabel = createElement('div', {
                className: 'text-mono text-xs',
                style: 'color: var(--color-text-tertiary); margin-bottom: 4px;'
            });
            diffLabel.textContent = 'DIFFERENCES';
            diffCol.appendChild(diffLabel);

            consecutiveTerms.slice(0, 4).forEach(([idx, val]) => {
                const prevVal = this.knownTerms.get(idx - 1);
                const diff = val - prevVal;
                const diffItem = createElement('div', { className: 'text-mono text-sm' });
                diffItem.textContent = `a${this.subscript(idx)} - a${this.subscript(idx - 1)} = ${diff >= 0 ? '+' : ''}${diff}`;
                diffCol.appendChild(diffItem);
            });

            if (consecutiveTerms.length === 0) {
                const noDiff = createElement('div', {
                    className: 'text-mono text-xs',
                    style: 'color: var(--color-text-tertiary);'
                });
                noDiff.textContent = 'Need consecutive terms';
                diffCol.appendChild(noDiff);
            }

            analysisContent.appendChild(diffCol);

            analysisBox.appendChild(analysisContent);
            this.container.appendChild(analysisBox);
        }

        // Guess history
        if (this.guessHistory.length > 0) {
            const historyBox = createElement('div', { className: 'game-box mb-4' });
            const historyHeader = createElement('div', { className: 'game-box-header' });
            historyHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: `GUESSES (${this.guessHistory.length}/${this.config.maxGuesses})`
            }));
            historyBox.appendChild(historyHeader);

            const historyContent = createElement('div', { className: 'flex flex-col gap-2' });

            this.guessHistory.forEach((g, i) => {
                const row = createElement('div', {
                    className: 'flex justify-between items-center',
                    style: `
                        padding: 8px 12px;
                        background: var(--color-surface);
                        border-radius: 4px;
                        border-left: 3px solid ${g.correct ? 'var(--color-success)' : 'var(--color-error)'};
                    `
                });

                const coeffDisplay = createElement('span', { className: 'text-mono' });
                coeffDisplay.textContent = `[${g.coeffs[0]}, ${g.coeffs[1]}]`;

                const resultDisplay = createElement('span', {
                    className: 'text-mono',
                    style: `color: ${g.correct ? 'var(--color-success)' : 'var(--color-error)'};`
                });
                resultDisplay.textContent = g.correct ? 'CORRECT' : 'WRONG';

                row.appendChild(coeffDisplay);
                row.appendChild(resultDisplay);
                historyContent.appendChild(row);
            });

            historyBox.appendChild(historyContent);
            this.container.appendChild(historyBox);
        }

        // Status
        const statusBox = createElement('div', { className: 'game-box mb-4' });
        const statusContent = createElement('div', {
            className: 'flex justify-around',
            style: 'padding: var(--space-3) 0;'
        });

        statusContent.innerHTML = `
            <div class="text-center">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">PROBES</div>
                <div class="text-mono" style="font-size: 1.25rem;">${this.probes.length}/${this.config.maxProbes}</div>
            </div>
            <div class="text-center">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">GUESSES</div>
                <div class="text-mono" style="font-size: 1.25rem;">${this.guessHistory.length}/${this.config.maxGuesses}</div>
            </div>
        `;

        statusBox.appendChild(statusContent);
        this.container.appendChild(statusBox);

        // Game result
        if (this.gameOver) {
            const resultBox = createElement('div', {
                className: 'game-box mt-4',
                style: this.won
                    ? 'border-color: var(--color-success);'
                    : 'border-color: var(--color-error);'
            });

            const resultText = createElement('div', {
                className: 'text-center',
                style: 'padding: var(--space-4);'
            });

            if (this.won) {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">Solved!</div>
                    <div class="text-mono" style="font-size: 1.25rem; color: var(--color-success);">
                        aₙ = ${this.coeffs[0]}·aₙ₋₁ + ${this.coeffs[1]}·aₙ₋₂
                    </div>
                    <div style="color: var(--color-text-secondary); margin-top: 8px;">
                        Found in ${this.probes.length} probes
                    </div>
                `;
            } else {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Out of guesses</div>
                    <div style="color: var(--color-text-secondary);">
                        The recurrence was:
                    </div>
                    <div class="text-mono" style="font-size: 1.25rem; color: var(--color-success); margin-top: 4px;">
                        aₙ = ${this.coeffs[0]}·aₙ₋₁ + ${this.coeffs[1]}·aₙ₋₂
                    </div>
                `;
            }

            resultBox.appendChild(resultText);
            this.container.appendChild(resultBox);
        }
    }

    subscript(n) {
        const subscripts = '₀₁₂₃₄₅₆₇₈₉';
        return String(n).split('').map(d => subscripts[parseInt(d)]).join('');
    }

    renderControls() {
        this.controls.innerHTML = '';

        if (this.gameOver) return;

        const controlGroup = createElement('div', { className: 'flex flex-col gap-4' });

        // Probe section
        if (this.probes.length < this.config.maxProbes) {
            const probeSection = createElement('div', { className: 'flex flex-col gap-2' });

            const probeLabel = createElement('div', {
                className: 'text-mono text-xs',
                style: 'color: var(--color-text-tertiary);'
            });
            probeLabel.textContent = `PROBE TERM (${this.config.maxProbes - this.probes.length} remaining)`;
            probeSection.appendChild(probeLabel);

            const probeRow = createElement('div', { className: 'flex gap-2' });

            const probeInput = createElement('input', {
                type: 'number',
                className: 'game-input',
                placeholder: 'Position (e.g., 5)',
                min: this.config.initialTerms.toString(),
                style: 'flex: 1;'
            });

            const probeBtn = createElement('button', {
                className: 'game-submit',
                textContent: 'PROBE',
                style: 'width: auto; padding: 0 24px; background: var(--color-surface); border: 2px solid var(--color-accent); color: var(--color-accent);'
            });

            probeBtn.addEventListener('click', () => {
                const n = parseInt(probeInput.value, 10);
                if (!isNaN(n) && n >= this.config.initialTerms) {
                    this.probeTermAt(n);
                    probeInput.value = '';
                }
            });

            probeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const n = parseInt(probeInput.value, 10);
                    if (!isNaN(n) && n >= this.config.initialTerms) {
                        this.probeTermAt(n);
                        probeInput.value = '';
                    }
                }
            });

            probeRow.appendChild(probeInput);
            probeRow.appendChild(probeBtn);
            probeSection.appendChild(probeRow);

            controlGroup.appendChild(probeSection);
        }

        // Divider
        const divider = createElement('div', {
            style: 'text-align: center; color: var(--color-text-tertiary); font-size: 0.75rem;'
        });
        divider.textContent = '— OR —';
        controlGroup.appendChild(divider);

        // Guess section
        const guessSection = createElement('div', { className: 'flex flex-col gap-2' });

        const guessLabel = createElement('div', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-tertiary);'
        });
        guessLabel.textContent = `GUESS COEFFICIENTS [c₁, c₂] (${this.config.maxGuesses - this.guessHistory.length} remaining)`;
        guessSection.appendChild(guessLabel);

        const guessRow = createElement('div', { className: 'flex gap-2 items-center' });

        const c1Input = createElement('input', {
            type: 'number',
            className: 'game-input',
            placeholder: 'c₁',
            style: 'width: 80px; text-align: center;',
            min: this.config.coeffMin.toString(),
            max: this.config.coeffMax.toString()
        });

        const c2Input = createElement('input', {
            type: 'number',
            className: 'game-input',
            placeholder: 'c₂',
            style: 'width: 80px; text-align: center;',
            min: this.config.coeffMin.toString(),
            max: this.config.coeffMax.toString()
        });

        const guessBtn = createElement('button', {
            className: 'game-submit',
            textContent: 'GUESS',
            style: 'flex: 1;'
        });

        const doGuess = () => {
            const c1 = parseInt(c1Input.value, 10);
            const c2 = parseInt(c2Input.value, 10);
            if (!isNaN(c1) && !isNaN(c2)) {
                this.submitGuess(c1, c2);
                c1Input.value = '';
                c2Input.value = '';
            }
        };

        guessBtn.addEventListener('click', doGuess);
        c2Input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doGuess();
        });

        guessRow.appendChild(c1Input);
        guessRow.appendChild(createElement('span', {
            style: 'color: var(--color-text-tertiary);',
            textContent: ','
        }));
        guessRow.appendChild(c2Input);
        guessRow.appendChild(guessBtn);
        guessSection.appendChild(guessRow);

        // Range hint
        const rangeHint = createElement('div', {
            className: 'text-mono text-xs text-center',
            style: 'color: var(--color-text-tertiary);'
        });
        rangeHint.textContent = `Coefficients are integers from ${this.config.coeffMin} to ${this.config.coeffMax}`;
        guessSection.appendChild(rangeHint);

        controlGroup.appendChild(guessSection);

        this.controls.appendChild(controlGroup);
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();
        const initialSeq = Array.from({ length: this.config.initialTerms }, (_, i) =>
            this.knownTerms.get(i)
        ).join(', ');

        const shareText = `Recurrence #${puzzleNumber}\nInitial: ${initialSeq}...\nProbes: ${this.probes.length}/${this.config.maxProbes}\n${this.won ? `Found: [${this.coeffs.join(', ')}]` : `X - Answer: [${this.coeffs.join(', ')}]`}`;

        resultDiv.textContent = shareText;

        shareBtn.onclick = () => {
            navigator.clipboard.writeText(shareText).then(() => {
                shareBtn.textContent = 'COPIED!';
                setTimeout(() => shareBtn.textContent = 'COPY RESULT', 2000);
            });
        };
    }

    renderSettingsModal() {
        const modal = document.getElementById('settings-modal');
        const body = document.getElementById('settings-body');

        const hasProgress = (this.probes.length > 0 || this.guessHistory.length > 0) && !this.gameOver;

        body.innerHTML = `
            <div class="settings-section">
                <h4 style="margin-bottom: 12px; color: var(--color-text-secondary);">DIFFICULTY</h4>
                <div class="difficulty-options" style="display: flex; flex-direction: column; gap: 8px;">
                    <button class="difficulty-btn ${this.difficulty === 'standard' ? 'active' : ''}" data-difficulty="standard" style="
                        padding: 12px 16px;
                        background: ${this.difficulty === 'standard' ? 'var(--color-accent)' : 'var(--color-surface)'};
                        border: 2px solid ${this.difficulty === 'standard' ? 'var(--color-accent)' : 'var(--color-border)'};
                        border-radius: 8px;
                        color: ${this.difficulty === 'standard' ? 'white' : 'var(--color-text)'};
                        cursor: pointer;
                        text-align: left;
                    ">
                        <div style="font-family: var(--font-mono); font-weight: 600;">STANDARD</div>
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">Coeffs [-3,3], 5 probes, 3 guesses</div>
                    </button>
                    <button class="difficulty-btn ${this.difficulty === 'hard' ? 'active' : ''}" data-difficulty="hard" style="
                        padding: 12px 16px;
                        background: ${this.difficulty === 'hard' ? 'var(--color-accent)' : 'var(--color-surface)'};
                        border: 2px solid ${this.difficulty === 'hard' ? 'var(--color-accent)' : 'var(--color-border)'};
                        border-radius: 8px;
                        color: ${this.difficulty === 'hard' ? 'white' : 'var(--color-text)'};
                        cursor: pointer;
                        text-align: left;
                    ">
                        <div style="font-family: var(--font-mono); font-weight: 600;">HARD</div>
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">Coeffs [-5,5], 4 probes, 2 guesses</div>
                    </button>
                </div>
                ${hasProgress ? '<p style="margin-top: 12px; font-size: 0.8rem; color: var(--color-warning);">⚠️ Changing difficulty will reset your current game</p>' : ''}
            </div>
        `;

        body.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const newDifficulty = btn.dataset.difficulty;
                if (newDifficulty !== this.difficulty) {
                    this.setDifficulty(newDifficulty);
                    modal.classList.add('hidden');
                }
            });
        });

        modal.classList.remove('hidden');
    }

    setDifficulty(mode) {
        this.difficulty = mode;
        this.config = DIFFICULTY[mode];

        const gameModeEl = document.getElementById('game-mode');
        if (gameModeEl) {
            gameModeEl.textContent = mode.toUpperCase();
        }

        // Reset game state
        this.probes = [];
        this.guessHistory = [];
        this.gameOver = false;
        this.won = false;

        this.init();
        this.shareSection.classList.add('hidden');
    }
}
