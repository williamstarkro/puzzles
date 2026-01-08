/**
 * Orbit - The Permutation Composition Game
 * Deduce a hidden permutation by probing with test permutations
 * and observing the cycle type of the composition.
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';

const DIFFICULTY = {
    standard: {
        n: 6,
        queries: 5
    },
    hard: {
        n: 7,
        queries: 5
    }
};

export class OrbitGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];

        // Target permutation (as array where target[i] = where i maps to)
        this.target = null;

        // Game state
        this.queryHistory = [];
        this.currentQuery = null; // Current permutation being built
        this.gameOver = false;
        this.won = false;
        this.guess = null;

        // UI state
        this.buildMode = 'swap'; // 'swap' or 'cycle'
        this.swapSelection = []; // For building swaps

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();
        const n = this.config.n;

        // Generate random permutation
        const arr = Array.from({ length: n }, (_, i) => i);
        this.target = rng.shuffle([...arr]);

        // Initialize current query as identity
        this.currentQuery = Array.from({ length: n }, (_, i) => i);

        this.render();
    }

    // Convert permutation array to cycle notation
    toCycles(perm) {
        const n = perm.length;
        const visited = new Set();
        const cycles = [];

        for (let i = 0; i < n; i++) {
            if (visited.has(i)) continue;

            const cycle = [];
            let j = i;

            while (!visited.has(j)) {
                visited.add(j);
                cycle.push(j);
                j = perm[j];
            }

            if (cycle.length > 1) {
                cycles.push(cycle);
            }
        }

        return cycles;
    }

    // Get cycle type (sorted lengths descending)
    getCycleType(perm) {
        const cycles = this.toCycles(perm);
        const lengths = cycles.map(c => c.length);

        // Add fixed points (1-cycles)
        const fixedPoints = perm.length - lengths.reduce((a, b) => a + b, 0);
        for (let i = 0; i < fixedPoints; i++) {
            lengths.push(1);
        }

        return lengths.sort((a, b) => b - a);
    }

    // Compose two permutations: (tau o sigma)(x) = tau(sigma(x))
    compose(tau, sigma) {
        return sigma.map(i => tau[i]);
    }

    // Check if two permutations are equal
    permsEqual(p1, p2) {
        if (p1.length !== p2.length) return false;
        return p1.every((v, i) => v === p2[i]);
    }

    // Apply a swap (transposition) to the current query
    applySwap(i, j) {
        if (i === j) return;

        const temp = this.currentQuery[i];
        this.currentQuery[i] = this.currentQuery[j];
        this.currentQuery[j] = temp;

        this.render();
    }

    // Reset current query to identity
    resetQuery() {
        this.currentQuery = Array.from({ length: this.config.n }, (_, i) => i);
        this.swapSelection = [];
        this.render();
    }

    // Submit current query
    submitQuery() {
        if (this.gameOver) return;
        if (this.queryHistory.length >= this.config.queries) return;

        // Compute tau o sigma
        const composition = this.compose(this.currentQuery, this.target);
        const cycleType = this.getCycleType(composition);

        this.queryHistory.push({
            tau: [...this.currentQuery],
            cycleType: cycleType
        });

        // Reset for next query (but not after the last query, so player can build their guess)
        if (this.queryHistory.length < this.config.queries) {
            this.currentQuery = Array.from({ length: this.config.n }, (_, i) => i);
            this.swapSelection = [];
        }

        this.render();
    }

    // Submit a guess
    submitGuess() {
        if (this.gameOver) return;

        this.guess = [...this.currentQuery];
        this.won = this.permsEqual(this.currentQuery, this.target);
        this.gameOver = true;

        gameEngine.recordResult('orbit', this.won, this.queryHistory.length);
        gameEngine.markCompleted('orbit');

        this.render();
        this.showShareSection();
    }

    // Format cycle type for display
    formatCycleType(cycleType) {
        return '[' + cycleType.join(',') + ']';
    }

    // Format permutation in cycle notation
    formatPermutation(perm) {
        const cycles = this.toCycles(perm);
        if (cycles.length === 0) return 'id';

        return cycles.map(cycle =>
            '(' + cycle.map(i => i + 1).join(' ') + ')'
        ).join('');
    }

    // Format permutation in two-line notation
    formatTwoLine(perm) {
        const top = Array.from({ length: perm.length }, (_, i) => i + 1);
        const bottom = perm.map(i => i + 1);
        return `[${top.join(',')}]\n[${bottom.join(',')}]`;
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
            textContent: 'ORBIT'
        }));
        statusHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-secondary);',
            textContent: `n = ${this.config.n}, ${this.config.n}! = ${this.factorial(this.config.n)} permutations`
        }));
        statusBox.appendChild(statusHeader);

        // Queries remaining
        const queriesLeft = this.config.queries - this.queryHistory.length;
        const statusContent = createElement('div', { className: 'text-center mt-3' });
        statusContent.innerHTML = `
            <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">QUERIES REMAINING</div>
            <div class="text-mono" style="font-size: 2rem; color: ${queriesLeft === 0 ? 'var(--color-warning)' : 'var(--color-text)'};">${queriesLeft}</div>
        `;
        statusBox.appendChild(statusContent);
        this.container.appendChild(statusBox);

        // Current query builder
        if (!this.gameOver) {
            const builderBox = createElement('div', { className: 'game-box mb-4' });
            const builderHeader = createElement('div', { className: 'game-box-header' });
            const allQueriesUsed = this.queryHistory.length >= this.config.queries;
            builderHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: allQueriesUsed ? 'BUILD YOUR GUESS FOR σ' : 'BUILD YOUR PERMUTATION τ'
            }));
            builderBox.appendChild(builderHeader);

            // Two-line notation display
            const twoLineDisplay = createElement('div', {
                className: 'text-mono text-center mt-3',
                style: 'background: var(--color-bg); padding: 12px; border-radius: 4px; border: 1px solid var(--color-border);'
            });

            const topRow = createElement('div', { style: 'color: var(--color-text-tertiary);' });
            topRow.textContent = Array.from({ length: this.config.n }, (_, i) => i + 1).join('  ');

            const arrowRow = createElement('div', { style: 'color: var(--color-text-tertiary); font-size: 0.8em;' });
            arrowRow.textContent = '↓  '.repeat(this.config.n).trim();

            const bottomRow = createElement('div', { style: 'color: var(--color-accent);' });
            bottomRow.textContent = this.currentQuery.map(i => i + 1).join('  ');

            twoLineDisplay.appendChild(topRow);
            twoLineDisplay.appendChild(arrowRow);
            twoLineDisplay.appendChild(bottomRow);
            builderBox.appendChild(twoLineDisplay);

            // Cycle notation
            const cycleDisplay = createElement('div', {
                className: 'text-mono text-center mt-2',
                style: 'color: var(--color-text-secondary);'
            });
            cycleDisplay.textContent = 'Cycle notation: ' + this.formatPermutation(this.currentQuery);
            builderBox.appendChild(cycleDisplay);

            // Swap builder
            const swapSection = createElement('div', { className: 'mt-4' });
            const swapLabel = createElement('div', {
                className: 'text-mono text-xs mb-2',
                style: 'color: var(--color-text-tertiary);'
            });
            swapLabel.textContent = 'Click two numbers to swap them:';
            swapSection.appendChild(swapLabel);

            const swapButtons = createElement('div', {
                className: 'flex gap-2',
                style: 'justify-content: center; flex-wrap: wrap;'
            });

            for (let i = 0; i < this.config.n; i++) {
                const isSelected = this.swapSelection.includes(i);
                const btn = createElement('button', {
                    className: 'text-mono',
                    style: `
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: ${isSelected ? 'var(--color-accent)' : 'var(--color-surface)'};
                        border: 2px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'};
                        color: ${isSelected ? 'white' : 'var(--color-text)'};
                        cursor: pointer;
                        font-size: 1rem;
                        font-weight: 600;
                    `,
                    textContent: i + 1
                });

                btn.addEventListener('click', () => {
                    if (this.swapSelection.includes(i)) {
                        this.swapSelection = this.swapSelection.filter(x => x !== i);
                    } else {
                        this.swapSelection.push(i);
                        if (this.swapSelection.length === 2) {
                            this.applySwap(this.swapSelection[0], this.swapSelection[1]);
                            this.swapSelection = [];
                        }
                    }
                    this.render();
                });

                swapButtons.appendChild(btn);
            }

            swapSection.appendChild(swapButtons);
            builderBox.appendChild(swapSection);

            this.container.appendChild(builderBox);
        }

        // Query history
        if (this.queryHistory.length > 0) {
            const historyBox = createElement('div', { className: 'game-box mb-4' });
            const historyHeader = createElement('div', { className: 'game-box-header' });
            historyHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'QUERY HISTORY'
            }));
            historyBox.appendChild(historyHeader);

            const historyTable = createElement('table', { className: 'query-history mt-3' });

            const thead = createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>#</th>
                    <th>τ (YOUR QUERY)</th>
                    <th>CYCLE TYPE OF τ∘σ</th>
                </tr>
            `;
            historyTable.appendChild(thead);

            const tbody = createElement('tbody');
            this.queryHistory.forEach((q, idx) => {
                const row = createElement('tr');
                row.innerHTML = `
                    <td style="color: var(--color-text-tertiary);">${idx + 1}</td>
                    <td>${this.formatPermutation(q.tau)}</td>
                    <td style="color: var(--color-accent);">${this.formatCycleType(q.cycleType)}</td>
                `;
                tbody.appendChild(row);
            });

            historyTable.appendChild(tbody);
            historyBox.appendChild(historyTable);
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

            if (this.won) {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">Correct!</div>
                    <div style="color: var(--color-text-secondary);">
                        Found σ = ${this.formatPermutation(this.target)} in ${this.queryHistory.length} queries
                    </div>
                `;
            } else {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Incorrect</div>
                    <div style="color: var(--color-text-secondary);">
                        You guessed: ${this.formatPermutation(this.guess)}
                    </div>
                    <div style="color: var(--color-text-secondary); margin-top: 4px;">
                        The answer was: σ = ${this.formatPermutation(this.target)}
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
        const actionRow = createElement('div', { className: 'flex gap-2' });

        const resetBtn = createElement('button', {
            className: 'game-submit',
            style: 'flex: 1; background: var(--color-surface); border: 2px solid var(--color-border); color: var(--color-text-secondary);',
            textContent: 'RESET TO IDENTITY'
        });
        resetBtn.addEventListener('click', () => this.resetQuery());
        actionRow.appendChild(resetBtn);

        controlGroup.appendChild(actionRow);

        // Submit buttons
        const submitRow = createElement('div', { className: 'flex gap-2' });

        const queryBtn = createElement('button', {
            className: 'game-submit',
            style: `flex: 1; ${this.queryHistory.length >= this.config.queries ? 'opacity: 0.5;' : ''}`,
            textContent: 'SUBMIT QUERY'
        });
        queryBtn.disabled = this.queryHistory.length >= this.config.queries;
        queryBtn.addEventListener('click', () => this.submitQuery());
        submitRow.appendChild(queryBtn);

        const guessBtn = createElement('button', {
            className: 'game-submit',
            style: 'flex: 1; background: var(--color-success);',
            textContent: 'GUESS σ'
        });
        guessBtn.addEventListener('click', () => this.submitGuess());
        submitRow.appendChild(guessBtn);

        controlGroup.appendChild(submitRow);

        // Hint
        const hint = createElement('div', {
            className: 'text-mono text-xs text-center',
            style: 'color: var(--color-text-tertiary);'
        });
        const allQueriesUsed = this.queryHistory.length >= this.config.queries;
        hint.textContent = allQueriesUsed
            ? 'Build your guess using swaps, then click GUESS σ'
            : 'Tip: Query identity first to see σ\'s own cycle type';
        controlGroup.appendChild(hint);

        this.controls.appendChild(controlGroup);
    }

    factorial(n) {
        if (n <= 1) return 1;
        return n * this.factorial(n - 1);
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();

        const cycleTypes = this.queryHistory.map(q => this.formatCycleType(q.cycleType)).join(' → ');

        const shareText = `Orbit #${puzzleNumber} 🔄
n = ${this.config.n}
Queries: ${this.queryHistory.length}/${this.config.queries}
${cycleTypes}
${this.won ? `✅ Found: ${this.formatPermutation(this.target)}` : '❌ Failed'}`;

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

        const hasProgress = this.queryHistory.length > 0 && !this.gameOver;

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
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">n=6 (720 permutations), 5 queries</div>
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
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">n=7 (5040 permutations), 5 queries</div>
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
        this.target = null;
        this.queryHistory = [];
        this.currentQuery = null;
        this.gameOver = false;
        this.won = false;
        this.guess = null;
        this.swapSelection = [];

        this.init();
        this.shareSection.classList.add('hidden');
    }
}
