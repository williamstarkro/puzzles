/**
 * Cipher - The Noisy Channel Game
 * Recover a hidden 5-letter word from corrupted "intercepts".
 * Intercepts and guesses share one action budget: an intercept is a noisy
 * sample, a guess is an exact positional test. Spend wisely.
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';
import { WORD_LIST } from '../utils/words.js';

const WORD_SET = new Set(WORD_LIST);

const DIFFICULTY = {
    standard: {
        noiseLevel: 0.30,
        minCorruptions: 2,      // Guarantee at least 2 corrupted positions
        budget: 7               // Total actions: intercepts + guesses
    },
    hard: {
        noiseLevel: 0.40,
        minCorruptions: 3,      // Guarantee at least 3 corrupted positions
        budget: 6
    }
};

export class CipherGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];
        this.intercepts = [];
        this.guesses = [];          // { word, greens: [bool x5] }
        this.gameOver = false;
        this.won = false;

        this.init();
    }

    budgetLeft() {
        return this.config.budget - this.intercepts.length - this.guesses.length;
    }

    init() {
        const rng = gameEngine.getRNG();

        // Select target word
        this.target = rng.choice(WORD_LIST);
        this.rng = rng;

        this.render();
    }

    generateIntercept() {
        const intercept = [...this.target];
        const corrupted = new Set();

        // Guarantee minCorruptions positions are corrupted
        const positions = [0, 1, 2, 3, 4];
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(this.rng.next() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        for (let i = 0; i < this.config.minCorruptions; i++) {
            const pos = positions[i];
            let randomChar;
            do {
                randomChar = String.fromCharCode(65 + Math.floor(this.rng.next() * 26));
            } while (randomChar === this.target[pos]);
            intercept[pos] = randomChar;
            corrupted.add(pos);
        }

        // Additional random corruptions at remaining positions
        for (let i = 0; i < 5; i++) {
            if (!corrupted.has(i) && this.rng.next() < this.config.noiseLevel) {
                let corruptChar;
                do {
                    corruptChar = String.fromCharCode(65 + Math.floor(this.rng.next() * 26));
                } while (corruptChar === this.target[i]);
                intercept[i] = corruptChar;
            }
        }

        return intercept.join('');
    }

    requestIntercept() {
        if (this.gameOver) return;
        // The last action is always reserved for a guess
        if (this.budgetLeft() <= 1) return;

        const intercept = this.generateIntercept();
        this.intercepts.push(intercept);

        this.render();
    }

    getConsensus() {
        if (this.intercepts.length === 0) return null;

        const consensus = [];
        for (let i = 0; i < 5; i++) {
            const counts = {};
            for (const intercept of this.intercepts) {
                const char = intercept[i];
                counts[char] = (counts[char] || 0) + 1;
            }

            // Find most common letter
            let maxCount = 0;
            let maxChar = '?';
            for (const [char, count] of Object.entries(counts)) {
                if (count > maxCount) {
                    maxCount = count;
                    maxChar = char;
                }
            }

            const confidence = maxCount / this.intercepts.length;
            consensus.push({
                char: maxChar,
                count: maxCount,
                total: this.intercepts.length,
                confidence
            });
        }

        return consensus;
    }

    submitGuess(guess) {
        if (this.gameOver) return;
        if (this.budgetLeft() <= 0) return;

        const normalized = guess.toUpperCase().trim();
        if (normalized.length !== 5) {
            this.showError('Enter a 5-letter word');
            return;
        }
        if (!WORD_SET.has(normalized)) {
            this.showError('Not in word list');
            return;
        }

        const greens = [...normalized].map((ch, i) => ch === this.target[i]);
        this.guesses.push({ word: normalized, greens });

        if (normalized === this.target) {
            this.won = true;
            this.gameOver = true;
            gameEngine.recordResult('cipher', true, this.intercepts.length + this.guesses.length);
            gameEngine.markCompleted('cipher');
        } else if (this.budgetLeft() <= 0) {
            this.gameOver = true;
            gameEngine.recordResult('cipher', false);
            gameEngine.markCompleted('cipher');
        }

        this.render();

        if (this.gameOver) {
            this.showShareSection();
        }
    }

    showError(message) {
        const input = this.controls.querySelector('.game-input');
        if (input) {
            input.classList.add('animate-shake');
            setTimeout(() => input.classList.remove('animate-shake'), 300);
        }
    }

    render() {
        this.renderGame();
        this.renderControls();
    }

    renderGame() {
        this.container.innerHTML = '';

        // Status bar
        const statusBox = createElement('div', { className: 'game-box mb-4' });
        const statusHeader = createElement('div', { className: 'game-box-header' });
        statusHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: 'SIGNAL STATUS'
        }));
        statusHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-secondary);',
            textContent: `Noise: ${Math.round(this.config.noiseLevel * 100)}%`
        }));
        statusBox.appendChild(statusHeader);

        const statusContent = createElement('div', {
            className: 'flex justify-between items-center',
            style: 'padding-top: var(--space-3);'
        });

        statusContent.innerHTML = `
            <div class="text-center">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">ACTIONS LEFT</div>
                <div class="text-mono" style="font-size: 1.5rem; color: ${this.budgetLeft() <= 2 ? 'var(--color-warning)' : 'var(--color-text)'};">${this.budgetLeft()}/${this.config.budget}</div>
            </div>
            <div class="text-center">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">INTERCEPTS</div>
                <div class="text-mono" style="font-size: 1.5rem;">${this.intercepts.length}</div>
            </div>
            <div class="text-center">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">GUESSES</div>
                <div class="text-mono" style="font-size: 1.5rem;">${this.guesses.length}</div>
            </div>
        `;

        statusBox.appendChild(statusContent);
        this.container.appendChild(statusBox);

        // Intercepts display
        if (this.intercepts.length > 0) {
            const interceptsBox = createElement('div', { className: 'game-box mb-4' });
            const interceptsHeader = createElement('div', { className: 'game-box-header' });
            interceptsHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'INTERCEPTED SIGNALS'
            }));
            interceptsBox.appendChild(interceptsHeader);

            const interceptDisplay = createElement('div', { className: 'intercept-display' });

            this.intercepts.forEach((intercept, idx) => {
                const row = createElement('div', { className: 'intercept-row' });

                // Intercept number
                const numLabel = createElement('span', {
                    className: 'text-mono text-xs',
                    style: 'color: var(--color-text-tertiary); width: 24px; text-align: right; margin-right: 8px; line-height: 44px;'
                });
                numLabel.textContent = `${idx + 1}`;
                row.appendChild(numLabel);

                // Letters
                for (let i = 0; i < 5; i++) {
                    const cell = createElement('div', { className: 'intercept-letter' });
                    cell.textContent = intercept[i];
                    row.appendChild(cell);
                }

                interceptDisplay.appendChild(row);
            });

            interceptsBox.appendChild(interceptDisplay);
            this.container.appendChild(interceptsBox);
        }

        // Consensus display
        const consensus = this.getConsensus();
        if (consensus) {
            const consensusBox = createElement('div', { className: 'game-box mb-4' });
            const consensusHeader = createElement('div', { className: 'game-box-header' });
            consensusHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'CONSENSUS ANALYSIS'
            }));
            consensusBox.appendChild(consensusHeader);

            const consensusRow = createElement('div', {
                className: 'flex gap-2 justify-center',
                style: 'padding: var(--space-3) 0;'
            });

            consensus.forEach(pos => {
                let className = 'intercept-letter';
                if (pos.confidence >= 0.7) {
                    className += ' confident';
                } else if (pos.confidence >= 0.4) {
                    className += ' uncertain';
                } else {
                    className += ' noisy';
                }

                const cell = createElement('div', { className });
                cell.textContent = pos.char;
                consensusRow.appendChild(cell);
            });

            consensusBox.appendChild(consensusRow);

            // Confidence legend
            const legend = createElement('div', {
                className: 'flex gap-4 justify-center text-mono text-xs',
                style: 'color: var(--color-text-tertiary); padding-top: var(--space-2);'
            });
            legend.innerHTML = `
                <span><span style="color: var(--color-success);">■</span> ≥70%</span>
                <span><span style="color: var(--color-warning);">■</span> 40-69%</span>
                <span><span style="color: var(--color-error);">■</span> <40%</span>
            `;
            consensusBox.appendChild(legend);

            this.container.appendChild(consensusBox);
        }

        // Guess history with exact positional feedback
        if (this.guesses.length > 0) {
            const guessBox = createElement('div', { className: 'game-box mb-4' });
            const guessHeader = createElement('div', { className: 'game-box-header' });
            guessHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'TRANSMISSION TESTS'
            }));
            guessHeader.appendChild(createElement('span', {
                className: 'text-mono text-xs',
                style: 'color: var(--color-text-tertiary);',
                textContent: 'green = confirmed position'
            }));
            guessBox.appendChild(guessHeader);

            const guessDisplay = createElement('div', { className: 'intercept-display' });
            this.guesses.forEach((g, idx) => {
                const row = createElement('div', { className: 'intercept-row' });
                const numLabel = createElement('span', {
                    className: 'text-mono text-xs',
                    style: 'color: var(--color-text-tertiary); width: 24px; text-align: right; margin-right: 8px; line-height: 44px;'
                });
                numLabel.textContent = `${idx + 1}`;
                row.appendChild(numLabel);

                for (let i = 0; i < 5; i++) {
                    const cell = createElement('div', {
                        className: 'intercept-letter',
                        style: g.greens[i]
                            ? 'background: rgba(76, 175, 80, 0.25); border-color: var(--color-success); color: var(--color-success);'
                            : 'opacity: 0.5;'
                    });
                    cell.textContent = g.word[i];
                    row.appendChild(cell);
                }
                guessDisplay.appendChild(row);
            });

            guessBox.appendChild(guessDisplay);
            this.container.appendChild(guessBox);
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
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">Decoded!</div>
                    <div class="text-mono" style="font-size: 1.5rem; color: var(--color-success);">${this.target}</div>
                    <div style="color: var(--color-text-secondary); margin-top: 8px;">
                        Used ${this.intercepts.length} intercepts
                    </div>
                `;
            } else {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Signal lost</div>
                    <div style="color: var(--color-text-secondary); margin-top: 4px;">
                        The word was: <span class="text-mono" style="color: var(--color-success);">${this.target}</span>
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

        // Request intercept button (last action is reserved for a guess)
        if (this.budgetLeft() > 1) {
            const interceptBtn = createElement('button', {
                className: 'game-submit',
                textContent: 'REQUEST INTERCEPT (−1 action)',
                style: 'background: var(--color-surface); border: 2px solid var(--color-accent); color: var(--color-accent);'
            });
            interceptBtn.addEventListener('click', () => this.requestIntercept());
            controlGroup.appendChild(interceptBtn);
        } else {
            const lastAction = createElement('div', {
                className: 'text-mono text-xs text-center',
                style: 'color: var(--color-warning);'
            });
            lastAction.textContent = 'LAST ACTION — make it count';
            controlGroup.appendChild(lastAction);
        }

        // Guess section
        if (this.intercepts.length > 0) {
            const divider = createElement('div', {
                style: 'text-align: center; color: var(--color-text-tertiary); font-size: 0.75rem;'
            });
            divider.textContent = '— OR GUESS (−1 action, wrong guesses reveal correct positions) —';
            controlGroup.appendChild(divider);

            const inputRow = createElement('div', { className: 'flex gap-3' });

            const input = createElement('input', {
                type: 'text',
                className: 'game-input',
                placeholder: 'Enter your guess',
                maxLength: '5',
                style: 'flex: 1; text-transform: uppercase;'
            });

            const submitBtn = createElement('button', {
                className: 'game-submit',
                textContent: 'SUBMIT',
                style: 'width: auto; padding: 0 24px;'
            });

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitGuess(input.value);
                }
            });

            submitBtn.addEventListener('click', () => {
                this.submitGuess(input.value);
            });

            inputRow.appendChild(input);
            inputRow.appendChild(submitBtn);
            controlGroup.appendChild(inputRow);
        }

        this.controls.appendChild(controlGroup);
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();
        const consensus = this.getConsensus();
        const consensusStr = consensus
            ? consensus.map(p => p.confidence >= 0.7 ? '🟩' : p.confidence >= 0.4 ? '🟨' : '🟥').join('')
            : '';

        const guessTrail = this.guesses
            .map(g => g.greens.map(x => x ? '🟩' : '⬛').join(''))
            .join('\n');
        const shareText = `Cipher #${puzzleNumber} 📡\nNoise: ${Math.round(this.config.noiseLevel * 100)}% · ${this.intercepts.length} intercepts, ${this.guesses.length} guesses\n${consensusStr}${guessTrail ? '\n' + guessTrail : ''}\n${this.won ? 'Decoded!' : 'Signal lost'}`;

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

        const hasProgress = this.intercepts.length > 0 && !this.gameOver;

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
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">30% noise, 2+ corruptions, 7 actions</div>
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
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">40% noise, 3+ corruptions, 6 actions</div>
                    </button>
                </div>
                ${hasProgress ? '<p style="margin-top: 12px; font-size: 0.8rem; color: var(--color-warning);">⚠️ Changing difficulty will reset your current game</p>' : ''}
            </div>
        `;

        // Add click handlers
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

        // Update the mode display
        const gameModeEl = document.getElementById('game-mode');
        if (gameModeEl) {
            gameModeEl.textContent = mode.toUpperCase();
        }

        // Reset game state
        this.intercepts = [];
        this.guesses = [];
        this.gameOver = false;
        this.won = false;

        // Reinitialize with same seed (same daily puzzle, different difficulty)
        this.init();

        // Hide share section if visible
        this.shareSection.classList.add('hidden');
    }
}
