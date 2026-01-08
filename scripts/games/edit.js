/**
 * Edit - The Distance Triangulation Game
 * Find a hidden word using only Levenshtein edit distance feedback.
 * No colors, no positional hints—just a single number.
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';
import { WORD_LIST, WORD_SET } from '../utils/words.js';

const DIFFICULTY = {
    standard: {
        maxGuesses: 8,
        distanceType: 'levenshtein',
        label: 'STANDARD',
        description: '8 guesses, Levenshtein distance'
    },
    hard: {
        maxGuesses: 6,
        distanceType: 'levenshtein',
        label: 'HARD',
        description: '6 guesses, Levenshtein distance'
    },
    clockwork: {
        maxGuesses: 8,
        distanceType: 'clockwork',
        label: 'CLOCKWORK',
        description: 'Cyclic distance with magnitude + spin'
    },
    residue: {
        maxGuesses: 10,
        distanceType: 'residue',
        label: 'RESIDUE',
        description: 'Cyclic distance mod 13 (ambiguous!)'
    },
    primes: {
        maxGuesses: 8,
        distanceType: 'primes',
        label: 'PRIMES',
        description: 'Position-weighted by primes (2,3,5,7,11)'
    },
    torus: {
        maxGuesses: 8,
        distanceType: 'torus',
        label: 'TORUS',
        description: 'Euclidean distance on 5-torus'
    }
};

/**
 * Compute Levenshtein edit distance between two strings
 */
function levenshteinDistance(a, b) {
    const m = a.length;
    const n = b.length;

    // Create DP table
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    // Base cases
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    // Fill table
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],     // deletion
                    dp[i][j - 1],     // insertion
                    dp[i - 1][j - 1]  // substitution
                );
            }
        }
    }

    return dp[m][n];
}

/**
 * Compute cyclic (circular alphabet) distance for a single letter pair
 * Returns signed distance: positive = clockwise, negative = counter-clockwise
 */
function cyclicLetterDistance(a, b) {
    const aVal = a.charCodeAt(0) - 65;
    const bVal = b.charCodeAt(0) - 65;
    let diff = bVal - aVal;

    // Wrap to range [-13, +13] (shortest path on circle)
    if (diff > 13) diff -= 26;
    if (diff < -13) diff += 26;

    return diff;
}

/**
 * Clockwork distance: returns magnitude (total arc) and spin (net direction)
 */
function clockworkDistance(guess, target) {
    let magnitude = 0;
    let spin = 0;

    for (let i = 0; i < 5; i++) {
        const diff = cyclicLetterDistance(guess[i], target[i]);
        magnitude += Math.abs(diff);
        spin += diff;
    }

    return { magnitude, spin };
}

/**
 * Residue distance: cyclic distance mod 13 (creates ambiguity)
 */
function residueDistance(guess, target) {
    let total = 0;
    for (let i = 0; i < 5; i++) {
        total += Math.abs(cyclicLetterDistance(guess[i], target[i]));
    }
    return total % 13;
}

/**
 * Prime-weighted distance: positions weighted by primes (2,3,5,7,11)
 */
function primesDistance(guess, target) {
    const weights = [2, 3, 5, 7, 11];
    let total = 0;

    for (let i = 0; i < 5; i++) {
        const dist = Math.abs(cyclicLetterDistance(guess[i], target[i]));
        total += dist * weights[i];
    }

    return total;
}

/**
 * Torus distance: Euclidean distance on 5-dimensional torus
 */
function torusDistance(guess, target) {
    let sumSquares = 0;

    for (let i = 0; i < 5; i++) {
        const dist = Math.abs(cyclicLetterDistance(guess[i], target[i]));
        sumSquares += dist * dist;
    }

    return Math.sqrt(sumSquares);
}

