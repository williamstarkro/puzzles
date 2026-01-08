/**
 * Bijection - The Hidden Matching Game
 * Discover a hidden bijection between two sets by probing pairs with yes/no queries.
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';

const DIFFICULTY = {
    standard: {
        n: 6,
        maxQueries: 15
    },
    hard: {
        n: 8,
        maxQueries: 20
    }
};

// Labels for sets
const SET_A_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const SET_B_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export class BijectionGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];
        this.queries = [];
        this.gameOver = false;
        this.won = false;

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();
        const n = this.config.n;

        // Generate random bijection: shuffle [0, 1, ..., n-1]
        this.bijection = [];
        const indices = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(rng.next() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        this.bijection = indices;

        // Track what we know: matrix[i][j] = true (match), false (no match), null (unknown)
        this.matrix = Array.from({ length: n }, () => Array(n).fill(null));

        // Track confirmed matches
        this.confirmed = new Array(n).fill(null); // confirmed[i] = j means i -> j is confirmed

        this.render();
    }

    query(i, j) {
        if (this.gameOver) return;
        if (this.queries.length >= this.config.maxQueries) return;
        if (this.matrix[i][j] !== null) return; // Already queried

        const isMatch = this.bijection[i] === j;
        this.matrix[i][j] = isMatch;
        this.queries.push({ i, j, result: isMatch });

        if (isMatch) {
            this.confirmed[i] = j;
            // Eliminate this column for other rows and this row for other columns
            this.propagateConstraints(i, j);
        }

        // Check if we've found all matches
        this.checkWin();

        this.render();

        if (this.gameOver) {
            this.showShareSection();
        }
    }

    propagateConstraints(confirmedRow, confirmedCol) {
        const n = this.config.n;

        // Mark all other cells in this row as false
        for (let j = 0; j < n; j++) {
            if (j !== confirmedCol && this.matrix[confirmedRow][j] === null) {
                this.matrix[confirmedRow][j] = false;
            }
        }

        // Mark all other cells in this column as false
        for (let i = 0; i < n; i++) {
            if (i !== confirmedRow && this.matrix[i][confirmedCol] === null) {
                this.matrix[i][confirmedCol] = false;
            }
        }

        // Check for forced moves (row or column with only one unknown)
        this.findForcedMoves();
    }

    findForcedMoves() {
        const n = this.config.n;
        let changed = true;

        while (changed) {
            changed = false;

            // Check each row
            for (let i = 0; i < n; i++) {
                if (this.confirmed[i] !== null) continue;

                const unknowns = [];
                for (let j = 0; j < n; j++) {
                    if (this.matrix[i][j] === null) unknowns.push(j);
                }

                if (unknowns.length === 1) {
                    // Forced move!
                    const j = unknowns[0];
                    this.matrix[i][j] = true;
                    this.confirmed[i] = j;
                    this.propagateConstraints(i, j);
                    changed = true;
                }
            }

            // Check each column
            for (let j = 0; j < n; j++) {
                // Find if this column is already confirmed
                let colConfirmed = false;
                for (let i = 0; i < n; i++) {
                    if (this.confirmed[i] === j) {
                        colConfirmed = true;
                        break;
                    }
                }
                if (colConfirmed) continue;

                const unknowns = [];
                for (let i = 0; i < n; i++) {
                    if (this.matrix[i][j] === null) unknowns.push(i);
                }

                if (unknowns.length === 1) {
                    const i = unknowns[0];
                    this.matrix[i][j] = true;
                    this.confirmed[i] = j;
                    this.propagateConstraints(i, j);
                    changed = true;
                }
            }
        }
    }

    checkWin() {
        const n = this.config.n;

        // Check if all matches are found
        const allFound = this.confirmed.every(c => c !== null);

        if (allFound) {
            // Verify correctness
            const correct = this.confirmed.every((j, i) => this.bijection[i] === j);
            if (correct) {
                this.won = true;
                this.gameOver = true;
                gameEngine.recordResult('bijection', true, this.queries.length);
                gameEngine.markCompleted('bijection');
            }
        } else if (this.queries.length >= this.config.maxQueries) {
            this.gameOver = true;
            gameEngine.recordResult('bijection', false);
            gameEngine.markCompleted('bijection');
        }
    }

    render() {
        this.renderGame();
        this.renderControls();
    }

    renderGame() {
        this.container.innerHTML = '';
        const n = this.config.n;

        // Status
        const statusBox = createElement('div', { className: 'game-box mb-4' });
        const statusContent = createElement('div', {
            className: 'flex justify-around',
            style: 'padding: var(--space-3) 0;'
        });

        const foundCount = this.confirmed.filter(c => c !== null).length;

        statusContent.innerHTML = `
            <div class="text-center">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">QUERIES</div>
                <div class="text-mono" style="font-size: 1.25rem;">${this.queries.length}/${this.config.maxQueries}</div>
            </div>
            <div class="text-center">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">MATCHES FOUND</div>
                <div class="text-mono" style="font-size: 1.25rem;">${foundCount}/${n}</div>
            </div>
        `;

        statusBox.appendChild(statusContent);
        this.container.appendChild(statusBox);

        // Matrix display
        const matrixBox = createElement('div', { className: 'game-box mb-4' });
        const matrixHeader = createElement('div', { className: 'game-box-header' });
        matrixHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: 'BIJECTION MATRIX'
        }));
        matrixBox.appendChild(matrixHeader);

        const matrixContainer = createElement('div', {
            style: 'overflow-x: auto; padding: var(--space-3) 0;'
        });

        const table = createElement('table', {
            style: 'margin: 0 auto; border-collapse: collapse;'
        });

        // Header row
        const headerRow = createElement('tr');
        headerRow.appendChild(createElement('th', {
            style: 'width: 40px; height: 40px;'
        }));

        for (let j = 0; j < n; j++) {
            const th = createElement('th', {
                className: 'text-mono',
                style: 'width: 40px; height: 40px; color: var(--color-accent);'
            });
            th.textContent = SET_B_LABELS[j];
            headerRow.appendChild(th);
        }
        table.appendChild(headerRow);

        // Data rows
        for (let i = 0; i < n; i++) {
            const row = createElement('tr');

            // Row label
            const rowLabel = createElement('th', {
                className: 'text-mono',
                style: 'width: 40px; height: 40px; color: var(--color-accent);'
            });
            rowLabel.textContent = SET_A_LABELS[i];
            row.appendChild(rowLabel);

            for (let j = 0; j < n; j++) {
                const cell = createElement('td', {
                    style: `
                        width: 40px;
                        height: 40px;
                        text-align: center;
                        border: 1px solid var(--color-border);
                        cursor: ${this.matrix[i][j] === null && !this.gameOver ? 'pointer' : 'default'};
                        background: ${this.getCellBackground(i, j)};
                        transition: background 0.15s;
                    `
                });

                cell.textContent = this.getCellContent(i, j);

                if (this.matrix[i][j] === null && !this.gameOver) {
                    cell.addEventListener('click', () => this.query(i, j));
                    cell.addEventListener('mouseenter', () => {
                        cell.style.background = 'var(--color-accent-dim)';
                    });
                    cell.addEventListener('mouseleave', () => {
                        cell.style.background = this.getCellBackground(i, j);
                    });
                }

                row.appendChild(cell);
            }

            table.appendChild(row);
        }

        matrixContainer.appendChild(table);
        matrixBox.appendChild(matrixContainer);
        this.container.appendChild(matrixBox);

        // Query history
        if (this.queries.length > 0) {
            const historyBox = createElement('div', { className: 'game-box mb-4' });
            const historyHeader = createElement('div', { className: 'game-box-header' });
            historyHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'QUERY HISTORY'
            }));
            historyBox.appendChild(historyHeader);

            const historyContent = createElement('div', {
                className: 'flex gap-2 flex-wrap',
                style: 'padding: var(--space-3) 0;'
            });

            this.queries.forEach(q => {
                const tag = createElement('span', {
                    className: 'text-mono text-sm',
                    style: `
                        padding: 4px 8px;
                        border-radius: 4px;
                        background: ${q.result ? 'var(--color-success)' : 'var(--color-surface)'};
                        color: ${q.result ? 'white' : 'var(--color-text-secondary)'};
                        border: 1px solid ${q.result ? 'var(--color-success)' : 'var(--color-border)'};
                    `
                });
                tag.textContent = `${SET_A_LABELS[q.i]}→${SET_B_LABELS[q.j]}`;
                historyContent.appendChild(tag);
            });

            historyBox.appendChild(historyContent);
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
                const matchStr = this.bijection.map((j, i) =>
                    `${SET_A_LABELS[i]}→${SET_B_LABELS[j]}`
                ).join(', ');

                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">Solved!</div>
                    <div class="text-mono text-sm" style="color: var(--color-text-secondary);">
                        ${matchStr}
                    </div>
                    <div style="color: var(--color-text-secondary); margin-top: 8px;">
                        Found in ${this.queries.length} queries
                    </div>
                `;
            } else {
                const matchStr = this.bijection.map((j, i) =>
                    `${SET_A_LABELS[i]}→${SET_B_LABELS[j]}`
                ).join(', ');

                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Out of queries</div>
                    <div style="color: var(--color-text-secondary);">
                        The bijection was:
                    </div>
                    <div class="text-mono text-sm" style="color: var(--color-success); margin-top: 4px;">
                        ${matchStr}
                    </div>
                `;
            }

            resultBox.appendChild(resultText);
            this.container.appendChild(resultBox);
        }
    }

    getCellBackground(i, j) {
        if (this.matrix[i][j] === true) return 'var(--color-success)';
        if (this.matrix[i][j] === false) return 'var(--color-surface)';
        return 'var(--color-bg)';
    }

    getCellContent(i, j) {
        if (this.matrix[i][j] === true) return '✓';
        if (this.matrix[i][j] === false) return '✗';
        return '?';
    }

    renderControls() {
        this.controls.innerHTML = '';

        if (this.gameOver) return;

        const hint = createElement('div', {
            className: 'text-mono text-sm text-center',
            style: 'color: var(--color-text-tertiary);'
        });
        hint.textContent = 'Click a cell to query: Does row map to column?';
        this.controls.appendChild(hint);
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();
        const yesCount = this.queries.filter(q => q.result).length;
        const noCount = this.queries.length - yesCount;

        const shareText = `Bijection #${puzzleNumber}\nSize: ${this.config.n}×${this.config.n}\nQueries: ${this.queries.length}/${this.config.maxQueries}\n✓${yesCount} ✗${noCount}\n${this.won ? 'Solved!' : 'Failed'}`;

        resultDiv.textContent = shareText;

        shareBtn.onclick = () => {
            navigator.clipboard.writeText(shareText).then(() => {
                shareBtn.textContent = 'COPIED!';
                setTimeout(() => shareBtn.textContent = 'COPY RESULT', 2000);
            });
        };
    }
}
