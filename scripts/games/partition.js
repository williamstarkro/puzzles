/**
 * Partition - The Integer Partition Game
 * Deduce a hidden integer partition using Wordle-style feedback on parts.
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';
import { generatePartitions, partitionCount } from '../utils/math-helpers.js';

const DIFFICULTY = {
    standard: {
        n: 20,
        maxGuesses: 6
    },
    hard: {
        n: 25,
        maxGuesses: 6
    }
};

export class PartitionGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];
        this.guesses = [];
        this.feedback = [];
        this.gameOver = false;
        this.won = false;
        this.currentParts = [];

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();

        // Generate all partitions and pick one
        const partitions = generatePartitions(this.config.n);
        this.target = rng.choice(partitions);
        this.partitionCount = partitions.length;

        this.render();
    }

    computeFeedback(guess) {
        const feedback = [];
        const targetCounts = {};
        const guessCounts = {};

        // Count parts in target
        for (const part of this.target) {
            targetCounts[part] = (targetCounts[part] || 0) + 1;
        }

        // First pass: mark greens (exact position matches)
        const maxLen = Math.max(guess.length, this.target.length);
        for (let i = 0; i < guess.length; i++) {
            if (i < this.target.length && guess[i] === this.target[i]) {
                feedback[i] = 'correct';
                targetCounts[guess[i]]--;
            } else {
                feedback[i] = null;
            }
        }

        // Second pass: mark yellows and grays
        for (let i = 0; i < guess.length; i++) {
            if (feedback[i] !== null) continue;

            const part = guess[i];
            if (targetCounts[part] && targetCounts[part] > 0) {
                feedback[i] = 'present';
                targetCounts[part]--;
            } else {
                feedback[i] = 'absent';
            }
        }

        return feedback;
    }

    submitGuess() {
        if (this.gameOver) return;
        if (this.currentParts.length === 0) return;

        // Validate sum
        const sum = this.currentParts.reduce((a, b) => a + b, 0);
        if (sum !== this.config.n) {
            this.showError(`Sum must equal ${this.config.n} (currently ${sum})`);
            return;
        }

        // Sort descending
        const guess = [...this.currentParts].sort((a, b) => b - a);
        const feedback = this.computeFeedback(guess);

        this.guesses.push(guess);
        this.feedback.push(feedback);

        // Check win
        if (guess.length === this.target.length &&
            guess.every((part, i) => part === this.target[i])) {
            this.won = true;
            this.gameOver = true;
            gameEngine.recordResult('partition', true, this.guesses.length);
            gameEngine.markCompleted('partition');
        } else if (this.guesses.length >= this.config.maxGuesses) {
            this.gameOver = true;
            gameEngine.recordResult('partition', false);
            gameEngine.markCompleted('partition');
        }

        this.currentParts = [];
        this.render();

        if (this.gameOver) {
            this.showShareSection();
        }
    }

    addPart(value) {
        if (this.gameOver) return;

        const currentSum = this.currentParts.reduce((a, b) => a + b, 0);
        if (currentSum + value > this.config.n) {
            this.showError(`Cannot exceed ${this.config.n}`);
            return;
        }

        this.currentParts.push(value);
        this.render();
    }

    removePart(index) {
        if (this.gameOver) return;
        this.currentParts.splice(index, 1);
        this.render();
    }

    clearParts() {
        this.currentParts = [];
        this.render();
    }

    showError(message) {
        // Could show a toast notification
        console.warn(message);
    }

    render() {
        this.renderGame();
        this.renderControls();
    }

    renderGame() {
        this.container.innerHTML = '';

        // Target info
        const infoBox = createElement('div', { className: 'game-box mb-4' });
        const infoHeader = createElement('div', { className: 'game-box-header' });
        infoHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: `PARTITION OF ${this.config.n}`
        }));
        infoHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-secondary);',
            textContent: `p(${this.config.n}) = ${this.partitionCount}`
        }));
        infoBox.appendChild(infoHeader);
        this.container.appendChild(infoBox);

        // Feedback grid
        const feedbackBox = createElement('div', { className: 'game-box mb-4' });
        const feedbackHeader = createElement('div', { className: 'game-box-header' });
        feedbackHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: `GUESSES (${this.guesses.length}/${this.config.maxGuesses})`
        }));
        feedbackBox.appendChild(feedbackHeader);

        const feedbackGrid = createElement('div', { className: 'feedback-grid' });

        // Render each guess
        for (let g = 0; g < this.config.maxGuesses; g++) {
            const row = createElement('div', {
                className: 'feedback-row',
                style: 'flex-wrap: wrap; justify-content: flex-start; gap: 4px;'
            });

            if (g < this.guesses.length) {
                const guess = this.guesses[g];
                const fb = this.feedback[g];

                for (let i = 0; i < guess.length; i++) {
                    const cell = createElement('div', {
                        className: `feedback-cell ${fb[i]}`,
                        style: 'width: 40px; height: 40px; font-size: 1rem;'
                    });
                    cell.textContent = guess[i];
                    row.appendChild(cell);
                }

                // Show sum
                const sumLabel = createElement('span', {
                    className: 'text-mono text-xs',
                    style: 'color: var(--color-text-tertiary); margin-left: 8px; line-height: 40px;'
                });
                sumLabel.textContent = `= ${this.config.n}`;
                row.appendChild(sumLabel);
            } else {
                const placeholder = createElement('div', {
                    style: 'height: 40px; display: flex; align-items: center;'
                });
                placeholder.innerHTML = '<span style="color: var(--color-text-tertiary);">—</span>';
                row.appendChild(placeholder);
            }

            feedbackGrid.appendChild(row);
        }

        feedbackBox.appendChild(feedbackGrid);
        this.container.appendChild(feedbackBox);

        // Current partition builder
        if (!this.gameOver) {
            const builderBox = createElement('div', { className: 'game-box' });
            const builderHeader = createElement('div', { className: 'game-box-header' });

            const currentSum = this.currentParts.reduce((a, b) => a + b, 0);
            const remaining = this.config.n - currentSum;

            builderHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'BUILD PARTITION'
            }));
            builderHeader.appendChild(createElement('span', {
                className: 'text-mono text-xs',
                style: `color: ${remaining === 0 ? 'var(--color-success)' : 'var(--color-text-secondary)'};`,
                textContent: `Sum: ${currentSum}/${this.config.n} (${remaining} remaining)`
            }));
            builderBox.appendChild(builderHeader);

            // Current parts display
            const partsDisplay = createElement('div', { className: 'partition-builder' });

            if (this.currentParts.length === 0) {
                partsDisplay.innerHTML = '<span style="color: var(--color-text-tertiary);">Click numbers below to add parts</span>';
            } else {
                const sortedParts = [...this.currentParts].sort((a, b) => b - a);
                sortedParts.forEach((part, idx) => {
                    const partEl = createElement('div', {
                        className: 'partition-part',
                        textContent: part
                    });
                    // Find the actual index in currentParts
                    const actualIdx = this.currentParts.findIndex((p, i) => {
                        return p === part && !this.currentParts.slice(0, i).includes('_marked_' + i);
                    });
                    partEl.addEventListener('click', () => {
                        const removeIdx = this.currentParts.lastIndexOf(part);
                        if (removeIdx !== -1) {
                            this.removePart(removeIdx);
                        }
                    });
                    partsDisplay.appendChild(partEl);
                });

                // Plus symbols between parts
                if (this.currentParts.length > 0) {
                    const eqLabel = createElement('span', {
                        className: 'partition-sum'
                    });
                    eqLabel.textContent = `= ${currentSum}`;
                    partsDisplay.appendChild(eqLabel);
                }
            }

            builderBox.appendChild(partsDisplay);
            this.container.appendChild(builderBox);
        }

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
                    <div class="text-mono" style="color: var(--color-text-secondary);">
                        [${this.target.join(', ')}]
                    </div>
                `;
            } else {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Game Over</div>
                    <div style="color: var(--color-text-secondary);">
                        The answer was: <span class="text-mono">[${this.target.join(', ')}]</span>
                    </div>
                `;
            }

            resultBox.appendChild(resultText);
            this.container.appendChild(resultBox);
        }
    }

    renderControls() {
        this.controls.innerHTML = '';

        if (this.gameOver) return;

        const controlGroup = createElement('div', { className: 'flex flex-col gap-4' });

        // Number pad
        const numPad = createElement('div', {
            className: 'partition-numpad',
            style: 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;'
        });

        const currentSum = this.currentParts.reduce((a, b) => a + b, 0);
        const remaining = this.config.n - currentSum;

        // Add number buttons 1 to min(20, remaining)
        const maxButton = Math.min(this.config.n, remaining);
        for (let i = 1; i <= maxButton && i <= 20; i++) {
            const btn = createElement('button', {
                className: 'btn',
                textContent: i,
                style: `
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    color: var(--color-text);
                    font-family: var(--font-mono);
                    padding: 12px;
                `
            });

            if (i > remaining) {
                btn.disabled = true;
                btn.style.opacity = '0.3';
            } else {
                btn.addEventListener('click', () => this.addPart(i));
            }

            numPad.appendChild(btn);
        }

        controlGroup.appendChild(numPad);

        // Action buttons
        const actionRow = createElement('div', { className: 'flex gap-3' });

        const clearBtn = createElement('button', {
            className: 'btn btn-secondary',
            textContent: 'CLEAR',
            style: 'flex: 1;'
        });
        clearBtn.addEventListener('click', () => this.clearParts());
        actionRow.appendChild(clearBtn);

        const submitBtn = createElement('button', {
            className: 'game-submit',
            textContent: 'SUBMIT',
            style: 'flex: 2;'
        });

        if (remaining !== 0) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
        } else {
            submitBtn.addEventListener('click', () => this.submitGuess());
        }

        actionRow.appendChild(submitBtn);
        controlGroup.appendChild(actionRow);

        this.controls.appendChild(controlGroup);
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();
        const feedbackStr = this.feedback.map(row =>
            row.map(f => f === 'correct' ? '🟩' : f === 'present' ? '🟨' : '⬛').join('')
        ).join('\n');

        const shareText = `Partition #${puzzleNumber} (N=${this.config.n})\n${feedbackStr}\n${this.won ? `Solved in ${this.guesses.length}/${this.config.maxGuesses}!` : 'X/' + this.config.maxGuesses}\n[${this.target.join(',')}]`;

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

        const hasProgress = this.guesses.length > 0 && !this.gameOver;

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
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">N=20 (~627 partitions), 6 guesses</div>
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
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">N=25 (~1958 partitions), 6 guesses</div>
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
        this.guesses = [];
        this.feedback = [];
        this.gameOver = false;
        this.won = false;
        this.currentParts = [];

        this.init();
        this.shareSection.classList.add('hidden');
    }
}
