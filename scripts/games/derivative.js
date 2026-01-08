/**
 * Derivative - The Polynomial Interrogation Game
 * Identify a hidden polynomial by querying its value or derivatives at chosen points.
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';

const DIFFICULTY = {
    standard: {
        degree: 3,
        coeffMin: -10,
        coeffMax: 10,
        budget: 8
    },
    hard: {
        degree: 4,
        coeffMin: -10,
        coeffMax: 10,
        budget: 9
    }
};

export class DerivativeGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];
        this.queries = [];
        this.budgetUsed = 0;
        this.gameOver = false;
        this.won = false;
        this.guessHistory = [];

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();
        const d = this.config.degree;

        // Generate random polynomial coefficients [a_d, a_{d-1}, ..., a_1, a_0]
        // Ensure leading coefficient is non-zero
        this.coeffs = [];
        for (let i = 0; i <= d; i++) {
            let coeff;
            if (i === 0) {
                // Leading coefficient - non-zero
                do {
                    coeff = Math.floor(rng.next() * (this.config.coeffMax - this.config.coeffMin + 1)) + this.config.coeffMin;
                } while (coeff === 0);
            } else {
                coeff = Math.floor(rng.next() * (this.config.coeffMax - this.config.coeffMin + 1)) + this.config.coeffMin;
            }
            this.coeffs.push(coeff);
        }

        this.render();
    }

    /**
     * Evaluate polynomial at x
     * coeffs = [a_d, a_{d-1}, ..., a_1, a_0]
     * f(x) = a_d * x^d + a_{d-1} * x^{d-1} + ... + a_1 * x + a_0
     */
    evaluate(x) {
        let result = 0;
        const d = this.config.degree;
        for (let i = 0; i <= d; i++) {
            result += this.coeffs[i] * Math.pow(x, d - i);
        }
        return result;
    }

    /**
     * Evaluate k-th derivative at x
     */
    evaluateDerivative(x, k) {
        if (k === 0) return this.evaluate(x);

        const d = this.config.degree;

        // Compute coefficients of k-th derivative
        // Original: a_d * x^d + a_{d-1} * x^{d-1} + ...
        // 1st derivative: d*a_d * x^{d-1} + (d-1)*a_{d-1} * x^{d-2} + ...
        let derivCoeffs = [...this.coeffs];

        for (let j = 0; j < k; j++) {
            const newCoeffs = [];
            for (let i = 0; i < derivCoeffs.length - 1; i++) {
                const power = derivCoeffs.length - 1 - i;
                newCoeffs.push(derivCoeffs[i] * power);
            }
            derivCoeffs = newCoeffs;
            if (derivCoeffs.length === 0) return 0;
        }

        // Evaluate derivative polynomial
        let result = 0;
        const newDegree = derivCoeffs.length - 1;
        for (let i = 0; i <= newDegree; i++) {
            result += derivCoeffs[i] * Math.pow(x, newDegree - i);
        }
        return result;
    }

    query(x, derivOrder) {
        if (this.gameOver) return;

        const cost = derivOrder + 1; // f costs 1, f' costs 2, f'' costs 3
        if (this.budgetUsed + cost > this.config.budget) return;

        const value = this.evaluateDerivative(x, derivOrder);
        this.queries.push({ x, derivOrder, value, cost });
        this.budgetUsed += cost;

        this.render();
    }

    submitGuess(guessCoeffs) {
        if (this.gameOver) return;

        // Check if guess matches
        const correct = guessCoeffs.length === this.coeffs.length &&
            guessCoeffs.every((c, i) => c === this.coeffs[i]);

        this.guessHistory.push({ coeffs: guessCoeffs, correct });

        if (correct) {
            this.won = true;
            this.gameOver = true;
            gameEngine.recordResult('derivative', true, this.budgetUsed);
            gameEngine.markCompleted('derivative');
        } else {
            // Wrong guess ends the game
            this.gameOver = true;
            gameEngine.recordResult('derivative', false);
            gameEngine.markCompleted('derivative');
        }

        this.render();

        if (this.gameOver) {
            this.showShareSection();
        }
    }

    formatPolynomial(coeffs) {
        const d = coeffs.length - 1;
        const parts = [];

        for (let i = 0; i <= d; i++) {
            const coeff = coeffs[i];
            const power = d - i;

            if (coeff === 0) continue;

            let term = '';
            if (parts.length === 0) {
                term = coeff < 0 ? '-' : '';
            } else {
                term = coeff < 0 ? ' - ' : ' + ';
            }

            const absCoeff = Math.abs(coeff);

            if (power === 0) {
                term += absCoeff;
            } else if (power === 1) {
                term += (absCoeff === 1 ? '' : absCoeff) + 'x';
            } else {
                term += (absCoeff === 1 ? '' : absCoeff) + 'x' + this.superscript(power);
            }

            parts.push(term);
        }

        return parts.length > 0 ? parts.join('') : '0';
    }

    superscript(n) {
        const supers = '⁰¹²³⁴⁵⁶⁷⁸⁹';
        return String(n).split('').map(d => supers[parseInt(d)]).join('');
    }

    render() {
        this.renderGame();
        this.renderControls();
    }

    renderGame() {
        this.container.innerHTML = '';
        const d = this.config.degree;

        // Status
        const statusBox = createElement('div', { className: 'game-box mb-4' });
        const statusHeader = createElement('div', { className: 'game-box-header' });
        statusHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: 'HIDDEN POLYNOMIAL'
        }));
        statusHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-secondary);',
            textContent: `Degree ≤ ${d}, coefficients in [${this.config.coeffMin}, ${this.config.coeffMax}]`
        }));
        statusBox.appendChild(statusHeader);

        const statusContent = createElement('div', {
            className: 'flex justify-around',
            style: 'padding: var(--space-4) 0;'
        });

        statusContent.innerHTML = `
            <div class="text-center">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">BUDGET</div>
                <div class="text-mono" style="font-size: 1.5rem;">${this.config.budget - this.budgetUsed}/${this.config.budget}</div>
            </div>
            <div class="text-center">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">QUERIES</div>
                <div class="text-mono" style="font-size: 1.5rem;">${this.queries.length}</div>
            </div>
        `;

        statusBox.appendChild(statusContent);
        this.container.appendChild(statusBox);

        // Query history
        if (this.queries.length > 0) {
            const queryBox = createElement('div', { className: 'game-box mb-4' });
            const queryHeader = createElement('div', { className: 'game-box-header' });
            queryHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'QUERY RESULTS'
            }));
            queryBox.appendChild(queryHeader);

            const queryContent = createElement('div', { className: 'flex flex-col gap-2' });

            this.queries.forEach(q => {
                const row = createElement('div', {
                    className: 'flex justify-between items-center',
                    style: `
                        padding: 8px 12px;
                        background: var(--color-surface);
                        border-radius: 4px;
                        border-left: 3px solid var(--color-accent);
                    `
                });

                const queryLabel = createElement('span', { className: 'text-mono' });
                const derivLabel = q.derivOrder === 0 ? 'f' :
                    q.derivOrder === 1 ? "f'" :
                    q.derivOrder === 2 ? "f''" : `f${"'".repeat(q.derivOrder)}`;
                queryLabel.textContent = `${derivLabel}(${q.x})`;

                const valueLabel = createElement('span', {
                    className: 'text-mono',
                    style: 'font-weight: bold;'
                });
                valueLabel.textContent = `= ${q.value}`;

                const costLabel = createElement('span', {
                    className: 'text-mono text-xs',
                    style: 'color: var(--color-text-tertiary);'
                });
                costLabel.textContent = `(cost: ${q.cost})`;

                row.appendChild(queryLabel);
                row.appendChild(valueLabel);
                row.appendChild(costLabel);
                queryContent.appendChild(row);
            });

            queryBox.appendChild(queryContent);
            this.container.appendChild(queryBox);
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

            const polyStr = this.formatPolynomial(this.coeffs);

            if (this.won) {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">Solved!</div>
                    <div class="text-mono" style="font-size: 1.25rem; color: var(--color-success);">
                        f(x) = ${polyStr}
                    </div>
                    <div style="color: var(--color-text-secondary); margin-top: 8px;">
                        Budget used: ${this.budgetUsed}/${this.config.budget}
                    </div>
                `;
            } else {
                const guessStr = this.guessHistory.length > 0
                    ? this.formatPolynomial(this.guessHistory[this.guessHistory.length - 1].coeffs)
                    : '(no guess)';

                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Incorrect</div>
                    <div style="color: var(--color-text-secondary);">
                        Your guess: <span class="text-mono">${guessStr}</span>
                    </div>
                    <div style="color: var(--color-text-secondary); margin-top: 8px;">
                        The polynomial was:
                    </div>
                    <div class="text-mono" style="font-size: 1.25rem; color: var(--color-success); margin-top: 4px;">
                        f(x) = ${polyStr}
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
        const querySection = createElement('div', { className: 'flex flex-col gap-2' });

        const queryLabel = createElement('div', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-tertiary);'
        });
        queryLabel.textContent = 'QUERY';
        querySection.appendChild(queryLabel);

        const queryRow = createElement('div', { className: 'flex gap-2 items-center flex-wrap' });

        // Query type selector
        const typeSelect = createElement('select', {
            className: 'game-input',
            style: 'width: 100px;'
        });
        ['f(x) (1pt)', "f'(x) (2pt)", "f''(x) (3pt)"].forEach((label, i) => {
            const opt = createElement('option', { value: i.toString() });
            opt.textContent = label;
            typeSelect.appendChild(opt);
        });
        queryRow.appendChild(typeSelect);

        const atLabel = createElement('span', {
            className: 'text-mono',
            style: 'color: var(--color-text-tertiary);'
        });
        atLabel.textContent = 'at x =';
        queryRow.appendChild(atLabel);

        const xInput = createElement('input', {
            type: 'number',
            className: 'game-input',
            placeholder: 'x',
            style: 'width: 80px; text-align: center;'
        });
        queryRow.appendChild(xInput);

        const queryBtn = createElement('button', {
            className: 'game-submit',
            textContent: 'QUERY',
            style: 'width: auto; padding: 0 16px; background: var(--color-surface); border: 2px solid var(--color-accent); color: var(--color-accent);'
        });

        queryBtn.addEventListener('click', () => {
            const x = parseFloat(xInput.value);
            const derivOrder = parseInt(typeSelect.value, 10);
            if (!isNaN(x)) {
                this.query(x, derivOrder);
                xInput.value = '';
            }
        });

        xInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const x = parseFloat(xInput.value);
                const derivOrder = parseInt(typeSelect.value, 10);
                if (!isNaN(x)) {
                    this.query(x, derivOrder);
                    xInput.value = '';
                }
            }
        });

        queryRow.appendChild(queryBtn);
        querySection.appendChild(queryRow);
        controlGroup.appendChild(querySection);

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
        guessLabel.textContent = `GUESS COEFFICIENTS [a${this.superscript(this.config.degree)}, a${this.superscript(this.config.degree - 1)}, ..., a₁, a₀]`;
        guessSection.appendChild(guessLabel);

        const guessRow = createElement('div', { className: 'flex gap-2 items-center flex-wrap' });

        const coeffInputs = [];
        for (let i = 0; i <= this.config.degree; i++) {
            const power = this.config.degree - i;
            const input = createElement('input', {
                type: 'number',
                className: 'game-input coefficient-input',
                placeholder: `a${this.subscript(power)}`,
                style: 'width: 60px; text-align: center;'
            });
            coeffInputs.push(input);
            guessRow.appendChild(input);
        }

        const guessBtn = createElement('button', {
            className: 'game-submit',
            textContent: 'GUESS',
            style: 'flex: 1;'
        });

        guessBtn.addEventListener('click', () => {
            const coeffs = coeffInputs.map(inp => parseInt(inp.value, 10));
            if (coeffs.every(c => !isNaN(c))) {
                this.submitGuess(coeffs);
            }
        });

        guessRow.appendChild(guessBtn);
        guessSection.appendChild(guessRow);

        const hintText = createElement('div', {
            className: 'text-mono text-xs text-center',
            style: 'color: var(--color-text-tertiary);'
        });
        hintText.textContent = 'One guess only! Make it count.';
        guessSection.appendChild(hintText);

        controlGroup.appendChild(guessSection);
        this.controls.appendChild(controlGroup);
    }

    subscript(n) {
        const subscripts = '₀₁₂₃₄₅₆₇₈₉';
        return String(n).split('').map(d => subscripts[parseInt(d)]).join('');
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();
        const queryStr = this.queries.map(q => {
            const derivLabel = q.derivOrder === 0 ? 'f' : `f${"'".repeat(q.derivOrder)}`;
            return `${derivLabel}(${q.x})=${q.value}`;
        }).join(', ');

        const shareText = `Derivative #${puzzleNumber}\nDegree: ${this.config.degree}\nBudget: ${this.budgetUsed}/${this.config.budget}\n${this.won ? 'Solved!' : 'Failed'}\n${this.won ? 'f(x) = ' + this.formatPolynomial(this.coeffs) : ''}`;

        resultDiv.textContent = shareText;

        shareBtn.onclick = () => {
            navigator.clipboard.writeText(shareText).then(() => {
                shareBtn.textContent = 'COPIED!';
                setTimeout(() => shareBtn.textContent = 'COPY RESULT', 2000);
            });
        };
    }
}