export class EditGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];
        this.guesses = [];
        this.gameOver = false;
        this.won = false;

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();

        // Select target word
        this.target = rng.choice(WORD_LIST);

        this.render();
    }

    isValidWord(word) {
        return WORD_SET.has(word.toUpperCase());
    }

    submitGuess(guess) {
        if (this.gameOver) return;

        const word = guess.toUpperCase().trim();

        if (word.length !== 5) {
            this.showError('Enter a 5-letter word');
            return;
        }

        if (!this.isValidWord(word)) {
            this.showError('Not in word list');
            return;
        }

        // Compute distance based on mode
        const distanceType = this.config.distanceType;
        let distance;
        let isWin = false;

        switch (distanceType) {
            case 'clockwork':
                distance = clockworkDistance(word, this.target);
                isWin = distance.magnitude === 0;
                break;
            case 'residue':
                distance = residueDistance(word, this.target);
                // For residue, 0 could be ambiguous (0 mod 13), so check actual match
                isWin = word === this.target;
                break;
            case 'primes':
                distance = primesDistance(word, this.target);
                isWin = distance === 0;
                break;
            case 'torus':
                distance = torusDistance(word, this.target);
                isWin = distance === 0;
                break;
            default: // levenshtein
                distance = levenshteinDistance(word, this.target);
                isWin = distance === 0;
        }

        this.guesses.push({ word, distance });

        if (isWin) {
            this.won = true;
            this.gameOver = true;
            gameEngine.recordResult('edit', true, this.guesses.length);
            gameEngine.markCompleted('edit');
        } else if (this.guesses.length >= this.config.maxGuesses) {
            this.gameOver = true;
            gameEngine.recordResult('edit', false);
            gameEngine.markCompleted('edit');
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

        // Current distance display (most recent)
        if (this.guesses.length > 0 && !this.gameOver) {
            const lastGuess = this.guesses[this.guesses.length - 1];
            const distanceBox = createElement('div', { className: 'game-box mb-4' });
            const distanceContent = createElement('div', {
                className: 'text-center',
                style: 'padding: var(--space-6);'
            });

            const distanceLabel = createElement('div', {
                className: 'text-mono text-xs',
                style: 'color: var(--color-text-tertiary); margin-bottom: 8px;'
            });
            distanceLabel.textContent = this.getDistanceLabel();

            // Handle different distance display formats
            if (this.config.distanceType === 'clockwork') {
                // Clockwork: show magnitude and spin side by side
                const dualDisplay = createElement('div', {
                    className: 'flex justify-center gap-8',
                    style: 'margin-bottom: 8px;'
                });

                const magBox = createElement('div', { className: 'text-center' });
                const magLabel = createElement('div', {
                    className: 'text-mono text-xs',
                    style: 'color: var(--color-text-tertiary);'
                });
                magLabel.textContent = 'MAGNITUDE';
                const magValue = createElement('div', {
                    className: 'text-mono',
                    style: `font-size: 3rem; font-weight: bold; color: ${this.getDistanceColor(lastGuess.distance.magnitude)};`
                });
                magValue.textContent = lastGuess.distance.magnitude;
                magBox.appendChild(magLabel);
                magBox.appendChild(magValue);

                const spinBox = createElement('div', { className: 'text-center' });
                const spinLabel = createElement('div', {
                    className: 'text-mono text-xs',
                    style: 'color: var(--color-text-tertiary);'
                });
                spinLabel.textContent = 'SPIN';
                const spinValue = createElement('div', {
                    className: 'text-mono',
                    style: `font-size: 3rem; font-weight: bold; color: ${this.getSpinColor(lastGuess.distance.spin)};`
                });
                const spinSign = lastGuess.distance.spin > 0 ? '+' : '';
                const spinArrow = lastGuess.distance.spin > 0 ? ' →' : lastGuess.distance.spin < 0 ? ' ←' : '';
                spinValue.textContent = `${spinSign}${lastGuess.distance.spin}${spinArrow}`;
                spinBox.appendChild(spinLabel);
                spinBox.appendChild(spinValue);

                dualDisplay.appendChild(magBox);
                dualDisplay.appendChild(spinBox);
                distanceContent.appendChild(distanceLabel);
                distanceContent.appendChild(dualDisplay);
            } else if (this.config.distanceType === 'torus') {
                // Torus: show with 1 decimal place
                distanceContent.appendChild(distanceLabel);
                const distanceValue = createElement('div', {
                    className: 'text-mono',
                    style: `font-size: 4rem; font-weight: bold; color: ${this.getDistanceColor(lastGuess.distance)};`
                });
                distanceValue.textContent = lastGuess.distance.toFixed(1);
                distanceContent.appendChild(distanceValue);
            } else {
                // Standard numeric display (levenshtein, residue, primes)
                distanceContent.appendChild(distanceLabel);
                const distanceValue = createElement('div', {
                    className: 'text-mono',
                    style: `font-size: 4rem; font-weight: bold; color: ${this.getDistanceColor(lastGuess.distance)};`
                });
                distanceValue.textContent = lastGuess.distance;
                distanceContent.appendChild(distanceValue);
            }

            const distanceHint = createElement('div', {
                className: 'text-mono text-sm',
                style: 'color: var(--color-text-secondary); margin-top: 8px;'
            });
            distanceHint.textContent = this.getDistanceHint(lastGuess.distance);
            distanceContent.appendChild(distanceHint);

            distanceBox.appendChild(distanceContent);
            this.container.appendChild(distanceBox);
        }

        // Guess history
        const historyBox = createElement('div', { className: 'game-box mb-4' });
        const historyHeader = createElement('div', { className: 'game-box-header' });
        historyHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: `GUESSES (${this.guesses.length}/${this.config.maxGuesses})`
        }));
        historyBox.appendChild(historyHeader);

        const historyContent = createElement('div', { style: 'padding-top: var(--space-2);' });

        if (this.guesses.length === 0) {
            const emptyMsg = createElement('div', {
                className: 'text-center text-mono text-sm',
                style: 'color: var(--color-text-tertiary); padding: var(--space-4);'
            });
            emptyMsg.textContent = 'Make your first guess to see the distance';
            historyContent.appendChild(emptyMsg);
        } else {
            // Show trajectory
            const trajectory = createElement('div', {
                className: 'flex gap-2 justify-center items-center flex-wrap',
                style: 'margin-bottom: var(--space-4);'
            });

            this.guesses.forEach((g, i) => {
                if (i > 0) {
                    const arrow = createElement('span', {
                        style: 'color: var(--color-text-tertiary);'
                    });
                    arrow.textContent = '→';
                    trajectory.appendChild(arrow);
                }
                const dist = createElement('span', {
                    className: 'text-mono',
                    style: `
                        padding: 4px 8px;
                        border-radius: 4px;
                        background: var(--color-surface);
                        color: ${this.getDistanceColor(this.getDisplayDistance(g.distance))};
                        font-weight: bold;
                    `
                });
                dist.textContent = this.formatDistance(g.distance);
                trajectory.appendChild(dist);
            });

            historyContent.appendChild(trajectory);

            // Full history list
            const historyList = createElement('div', { className: 'flex flex-col gap-2' });

            this.guesses.forEach((g, i) => {
                const row = createElement('div', {
                    className: 'flex justify-between items-center',
                    style: `
                        padding: 8px 12px;
                        background: var(--color-surface);
                        border-radius: 4px;
                        border-left: 3px solid ${this.getDistanceColor(this.getDisplayDistance(g.distance))};
                    `
                });

                const wordSpan = createElement('span', { className: 'text-mono' });
                wordSpan.textContent = g.word;

                const distSpan = createElement('span', {
                    className: 'text-mono',
                    style: `color: ${this.getDistanceColor(this.getDisplayDistance(g.distance))}; font-weight: bold;`
                });
                distSpan.textContent = this.formatDistance(g.distance);

                row.appendChild(wordSpan);
                row.appendChild(distSpan);
                historyList.appendChild(row);
            });

            historyContent.appendChild(historyList);
        }

        historyBox.appendChild(historyContent);
        this.container.appendChild(historyBox);

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
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">Found it!</div>
                    <div class="text-mono" style="font-size: 2rem; color: var(--color-success);">${this.target}</div>
                    <div style="color: var(--color-text-secondary); margin-top: 8px;">
                        Triangulated in ${this.guesses.length} guesses
                    </div>
                `;
            } else {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Out of guesses</div>
                    <div style="color: var(--color-text-secondary);">
                        The word was: <span class="text-mono" style="color: var(--color-success);">${this.target}</span>
                    </div>
                `;
            }

            resultBox.appendChild(resultText);
            this.container.appendChild(resultBox);
        }
    }

    getDistanceLabel() {
        switch (this.config.distanceType) {
            case 'clockwork': return 'CYCLIC DISTANCE';
            case 'residue': return 'DISTANCE MOD 13';
            case 'primes': return 'PRIME-WEIGHTED DISTANCE';
            case 'torus': return 'TORUS DISTANCE';
            default: return 'EDIT DISTANCE';
        }
    }

    // Get the primary numeric value for color coding
    getDisplayDistance(distance) {
        if (this.config.distanceType === 'clockwork') {
            return distance.magnitude;
        }
        return distance;
    }

    // Format distance for display in trajectory/history
    formatDistance(distance) {
        if (this.config.distanceType === 'clockwork') {
            const sign = distance.spin > 0 ? '+' : '';
            return `${distance.magnitude}/${sign}${distance.spin}`;
        }
        if (this.config.distanceType === 'torus') {
            return distance.toFixed(1);
        }
        return distance;
    }

    getDistanceColor(distance) {
        // Handle different modes with appropriate thresholds
        const type = this.config.distanceType;

        if (type === 'levenshtein') {
            if (distance === 0) return 'var(--color-success)';
            if (distance === 1) return 'var(--color-warning)';
            if (distance <= 2) return 'var(--color-accent)';
            return 'var(--color-text-secondary)';
        }

        if (type === 'clockwork' || type === 'residue') {
            // Cyclic magnitude: 0-65 possible, but typically <30
            if (distance === 0) return 'var(--color-success)';
            if (distance <= 5) return 'var(--color-warning)';
            if (distance <= 15) return 'var(--color-accent)';
            return 'var(--color-text-secondary)';
        }

        if (type === 'primes') {
            // Prime-weighted: 0 to 364 max, typical ~100-200
            if (distance === 0) return 'var(--color-success)';
            if (distance <= 30) return 'var(--color-warning)';
            if (distance <= 80) return 'var(--color-accent)';
            return 'var(--color-text-secondary)';
        }

        if (type === 'torus') {
            // Torus: 0 to ~29 max
            if (distance === 0) return 'var(--color-success)';
            if (distance <= 3) return 'var(--color-warning)';
            if (distance <= 8) return 'var(--color-accent)';
            return 'var(--color-text-secondary)';
        }

        return 'var(--color-text-secondary)';
    }

    getSpinColor(spin) {
        if (spin === 0) return 'var(--color-success)';
        if (Math.abs(spin) <= 10) return 'var(--color-warning)';
        return 'var(--color-text-secondary)';
    }

    getDistanceHint(distance) {
        const type = this.config.distanceType;

        if (type === 'clockwork') {
            const mag = distance.magnitude;
            const spin = distance.spin;
            if (mag === 0) return 'Perfect match!';
            if (mag <= 5) return spin === mag ? 'All shifts same direction!' : 'Very close';
            if (Math.abs(spin) < mag / 2) return 'Shifts canceling out';
            return spin > 0 ? 'Net clockwise' : 'Net counter-clockwise';
        }

        if (type === 'residue') {
            if (distance === 0) return 'Distance ≡ 0 (mod 13) — could be 0, 13, 26...';
            return `Distance ≡ ${distance} (mod 13)`;
        }

        if (type === 'primes') {
            if (distance === 0) return 'Perfect match!';
            if (distance <= 30) return 'Very close — check late positions';
            if (distance <= 80) return 'Moderate distance';
            return 'Last positions matter most (×11, ×7)';
        }

        if (type === 'torus') {
            if (distance === 0) return 'Perfect match!';
            if (distance <= 3) return 'Very close — small total deviation';
            if (distance <= 8) return 'Getting warmer';
            return 'Large deviation somewhere';
        }

        // Levenshtein default
        if (distance === 0) return 'Perfect match!';
        if (distance === 1) return 'One edit away!';
        if (distance === 2) return 'Very close';
        if (distance === 3) return 'Getting warmer';
        if (distance === 4) return 'In the neighborhood';
        return 'Far away';
    }

    getHintText() {
        switch (this.config.distanceType) {
            case 'clockwork':
                return 'Magnitude = total arc, Spin = net rotation (+ clockwise)';
            case 'residue':
                return 'Distance mod 13 — beware ambiguity!';
            case 'primes':
                return 'Positions weighted by primes: 2, 3, 5, 7, 11';
            case 'torus':
                return 'Euclidean distance on circular alphabet';
            default:
                return 'Feedback is edit distance only — no colors, no positions';
        }
    }

    renderControls() {
        this.controls.innerHTML = '';

        if (this.gameOver) return;

        const inputGroup = createElement('div', { className: 'flex flex-col gap-3' });

        const inputRow = createElement('div', { className: 'flex gap-3' });

        const input = createElement('input', {
            type: 'text',
            className: 'game-input',
            placeholder: 'Enter a 5-letter word',
            maxLength: '5',
            style: 'flex: 1; text-transform: uppercase;'
        });

        const submitBtn = createElement('button', {
            className: 'game-submit',
            textContent: 'GUESS',
            style: 'width: auto; padding: 0 24px;'
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitGuess(input.value);
                input.value = '';
            }
        });

        submitBtn.addEventListener('click', () => {
            this.submitGuess(input.value);
            input.value = '';
        });

        inputRow.appendChild(input);
        inputRow.appendChild(submitBtn);
        inputGroup.appendChild(inputRow);

        // Hint text
        const hint = createElement('div', {
            className: 'text-mono text-xs text-center',
            style: 'color: var(--color-text-tertiary);'
        });
        hint.textContent = this.getHintText();
        inputGroup.appendChild(hint);

        this.controls.appendChild(inputGroup);

        // Focus input
        setTimeout(() => input.focus(), 100);
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();
        const trajectory = this.guesses.map(g => this.formatDistance(g.distance)).join(' → ');

        // Include mode in share text for non-standard modes
        const modeLabel = this.config.distanceType !== 'levenshtein'
            ? ` [${this.config.label}]`
            : '';

        const shareText = `Edit #${puzzleNumber}${modeLabel}\n${trajectory}${this.won ? ' → 0' : ''}\n${this.won ? `Solved in ${this.guesses.length}/${this.config.maxGuesses}!` : `X/${this.config.maxGuesses}`}`;

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

        const hasProgress = this.guesses.length > 0 && !this.gameOver;

        // Generate buttons for all modes
        const modes = Object.entries(DIFFICULTY);
        const modeButtons = modes.map(([key, config]) => {
            const isActive = this.difficulty === key;
            return `
                <button class="difficulty-btn ${isActive ? 'active' : ''}" data-difficulty="${key}" style="
                    padding: 12px 16px;
                    background: ${isActive ? 'var(--color-accent)' : 'var(--color-surface)'};
                    border: 2px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'};
                    border-radius: 8px;
                    color: ${isActive ? 'white' : 'var(--color-text)'};
                    cursor: pointer;
                    text-align: left;
                ">
                    <div style="font-family: var(--font-mono); font-weight: 600;">${config.label}</div>
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">${config.description}</div>
                </button>
            `;
        }).join('');

        body.innerHTML = `
            <div class="settings-section">
                <h4 style="margin-bottom: 12px; color: var(--color-text-secondary);">MODE</h4>
                <div class="difficulty-options" style="display: flex; flex-direction: column; gap: 8px;">
                    ${modeButtons}
                </div>
                ${hasProgress ? '<p style="margin-top: 12px; font-size: 0.8rem; color: var(--color-warning);">Changing mode will reset your current game</p>' : ''}
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
        this.guesses = [];
        this.gameOver = false;
        this.won = false;

        this.init();
        this.shareSection.classList.add('hidden');
    }
}
