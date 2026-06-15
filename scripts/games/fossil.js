/**
 * Fossil - The Excavation Game
 * A hidden polyomino (the "fossil") is buried in the grid.
 * Core probes reveal Manhattan distance to the nearest fossil cell.
 * Radar scans reveal how many fossil cells lie in a row or column.
 * Stake your claim by declaring the exact set of cells.
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';

const DIFFICULTY = {
    standard: {
        gridSize: 8,
        fossilSize: 5,
        budget: 14,
        declares: 2,
        probeCost: 1,
        scanCost: 2
    },
    hard: {
        gridSize: 8,
        fossilSize: 6,
        budget: 15,
        declares: 1,
        probeCost: 1,
        scanCost: 2
    }
};

const cellKey = (r, c) => `${r},${c}`;

export class FossilGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];

        this.history = [];          // { type:'probe', r, c, dist } | { type:'scan', axis, index, count } | { type:'declare', cells, correct }
        this.declaresUsed = 0;
        this.mode = 'probe';        // 'probe' | 'declare'
        this.declareSelection = new Set();
        this.gameOver = false;
        this.won = false;

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();
        const size = this.config.gridSize;
        const k = this.config.fossilSize;

        // Grow a random connected polyomino inside the grid
        this.fossil = new Set();
        const startR = rng.nextInt(0, size - 1);
        const startC = rng.nextInt(0, size - 1);
        this.fossil.add(cellKey(startR, startC));

        while (this.fossil.size < k) {
            const frontier = new Set();
            for (const key of this.fossil) {
                const [r, c] = key.split(',').map(Number);
                for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                    const nr = r + dr, nc = c + dc;
                    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
                    const nk = cellKey(nr, nc);
                    if (!this.fossil.has(nk)) frontier.add(nk);
                }
            }
            const options = [...frontier];
            this.fossil.add(options[rng.nextInt(0, options.length - 1)]);
        }

        this.fossilCells = [...this.fossil].map(key => key.split(',').map(Number));

        this.render();
    }

    budgetSpent() {
        return this.history.reduce((sum, a) => {
            if (a.type === 'probe') return sum + this.config.probeCost;
            if (a.type === 'scan') return sum + this.config.scanCost;
            return sum;
        }, 0);
    }

    budgetLeft() {
        return this.config.budget - this.budgetSpent();
    }

    declaresLeft() {
        return this.config.declares - this.declaresUsed;
    }

    distanceTo(r, c) {
        let best = Infinity;
        for (const [fr, fc] of this.fossilCells) {
            best = Math.min(best, Math.abs(fr - r) + Math.abs(fc - c));
        }
        return best;
    }

    scanned(axis, index) {
        return this.history.find(a => a.type === 'scan' && a.axis === axis && a.index === index);
    }

    probed(r, c) {
        return this.history.find(a => a.type === 'probe' && a.r === r && a.c === c);
    }

    // Knowledge derived from feedback: hits, probed distances, provably-empty cells
    getKnowledge() {
        const size = this.config.gridSize;
        const know = new Map(); // key -> { state: 'hit'|'probed'|'empty', dist? }

        for (const a of this.history) {
            if (a.type === 'probe') {
                if (a.dist === 0) {
                    know.set(cellKey(a.r, a.c), { state: 'hit' });
                } else {
                    know.set(cellKey(a.r, a.c), { state: 'probed', dist: a.dist });
                }
            }
        }

        const markEmpty = (r, c) => {
            const key = cellKey(r, c);
            if (!know.has(key)) know.set(key, { state: 'empty' });
        };

        for (const a of this.history) {
            if (a.type === 'probe' && a.dist > 0) {
                // No fossil cell lies strictly closer than the reported distance
                for (let r = 0; r < size; r++) {
                    for (let c = 0; c < size; c++) {
                        if (Math.abs(r - a.r) + Math.abs(c - a.c) < a.dist) markEmpty(r, c);
                    }
                }
            } else if (a.type === 'scan' && a.count === 0) {
                for (let i = 0; i < size; i++) {
                    if (a.axis === 'row') markEmpty(a.index, i);
                    else markEmpty(i, a.index);
                }
            }
        }

        return know;
    }

    submitProbe(r, c) {
        if (this.gameOver) return;
        if (this.budgetLeft() < this.config.probeCost) return;
        if (this.probed(r, c)) return;

        this.history.push({ type: 'probe', r, c, dist: this.distanceTo(r, c) });
        this.checkStuck();
        this.render();
    }

    submitScan(axis, index) {
        if (this.gameOver) return;
        if (this.budgetLeft() < this.config.scanCost) return;
        if (this.scanned(axis, index)) return;

        let count = 0;
        for (const [fr, fc] of this.fossilCells) {
            if ((axis === 'row' ? fr : fc) === index) count++;
        }

        this.history.push({ type: 'scan', axis, index, count });
        this.checkStuck();
        this.render();
    }

    toggleDeclareCell(r, c) {
        if (this.gameOver) return;
        const key = cellKey(r, c);
        if (this.declareSelection.has(key)) {
            this.declareSelection.delete(key);
        } else {
            const info = this.getKnowledge().get(key);
            if (info && (info.state === 'empty' || info.state === 'probed')) return; // provably not fossil
            if (this.declareSelection.size >= this.config.fossilSize) return;
            this.declareSelection.add(key);
        }
        this.render();
    }

    submitDeclare() {
        if (this.gameOver) return;
        if (this.declaresLeft() <= 0) return;
        if (this.declareSelection.size !== this.config.fossilSize) return;

        const cells = [...this.declareSelection];
        const correct = cells.filter(key => this.fossil.has(key)).length;
        this.declaresUsed++;
        this.history.push({ type: 'declare', cells, correct });

        if (correct === this.config.fossilSize) {
            this.won = true;
            this.gameOver = true;
            gameEngine.recordResult('fossil', true, this.budgetSpent());
            gameEngine.markCompleted('fossil');
        } else if (this.declaresLeft() <= 0) {
            this.gameOver = true;
            gameEngine.recordResult('fossil', false);
            gameEngine.markCompleted('fossil');
        }

        this.render();
        if (this.gameOver) this.showShareSection();
    }

    // Lose immediately if no action is possible: no declares left is handled at declare time;
    // here: out of budget for any probe/scan AND no declares remaining.
    checkStuck() {
        if (this.declaresLeft() > 0) return;
        if (this.budgetLeft() >= this.config.probeCost) return;
        this.gameOver = true;
        gameEngine.recordResult('fossil', false);
        gameEngine.markCompleted('fossil');
        this.showShareSection();
    }

    setMode(mode) {
        if (this.gameOver) return;
        this.mode = mode;
        if (mode === 'declare' && this.declareSelection.size === 0) {
            // Pre-fill with confirmed hits as a courtesy
            for (const [key, info] of this.getKnowledge()) {
                if (info.state === 'hit' && this.declareSelection.size < this.config.fossilSize) {
                    this.declareSelection.add(key);
                }
            }
        }
        this.render();
    }

    render() {
        this.renderGame();
        this.renderControls();
    }

    renderGame() {
        this.container.innerHTML = '';
        const size = this.config.gridSize;
        const know = this.getKnowledge();
        const hits = [...know.values()].filter(i => i.state === 'hit').length;

        // Status bar
        const statusBox = createElement('div', { className: 'game-box mb-4' });
        const statusHeader = createElement('div', { className: 'game-box-header' });
        statusHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: 'EXCAVATION SITE'
        }));
        statusHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-secondary);',
            textContent: `${this.config.fossilSize}-cell fossil · ${size}×${size} grid`
        }));
        statusBox.appendChild(statusHeader);

        const statusContent = createElement('div', {
            className: 'flex justify-between items-center',
            style: 'padding-top: var(--space-3); gap: 16px;'
        });
        statusContent.innerHTML = `
            <div class="text-center" style="flex: 1;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">BUDGET</div>
                <div class="text-mono" style="font-size: 1.25rem; color: ${this.budgetLeft() <= 3 ? 'var(--color-warning)' : 'var(--color-text)'};">${this.budgetLeft()}/${this.config.budget}</div>
            </div>
            <div class="text-center" style="flex: 1;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">CLAIMS</div>
                <div class="text-mono" style="font-size: 1.25rem;">${this.declaresLeft()}</div>
            </div>
            <div class="text-center" style="flex: 1;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">UNEARTHED</div>
                <div class="text-mono" style="font-size: 1.25rem; color: ${hits > 0 ? 'var(--color-success)' : 'var(--color-text)'};">${hits}/${this.config.fossilSize}</div>
            </div>
        `;
        statusBox.appendChild(statusContent);
        this.container.appendChild(statusBox);

        // Grid
        const gridBox = createElement('div', { className: 'game-box mb-4' });
        const gridHeader = createElement('div', { className: 'game-box-header' });
        gridHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: this.mode === 'declare' ? 'SELECT YOUR CLAIM' : 'DIG SITE'
        }));
        gridHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-tertiary);',
            textContent: this.mode === 'declare'
                ? `${this.declareSelection.size}/${this.config.fossilSize} selected`
                : `⛏ probe −${this.config.probeCost} · 📡 scan −${this.config.scanCost}`
        }));
        gridBox.appendChild(gridHeader);

        const grid = createElement('div', {
            style: `
                display: grid;
                grid-template-columns: 28px repeat(${size}, 1fr);
                gap: 3px;
                padding: var(--space-3) 0;
                max-width: 460px;
                margin: 0 auto;
            `
        });

        // Header row: corner + column scan buttons
        grid.appendChild(createElement('div'));
        for (let c = 0; c < size; c++) {
            grid.appendChild(this.renderScanButton('col', c));
        }

        for (let r = 0; r < size; r++) {
            grid.appendChild(this.renderScanButton('row', r));
            for (let c = 0; c < size; c++) {
                grid.appendChild(this.renderCell(r, c, know));
            }
        }

        gridBox.appendChild(grid);

        const legend = createElement('div', {
            className: 'flex gap-4 justify-center text-mono text-xs',
            style: 'color: var(--color-text-tertiary); padding-top: var(--space-2); flex-wrap: wrap;'
        });
        legend.innerHTML = `
            <span><span style="color: var(--color-success);">●</span> fossil</span>
            <span><span style="color: var(--color-text);">n</span> distance</span>
            <span><span style="color: var(--color-text-tertiary);">·</span> ruled out</span>
            <span>▶▼ scan row/col</span>
        `;
        gridBox.appendChild(legend);
        this.container.appendChild(gridBox);

        // History
        if (this.history.length > 0) {
            const historyBox = createElement('div', { className: 'game-box mb-4' });
            const historyHeader = createElement('div', { className: 'game-box-header' });
            historyHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'FIELD LOG'
            }));
            historyBox.appendChild(historyHeader);

            const list = createElement('div', {
                className: 'flex flex-col gap-2',
                style: 'padding-top: var(--space-2); max-height: 220px; overflow-y: auto;'
            });

            this.history.forEach((a, idx) => {
                let text, accent;
                if (a.type === 'probe') {
                    text = `⛏ probe (${a.r + 1},${a.c + 1}) → ${a.dist === 0 ? 'FOSSIL!' : `distance ${a.dist}`}`;
                    accent = a.dist === 0 ? 'var(--color-success)' : 'var(--color-accent)';
                } else if (a.type === 'scan') {
                    text = `📡 scan ${a.axis} ${a.index + 1} → ${a.count} cell${a.count === 1 ? '' : 's'}`;
                    accent = 'var(--color-warning)';
                } else {
                    const win = a.correct === this.config.fossilSize;
                    text = `🚩 claim → ${a.correct}/${this.config.fossilSize} correct${win ? ' — UNEARTHED!' : ''}`;
                    accent = win ? 'var(--color-success)' : 'var(--color-error)';
                }
                const row = createElement('div', {
                    className: 'text-mono text-sm',
                    style: `padding: 6px 12px; background: var(--color-surface); border-radius: 4px; border-left: 3px solid ${accent};`
                });
                row.textContent = `${idx + 1}. ${text}`;
                list.appendChild(row);
            });

            historyBox.appendChild(list);
            this.container.appendChild(historyBox);
        }

        // Result
        if (this.gameOver) {
            const resultBox = createElement('div', {
                className: 'game-box mt-4',
                style: `border-color: var(--color-${this.won ? 'success' : 'error'});`
            });
            const resultText = createElement('div', {
                className: 'text-center',
                style: 'padding: var(--space-4);'
            });
            if (this.won) {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">Fossil unearthed!</div>
                    <div style="color: var(--color-text-secondary);">
                        Budget used: <span class="text-mono">${this.budgetSpent()}/${this.config.budget}</span>
                    </div>
                `;
            } else {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Excavation failed</div>
                    <div style="color: var(--color-text-secondary);">The fossil is revealed on the grid above.</div>
                `;
            }
            resultBox.appendChild(resultText);
            this.container.appendChild(resultBox);
        }
    }

    renderScanButton(axis, index) {
        const scan = this.scanned(axis, index);
        const disabled = this.gameOver || this.mode === 'declare' ||
            (!scan && this.budgetLeft() < this.config.scanCost);

        const btn = createElement('button', {
            className: 'text-mono text-xs',
            'aria-label': `Scan ${axis} ${index + 1}`,
            style: `
                width: 100%;
                min-height: 28px;
                aspect-ratio: auto;
                border: 1px solid ${scan ? 'var(--color-warning)' : 'var(--color-border)'};
                background: var(--color-bg);
                color: ${scan ? 'var(--color-warning)' : 'var(--color-text-tertiary)'};
                border-radius: 4px;
                cursor: ${scan || disabled ? 'default' : 'pointer'};
                opacity: ${!scan && disabled ? '0.35' : '1'};
                font-weight: 600;
            `
        });
        btn.textContent = scan ? `${scan.count}` : (axis === 'col' ? '▼' : '▶');
        if (!scan && !disabled) {
            btn.addEventListener('click', () => this.submitScan(axis, index));
        }
        return btn;
    }

    renderCell(r, c, know) {
        const key = cellKey(r, c);
        const info = know.get(key);
        const isFossilReveal = this.gameOver && this.fossil.has(key);
        const selected = this.declareSelection.has(key);

        let bg = 'var(--color-surface)';
        let color = 'var(--color-text)';
        let border = 'var(--color-border)';
        let content = '';

        if (info?.state === 'hit') {
            bg = 'rgba(76, 175, 80, 0.25)';
            border = 'var(--color-success)';
            color = 'var(--color-success)';
            content = '●';
        } else if (info?.state === 'probed') {
            bg = 'var(--color-surface-elevated)';
            color = 'var(--color-text-secondary)';
            content = `${info.dist}`;
        } else if (info?.state === 'empty') {
            bg = 'var(--color-bg)';
            color = 'var(--color-text-tertiary)';
            content = '·';
        }

        if (selected && !this.gameOver) {
            border = 'var(--color-accent)';
            bg = 'rgba(255, 107, 53, 0.2)';
        }

        if (isFossilReveal) {
            border = this.won ? 'var(--color-success)' : 'var(--color-warning)';
            bg = this.won ? 'rgba(76, 175, 80, 0.25)' : 'rgba(255, 152, 0, 0.25)';
            content = '●';
            color = border;
        }

        const cell = createElement('button', {
            className: 'text-mono',
            'aria-label': `Cell ${r + 1},${c + 1}`,
            style: `
                width: 100%;
                aspect-ratio: 1;
                border: 2px solid ${border};
                background: ${bg};
                color: ${color};
                font-size: 0.9rem;
                font-weight: 600;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.15s ease;
                padding: 0;
            `
        });
        cell.textContent = content;

        if (!this.gameOver) {
            cell.addEventListener('click', () => {
                if (this.mode === 'declare') this.toggleDeclareCell(r, c);
                else this.submitProbe(r, c);
            });
        }
        return cell;
    }

    renderControls() {
        this.controls.innerHTML = '';
        if (this.gameOver) return;

        const controlGroup = createElement('div', { className: 'flex flex-col gap-3' });

        // Mode toggle
        const modeRow = createElement('div', { className: 'flex gap-3' });
        for (const [mode, label] of [['probe', '⛏ DIG'], ['declare', '🚩 CLAIM']]) {
            const active = this.mode === mode;
            const btn = createElement('button', {
                className: active ? 'game-submit' : 'btn btn-secondary',
                textContent: label,
                style: 'flex: 1;'
            });
            btn.addEventListener('click', () => this.setMode(mode));
            modeRow.appendChild(btn);
        }
        controlGroup.appendChild(modeRow);

        if (this.mode === 'declare') {
            const actionRow = createElement('div', { className: 'flex gap-3' });

            const clearBtn = createElement('button', {
                className: 'btn btn-secondary',
                textContent: 'CLEAR',
                style: 'flex: 1;'
            });
            clearBtn.addEventListener('click', () => {
                this.declareSelection.clear();
                this.render();
            });
            actionRow.appendChild(clearBtn);

            const submitBtn = createElement('button', {
                className: 'game-submit',
                textContent: `STAKE CLAIM (${this.declaresLeft()} left)`,
                style: 'flex: 2;'
            });
            if (this.declareSelection.size !== this.config.fossilSize || this.declaresLeft() <= 0) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
            } else {
                submitBtn.addEventListener('click', () => this.submitDeclare());
            }
            actionRow.appendChild(submitBtn);
            controlGroup.appendChild(actionRow);
        }

        const hint = createElement('div', {
            className: 'text-mono text-xs text-center',
            style: 'color: var(--color-text-tertiary);'
        });
        hint.textContent = this.mode === 'declare'
            ? `Select exactly ${this.config.fossilSize} cells. A wrong claim tells you how many were right.`
            : 'Tap a cell to probe distance. Tap ▶/▼ to scan a row or column.';
        controlGroup.appendChild(hint);

        this.controls.appendChild(controlGroup);
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();
        const trail = this.history.map(a => {
            if (a.type === 'probe') return a.dist === 0 ? '🦴' : `${a.dist}`;
            if (a.type === 'scan') return '📡';
            return `🚩${a.correct}/${this.config.fossilSize}`;
        }).join(' ');

        const shareText = `Fossil #${puzzleNumber} 🦴\n${this.difficulty === 'hard' ? 'Hard' : 'Standard'} · Budget ${this.budgetSpent()}/${this.config.budget}\n${trail}\n${this.won ? 'Unearthed!' : 'X'}`;

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
        const hasProgress = this.history.length > 0 && !this.gameOver;

        const option = (mode, label, desc) => `
            <button class="difficulty-btn" data-difficulty="${mode}" style="
                padding: 12px 16px;
                background: ${this.difficulty === mode ? 'var(--color-accent)' : 'var(--color-surface)'};
                border: 2px solid ${this.difficulty === mode ? 'var(--color-accent)' : 'var(--color-border)'};
                border-radius: 8px;
                color: ${this.difficulty === mode ? 'white' : 'var(--color-text)'};
                cursor: pointer;
                text-align: left;
            ">
                <div style="font-family: var(--font-mono); font-weight: 600;">${label}</div>
                <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">${desc}</div>
            </button>
        `;

        body.innerHTML = `
            <div class="settings-section">
                <h4 style="margin-bottom: 12px; color: var(--color-text-secondary);">DIFFICULTY</h4>
                <div class="difficulty-options" style="display: flex; flex-direction: column; gap: 8px;">
                    ${option('standard', 'STANDARD', '5-cell fossil, 14 budget, 2 claims')}
                    ${option('hard', 'HARD', '6-cell fossil, 15 budget, 1 claim')}
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
        if (gameModeEl) gameModeEl.textContent = mode.toUpperCase();

        this.history = [];
        this.declaresUsed = 0;
        this.mode = 'probe';
        this.declareSelection = new Set();
        this.gameOver = false;
        this.won = false;

        this.init();
        this.shareSection.classList.add('hidden');
    }
}
