/**
 * MATHDLE - Main App Controller
 * Mathematical Wordle Variations
 */

import { gameEngine } from './game-engine.js';
import { Storage } from './utils/storage.js';
import { createElement, formatPercent } from './utils/ui-helpers.js';
import { REFERENCE_GUIDES } from './utils/reference-guides.js?v=3';
import { GAMES, getGamesByCategory, getAvailableGames } from './games/index.js?v=5';

class App {
    constructor() {
        this.currentGame = null;
        this.currentGameInstance = null;
        this.currentCategory = 'all';
        this.init();
    }

    init() {
        this.updatePuzzleDay();
        this.renderGameSelector();
        this.setupEventListeners();
    }

    updatePuzzleDay() {
        const puzzleDay = document.getElementById('puzzle-day');
        if (puzzleDay) {
            const dayNum = gameEngine.getPuzzleNumber();
            puzzleDay.textContent = `Day ${dayNum}`;
        }
    }

    renderGameSelector() {
        const grid = document.getElementById('game-grid');
        grid.innerHTML = '';

        const games = getGamesByCategory(this.currentCategory);
        const availableGames = getAvailableGames();

        games.forEach((game, index) => {
            const stats = gameEngine.getStats(game.id);
            const winRate = stats.gamesPlayed > 0
                ? formatPercent((stats.gamesWon / stats.gamesPlayed) * 100, 0)
                : '--';

            const isAvailable = availableGames.some(g => g.id === game.id);

            const card = createElement('div', {
                className: `game-card ${!isAvailable ? 'coming-soon' : ''}`,
                style: !isAvailable ? 'opacity: 0.6; cursor: not-allowed;' : ''
            });

            if (isAvailable) {
                card.addEventListener('click', () => this.startGame(game.id));
            }

            // Card header
            const header = createElement('div', { className: 'game-card-header' });
            header.appendChild(createElement('span', {
                className: 'game-card-number',
                textContent: `${String(index + 1).padStart(2, '0')}`
            }));
            header.appendChild(createElement('span', {
                className: 'game-card-category',
                textContent: game.category.toUpperCase().replace('-', ' ')
            }));
            card.appendChild(header);

            // Title and tagline
            card.appendChild(createElement('div', {
                className: 'game-card-title',
                textContent: game.name
            }));

            card.appendChild(createElement('div', {
                className: 'game-card-tagline',
                textContent: game.tagline
            }));

            // Description
            card.appendChild(createElement('div', {
                className: 'game-card-description',
                textContent: game.description
            }));

            // Meta info
            const meta = createElement('div', { className: 'game-card-meta' });

            const difficultyItem = createElement('div', { className: 'game-card-meta-item' });
            difficultyItem.appendChild(createElement('span', {
                className: 'game-card-meta-label',
                textContent: 'DIFFICULTY'
            }));
            difficultyItem.appendChild(createElement('span', {
                className: 'game-card-meta-value',
                textContent: game.difficulty
            }));
            meta.appendChild(difficultyItem);

            if (!isAvailable) {
                const statusItem = createElement('div', { className: 'game-card-meta-item' });
                statusItem.appendChild(createElement('span', {
                    className: 'game-card-meta-label',
                    textContent: 'STATUS'
                }));
                statusItem.appendChild(createElement('span', {
                    className: 'game-card-meta-value',
                    style: 'color: var(--color-warning);',
                    textContent: 'COMING SOON'
                }));
                meta.appendChild(statusItem);
            }

            card.appendChild(meta);

            // Stats (if played)
            if (stats.gamesPlayed > 0) {
                const statsDiv = createElement('div', { className: 'game-card-stats' });
                statsDiv.innerHTML = `
                    <span class="game-card-stat">Streak: <strong>${stats.currentStreak}</strong></span>
                    <span class="game-card-stat">Win Rate: <strong>${winRate}</strong></span>
                    <span class="game-card-stat">Played: <strong>${stats.gamesPlayed}</strong></span>
                `;
                card.appendChild(statsDiv);
            }

            grid.appendChild(card);
        });

        // Update category button counts
        this.updateCategoryCounts();
    }

    updateCategoryCounts() {
        const buttons = document.querySelectorAll('.category-btn');
        buttons.forEach(btn => {
            const category = btn.dataset.category;
            const games = getGamesByCategory(category);
            const count = games.length;

            if (category === 'all') {
                btn.textContent = `ALL [${count}]`;
            }

            btn.classList.toggle('active', category === this.currentCategory);
        });
    }

