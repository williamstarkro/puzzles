/**
 * Cascade - The Cellular Automaton Inference Game
 * Deduce which elementary CA rule governs a 1D grid by observing evolutions.
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';

const DIFFICULTY = {
    standard: {
        gridWidth: 11,
        stepsShown: 6,
        maxQueries: 4
    },
    hard: {
        gridWidth: 11,
        stepsShown: 6,
        maxQueries: 3
    }
};

// All 8 possible 3-cell neighborhoods
const NEIGHBORHOODS = ['111', '110', '101', '100', '011', '010', '001', '000'];

export class CascadeGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];
        this.queries = [];
        this.gameOver = false;
        this.won = false;
        this.guessHistory = [];

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();

        // Pick a random rule (0-255)
        this.rule = Math.floor(rng.next() * 256);

        // Precompute rule table
        this.ruleTable = this.getRuleTable(this.rule);

        // Track which neighborhood patterns we've observed
        this.observedPatterns = new Map(); // pattern -> output

        this.render();
    }

    /**
     * Convert rule number to lookup table
     * Rule N: binary representation tells us what each neighborhood produces
     */
    getRuleTable(ruleNum) {
        const table = {};
        for (let i = 0; i < 8; i++) {
            const pattern = NEIGHBORHOODS[7 - i]; // 000, 001, ..., 111
            const output = (ruleNum >> i) & 1;
            table[pattern] = output;
        }
        return table;
    }

    /**
     * Evolve a grid state one step using the rule
     */
    evolve(state) {
        const n = state.length;
        const next = [];

        for (let i = 0; i < n; i++) {
            // Wraparound boundary
            const left = state[(i - 1 + n) % n];
            const center = state[i];
            const right = state[(i + 1) % n];
            const pattern = `${left}${center}${right}`;
            next.push(this.ruleTable[pattern]);
        }

        return next;
    }

    /**
     * Run evolution and track which patterns appear
     */
    runEvolution(initialState) {
        const history = [initialState];
        let state = initialState;

        for (let step = 0; step < this.config.stepsShown; step++) {
            // Record which patterns appear
            const n = state.length;
            for (let i = 0; i < n; i++) {
                const left = state[(i - 1 + n) % n];
                const center = state[i];
                const right = state[(i + 1) % n];
                const pattern = `${left}${center}${right}`;
                this.observedPatterns.set(pattern, this.ruleTable[pattern]);
            }

            state = this.evolve(state);
            history.push(state);
        }

        return history;
    }

    /**
     * Submit an initial condition query
     */
    query(initialString) {
        if (this.gameOver) return;
        if (this.queries.length >= this.config.maxQueries) return;

        // Parse initial state
        const state = initialString.split('').map(c => parseInt(c, 10));
        if (state.length !== this.config.gridWidth || state.some(c => isNaN(c) || (c !== 0 && c !== 1))) {
            return; // Invalid input
        }

        const history = this.runEvolution(state);
        this.queries.push({ initial: state, history });

        this.render();
    }

    /**
     * Submit a guess for the rule number
     */
    submitGuess(ruleGuess) {
        if (this.gameOver) return;

        const correct = ruleGuess === this.rule;
        this.guessHistory.push({ rule: ruleGuess, correct });

        if (correct) {
            this.won = true;
            this.gameOver = true;
            gameEngine.recordResult('cascade', true, this.queries.length);
            gameEngine.markCompleted('cascade');
        } else {
            this.gameOver = true;
            gameEngine.recordResult('cascade', false);
            gameEngine.markCompleted('cascade');
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

        // Status
        const statusBox = createElement('div', { className: 'game-box mb-4' });
        const statusContent = createElement('div', {
            className: 'flex justify-around',
            style: 'padding: var(--space-3) 0;'
        });

        statusContent.innerHTML = `
            <div class="text-center">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">QUERIES</div>
                <div class="text-mono" style="font-size: 1.25rem;">${this.queries.length}/${this.config.maxQueries}</div>
            </div>
            <div class="text-center">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">PATTERNS SEEN</div>
                <div class="text-mono" style="font-size: 1.25rem;">${this.observedPatterns.size}/8</div>
            </div>
        `;

        statusBox.appendChild(statusContent);
        this.container.appendChild(statusBox);

        // Rule table tracker
        const ruleBox = createElement('div', { className: 'game-box mb-4' });
        const ruleHeader = createElement('div', { className: 'game-box-header' });
        ruleHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: 'RULE TABLE'
        }));
        ruleBox.appendChild(ruleHeader);

        const ruleGrid = createElement('div', {
            className: 'flex gap-2 flex-wrap justify-center',
            style: 'padding: var(--space-3) 0;'
        });

        NEIGHBORHOODS.forEach(pattern => {
            const cell = createElement('div', {
                style: `
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 8px;
                    background: ${this.observedPatterns.has(pattern) ? 'var(--color-surface)' : 'var(--color-bg)'};
                    border: 1px solid ${this.observedPatterns.has(pattern) ? 'var(--color-accent)' : 'var(--color-border)'};
                    border-radius: 4px;
                    min-width: 50px;
                `
            });

            // Show pattern as mini grid
            const patternDisplay = createElement('div', {
                className: 'flex gap-1',
                style: 'margin-bottom: 4px;'
            });
            pattern.split('').forEach(bit => {
                const bitCell = createElement('div', {
                    style: `
                        width: 10px;
                        height: 10px;
                        background: ${bit === '1' ? 'var(--color-text)' : 'var(--color-bg)'};
                        border: 1px solid var(--color-border);
                    `
                });
                patternDisplay.appendChild(bitCell);
            });
            cell.appendChild(patternDisplay);

            // Arrow
            const arrow = createElement('div', {
                className: 'text-mono text-xs',
                style: 'color: var(--color-text-tertiary);'
            });
            arrow.textContent = '↓';
            cell.appendChild(arrow);

            // Output
            const output = createElement('div', {
                style: `
                    width: 10px;
                    height: 10px;
                    background: ${this.observedPatterns.has(pattern)
                        ? (this.observedPatterns.get(pattern) === 1 ? 'var(--color-text)' : 'var(--color-bg)')
                        : 'var(--color-text-tertiary)'};
                    border: 1px solid var(--color-border);
                `
            });
            cell.appendChild(output);

            ruleGrid.appendChild(cell);
        });

        ruleBox.appendChild(ruleGrid);
        this.container.appendChild(ruleBox);

        // Evolution displays
        this.queries.forEach((q, idx) => {
            const evoBox = createElement('div', { className: 'game-box mb-4' });
            const evoHeader = createElement('div', { className: 'game-box-header' });
            evoHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: `EVOLUTION #${idx + 1}`
            }));
            evoBox.appendChild(evoHeader);

            const evoGrid = createElement('div', {
                style: 'display: flex; flex-direction: column; align-items: center; padding: var(--space-3) 0;'
            });

            q.history.forEach((state, step) => {
                const row = createElement('div', {
                    className: 'flex',
                    style: 'margin-bottom: 2px;'
                });

                // Step label
                const stepLabel = createElement('span', {
                    className: 'text-mono text-xs',
                    style: 'width: 24px; text-align: right; margin-right: 8px; color: var(--color-text-tertiary); line-height: 12px;'
                });
                stepLabel.textContent = step;
                row.appendChild(stepLabel);

                // Cells
                state.forEach(bit => {
                    const cell = createElement('div', {
                        className: 'evolution-cell',
                        style: `
                            width: 12px;
                            height: 12px;
                            background: ${bit === 1 ? 'var(--color-accent)' : 'var(--color-surface)'};
                            border: 1px solid var(--color-border);
                        `
                    });
                    row.appendChild(cell);
                });

                evoGrid.appendChild(row);
            });

            evoBox.appendChild(evoGrid);
            this.container.appendChild(evoBox);
        });

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
                    <div class="text-mono" style="font-size: 2rem; color: var(--color-success);">
                        Rule ${this.rule}
                    </div>
                    <div style="color: var(--color-text-secondary); margin-top: 8px;">
                        Identified in ${this.queries.length} queries
                    </div>
                `;
            } else {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Incorrect</div>
                    <div style="color: var(--color-text-secondary);">
                        You guessed: Rule ${this.guessHistory[this.guessHistory.length - 1].rule}
                    </div>
                    <div style="color: var(--color-text-secondary); margin-top: 8px;">
                        The rule was:
                    </div>
                    <div class="text-mono" style="font-size: 2rem; color: var(--color-success); margin-top: 4px;">
                        Rule ${this.rule}
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

        // Query section
        if (this.queries.length < this.config.maxQueries) {
            const querySection = createElement('div', { className: 'flex flex-col gap-2' });

            const queryLabel = createElement('div', {
                className: 'text-mono text-xs',
                style: 'color: var(--color-text-tertiary);'
            });
            queryLabel.textContent = `INITIAL CONDITION (${this.config.gridWidth} bits)`;
            querySection.appendChild(queryLabel);

            const queryRow = createElement('div', { className: 'flex gap-2' });

            const input = createElement('input', {
                type: 'text',
                className: 'game-input text-mono',
                placeholder: '00000100000',
                maxLength: this.config.gridWidth.toString(),
                style: 'flex: 1; letter-spacing: 2px;'
            });

            const presets = createElement('div', { className: 'flex gap-2' });

            // Single cell preset
            const singleBtn = createElement('button', {
                className: 'game-submit',
                textContent: '●',
                title: 'Single cell in center',
                style: 'width: 40px; padding: 0; background: var(--color-surface); border: 2px solid var(--color-border); color: var(--color-text-secondary);'
            });
            singleBtn.addEventListener('click', () => {
                const center = Math.floor(this.config.gridWidth / 2);
                input.value = '0'.repeat(center) + '1' + '0'.repeat(this.config.gridWidth - center - 1);
            });

            // Random preset
            const randomBtn = createElement('button', {
                className: 'game-submit',
                textContent: '?',
                title: 'Random',
                style: 'width: 40px; padding: 0; background: var(--color-surface); border: 2px solid var(--color-border); color: var(--color-text-secondary);'
            });
            randomBtn.addEventListener('click', () => {
                let s = '';
                for (let i = 0; i < this.config.gridWidth; i++) {
                    s += Math.random() < 0.5 ? '0' : '1';
                }
                input.value = s;
            });

            presets.appendChild(singleBtn);
            presets.appendChild(randomBtn);

            const queryBtn = createElement('button', {
                className: 'game-submit',
                textContent: 'RUN',
                style: 'width: auto; padding: 0 24px; background: var(--color-surface); border: 2px solid var(--color-accent); color: var(--color-accent);'
            });

            queryBtn.addEventListener('click', () => {
                this.query(input.value);
                input.value = '';
            });

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.query(input.value);
                    input.value = '';
                }
            });

            queryRow.appendChild(input);
            queryRow.appendChild(presets);
            queryRow.appendChild(queryBtn);
            querySection.appendChild(queryRow);

            controlGroup.appendChild(querySection);
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
        guessLabel.textContent = 'GUESS RULE NUMBER (0-255)';
        guessSection.appendChild(guessLabel);

        const guessRow = createElement('div', { className: 'flex gap-2' });

        const guessInput = createElement('input', {
            type: 'number',
            className: 'game-input',
            placeholder: 'Rule #',
            min: '0',
            max: '255',
            style: 'flex: 1;'
        });

        const guessBtn = createElement('button', {
            className: 'game-submit',
            textContent: 'GUESS',
            style: 'flex: 1;'
        });

        guessBtn.addEventListener('click', () => {
            const rule = parseInt(guessInput.value, 10);
            if (!isNaN(rule) && rule >= 0 && rule <= 255) {
                this.submitGuess(rule);
            }
        });

        guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const rule = parseInt(guessInput.value, 10);
                if (!isNaN(rule) && rule >= 0 && rule <= 255) {
                    this.submitGuess(rule);
                }
            }
        });

        guessRow.appendChild(guessInput);
        guessRow.appendChild(guessBtn);
        guessSection.appendChild(guessRow);

        controlGroup.appendChild(guessSection);
        this.controls.appendChild(controlGroup);
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();

        const shareText = `Cascade #${puzzleNumber}\nQueries: ${this.queries.length}/${this.config.maxQueries}\nPatterns: ${this.observedPatterns.size}/8\n${this.won ? `Identified: Rule ${this.rule}` : `Failed (Rule ${this.rule})`}`;

        resultDiv.textContent = shareText;

        shareBtn.onclick = () => {
            navigator.clipboard.writeText(shareText).then(() => {
                shareBtn.textContent = 'COPIED!';
                setTimeout(() => shareBtn.textContent = 'COPY RESULT', 2000);
            });
        };
    }
}
