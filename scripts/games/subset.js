/**
 * Subset - The Set Intersection Game
 * Find a hidden subset by probing with test sets and learning intersection sizes.
 * Query the exact target set to win!
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';

const DIFFICULTY = {
    standard: {
        universeSize: 12,
        targetSize: 4,
        maxQueries: 8
    },
    hard: {
        universeSize: 15,
        targetSize: 5,
        maxQueries: 6
    }
};

export class SubsetGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];
        this.queries = [];          // Array of { query: Set, result: number, isWin: boolean }
        this.gameOver = false;
        this.won = false;
        this.currentSelection = new Set();

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();

        // Generate random target subset
        const universe = Array.from({ length: this.config.universeSize }, (_, i) => i + 1);
        this.target = new Set();

        // Shuffle and pick first targetSize elements
        const shuffled = [...universe];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(rng.next() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        for (let i = 0; i < this.config.targetSize; i++) {
            this.target.add(shuffled[i]);
        }

        // Calculate total possible subsets for display
        this.totalCombinations = this.binomial(this.config.universeSize, this.config.targetSize);

        this.render();
    }

    binomial(n, k) {
        if (k > n) return 0;
        if (k === 0 || k === n) return 1;
        let result = 1;
        for (let i = 0; i < k; i++) {
            result = result * (n - i) / (i + 1);
        }
        return Math.round(result);
    }

    getRemainingQueries() {
        return this.config.maxQueries - this.queries.length;
    }

    toggleElement(element) {
        if (this.gameOver) return;

        if (this.currentSelection.has(element)) {
            this.currentSelection.delete(element);
        } else {
            this.currentSelection.add(element);
        }
        this.render();
    }

    clearSelection() {
        this.currentSelection.clear();
        this.render();
    }

    submitQuery() {
        if (this.gameOver) return;
        if (this.currentSelection.size === 0) return;
        if (this.queries.length >= this.config.maxQueries) return;

        // Calculate intersection
        const intersection = [...this.currentSelection].filter(x => this.target.has(x)).length;

        // Check if this is the exact target
        const isWin = this.currentSelection.size === this.target.size &&
            [...this.currentSelection].every(x => this.target.has(x));

        this.queries.push({
            query: new Set(this.currentSelection),
            result: intersection,
            isWin: isWin
        });

        if (isWin) {
            this.won = true;
            this.gameOver = true;
            gameEngine.recordResult('subset', true, this.queries.length);
            gameEngine.markCompleted('subset');
        } else if (this.queries.length >= this.config.maxQueries) {
            this.gameOver = true;
            gameEngine.recordResult('subset', false);
            gameEngine.markCompleted('subset');
        }

        this.currentSelection.clear();
        this.render();

        if (this.gameOver) {
            this.showShareSection();
        }
    }

    showError(message) {
        this.controls.classList.add('animate-shake');
        setTimeout(() => this.controls.classList.remove('animate-shake'), 300);
    }

    getElementStatus(element) {
        let confirmedIn = false;
        let confirmedOut = false;

        for (const q of this.queries) {
            if (q.query.has(element)) {
                if (q.result === 0) {
                    confirmedOut = true;
                }
                if (q.result === q.query.size && q.query.size === 1) {
                    confirmedIn = true;
                }
            } else {
                if (q.result === this.config.targetSize) {
                    confirmedOut = true;
                }
            }
        }

        if (confirmedIn) return 'in';
        if (confirmedOut) return 'out';
        return 'unknown';
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
            textContent: 'SUBSET HUNT'
        }));
        statusHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-secondary);',
            textContent: `C(${this.config.universeSize},${this.config.targetSize}) = ${this.totalCombinations}`
        }));
        statusBox.appendChild(statusHeader);

        const statusContent = createElement('div', {
            className: 'flex justify-between items-center',
            style: 'padding-top: var(--space-3); gap: 16px;'
        });

        statusContent.innerHTML = `
            <div class="text-center" style="flex: 1; min-width: 0;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">QUERIES</div>
                <div class="text-mono" style="font-size: 1.25rem;">${this.queries.length}/${this.config.maxQueries}</div>
            </div>
            <div class="text-center" style="flex: 1; min-width: 0;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">TARGET</div>
                <div class="text-mono" style="font-size: 1.25rem;">${this.config.targetSize}</div>
            </div>
            <div class="text-center" style="flex: 1; min-width: 0;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">SELECTED</div>
                <div class="text-mono" style="font-size: 1.25rem; color: ${this.currentSelection.size === this.config.targetSize ? 'var(--color-success)' : 'var(--color-text)'};">${this.currentSelection.size}</div>
            </div>
        `;

        statusBox.appendChild(statusContent);
        this.container.appendChild(statusBox);

        // Universe grid
        const universeBox = createElement('div', { className: 'game-box mb-4' });
        const universeHeader = createElement('div', { className: 'game-box-header' });
        universeHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: 'SELECT ELEMENTS TO PROBE'
        }));

        if (this.currentSelection.size > 0) {
            const matchInfo = this.currentSelection.size === this.config.targetSize
                ? '✓ Ready to probe!'
                : `${this.currentSelection.size}/${this.config.targetSize}`;
            universeHeader.appendChild(createElement('span', {
                className: 'text-mono text-xs',
                style: `color: ${this.currentSelection.size === this.config.targetSize ? 'var(--color-success)' : 'var(--color-text-secondary)'};`,
                textContent: matchInfo
            }));
        }

        universeBox.appendChild(universeHeader);

        const universeGrid = createElement('div', {
            style: `
                display: grid;
                grid-template-columns: repeat(${Math.min(6, this.config.universeSize)}, 1fr);
                gap: 8px;
                padding: var(--space-3) 0;
            `
        });

        for (let i = 1; i <= this.config.universeSize; i++) {
            const status = this.getElementStatus(i);
            const isSelected = this.currentSelection.has(i);

            const cell = createElement('button', {
                className: 'subset-cell',
                style: `
                    width: 100%;
                    aspect-ratio: 1;
                    border: 2px solid ${isSelected ? 'var(--color-accent)' : status === 'in' ? 'var(--color-success)' : status === 'out' ? 'var(--color-error)' : 'var(--color-border)'};
                    background: ${isSelected ? 'var(--color-accent)' : 'var(--color-surface)'};
                    color: ${isSelected ? 'white' : status === 'out' ? 'var(--color-text-tertiary)' : 'var(--color-text)'};
                    font-family: var(--font-mono);
                    font-size: 1.25rem;
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    opacity: ${status === 'out' ? '0.5' : '1'};
                `
            });
            cell.textContent = i;
            cell.addEventListener('click', () => this.toggleElement(i));
            universeGrid.appendChild(cell);
        }

        universeBox.appendChild(universeGrid);

        // Legend
        const legend = createElement('div', {
            className: 'flex gap-4 justify-center text-mono text-xs',
            style: 'color: var(--color-text-tertiary); padding-top: var(--space-2);'
        });
        legend.innerHTML = `
            <span><span style="color: var(--color-success);">■</span> Confirmed in</span>
            <span><span style="color: var(--color-error);">■</span> Confirmed out</span>
            <span><span style="color: var(--color-border);">■</span> Unknown</span>
        `;
        universeBox.appendChild(legend);

        this.container.appendChild(universeBox);

        // Query history
        if (this.queries.length > 0) {
            const historyBox = createElement('div', { className: 'game-box mb-4' });
            const historyHeader = createElement('div', { className: 'game-box-header' });
            historyHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'QUERY HISTORY'
            }));
            historyBox.appendChild(historyHeader);

            const historyList = createElement('div', {
                className: 'flex flex-col gap-2',
                style: 'padding-top: var(--space-2);'
            });

            this.queries.forEach((q, idx) => {
                const row = createElement('div', {
                    className: 'flex justify-between items-center',
                    style: `
                        padding: 8px 12px;
                        background: var(--color-surface);
                        border-radius: 4px;
                        border-left: 3px solid ${q.isWin ? 'var(--color-success)' : 'var(--color-accent)'};
                    `
                });

                const queryStr = `{${[...q.query].sort((a, b) => a - b).join(', ')}}`;
                const leftSide = createElement('span', { className: 'text-mono text-sm' });
                leftSide.textContent = queryStr;

                const rightSide = createElement('div', { className: 'flex gap-2 items-center' });

                if (q.isWin) {
                    rightSide.innerHTML = `
                        <span class="text-mono" style="font-size: 1rem; font-weight: bold; color: var(--color-success);">✓ MATCH!</span>
                    `;
                } else {
                    rightSide.innerHTML = `
                        <span class="text-mono text-xs" style="color: var(--color-text-tertiary);">∩ =</span>
                        <span class="text-mono" style="font-size: 1.25rem; font-weight: bold; color: var(--color-accent);">${q.result}</span>
                    `;
                }

                row.appendChild(leftSide);
                row.appendChild(rightSide);
                historyList.appendChild(row);
            });

            historyBox.appendChild(historyList);
            this.container.appendChild(historyBox);
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

            const targetArr = [...this.target].sort((a, b) => a - b);

            if (this.won) {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">Found it!</div>
                    <div class="text-mono" style="font-size: 1.25rem; color: var(--color-success);">{${targetArr.join(', ')}}</div>
                    <div style="color: var(--color-text-secondary); margin-top: 8px;">
                        Solved in ${this.queries.length} ${this.queries.length === 1 ? 'query' : 'queries'}
                    </div>
                `;
            } else {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Out of queries</div>
                    <div style="color: var(--color-text-secondary); margin-top: 4px;">
                        The answer was: <span class="text-mono" style="color: var(--color-success);">{${targetArr.join(', ')}}</span>
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

        const controlGroup = createElement('div', { className: 'flex flex-col gap-3' });

        // Action buttons
        const actionRow = createElement('div', { className: 'flex gap-3' });

        const clearBtn = createElement('button', {
            className: 'btn btn-secondary',
            textContent: 'CLEAR',
            style: 'flex: 1;'
        });
        clearBtn.addEventListener('click', () => this.clearSelection());
        actionRow.appendChild(clearBtn);

        const submitBtn = createElement('button', {
            className: 'game-submit',
            textContent: 'PROBE',
            style: 'flex: 2;'
        });

        if (this.currentSelection.size === 0 || this.queries.length >= this.config.maxQueries) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
        } else {
            submitBtn.addEventListener('click', () => this.submitQuery());
        }
        actionRow.appendChild(submitBtn);

        controlGroup.appendChild(actionRow);

        // Hint text
        const hint = createElement('div', {
            className: 'text-mono text-xs text-center',
            style: 'color: var(--color-text-tertiary);'
        });
        hint.textContent = 'Select elements and probe. Match the target exactly to win!';
        controlGroup.appendChild(hint);

        this.controls.appendChild(controlGroup);
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();
        const queryStr = this.queries.map(q => `🔍${q.query.size}→${q.result}`).join(' ');
        const targetArr = [...this.target].sort((a, b) => a - b);

        const shareText = `Subset #${puzzleNumber}\nQueries: ${this.queries.length}/${this.config.maxQueries}\n${queryStr}\n${this.won ? `Found: {${targetArr.join(',')}}\nSolved!` : 'X'}`;

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

        const hasProgress = this.queries.length > 0 && !this.gameOver;

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
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">12 elements, find 4, 8 queries</div>
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
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">15 elements, find 5, 6 queries</div>
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
        this.queries = [];
        this.gameOver = false;
        this.won = false;
        this.currentSelection = new Set();

        this.init();
        this.shareSection.classList.add('hidden');
    }
}