    setupEventListeners() {
        // Back button
        const backButton = document.getElementById('back-button');
        backButton.addEventListener('click', () => this.showGameSelector());

        // Settings button
        const settingsButton = document.getElementById('settings-button');
        settingsButton.addEventListener('click', () => {
            if (this.currentGameInstance && this.currentGameInstance.renderSettingsModal) {
                this.currentGameInstance.renderSettingsModal();
            }
        });

        // Help button
        const helpButton = document.getElementById('help-button');
        helpButton.addEventListener('click', () => this.showReferenceGuide());

        // Reference modal
        const referenceClose = document.getElementById('reference-close');
        const referenceModal = document.getElementById('reference-modal');
        referenceClose.addEventListener('click', () => this.hideReferenceGuide());
        referenceModal.addEventListener('click', (e) => {
            if (e.target === referenceModal) {
                this.hideReferenceGuide();
            }
        });

        // Tutorial
        const tutorialNext = document.getElementById('tutorial-next');
        const tutorialSkip = document.getElementById('tutorial-skip');
        tutorialNext.addEventListener('click', () => this.handleTutorialNext());
        tutorialSkip.addEventListener('click', () => this.hideTutorial());

        // Category navigation
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentCategory = btn.dataset.category;
                this.renderGameSelector();
            });
        });

        // Stats link
        const statsLink = document.getElementById('stats-link');
        if (statsLink) {
            statsLink.addEventListener('click', () => this.showStatsModal());
        }

        // About link
        const aboutLink = document.getElementById('about-link');
        if (aboutLink) {
            aboutLink.addEventListener('click', () => this.showAboutModal());
        }

        // Modal closes
        const settingsClose = document.getElementById('settings-close');
        const settingsModal = document.getElementById('settings-modal');
        if (settingsClose) {
            settingsClose.addEventListener('click', () => this.hideSettingsModal());
        }
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) this.hideSettingsModal();
            });
        }

        const statsClose = document.getElementById('stats-close');
        const statsModal = document.getElementById('stats-modal');
        if (statsClose) {
            statsClose.addEventListener('click', () => this.hideStatsModal());
        }
        if (statsModal) {
            statsModal.addEventListener('click', (e) => {
                if (e.target === statsModal) this.hideStatsModal();
            });
        }

        const aboutClose = document.getElementById('about-close');
        const aboutModal = document.getElementById('about-modal');
        if (aboutClose) {
            aboutClose.addEventListener('click', () => this.hideAboutModal());
        }
        if (aboutModal) {
            aboutModal.addEventListener('click', (e) => {
                if (e.target === aboutModal) this.hideAboutModal();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!referenceModal.classList.contains('hidden')) {
                    this.hideReferenceGuide();
                }
                if (!document.getElementById('tutorial-modal').classList.contains('hidden')) {
                    this.hideTutorial();
                }
                if (settingsModal && !settingsModal.classList.contains('hidden')) {
                    this.hideSettingsModal();
                }
                if (statsModal && !statsModal.classList.contains('hidden')) {
                    this.hideStatsModal();
                }
                if (aboutModal && !aboutModal.classList.contains('hidden')) {
                    this.hideAboutModal();
                }
            }
        });
    }

    startGame(gameId) {
        const gameDef = GAMES.find(g => g.id === gameId);
        if (!gameDef || !gameDef.game) return;

        this.currentGame = gameDef;
        gameEngine.initGame(gameId);

        // Update UI
        document.getElementById('game-selector').classList.remove('active');
        document.getElementById('game-view').classList.add('active');

        // Update header
        const puzzleNumber = gameEngine.getPuzzleNumber();
        document.getElementById('game-name').textContent = gameDef.name;
        document.getElementById('game-day').textContent = `#${puzzleNumber}`;

        // Update stats
        const stats = gameEngine.getStats(gameId);
        document.getElementById('streak-count').textContent = stats.currentStreak;
        const winRate = stats.gamesPlayed > 0
            ? formatPercent((stats.gamesWon / stats.gamesPlayed) * 100, 0)
            : '--';
        document.getElementById('win-rate').textContent = winRate;

        // Initialize game
        const container = document.getElementById('game-container');
        const controls = document.getElementById('game-controls');
        const shareSection = document.getElementById('share-section');

        container.innerHTML = '';
        controls.innerHTML = '';
        shareSection.classList.add('hidden');

        this.currentGameInstance = new gameDef.game(container, controls, shareSection);

        // Show settings button for games that have settings
        const settingsButton = document.getElementById('settings-button');
        if (this.currentGameInstance.renderSettingsModal) {
            settingsButton.style.display = 'flex';
        } else {
            settingsButton.style.display = 'none';
        }

        // Check if first time playing this game
        this.checkFirstTime(gameId);
    }

    showGameSelector() {
        document.getElementById('game-view').classList.remove('active');
        document.getElementById('game-selector').classList.add('active');
        this.currentGame = null;
        this.currentGameInstance = null;
        this.renderGameSelector();
    }

    showReferenceGuide() {
        if (!this.currentGame) return;

        const guide = REFERENCE_GUIDES[this.currentGame.id];

        const modal = document.getElementById('reference-modal');
        const title = document.getElementById('reference-title');
        const body = document.getElementById('reference-body');

        if (guide) {
            title.textContent = guide.title;
            body.innerHTML = guide.content;
        } else {
            title.textContent = `${this.currentGame.name} - Reference`;
            body.innerHTML = `
                <h3>How to Play</h3>
                <p>${this.currentGame.description}</p>
                <h3>Category</h3>
                <p>${this.currentGame.category.replace('-', ' ').toUpperCase()}</p>
                <h3>Difficulty</h3>
                <p>${this.currentGame.difficulty}</p>
            `;
        }

        modal.classList.remove('hidden');
    }

    hideReferenceGuide() {
        document.getElementById('reference-modal').classList.add('hidden');
    }

    showStatsModal() {
        const modal = document.getElementById('stats-modal');
        const body = document.getElementById('stats-body');

        let html = '<div class="stats-grid" style="display: grid; gap: 16px;">';

        const availableGames = getAvailableGames();
        for (const game of availableGames) {
            const stats = gameEngine.getStats(game.id);
            const winRate = stats.gamesPlayed > 0
                ? formatPercent((stats.gamesWon / stats.gamesPlayed) * 100, 0)
                : '--';

            html += `
                <div style="padding: 12px; background: var(--color-bg); border-radius: 8px; border: 1px solid var(--color-border);">
                    <div style="font-family: var(--font-mono); font-size: 0.875rem; color: var(--color-accent); margin-bottom: 8px;">${game.name}</div>
                    <div style="display: flex; gap: 16px; font-size: 0.8rem; color: var(--color-text-secondary);">
                        <span>Played: <strong style="color: var(--color-text);">${stats.gamesPlayed}</strong></span>
                        <span>Won: <strong style="color: var(--color-text);">${stats.gamesWon}</strong></span>
                        <span>Streak: <strong style="color: var(--color-text);">${stats.currentStreak}</strong></span>
                        <span>Best: <strong style="color: var(--color-text);">${stats.maxStreak}</strong></span>
                        <span>Win %: <strong style="color: var(--color-text);">${winRate}</strong></span>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        body.innerHTML = html;

        modal.classList.remove('hidden');
    }

    hideStatsModal() {
        document.getElementById('stats-modal').classList.add('hidden');
    }

    hideSettingsModal() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    updateGameModeDisplay(mode) {
        const gameModeEl = document.getElementById('game-mode');
        if (gameModeEl) {
            gameModeEl.textContent = mode.toUpperCase();
        }
    }

    showAboutModal() {
        document.getElementById('about-modal').classList.remove('hidden');
    }

    hideAboutModal() {
        document.getElementById('about-modal').classList.add('hidden');
    }

    checkFirstTime(gameId) {
        const key = `mathdle_tutorial_${gameId}`;
        const hasSeenTutorial = localStorage.getItem(key) === 'true';

        if (!hasSeenTutorial) {
            setTimeout(() => {
                this.showTutorial(gameId);
            }, 500);
        }
    }

    showTutorial(gameId) {
        const gameDef = GAMES.find(g => g.id === gameId);
        if (!gameDef) return;

        const tutorialSteps = this.getTutorialSteps(gameId, gameDef);
        this.currentTutorialStep = 0;
        this.tutorialSteps = tutorialSteps;

        const modal = document.getElementById('tutorial-modal');
        const title = document.getElementById('tutorial-title');
        const subtitle = document.getElementById('tutorial-subtitle');

        title.textContent = `Welcome to ${gameDef.name}!`;
        subtitle.textContent = gameDef.tagline;

        this.renderTutorialStep();

        modal.classList.remove('hidden');
    }

    getTutorialSteps(gameId, gameDef) {
        const baseSteps = [
            {
                title: 'Welcome!',
                content: `<p>You're about to play <strong>${gameDef.name}</strong>: ${gameDef.description.toLowerCase()}</p>
                <p>This is a mathematical puzzle inspired by Wordle. Each game has unique mechanics and strategy.</p>`
            },
            {
                title: 'How to Play',
                content: `<p>Take your time to understand the game mechanics. Click the <strong>Help</strong> button (?) in the top right for a detailed reference guide.</p>
                <p>Each puzzle is generated daily - everyone plays the same challenge.</p>`
            },
            {
                title: 'Ready to Start',
                content: `<p>Good luck! Remember:</p>
                <ul>
                    <li>Click <strong>Help</strong> anytime for the reference guide</li>
                    <li>Your progress is saved automatically</li>
                    <li>Try to maintain your streak!</li>
                </ul>`
            }
        ];

        // Game-specific first step
        const gameSpecificStep = this.getGameSpecificTutorialStep(gameId);
        if (gameSpecificStep) {
            baseSteps.splice(1, 0, gameSpecificStep);
        }

        return baseSteps;
    }

    getGameSpecificTutorialStep(gameId) {
        const steps = {
            primal: {
                title: 'Prime Factorization',
                content: `<p>Each number has a unique prime factorization. Your guess is compared to the target's exponent vector.</p>
                <p>Example: 72 = 2<sup>3</sup> × 3<sup>2</sup> has exponent vector [3, 2, 0, 0, ...]</p>`
            },
            cipher: {
                title: 'Noisy Intercepts',
                content: `<p>Each intercept has some letters randomly corrupted. Look for patterns across multiple intercepts.</p>
                <p>Letters that appear consistently are likely correct. Build consensus to find the hidden word.</p>`
            },
            partition: {
                title: 'Integer Partitions',
                content: `<p>A partition expresses a number as a sum. For example, 7 = 4+2+1 is the partition [4,2,1].</p>
                <p>Your guess gets Wordle feedback - green means right part in right position.</p>`
            },
            balance: {
                title: 'Balance Scale Logic',
                content: `<p>Use the balance scale to narrow down which coin is fake and whether it's heavy or light.</p>
                <p>Each weighing has 3 possible outcomes - plan strategically!</p>`
            }
        };

        return steps[gameId] || null;
    }

    renderTutorialStep() {
        if (!this.tutorialSteps || this.currentTutorialStep >= this.tutorialSteps.length) {
            this.hideTutorial();
            return;
        }

        const step = this.tutorialSteps[this.currentTutorialStep];
        const body = document.getElementById('tutorial-body');
        const nextButton = document.getElementById('tutorial-next');

        body.innerHTML = `
            <div class="tutorial-step">
                <h3>
                    <span class="tutorial-step-number">${this.currentTutorialStep + 1}</span>
                    ${step.title}
                </h3>
                ${step.content}
            </div>
        `;

        if (this.currentTutorialStep === this.tutorialSteps.length - 1) {
            nextButton.textContent = 'Got it!';
        } else {
            nextButton.textContent = 'Next';
        }
    }

    handleTutorialNext() {
        this.currentTutorialStep++;

        if (this.currentTutorialStep >= this.tutorialSteps.length) {
            this.hideTutorial();
        } else {
            this.renderTutorialStep();
        }
    }

    hideTutorial() {
        const modal = document.getElementById('tutorial-modal');
        modal.classList.add('hidden');

        // Mark tutorial as seen
        if (this.currentGame) {
            const key = `mathdle_tutorial_${this.currentGame.id}`;
            localStorage.setItem(key, 'true');
        }
    }
}

// Initialize app when DOM is ready
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            try {
                new App();
            } catch (error) {
                console.error('Error initializing app:', error);
                document.getElementById('game-grid').innerHTML =
                    '<div style="text-align: center; padding: 2rem; color: #f44336; grid-column: 1 / -1;">' +
                    '<p>Error loading games. Please check the browser console.</p>' +
                    '<p style="font-size: 0.875rem; margin-top: 1rem;">Make sure you\'re serving this page via HTTP (not file://).</p>' +
                    '<p style="font-size: 0.875rem;">Try: <code>python3 -m http.server 8000</code> then visit <code>http://localhost:8000</code></p>' +
                    '</div>';
            }
        });
    } else {
        try {
            new App();
        } catch (error) {
            console.error('Error initializing app:', error);
            document.getElementById('game-grid').innerHTML =
                '<div style="text-align: center; padding: 2rem; color: #f44336; grid-column: 1 / -1;">' +
                '<p>Error loading games. Please check the browser console.</p>' +
                '<p style="font-size: 0.875rem; margin-top: 1rem;">Make sure you\'re serving this page via HTTP (not file://).</p>' +
                '<p style="font-size: 0.875rem;">Try: <code>python3 -m http.server 8000</code> then visit <code>http://localhost:8000</code></p>' +
                '</div>';
        }
    }
} catch (error) {
    console.error('Fatal error:', error);
}
