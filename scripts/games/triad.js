/**
 * Triad - The Median Logic Game
 * A hidden strict ranking of items. The top-ranked item is revealed.
 * Query any three items to learn which one is the MEDIAN of the trio.
 * Declare the full ranking to win; a wrong declaration reveals how many
 * positions were correct.
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';

const DIFFICULTY = {
    standard: {
        items: 7,
        queries: 8,
        declares: 2
    },
    hard: {
        items: 8,
        queries: 10,
        declares: 1
    }
};

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export class TriadGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];

        this.queryLog = [];        // { items: [i,i,i], median: i }
        this.declareLog = [];      // { order: [...], correct: n }
        this.mode = 'query';       // 'query' | 'declare'
        this.querySelection = new Set();
        this.declareOrder = [];    // built by the player, slot 0 locked to top item
        this.gameOver = false;
        this.won = false;

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();
        const n = this.config.items;

        // ranking[0] = strongest ... ranking[n-1] = weakest
        this.ranking = rng.shuffle(Array.from({ length: n }, (_, i) => i));
        this.topItem = this.ranking[0];
        this.rankOf = new Array(n);
        this.ranking.forEach((item, pos) => { this.rankOf[item] = pos; });

        this.declareOrder = [this.topItem];

        this.render();
    }

    queriesLeft() {
        return this.config.queries - this.queryLog.length;
    }

    declaresLeft() {
        return this.config.declares - this.declareLog.length;
    }

    toggleQueryItem(item) {
        if (this.gameOver) return;
        if (this.querySelection.has(item)) {
            this.querySelection.delete(item);
        } else {
            if (this.querySelection.size >= 3) return;
            this.querySelection.add(item);
        }
        this.render();
    }

    submitQuery() {
        if (this.gameOver) return;
        if (this.querySelection.size !== 3 || this.queriesLeft() <= 0) return;

        const items = [...this.querySelection].sort((a, b) => a - b);
        const byRank = [...items].sort((a, b) => this.rankOf[a] - this.rankOf[b]);
        const median = byRank[1];

        this.queryLog.push({ items, median });
        this.querySelection.clear();
        this.render();
    }

    tapDeclareItem(item) {
        if (this.gameOver) return;
        const idx = this.declareOrder.indexOf(item);
        if (idx === 0) return; // top item is locked
        if (idx > 0) {
            this.declareOrder.splice(idx, 1);
        } else if (this.declareOrder.length < this.config.items) {
            this.declareOrder.push(item);
        }
        this.render();
    }

    submitDeclare() {
        if (this.gameOver) return;
        if (this.declaresLeft() <= 0) return;
        if (this.declareOrder.length !== this.config.items) return;

        // Count correct positions among the unknown slots (1..n-1)
        let correct = 0;
        for (let pos = 1; pos < this.config.items; pos++) {
            if (this.declareOrder[pos] === this.ranking[pos]) correct++;
        }

        const isWin = correct === this.config.items - 1;
        this.declareLog.push({ order: [...this.declareOrder], correct });

        if (isWin) {
            this.won = true;
            this.gameOver = true;
            gameEngine.recordResult('triad', true, this.queryLog.length);
            gameEngine.markCompleted('triad');
        } else if (this.declaresLeft() <= 0) {
            this.gameOver = true;
            gameEngine.recordResult('triad', false);
            gameEngine.markCompleted('triad');
        }

        this.render();
        if (this.gameOver) this.showShareSection();
    }

    label(item) {
        return LABELS[item];
    }

    render() {
        this.renderGame();
        this.renderControls();
    }

    renderGame() {
        this.container.innerHTML = '';
        const n = this.config.items;

        // Status bar
        const statusBox = createElement('div', { className: 'game-box mb-4' });
        const statusHeader = createElement('div', { className: 'game-box-header' });
        statusHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: 'HIDDEN RANKING'
        }));
        statusHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-secondary);',
            textContent: `${n} items · ${this.formatFactorial(n - 1)} orderings`
        }));
        statusBox.appendChild(statusHeader);

        const statusContent = createElement('div', {
            className: 'flex justify-between items-center',
            style: 'padding-top: var(--space-3); gap: 16px;'
        });
        statusContent.innerHTML = `
            <div class="text-center" style="flex: 1;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">QUERIES</div>
                <div class="text-mono" style="font-size: 1.25rem; color: ${this.queriesLeft() <= 2 ? 'var(--color-warning)' : 'var(--color-text)'};">${this.queriesLeft()}/${this.config.queries}</div>
            </div>
            <div class="text-center" style="flex: 1;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">DECLARES</div>
                <div class="text-mono" style="font-size: 1.25rem;">${this.declaresLeft()}</div>
            </div>
            <div class="text-center" style="flex: 1;">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">KNOWN #1</div>
                <div class="text-mono" style="font-size: 1.25rem; color: var(--color-accent);">★ ${this.label(this.topItem)}</div>
            </div>
        `;
        statusBox.appendChild(statusContent);
        this.container.appendChild(statusBox);

        // Item chips
        const chipBox = createElement('div', { className: 'game-box mb-4' });
        const chipHeader = createElement('div', { className: 'game-box-header' });
        chipHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: this.mode === 'query' ? 'PICK THREE ITEMS' : 'BUILD YOUR RANKING'
        }));
        chipHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-tertiary);',
            textContent: this.mode === 'query'
                ? `${this.querySelection.size}/3 selected`
                : `${this.declareOrder.length}/${n} placed`
        }));
        chipBox.appendChild(chipHeader);

        const chipRow = createElement('div', {
            className: 'flex gap-2 justify-center',
            style: 'padding: var(--space-3) 0; flex-wrap: wrap;'
        });

        for (let item = 0; item < n; item++) {
            const inQuery = this.querySelection.has(item);
            const declarePos = this.declareOrder.indexOf(item);
            const placed = declarePos >= 0;
            const isTop = item === this.topItem;

            let bg = 'var(--color-surface)';
            let border = 'var(--color-border)';
            let color = 'var(--color-text)';

            if (this.mode === 'query' && inQuery) {
                bg = 'var(--color-accent)';
                border = 'var(--color-accent)';
                color = 'white';
            } else if (this.mode === 'declare' && placed) {
                bg = 'var(--color-bg)';
                border = 'var(--color-border)';
                color = 'var(--color-text-tertiary)';
            }

            const chip = createElement('button', {
                className: 'text-mono',
                'aria-label': `Item ${this.label(item)}`,
                style: `
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    background: ${bg};
                    border: 2px solid ${border};
                    color: ${color};
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.15s ease;
                `
            });
            chip.textContent = this.label(item);

            if (isTop) {
                const star = createElement('span', {
                    style: 'position: absolute; top: -8px; right: -4px; font-size: 0.7rem; color: var(--color-accent);'
                });
                star.textContent = '★';
                chip.appendChild(star);
            }

            if (this.mode === 'declare' && placed) {
                const badge = createElement('span', {
                    className: 'text-mono',
                    style: `position: absolute; bottom: -6px; right: -6px; font-size: 0.65rem;
                        background: ${declarePos === 0 ? 'var(--color-accent)' : 'var(--color-surface-elevated)'};
                        color: ${declarePos === 0 ? 'white' : 'var(--color-text-secondary)'};
                        border: 1px solid var(--color-border-light); border-radius: 8px; padding: 1px 5px;`
                });
                badge.textContent = `${declarePos + 1}`;
                chip.appendChild(badge);
            }

            if (!this.gameOver) {
                chip.addEventListener('click', () => {
                    if (this.mode === 'query') this.toggleQueryItem(item);
                    else this.tapDeclareItem(item);
                });
            }
            chipRow.appendChild(chip);
        }

        chipBox.appendChild(chipRow);

        // Declare order preview
        if (this.mode === 'declare') {
            const orderRow = createElement('div', {
                className: 'text-mono text-center',
                style: 'padding-bottom: var(--space-2); color: var(--color-text-secondary); letter-spacing: 0.1em;'
            });
            const slots = [];
            for (let i = 0; i < n; i++) {
                slots.push(this.declareOrder[i] !== undefined ? this.label(this.declareOrder[i]) : '·');
            }
            orderRow.textContent = `1st  ${slots.join(' › ')}  last`;
            chipBox.appendChild(orderRow);

            const hint = createElement('div', {
                className: 'text-mono text-xs text-center',
                style: 'color: var(--color-text-tertiary);'
            });
            hint.textContent = `★ ${this.label(this.topItem)} is locked at #1. Tap items in order; tap again to remove.`;
            chipBox.appendChild(hint);
        }

        this.container.appendChild(chipBox);

        // History
        if (this.queryLog.length > 0 || this.declareLog.length > 0) {
            const historyBox = createElement('div', { className: 'game-box mb-4' });
            const historyHeader = createElement('div', { className: 'game-box-header' });
            historyHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'EVIDENCE'
            }));
            historyBox.appendChild(historyHeader);

            const list = createElement('div', {
                className: 'flex flex-col gap-2',
                style: 'padding-top: var(--space-2);'
            });

            this.queryLog.forEach((q, idx) => {
                const row = createElement('div', {
                    className: 'flex justify-between items-center text-mono text-sm',
                    style: 'padding: 6px 12px; background: var(--color-surface); border-radius: 4px; border-left: 3px solid var(--color-accent);'
                });
                row.innerHTML = `
                    <span>${idx + 1}. ${q.items.map(i => this.label(i)).join(' · ')}</span>
                    <span>median <strong style="color: var(--color-accent); font-size: 1.1rem;">${this.label(q.median)}</strong></span>
                `;
                list.appendChild(row);
            });

            this.declareLog.forEach((d) => {
                const win = d.correct === this.config.items - 1;
                const row = createElement('div', {
                    className: 'flex justify-between items-center text-mono text-sm',
                    style: `padding: 6px 12px; background: var(--color-surface); border-radius: 4px; border-left: 3px solid var(--color-${win ? 'success' : 'error'});`
                });
                row.innerHTML = `
                    <span>🔺 ${d.order.map(i => this.label(i)).join('›')}</span>
                    <span style="color: var(--color-${win ? 'success' : 'error'});">${d.correct}/${this.config.items - 1} placed</span>
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
            const trueOrder = this.ranking.map(i => this.label(i)).join(' › ');
            if (this.won) {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">Ranking cracked!</div>
                    <div class="text-mono" style="font-size: 1.1rem; color: var(--color-success);">${trueOrder}</div>
                    <div style="color: var(--color-text-secondary); margin-top: 8px;">
                        ${this.queryLog.length} queries, ${this.declareLog.length} declaration${this.declareLog.length === 1 ? '' : 's'}
                    </div>
                `;
            } else {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Out of declarations</div>
                    <div style="color: var(--color-text-secondary);">
                        The ranking was: <span class="text-mono" style="color: var(--color-success);">${trueOrder}</span>
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

        // Mode toggle
        const modeRow = createElement('div', { className: 'flex gap-3' });
        for (const [mode, label] of [['query', '🔺 QUERY'], ['declare', '🏁 DECLARE']]) {
            const active = this.mode === mode;
            const btn = createElement('button', {
                className: active ? 'game-submit' : 'btn btn-secondary',
                textContent: label,
                style: 'flex: 1;'
            });
            btn.addEventListener('click', () => {
                this.mode = mode;
                this.render();
            });
            modeRow.appendChild(btn);
        }
        controlGroup.appendChild(modeRow);

        if (this.mode === 'query') {
            const submitBtn = createElement('button', {
                className: 'game-submit',
                textContent: this.queriesLeft() > 0 ? 'REVEAL MEDIAN' : 'NO QUERIES LEFT'
            });
            if (this.querySelection.size !== 3 || this.queriesLeft() <= 0) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
            } else {
                submitBtn.addEventListener('click', () => this.submitQuery());
            }
            controlGroup.appendChild(submitBtn);
        } else {
            const actionRow = createElement('div', { className: 'flex gap-3' });

            const clearBtn = createElement('button', {
                className: 'btn btn-secondary',
                textContent: 'RESET',
                style: 'flex: 1;'
            });
            clearBtn.addEventListener('click', () => {
                this.declareOrder = [this.topItem];
                this.render();
            });
            actionRow.appendChild(clearBtn);

            const submitBtn = createElement('button', {
                className: 'game-submit',
                textContent: `DECLARE (${this.declaresLeft()} left)`,
                style: 'flex: 2;'
            });
            if (this.declareOrder.length !== this.config.items || this.declaresLeft() <= 0) {
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
        hint.textContent = this.mode === 'query'
            ? 'The median is the middle-ranked of your three picks.'
            : 'A wrong declaration reveals how many items you placed correctly.';
        controlGroup.appendChild(hint);

        this.controls.appendChild(controlGroup);
    }

    formatFactorial(n) {
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return `${n}! = ${result.toLocaleString()}`;
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();
        const queryStr = '🔺'.repeat(this.queryLog.length);
        const declareStr = this.declareLog
            .map(d => d.correct === this.config.items - 1 ? '✓' : `${d.correct}/${this.config.items - 1}`)
            .join(' → ');

        const shareText = `Triad #${puzzleNumber} 🔺\n${this.difficulty === 'hard' ? 'Hard' : 'Standard'} · Queries ${this.queryLog.length}/${this.config.queries}\n${queryStr} → ${declareStr}\n${this.won ? 'Solved!' : 'X'}`;

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
        const hasProgress = (this.queryLog.length > 0 || this.declareLog.length > 0) && !this.gameOver;

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
                    ${option('standard', 'STANDARD', '7 items, 8 queries, 2 declarations')}
                    ${option('hard', 'HARD', '8 items, 10 queries, 1 declaration')}
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

        this.queryLog = [];
        this.declareLog = [];
        this.mode = 'query';
        this.querySelection = new Set();
        this.gameOver = false;
        this.won = false;

        this.init();
        this.shareSection.classList.add('hidden');
    }
}
