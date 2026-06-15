/**
 * Flip - The Triangulation Game
 * A hidden triangulation of a convex polygon (one of Catalan-many).
 * Query any diagonal to learn how many target diagonals it crosses.
 * Because triangulations are MAXIMAL non-crossing sets, a crossing count
 * of 0 means your diagonal is in the target. Assemble and declare the
 * full triangulation to win.
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const DIFFICULTY = {
    standard: {
        n: 9,           // 9-gon: Catalan(7) = 429 triangulations, 6 diagonals, 27 candidates
        budget: 11,
        declares: 2
    },
    hard: {
        n: 10,          // 10-gon: Catalan(8) = 1430 triangulations, 7 diagonals, 35 candidates
        budget: 12,
        declares: 1
    }
};

const CATALAN = { 9: 429, 10: 1430 };

function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
}

const diagKey = (a, b) => a < b ? `${a}-${b}` : `${b}-${a}`;

export class FlipGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];

        this.queries = [];           // { a, b, crossings }
        this.declareLog = [];        // { diagonals: [keys], correct }
        this.mode = 'query';         // 'query' | 'declare'
        this.selectedVertex = null;
        this.declareSet = new Set(); // diagonal keys
        this.gameOver = false;
        this.won = false;

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();
        const n = this.config.n;

        // Random triangulation via recursive splitting of the chain 0..n-1
        // (every binary split tree yields a valid triangulation)
        this.target = new Set();
        const split = (i, j) => {
            if (j - i < 2) return;
            const k = rng.nextInt(i + 1, j - 1);
            if (k - i > 1) this.target.add(diagKey(i, k));
            if (j - k > 1) this.target.add(diagKey(k, j));
            split(i, k);
            split(k, j);
        };
        split(0, n - 1);
        // (0, n-1) is a polygon side, so target has exactly n-3 diagonals

        this.render();
    }

    isDiagonal(a, b) {
        const n = this.config.n;
        if (a === b) return false;
        const diff = (a - b + n) % n;
        return diff !== 1 && diff !== n - 1;
    }

    // Strict interior crossing of chords (a,b) and (c,d) on a convex polygon
    crosses(a, b, c, d) {
        if (a === c || a === d || b === c || b === d) return false;
        const between = (x, lo, hi) => {
            // is x strictly inside the cyclic arc lo -> hi (walking +1)?
            const n = this.config.n;
            for (let v = (lo + 1) % n; v !== hi; v = (v + 1) % n) {
                if (v === x) return true;
            }
            return false;
        };
        return between(c, a, b) !== between(d, a, b);
    }

    crossingCount(a, b) {
        let count = 0;
        for (const key of this.target) {
            const [c, d] = key.split('-').map(Number);
            if (this.crosses(a, b, c, d)) count++;
        }
        return count;
    }

    budgetLeft() {
        return this.config.budget - this.queries.length;
    }

    declaresLeft() {
        return this.config.declares - this.declareLog.length;
    }

    queried(a, b) {
        return this.queries.find(q => diagKey(q.a, q.b) === diagKey(a, b));
    }

    confirmedDiagonals() {
        return this.queries.filter(q => q.crossings === 0).map(q => diagKey(q.a, q.b));
    }

    handleVertexClick(v) {
        if (this.gameOver) return;

        if (this.selectedVertex === null) {
            this.selectedVertex = v;
        } else if (this.selectedVertex === v) {
            this.selectedVertex = null;
        } else {
            const a = this.selectedVertex, b = v;
            this.selectedVertex = null;
            if (!this.isDiagonal(a, b)) {
                // polygon side — not a diagonal
            } else if (this.mode === 'query') {
                this.submitQuery(a, b);
                return;
            } else {
                this.toggleDeclareDiagonal(a, b);
                return;
            }
        }
        this.render();
    }

    submitQuery(a, b) {
        if (this.gameOver) return;
        if (this.budgetLeft() <= 0) return;
        if (this.queried(a, b)) { this.render(); return; }

        this.queries.push({ a, b, crossings: this.crossingCount(a, b) });
        this.render();
    }

    toggleDeclareDiagonal(a, b) {
        const key = diagKey(a, b);
        if (this.declareSet.has(key)) {
            this.declareSet.delete(key);
        } else if (this.declareSet.size < this.config.n - 3) {
            this.declareSet.add(key);
        }
        this.render();
    }

    declareIsValid() {
        // must be pairwise non-crossing (triangulations are non-crossing sets)
        const keys = [...this.declareSet];
        for (let i = 0; i < keys.length; i++) {
            for (let j = i + 1; j < keys.length; j++) {
                const [a, b] = keys[i].split('-').map(Number);
                const [c, d] = keys[j].split('-').map(Number);
                if (this.crosses(a, b, c, d)) return false;
            }
        }
        return true;
    }

    submitDeclare() {
        if (this.gameOver) return;
        if (this.declaresLeft() <= 0) return;
        if (this.declareSet.size !== this.config.n - 3) return;
        if (!this.declareIsValid()) return;

        const diagonals = [...this.declareSet];
        const correct = diagonals.filter(k => this.target.has(k)).length;
        this.declareLog.push({ diagonals, correct });

        if (correct === this.config.n - 3) {
            this.won = true;
            this.gameOver = true;
            gameEngine.recordResult('flip', true, this.queries.length);
            gameEngine.markCompleted('flip');
        } else if (this.declaresLeft() <= 0) {
            this.gameOver = true;
            gameEngine.recordResult('flip', false);
            gameEngine.markCompleted('flip');
        }

        this.render();
        if (this.gameOver) this.showShareSection();
    }

    setMode(mode) {
        if (this.gameOver) return;
        this.mode = mode;
        this.selectedVertex = null;
        if (mode === 'declare' && this.declareSet.size === 0) {
            for (const key of this.confirmedDiagonals()) {
                if (this.declareSet.size < this.config.n - 3) this.declareSet.add(key);
            }
        }
        this.render();
    }

    vertexPos(v, cx, cy, r) {
        const angle = -Math.PI / 2 + (2 * Math.PI * v) / this.config.n;
        return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    }

    render() {
        this.renderGame();
        this.renderControls();
    }

    renderGame() {
        this.container.innerHTML = '';
        const n = this.config.n;

        // Status bar
        const statusBox = createElement('div', { className: 'game-box mb-4' });
        const statusHeader = createElement('div', { className: 'game-box-header' });
        statusHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: 'HIDDEN TRIANGULATION'
        }));
        statusHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-secondary);',
            textContent: `${n}-gon · C(${n - 2}) = ${CATALAN[n]} triangulations`
        }));
        statusBox.appendChild(statusHeader);

        const found = this.confirmedDiagonals().length;
        const statusContent = createElement('div', {
            className: 'flex justify-between items-center',
            style: 'padding-top: var(--space-3); gap: 16px;'
        });
        statusContent.innerHTML = `
            <div class="text-center" style="flex: 1;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">QUERIES</div>
                <div class="text-mono" style="font-size: 1.25rem; color: ${this.budgetLeft() <= 2 ? 'var(--color-warning)' : 'var(--color-text)'};">${this.budgetLeft()}/${this.config.budget}</div>
            </div>
            <div class="text-center" style="flex: 1;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">DECLARES</div>
                <div class="text-mono" style="font-size: 1.25rem;">${this.declaresLeft()}</div>
            </div>
            <div class="text-center" style="flex: 1;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">CONFIRMED</div>
                <div class="text-mono" style="font-size: 1.25rem; color: ${found > 0 ? 'var(--color-success)' : 'var(--color-text)'};">${found}/${n - 3}</div>
            </div>
        `;
        statusBox.appendChild(statusContent);
        this.container.appendChild(statusBox);

        // Polygon
        const polyBox = createElement('div', { className: 'game-box mb-4' });
        const polyHeader = createElement('div', { className: 'game-box-header' });
        polyHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: this.mode === 'declare' ? 'SELECT YOUR TRIANGULATION' : 'QUERY A DIAGONAL'
        }));
        polyHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-tertiary);',
            textContent: this.mode === 'declare'
                ? `${this.declareSet.size}/${n - 3} diagonals`
                : (this.selectedVertex !== null ? `vertex ${this.selectedVertex + 1} selected…` : 'tap two vertices')
        }));
        polyBox.appendChild(polyHeader);

        polyBox.appendChild(this.renderPolygonSVG());

        const legend = createElement('div', {
            className: 'flex gap-4 justify-center text-mono text-xs',
            style: 'color: var(--color-text-tertiary); padding-top: var(--space-2); flex-wrap: wrap;'
        });
        legend.innerHTML = `
            <span><span style="color: var(--color-success);">━</span> in target (0 crossings)</span>
            <span><span style="color: var(--color-text-tertiary);">┅n</span> crosses n</span>
            ${this.mode === 'declare' ? '<span><span style="color: var(--color-accent);">━</span> your claim</span>' : ''}
        `;
        polyBox.appendChild(legend);
        this.container.appendChild(polyBox);

        // History
        if (this.queries.length > 0 || this.declareLog.length > 0) {
            const historyBox = createElement('div', { className: 'game-box mb-4' });
            const historyHeader = createElement('div', { className: 'game-box-header' });
            historyHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'SURVEY LOG'
            }));
            historyBox.appendChild(historyHeader);

            const list = createElement('div', {
                className: 'flex flex-col gap-2',
                style: 'padding-top: var(--space-2); max-height: 200px; overflow-y: auto;'
            });

            this.queries.forEach((q, idx) => {
                const inTarget = q.crossings === 0;
                const row = createElement('div', {
                    className: 'flex justify-between items-center text-mono text-sm',
                    style: `padding: 6px 12px; background: var(--color-surface); border-radius: 4px; border-left: 3px solid ${inTarget ? 'var(--color-success)' : 'var(--color-accent)'};`
                });
                row.innerHTML = `
                    <span>${idx + 1}. diagonal ${q.a + 1}—${q.b + 1}</span>
                    <span style="color: ${inTarget ? 'var(--color-success)' : 'var(--color-accent)'};">${inTarget ? '✓ IN TARGET' : `crosses ${q.crossings}`}</span>
                `;
                list.appendChild(row);
            });

            this.declareLog.forEach((d) => {
                const win = d.correct === n - 3;
                const row = createElement('div', {
                    className: 'flex justify-between items-center text-mono text-sm',
                    style: `padding: 6px 12px; background: var(--color-surface); border-radius: 4px; border-left: 3px solid var(--color-${win ? 'success' : 'error'});`
                });
                row.innerHTML = `
                    <span>🚩 declared ${d.diagonals.length} diagonals</span>
                    <span style="color: var(--color-${win ? 'success' : 'error'});">${d.correct}/${n - 3} correct</span>
                `;
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
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">Triangulation found!</div>
                    <div style="color: var(--color-text-secondary);">
                        ${this.queries.length} queries, ${this.declareLog.length} declaration${this.declareLog.length === 1 ? '' : 's'}
                    </div>
                `;
            } else {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Out of declarations</div>
                    <div style="color: var(--color-text-secondary);">The target triangulation is shown above in green.</div>
                `;
            }
            resultBox.appendChild(resultText);
            this.container.appendChild(resultBox);
        }
    }

    renderPolygonSVG() {
        const n = this.config.n;
        const W = 340, cx = W / 2, cy = W / 2, r = W / 2 - 30;

        const wrap = createElement('div', { style: 'display: flex; justify-content: center; padding: var(--space-3) 0;' });
        const svg = svgEl('svg', {
            viewBox: `0 0 ${W} ${W}`,
            width: '100%',
            style: 'max-width: 380px; touch-action: manipulation;'
        });

        const line = (a, b, attrs) => {
            const [x1, y1] = this.vertexPos(a, cx, cy, r);
            const [x2, y2] = this.vertexPos(b, cx, cy, r);
            return svgEl('line', { x1, y1, x2, y2, ...attrs });
        };

        // polygon sides
        for (let v = 0; v < n; v++) {
            svg.appendChild(line(v, (v + 1) % n, {
                stroke: '#3a3a3a', 'stroke-width': 2
            }));
        }

        // queried non-target diagonals (faint, labeled with crossing count)
        for (const q of this.queries) {
            if (q.crossings === 0) continue;
            svg.appendChild(line(q.a, q.b, {
                stroke: '#808080', 'stroke-width': 1.5,
                'stroke-dasharray': '4 5', opacity: 0.35
            }));
            const [x1, y1] = this.vertexPos(q.a, cx, cy, r);
            const [x2, y2] = this.vertexPos(q.b, cx, cy, r);
            const label = svgEl('text', {
                x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 3,
                fill: '#808080', 'font-size': 11,
                'font-family': 'monospace', 'text-anchor': 'middle'
            });
            label.textContent = q.crossings;
            svg.appendChild(label);
        }

        // confirmed target diagonals
        for (const key of this.confirmedDiagonals()) {
            const [a, b] = key.split('-').map(Number);
            svg.appendChild(line(a, b, { stroke: '#4caf50', 'stroke-width': 3 }));
        }

        // declare selection
        if (this.mode === 'declare' && !this.gameOver) {
            for (const key of this.declareSet) {
                const [a, b] = key.split('-').map(Number);
                svg.appendChild(line(a, b, {
                    stroke: '#ff6b35', 'stroke-width': 3, opacity: 0.85
                }));
            }
        }

        // reveal target at game over
        if (this.gameOver) {
            for (const key of this.target) {
                const [a, b] = key.split('-').map(Number);
                svg.appendChild(line(a, b, {
                    stroke: this.won ? '#4caf50' : '#ff9800', 'stroke-width': 3, opacity: 0.9
                }));
            }
        }

        // vertices
        for (let v = 0; v < n; v++) {
            const [x, y] = this.vertexPos(v, cx, cy, r);
            const selected = this.selectedVertex === v;

            const hit = svgEl('circle', {
                cx: x, cy: y, r: 16,
                fill: selected ? '#ff6b35' : '#252525',
                stroke: selected ? '#ff6b35' : '#3a3a3a',
                'stroke-width': 2,
                style: 'cursor: pointer;'
            });
            hit.addEventListener('click', () => this.handleVertexClick(v));
            svg.appendChild(hit);

            const label = svgEl('text', {
                x, y: y + 4, fill: selected ? '#ffffff' : '#e0e0e0',
                'font-size': 12, 'font-family': 'monospace',
                'font-weight': 600, 'text-anchor': 'middle',
                style: 'pointer-events: none;'
            });
            label.textContent = v + 1;
            svg.appendChild(label);
        }

        wrap.appendChild(svg);
        return wrap;
    }

    renderControls() {
        this.controls.innerHTML = '';
        if (this.gameOver) return;

        const controlGroup = createElement('div', { className: 'flex flex-col gap-3' });

        const modeRow = createElement('div', { className: 'flex gap-3' });
        for (const [mode, label] of [['query', '📐 QUERY'], ['declare', '🚩 DECLARE']]) {
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
            const valid = this.declareIsValid();
            const actionRow = createElement('div', { className: 'flex gap-3' });

            const clearBtn = createElement('button', {
                className: 'btn btn-secondary',
                textContent: 'CLEAR',
                style: 'flex: 1;'
            });
            clearBtn.addEventListener('click', () => {
                this.declareSet.clear();
                this.render();
            });
            actionRow.appendChild(clearBtn);

            const submitBtn = createElement('button', {
                className: 'game-submit',
                textContent: `DECLARE (${this.declaresLeft()} left)`,
                style: 'flex: 2;'
            });
            const ready = this.declareSet.size === this.config.n - 3 && valid && this.declaresLeft() > 0;
            if (!ready) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
            } else {
                submitBtn.addEventListener('click', () => this.submitDeclare());
            }
            actionRow.appendChild(submitBtn);
            controlGroup.appendChild(actionRow);

            if (!valid) {
                const warn = createElement('div', {
                    className: 'text-mono text-xs text-center',
                    style: 'color: var(--color-error);'
                });
                warn.textContent = 'Your selected diagonals cross each other — a triangulation never does.';
                controlGroup.appendChild(warn);
            }
        }

        const hint = createElement('div', {
            className: 'text-mono text-xs text-center',
            style: 'color: var(--color-text-tertiary);'
        });
        hint.textContent = this.mode === 'declare'
            ? `Select the ${this.config.n - 3} diagonals of the hidden triangulation.`
            : 'Crossing count 0 means the diagonal IS in the target (triangulations are maximal).';
        controlGroup.appendChild(hint);

        this.controls.appendChild(controlGroup);
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();
        const trail = this.queries.map(q => q.crossings === 0 ? '🟩' : `${q.crossings}`).join(' ');
        const declares = this.declareLog.map(d =>
            d.correct === this.config.n - 3 ? '✓' : `${d.correct}/${this.config.n - 3}`).join(' → ');

        const shareText = `Flip #${puzzleNumber} 📐\n${this.difficulty === 'hard' ? 'Hard' : 'Standard'} (${this.config.n}-gon) · Queries ${this.queries.length}/${this.config.budget}\n${trail}\n🚩 ${declares}\n${this.won ? 'Triangulated!' : 'X'}`;

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
        const hasProgress = (this.queries.length > 0 || this.declareLog.length > 0) && !this.gameOver;

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
                    ${option('standard', 'STANDARD', '9-gon (429 triangulations), 11 queries, 2 declares')}
                    ${option('hard', 'HARD', '10-gon (1430 triangulations), 12 queries, 1 declare')}
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

        this.queries = [];
        this.declareLog = [];
        this.mode = 'query';
        this.selectedVertex = null;
        this.declareSet = new Set();
        this.gameOver = false;
        this.won = false;

        this.init();
        this.shareSection.classList.add('hidden');
    }
}
