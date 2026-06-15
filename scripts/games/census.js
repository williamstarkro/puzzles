/**
 * Census - The Graph Reconstruction Game
 * A hidden graph. You cannot see it — you can only buy global subgraph
 * counts (edges, cherries, triangles, claws, paths, 4-cycles...).
 * Rebuild the graph in the editor and declare it; you win if your graph
 * is ISOMORPHIC to the target. (Lovász: homomorphism counts determine a
 * graph — but you can't afford them all.)
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const DIFFICULTY = {
    standard: {
        n: 6,           // 156 graphs up to isomorphism
        budget: 8,
        declares: 2,
        edgeProb: 0.45
    },
    hard: {
        n: 7,           // 1044 graphs up to isomorphism
        budget: 10,
        declares: 1,
        edgeProb: 0.4
    }
};

const PROBES = [
    { id: 'edges', glyph: '─', name: 'EDGES', cost: 1, desc: 'Number of edges' },
    { id: 'cherries', glyph: '∧', name: 'CHERRIES', cost: 1, desc: 'Paths of 2 edges (P₃)' },
    { id: 'triangles', glyph: '△', name: 'TRIANGLES', cost: 2, desc: 'Triangles (K₃)' },
    { id: 'claws', glyph: '✶', name: 'CLAWS', cost: 2, desc: 'Stars K₁,₃' },
    { id: 'paths4', glyph: '⌁', name: 'PATHS', cost: 3, desc: 'Paths of 3 edges (P₄)' },
    { id: 'cycles4', glyph: '◻', name: '4-CYCLES', cost: 3, desc: 'Cycles of length 4' },
    { id: 'degseq', glyph: '𝚫', name: 'DEGREES', cost: 4, desc: 'Full sorted degree sequence' }
];

function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
}

const edgeKey = (a, b) => a < b ? `${a}-${b}` : `${b}-${a}`;
const choose2 = d => d * (d - 1) / 2;
const choose3 = d => d * (d - 1) * (d - 2) / 6;

export class CensusGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];

        this.probeLog = [];          // { id, value (number|array), cost }
        this.declareLog = [];        // { edges: [keys], overlap, guessSize }
        this.declaresUsed = 0;
        this.guessEdges = new Set(); // player's editor state
        this.selectedVertex = null;
        this.gameOver = false;
        this.won = false;

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();
        const n = this.config.n;

        // Random G(n, p), re-rolled away from degenerate edge counts
        const maxEdges = choose2(n);
        do {
            this.target = new Set();
            for (let a = 0; a < n; a++) {
                for (let b = a + 1; b < n; b++) {
                    if (rng.next() < this.config.edgeProb) this.target.add(edgeKey(a, b));
                }
            }
        } while (this.target.size < 4 || this.target.size > maxEdges - 4);

        this.render();
    }

    // ---------- counting ----------

    adjacency(edges) {
        const n = this.config.n;
        const adj = Array.from({ length: n }, () => new Set());
        for (const key of edges) {
            const [a, b] = key.split('-').map(Number);
            adj[a].add(b);
            adj[b].add(a);
        }
        return adj;
    }

    countProbe(id, edges) {
        const n = this.config.n;
        const adj = this.adjacency(edges);
        const deg = adj.map(s => s.size);

        switch (id) {
            case 'edges':
                return edges.size;
            case 'cherries':
                return deg.reduce((s, d) => s + choose2(d), 0);
            case 'claws':
                return deg.reduce((s, d) => s + choose3(d), 0);
            case 'degseq':
                return [...deg].sort((a, b) => b - a);
            case 'triangles': {
                let count = 0;
                for (let a = 0; a < n; a++)
                    for (let b = a + 1; b < n; b++)
                        for (let c = b + 1; c < n; c++)
                            if (adj[a].has(b) && adj[b].has(c) && adj[a].has(c)) count++;
                return count;
            }
            case 'paths4': {
                // ordered walks a-b-c-d on distinct vertices with all edges present, /2
                let count = 0;
                for (let a = 0; a < n; a++)
                    for (const b of adj[a])
                        for (const c of adj[b]) {
                            if (c === a) continue;
                            for (const d of adj[c]) {
                                if (d === a || d === b) continue;
                                count++;
                            }
                        }
                return count / 2;
            }
            case 'cycles4': {
                // ordered closed walks a-b-c-d-a on distinct vertices, /8
                let count = 0;
                for (let a = 0; a < n; a++)
                    for (const b of adj[a])
                        for (const c of adj[b]) {
                            if (c === a) continue;
                            for (const d of adj[c]) {
                                if (d === a || d === b) continue;
                                if (adj[d].has(a)) count++;
                            }
                        }
                return count / 8;
            }
        }
    }

    // ---------- game state ----------

    budgetSpent() {
        return this.probeLog.reduce((s, p) => s + p.cost, 0);
    }

    budgetLeft() {
        return this.config.budget - this.budgetSpent();
    }

    declaresLeft() {
        return this.config.declares - this.declaresUsed;
    }

    probeUsed(id) {
        return this.probeLog.find(p => p.id === id);
    }

    submitProbe(id) {
        if (this.gameOver) return;
        const probe = PROBES.find(p => p.id === id);
        if (!probe || this.probeUsed(id)) return;
        if (this.budgetLeft() < probe.cost) return;

        this.probeLog.push({ id, value: this.countProbe(id, this.target), cost: probe.cost });
        this.render();
    }

    toggleGuessEdge(a, b) {
        const key = edgeKey(a, b);
        if (this.guessEdges.has(key)) this.guessEdges.delete(key);
        else this.guessEdges.add(key);
        this.render();
    }

    handleVertexClick(v) {
        if (this.gameOver) return;
        if (this.selectedVertex === null) {
            this.selectedVertex = v;
        } else if (this.selectedVertex === v) {
            this.selectedVertex = null;
        } else {
            const a = this.selectedVertex;
            this.selectedVertex = null;
            this.toggleGuessEdge(a, v);
            return;
        }
        this.render();
    }

    // Best edge overlap between guess and target over all vertex permutations.
    // Also detects isomorphism (overlap == |target| == |guess|).
    bestAlignment() {
        const n = this.config.n;
        const targetEdges = [...this.target].map(k => k.split('-').map(Number));
        let best = 0;

        const perm = Array.from({ length: n }, (_, i) => i);
        const permute = (k) => {
            if (k === n) {
                let overlap = 0;
                for (const [a, b] of targetEdges) {
                    if (this.guessEdges.has(edgeKey(perm[a], perm[b]))) overlap++;
                }
                if (overlap > best) best = overlap;
                return;
            }
            for (let i = k; i < n; i++) {
                [perm[k], perm[i]] = [perm[i], perm[k]];
                permute(k + 1);
                [perm[k], perm[i]] = [perm[i], perm[k]];
            }
        };
        permute(0);
        return best;
    }

    submitDeclare() {
        if (this.gameOver) return;
        if (this.declaresLeft() <= 0) return;

        const overlap = this.bestAlignment();
        const isIso = overlap === this.target.size && this.guessEdges.size === this.target.size;
        this.declaresUsed++;
        this.declareLog.push({ edges: [...this.guessEdges], overlap, guessSize: this.guessEdges.size });

        if (isIso) {
            this.won = true;
            this.gameOver = true;
            gameEngine.recordResult('census', true, this.budgetSpent());
            gameEngine.markCompleted('census');
        } else if (this.declaresLeft() <= 0) {
            this.gameOver = true;
            gameEngine.recordResult('census', false);
            gameEngine.markCompleted('census');
        }

        this.render();
        if (this.gameOver) this.showShareSection();
    }

    formatValue(value) {
        return Array.isArray(value) ? `[${value.join(', ')}]` : `${value}`;
    }

    // ---------- rendering ----------

    render() {
        this.renderGame();
        this.renderControls();
    }

    renderGame() {
        this.container.innerHTML = '';
        const n = this.config.n;

        // Status
        const statusBox = createElement('div', { className: 'game-box mb-4' });
        const statusHeader = createElement('div', { className: 'game-box-header' });
        statusHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: 'HIDDEN GRAPH'
        }));
        statusHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-secondary);',
            textContent: `${n} vertices · ${n === 6 ? 156 : 1044} graphs up to iso`
        }));
        statusBox.appendChild(statusHeader);

        const statusContent = createElement('div', {
            className: 'flex justify-between items-center',
            style: 'padding-top: var(--space-3); gap: 16px;'
        });
        statusContent.innerHTML = `
            <div class="text-center" style="flex: 1;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">BUDGET</div>
                <div class="text-mono" style="font-size: 1.25rem; color: ${this.budgetLeft() <= 2 ? 'var(--color-warning)' : 'var(--color-text)'};">${this.budgetLeft()}/${this.config.budget}</div>
            </div>
            <div class="text-center" style="flex: 1;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">DECLARES</div>
                <div class="text-mono" style="font-size: 1.25rem;">${this.declaresLeft()}</div>
            </div>
            <div class="text-center" style="flex: 1;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">YOUR EDGES</div>
                <div class="text-mono" style="font-size: 1.25rem;">${this.guessEdges.size}</div>
            </div>
        `;
        statusBox.appendChild(statusContent);
        this.container.appendChild(statusBox);

        // Census results
        const censusBox = createElement('div', { className: 'game-box mb-4' });
        const censusHeader = createElement('div', { className: 'game-box-header' });
        censusHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: 'CENSUS DATA'
        }));
        censusHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-tertiary);',
            textContent: 'tap to purchase'
        }));
        censusBox.appendChild(censusHeader);

        const probeGrid = createElement('div', {
            style: 'display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; padding-top: var(--space-3);'
        });

        for (const probe of PROBES) {
            const used = this.probeUsed(probe.id);
            const affordable = this.budgetLeft() >= probe.cost;
            const btn = createElement('button', {
                className: 'text-mono',
                style: `
                    padding: 10px 12px;
                    text-align: left;
                    background: ${used ? 'var(--color-bg)' : 'var(--color-surface)'};
                    border: 2px solid ${used ? 'var(--color-accent)' : 'var(--color-border)'};
                    border-radius: 8px;
                    color: var(--color-text);
                    cursor: ${used || !affordable || this.gameOver ? 'default' : 'pointer'};
                    opacity: ${!used && !affordable ? '0.4' : '1'};
                    transition: all 0.15s ease;
                `
            });
            btn.innerHTML = used
                ? `<div class="text-xs" style="color: var(--color-text-tertiary);">${probe.glyph} ${probe.name}</div>
                   <div style="font-size: 1.1rem; color: var(--color-accent); font-weight: 600;">${this.formatValue(used.value)}</div>`
                : `<div class="text-xs" style="color: var(--color-text-tertiary);">${probe.glyph} ${probe.name} · −${probe.cost}</div>
                   <div class="text-xs" style="color: var(--color-text-secondary); margin-top: 2px;">${probe.desc}</div>`;
            if (!used && affordable && !this.gameOver) {
                btn.addEventListener('click', () => this.submitProbe(probe.id));
            }
            probeGrid.appendChild(btn);
        }

        censusBox.appendChild(probeGrid);
        this.container.appendChild(censusBox);

        // Graph editor
        const editorBox = createElement('div', { className: 'game-box mb-4' });
        const editorHeader = createElement('div', { className: 'game-box-header' });
        editorHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: this.gameOver ? 'THE HIDDEN GRAPH' : 'RECONSTRUCTION'
        }));
        editorHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-tertiary);',
            textContent: this.gameOver
                ? 'revealed'
                : (this.selectedVertex !== null ? `vertex ${this.selectedVertex + 1} selected…` : 'tap two vertices to toggle an edge')
        }));
        editorBox.appendChild(editorHeader);
        editorBox.appendChild(this.renderGraphSVG());
        this.container.appendChild(editorBox);

        // Declare history
        if (this.declareLog.length > 0) {
            const historyBox = createElement('div', { className: 'game-box mb-4' });
            const historyHeader = createElement('div', { className: 'game-box-header' });
            historyHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'DECLARATIONS'
            }));
            historyBox.appendChild(historyHeader);

            const list = createElement('div', {
                className: 'flex flex-col gap-2',
                style: 'padding-top: var(--space-2);'
            });
            this.declareLog.forEach((d, idx) => {
                const win = d.overlap === this.target.size && d.guessSize === this.target.size;
                const row = createElement('div', {
                    className: 'flex justify-between items-center text-mono text-sm',
                    style: `padding: 6px 12px; background: var(--color-surface); border-radius: 4px; border-left: 3px solid var(--color-${win ? 'success' : 'error'});`
                });
                row.innerHTML = win
                    ? `<span>${idx + 1}. declared ${d.guessSize} edges</span><span style="color: var(--color-success);">ISOMORPHIC ✓</span>`
                    : `<span>${idx + 1}. declared ${d.guessSize} edges</span><span style="color: var(--color-error);">best alignment: ${d.overlap} edges</span>`;
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
            resultText.innerHTML = this.won
                ? `<div style="font-size: 1.5rem; margin-bottom: 8px;">Graph reconstructed!</div>
                   <div style="color: var(--color-text-secondary);">Budget used: <span class="text-mono">${this.budgetSpent()}/${this.config.budget}</span></div>`
                : `<div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Not isomorphic</div>
                   <div style="color: var(--color-text-secondary);">The hidden graph is shown above.</div>`;
            resultBox.appendChild(resultText);
            this.container.appendChild(resultBox);
        }
    }

    renderGraphSVG() {
        const n = this.config.n;
        const W = 300, cx = W / 2, cy = W / 2, r = W / 2 - 30;

        const pos = v => {
            const angle = -Math.PI / 2 + (2 * Math.PI * v) / n;
            return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
        };

        const wrap = createElement('div', { style: 'display: flex; justify-content: center; padding: var(--space-3) 0;' });
        const svg = svgEl('svg', {
            viewBox: `0 0 ${W} ${W}`,
            width: '100%',
            style: 'max-width: 320px; touch-action: manipulation;'
        });

        const edges = this.gameOver ? this.target : this.guessEdges;
        const stroke = this.gameOver ? (this.won ? '#4caf50' : '#ff9800') : '#ff6b35';

        for (const key of edges) {
            const [a, b] = key.split('-').map(Number);
            const [x1, y1] = pos(a);
            const [x2, y2] = pos(b);
            const line = svgEl('line', {
                x1, y1, x2, y2,
                stroke, 'stroke-width': 2.5,
                style: this.gameOver ? '' : 'cursor: pointer;'
            });
            if (!this.gameOver) {
                line.addEventListener('click', () => this.toggleGuessEdge(a, b));
            }
            svg.appendChild(line);
        }

        for (let v = 0; v < n; v++) {
            const [x, y] = pos(v);
            const selected = this.selectedVertex === v;
            const circle = svgEl('circle', {
                cx: x, cy: y, r: 15,
                fill: selected ? '#ff6b35' : '#252525',
                stroke: selected ? '#ff6b35' : '#3a3a3a',
                'stroke-width': 2,
                style: this.gameOver ? '' : 'cursor: pointer;'
            });
            if (!this.gameOver) {
                circle.addEventListener('click', () => this.handleVertexClick(v));
            }
            svg.appendChild(circle);

            const label = svgEl('text', {
                x, y: y + 4,
                fill: selected ? '#ffffff' : '#e0e0e0',
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

        const actionRow = createElement('div', { className: 'flex gap-3' });
        const clearBtn = createElement('button', {
            className: 'btn btn-secondary',
            textContent: 'CLEAR GRAPH',
            style: 'flex: 1;'
        });
        clearBtn.addEventListener('click', () => {
            this.guessEdges.clear();
            this.render();
        });
        actionRow.appendChild(clearBtn);

        const submitBtn = createElement('button', {
            className: 'game-submit',
            textContent: `DECLARE (${this.declaresLeft()} left)`,
            style: 'flex: 2;'
        });
        if (this.guessEdges.size === 0 || this.declaresLeft() <= 0) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
        } else {
            submitBtn.addEventListener('click', () => this.submitDeclare());
        }
        actionRow.appendChild(submitBtn);
        controlGroup.appendChild(actionRow);

        const hint = createElement('div', {
            className: 'text-mono text-xs text-center',
            style: 'color: var(--color-text-tertiary);'
        });
        hint.textContent = 'Vertex labels don\'t matter — you win if your graph is isomorphic to the target.';
        controlGroup.appendChild(hint);

        this.controls.appendChild(controlGroup);
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();
        const probes = this.probeLog.map(p => PROBES.find(x => x.id === p.id).glyph).join(' ');
        const declares = this.declareLog
            .map(d => (d.overlap === this.target.size && d.guessSize === this.target.size) ? '✓' : `${d.overlap}`)
            .join(' → ');

        const shareText = `Census #${puzzleNumber} 🕸️\n${this.difficulty === 'hard' ? 'Hard' : 'Standard'} (${this.config.n} vertices) · Budget ${this.budgetSpent()}/${this.config.budget}\n${probes}\n🚩 ${declares}\n${this.won ? 'Reconstructed!' : 'X'}`;

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
        const hasProgress = (this.probeLog.length > 0 || this.declareLog.length > 0) && !this.gameOver;

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
                    ${option('standard', 'STANDARD', '6 vertices, 8 budget, 2 declares')}
                    ${option('hard', 'HARD', '7 vertices, 10 budget, 1 declare')}
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

        this.probeLog = [];
        this.declareLog = [];
        this.declaresUsed = 0;
        this.guessEdges = new Set();
        this.selectedVertex = null;
        this.gameOver = false;
        this.won = false;

        this.init();
        this.shareSection.classList.add('hidden');
    }
}
