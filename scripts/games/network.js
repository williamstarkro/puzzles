/**
 * Network - The Graph Exploration Game (Fog of War Edition)
 * Find a hidden target node in a graph with fog of war.
 * The target may move after each ping!
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';

const DIFFICULTY = {
    easy: {
        nodes: 12,
        minEdges: 15,
        maxEdges: 18,
        pings: 8,
        moveProb: 0,
        showMovement: true
    },
    standard: {
        nodes: 16,
        minEdges: 20,
        maxEdges: 24,
        pings: 9,
        moveProb: 0.4,
        showMovement: true
    },
    hard: {
        nodes: 20,
        minEdges: 26,
        maxEdges: 32,
        pings: 9,
        moveProb: 0.5,
        showMovement: false
    }
};

export class NetworkGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];

        // Graph state
        this.nodes = [];
        this.edges = [];
        this.adjacency = {};

        // Game state
        this.targetNode = null;
        this.startNode = null;
        this.visibleNodes = new Set();
        this.visibleEdges = new Set();
        this.pingedNodes = new Set();
        this.pingHistory = [];
        this.movementCount = 0;

        this.gameOver = false;
        this.won = false;
        this.selectedNode = null;
        this.actionMode = 'ping'; // 'ping' or 'guess'

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();

        // Generate graph
        this.generateGraph(rng);

        // Place target and start nodes
        this.placeNodes(rng);

        // Reveal starting node and its neighborhood
        this.revealNeighborhood(this.startNode);

        this.render();
    }

    generateGraph(rng) {
        const n = this.config.nodes;

        // Create nodes with positions for visualization
        this.nodes = [];
        for (let i = 0; i < n; i++) {
            // Spread nodes randomly across the full container area
            this.nodes.push({
                id: i,
                x: 0.1 + rng.next() * 0.8,  // Random x from 0.1 to 0.9
                y: 0.1 + rng.next() * 0.8   // Random y from 0.1 to 0.9
            });
        }

        // Initialize adjacency
        this.adjacency = {};
        for (let i = 0; i < n; i++) {
            this.adjacency[i] = new Set();
        }

        // Create spanning tree first (ensures connectivity)
        const inTree = new Set([0]);
        const notInTree = new Set();
        for (let i = 1; i < n; i++) notInTree.add(i);

        this.edges = [];

        while (notInTree.size > 0) {
            const from = rng.choice([...inTree]);
            const to = rng.choice([...notInTree]);

            this.edges.push([from, to]);
            this.adjacency[from].add(to);
            this.adjacency[to].add(from);

            inTree.add(to);
            notInTree.delete(to);
        }

        // Add random edges until target density
        const targetEdges = this.config.minEdges +
            Math.floor(rng.next() * (this.config.maxEdges - this.config.minEdges + 1));

        while (this.edges.length < targetEdges) {
            const from = Math.floor(rng.next() * n);
            const to = Math.floor(rng.next() * n);

            if (from !== to && !this.adjacency[from].has(to)) {
                this.edges.push([from, to]);
                this.adjacency[from].add(to);
                this.adjacency[to].add(from);
            }
        }

        // Apply force-directed layout for better visualization
        this.applyForceLayout(rng);
    }

    applyForceLayout(rng) {
        // Force-directed layout with simulated annealing for stability
        const iterations = 100;
        const repulsion = 0.025;     // Very strong repulsion for maximum spread
        const attraction = 0.025;    // Balanced attraction
        const idealDist = 0.4;       // Very large ideal edge length
        const maxVelocity = 0.06;    // Cap velocity to prevent explosion

        // Temperature starts high and decreases (simulated annealing)
        let temperature = 0.12;
        const coolingRate = 0.95;

        // Bounds - minimal padding to use full container
        const padding = 0.02;
        const minX = padding;
        const maxX = 1 - padding;
        const minY = padding;
        const maxY = 1 - padding;

        for (let iter = 0; iter < iterations; iter++) {
            const forces = this.nodes.map(() => ({ x: 0, y: 0 }));

            // Repulsion between all nodes (inverse square law)
            for (let i = 0; i < this.nodes.length; i++) {
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const dx = this.nodes[j].x - this.nodes[i].x;
                    const dy = this.nodes[j].y - this.nodes[i].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const minDist = 0.05;  // Prevent division by tiny numbers
                    const effectiveDist = Math.max(dist, minDist);
                    const force = repulsion / (effectiveDist * effectiveDist);

                    const fx = (dx / effectiveDist) * force;
                    const fy = (dy / effectiveDist) * force;

                    forces[i].x -= fx;
                    forces[i].y -= fy;
                    forces[j].x += fx;
                    forces[j].y += fy;
                }
            }

            // Attraction along edges (spring force toward ideal distance)
            for (const [a, b] of this.edges) {
                const dx = this.nodes[b].x - this.nodes[a].x;
                const dy = this.nodes[b].y - this.nodes[a].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const effectiveDist = Math.max(dist, 0.01);

                // Spring force: pull if too far, push if too close
                const displacement = dist - idealDist;
                const force = displacement * attraction;

                const fx = (dx / effectiveDist) * force;
                const fy = (dy / effectiveDist) * force;

                forces[a].x += fx;
                forces[a].y += fy;
                forces[b].x -= fx;
                forces[b].y -= fy;
            }

            // No center gravity - let nodes spread naturally to fill space

            // Apply forces with temperature scaling and velocity clamping
            for (let i = 0; i < this.nodes.length; i++) {
                // Scale forces by temperature
                let vx = forces[i].x * temperature;
                let vy = forces[i].y * temperature;

                // Clamp velocity to prevent explosions
                const speed = Math.sqrt(vx * vx + vy * vy);
                if (speed > maxVelocity) {
                    vx = (vx / speed) * maxVelocity;
                    vy = (vy / speed) * maxVelocity;
                }

                this.nodes[i].x += vx;
                this.nodes[i].y += vy;

                // Keep in bounds
                this.nodes[i].x = Math.max(minX, Math.min(maxX, this.nodes[i].x));
                this.nodes[i].y = Math.max(minY, Math.min(maxY, this.nodes[i].y));
            }

            // Cool down
            temperature *= coolingRate;
        }

        // Post-process: stretch positions to fill full container width
        const actualMinX = Math.min(...this.nodes.map(n => n.x));
        const actualMaxX = Math.max(...this.nodes.map(n => n.x));
        const actualMinY = Math.min(...this.nodes.map(n => n.y));
        const actualMaxY = Math.max(...this.nodes.map(n => n.y));

        const rangeX = actualMaxX - actualMinX || 1;
        const rangeY = actualMaxY - actualMinY || 1;

        // Scale to use full container (with small padding)
        const targetPadding = 0.04;
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].x = targetPadding + ((this.nodes[i].x - actualMinX) / rangeX) * (1 - 2 * targetPadding);
            this.nodes[i].y = targetPadding + ((this.nodes[i].y - actualMinY) / rangeY) * (1 - 2 * targetPadding);
        }
    }

    placeNodes(rng) {
        const n = this.config.nodes;

        // Calculate eccentricity for each node
        const eccentricities = [];
        for (let i = 0; i < n; i++) {
            const distances = this.bfsDistances(i);
            eccentricities.push(Math.max(...distances.filter(d => d !== Infinity)));
        }

        const medianEcc = [...eccentricities].sort((a, b) => a - b)[Math.floor(n / 2)];

        // Find candidates for target (not too central, not a leaf)
        const targetCandidates = [];
        for (let i = 0; i < n; i++) {
            if (eccentricities[i] >= medianEcc && this.adjacency[i].size >= 2) {
                targetCandidates.push(i);
            }
        }

        this.targetNode = rng.choice(targetCandidates.length > 0 ? targetCandidates : [...Array(n).keys()]);

        // Place start node far from target
        const distFromTarget = this.bfsDistances(this.targetNode);
        const maxDist = Math.max(...distFromTarget.filter(d => d !== Infinity));

        const startCandidates = [];
        for (let i = 0; i < n; i++) {
            if (i !== this.targetNode && distFromTarget[i] >= maxDist / 2) {
                startCandidates.push(i);
            }
        }

        this.startNode = rng.choice(startCandidates.length > 0 ? startCandidates :
            [...Array(n).keys()].filter(i => i !== this.targetNode));
    }

    bfsDistances(start) {
        const distances = new Array(this.nodes.length).fill(Infinity);
        distances[start] = 0;
        const queue = [start];

        while (queue.length > 0) {
            const current = queue.shift();
            for (const neighbor of this.adjacency[current]) {
                if (distances[neighbor] === Infinity) {
                    distances[neighbor] = distances[current] + 1;
                    queue.push(neighbor);
                }
            }
        }

        return distances;
    }

    revealNeighborhood(nodeId) {
        // Reveal all nodes within distance 2
        const distances = this.bfsDistances(nodeId);

        for (let i = 0; i < this.nodes.length; i++) {
            if (distances[i] <= 2) {
                this.visibleNodes.add(i);
            }
        }

        // Reveal edges between visible nodes
        for (const [a, b] of this.edges) {
            if (this.visibleNodes.has(a) && this.visibleNodes.has(b)) {
                this.visibleEdges.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
            }
        }
    }

    ping(nodeId) {
        if (this.gameOver) return;
        if (this.pingHistory.length >= this.config.pings) return;
        if (!this.visibleNodes.has(nodeId)) return;
        if (this.pingedNodes.has(nodeId)) return;

        const distance = this.bfsDistances(nodeId)[this.targetNode];

        this.pingedNodes.add(nodeId);
        this.revealNeighborhood(nodeId);

        // Check for auto-win (pinged the target)
        if (distance === 0) {
            this.pingHistory.push({ node: nodeId, distance: 0, moved: false });
            this.won = true;
            this.gameOver = true;
            gameEngine.recordResult('network', true, this.pingHistory.length);
            gameEngine.markCompleted('network');
            this.render();
            this.showShareSection();
            return;
        }

        // Determine if target moves
        const rng = gameEngine.getRNG();
        let moved = false;

        if (this.config.moveProb > 0 && rng.next() < this.config.moveProb) {
            // Target tries to move to adjacent non-pinged node
            const neighbors = [...this.adjacency[this.targetNode]].filter(n => !this.pingedNodes.has(n));
            if (neighbors.length > 0) {
                this.targetNode = rng.choice(neighbors);
                moved = true;
                this.movementCount++;
            }
        }

        this.pingHistory.push({
            node: nodeId,
            distance,
            moved: this.config.showMovement ? moved : null
        });

        // Check if out of pings
        if (this.pingHistory.length >= this.config.pings) {
            // Don't end game - player can still guess
        }

        this.render();
    }

    guess(nodeId) {
        if (this.gameOver) return;
        if (!this.visibleNodes.has(nodeId)) return;

        this.won = nodeId === this.targetNode;
        this.gameOver = true;

        gameEngine.recordResult('network', this.won, this.pingHistory.length);
        gameEngine.markCompleted('network');

        this.render();
        this.showShareSection();
    }

    getDistanceEmoji(distance) {
        if (distance === 0) return '🎯';
        if (distance === 1) return '🔥';
        if (distance === 2) return '🌡️';
        return `❄️${distance}`;
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
            textContent: 'NETWORK'
        }));
        statusHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: 'color: var(--color-text-secondary);',
            textContent: `${this.config.nodes} nodes, ${this.edges.length} edges`
        }));
        statusBox.appendChild(statusHeader);

        // Pings remaining
        const pingsLeft = this.config.pings - this.pingHistory.length;
        const statusContent = createElement('div', { className: 'flex justify-between items-center mt-3' });
        statusContent.innerHTML = `
            <div>
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">PINGS REMAINING</div>
                <div class="text-mono" style="font-size: 1.5rem; color: ${pingsLeft === 0 ? 'var(--color-warning)' : 'var(--color-text)'};">${pingsLeft}</div>
            </div>
            <div>
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">MODE</div>
                <div class="text-mono" style="font-size: 1rem; color: var(--color-accent);">${this.actionMode.toUpperCase()}</div>
            </div>
        `;
        statusBox.appendChild(statusContent);
        this.container.appendChild(statusBox);

        // Graph visualization
        const graphBox = createElement('div', { className: 'game-box mb-4' });
        const graphContainer = createElement('div', {
            className: 'graph-container',
            style: 'height: 350px;'
        });

        // Draw edges first
        for (const edgeKey of this.visibleEdges) {
            const [a, b] = edgeKey.split('-').map(Number);
            const nodeA = this.nodes[a];
            const nodeB = this.nodes[b];

            const edge = this.createEdgeElement(nodeA, nodeB);
            graphContainer.appendChild(edge);
        }

        // Draw nodes
        for (const nodeId of this.visibleNodes) {
            const node = this.nodes[nodeId];
            const nodeEl = this.createNodeElement(nodeId, node);
            graphContainer.appendChild(nodeEl);
        }

        graphBox.appendChild(graphContainer);
        this.container.appendChild(graphBox);

        // Ping history
        if (this.pingHistory.length > 0) {
            const historyBox = createElement('div', { className: 'game-box mb-4' });
            const historyHeader = createElement('div', { className: 'game-box-header' });
            historyHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'PING HISTORY'
            }));
            historyBox.appendChild(historyHeader);

            const historyContent = createElement('div', {
                className: 'flex flex-wrap gap-2 mt-3',
                style: 'justify-content: center;'
            });

            for (const ping of this.pingHistory) {
                const pingEl = createElement('div', {
                    className: 'text-mono text-sm',
                    style: `
                        padding: 4px 12px;
                        background: var(--color-bg);
                        border: 1px solid var(--color-border);
                        border-radius: 4px;
                        display: flex;
                        gap: 8px;
                        align-items: center;
                    `
                });

                const nodeLabel = createElement('span', {
                    style: 'color: var(--color-text-tertiary);',
                    textContent: `#${ping.node}`
                });

                const distLabel = createElement('span', {
                    textContent: this.getDistanceEmoji(ping.distance)
                });

                pingEl.appendChild(nodeLabel);
                pingEl.appendChild(distLabel);

                if (ping.moved === true) {
                    const moveLabel = createElement('span', {
                        style: 'color: var(--color-warning);',
                        textContent: '🏃'
                    });
                    pingEl.appendChild(moveLabel);
                }

                historyContent.appendChild(pingEl);
            }

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
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">Target Found!</div>
                    <div style="color: var(--color-text-secondary);">
                        Pings used: ${this.pingHistory.length}/${this.config.pings}
                    </div>
                `;
            } else {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Wrong Node!</div>
                    <div style="color: var(--color-text-secondary);">
                        Target was at node #${this.targetNode}
                    </div>
                `;
            }

            resultBox.appendChild(resultText);
            this.container.appendChild(resultBox);
        }
    }

    createEdgeElement(nodeA, nodeB) {
        const container = this.container.querySelector('.graph-container');
        const width = container ? container.offsetWidth : 400;
        const height = container ? container.offsetHeight : 350;

        const x1 = nodeA.x * width;
        const y1 = nodeA.y * height;
        const x2 = nodeB.x * width;
        const y2 = nodeB.y * height;

        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        const edge = createElement('div', {
            className: 'graph-edge visible',
            style: `
                left: ${x1}px;
                top: ${y1}px;
                width: ${length}px;
                transform: rotate(${angle}deg);
            `
        });

        return edge;
    }

    createNodeElement(nodeId, node) {
        const container = this.container.querySelector('.graph-container');
        const width = container ? container.offsetWidth : 400;
        const height = container ? container.offsetHeight : 350;

        const isPinged = this.pingedNodes.has(nodeId);
        const isTarget = this.gameOver && nodeId === this.targetNode;
        const isSelected = this.selectedNode === nodeId;

        let className = 'graph-node';
        if (isPinged) className += ' pinged';
        if (isTarget) className += ' target';

        let style = `
            left: ${node.x * width}px;
            top: ${node.y * height}px;
        `;

        if (isSelected) {
            style += 'border-color: var(--color-accent); box-shadow: 0 0 10px var(--color-accent);';
        }

        const nodeEl = createElement('div', {
            className,
            style
        });

        // Show distance badge if pinged
        if (isPinged) {
            const ping = this.pingHistory.find(p => p.node === nodeId);
            if (ping) {
                const badge = createElement('div', {
                    style: `
                        position: absolute;
                        top: -8px;
                        right: -8px;
                        font-size: 10px;
                        background: var(--color-bg);
                        padding: 2px 4px;
                        border-radius: 4px;
                        border: 1px solid var(--color-border);
                    `,
                    textContent: this.getDistanceEmoji(ping.distance)
                });
                nodeEl.appendChild(badge);
            }
        }

        nodeEl.textContent = nodeId;

        if (!this.gameOver) {
            nodeEl.addEventListener('click', () => {
                if (this.actionMode === 'ping') {
                    if (!this.pingedNodes.has(nodeId)) {
                        this.ping(nodeId);
                    }
                } else {
                    this.guess(nodeId);
                }
            });
        }

        return nodeEl;
    }

    renderControls() {
        this.controls.innerHTML = '';

        if (this.gameOver) return;

        const controlGroup = createElement('div', { className: 'flex flex-col gap-4' });

        // Mode selector
        const modeSelector = createElement('div', {
            className: 'flex gap-2',
            style: 'justify-content: center;'
        });

        const pingBtn = createElement('button', {
            className: 'game-submit',
            style: `
                flex: 1;
                ${this.actionMode === 'ping'
                    ? 'background: var(--color-accent);'
                    : 'background: var(--color-surface); border: 2px solid var(--color-border); color: var(--color-text-secondary);'}
            `,
            textContent: `PING (${this.config.pings - this.pingHistory.length} left)`
        });
        pingBtn.addEventListener('click', () => {
            this.actionMode = 'ping';
            this.render();
        });

        const guessBtn = createElement('button', {
            className: 'game-submit',
            style: `
                flex: 1;
                ${this.actionMode === 'guess'
                    ? 'background: var(--color-success);'
                    : 'background: var(--color-surface); border: 2px solid var(--color-border); color: var(--color-text-secondary);'}
            `,
            textContent: 'GUESS TARGET'
        });
        guessBtn.addEventListener('click', () => {
            this.actionMode = 'guess';
            this.render();
        });

        modeSelector.appendChild(pingBtn);
        modeSelector.appendChild(guessBtn);
        controlGroup.appendChild(modeSelector);

        // Instructions
        const instructions = createElement('div', {
            className: 'text-mono text-xs text-center',
            style: 'color: var(--color-text-tertiary);'
        });

        if (this.actionMode === 'ping') {
            instructions.textContent = 'Click a node to ping it and learn its distance to the target';
        } else {
            instructions.textContent = 'Click the node you think is the target';
        }

        controlGroup.appendChild(instructions);

        // Movement info
        if (this.config.showMovement && this.movementCount > 0) {
            const moveInfo = createElement('div', {
                className: 'text-mono text-xs text-center',
                style: 'color: var(--color-warning);'
            });
            moveInfo.textContent = `Target has moved ${this.movementCount} time${this.movementCount > 1 ? 's' : ''}`;
            controlGroup.appendChild(moveInfo);
        }

        this.controls.appendChild(controlGroup);
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();

        const pingSymbols = this.pingHistory.map(p => {
            let symbol = this.getDistanceEmoji(p.distance);
            if (p.moved === true) symbol += '🏃';
            return symbol;
        }).join('→');

        const shareText = `Network #${puzzleNumber} 🕸️
Mode: ${this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1)}${this.config.moveProb > 0 ? ' (Moving Target)' : ''}
Pings: ${this.pingHistory.length}/${this.config.pings}
${this.movementCount > 0 ? `Moves: ${this.movementCount}\n` : ''}${pingSymbols}
${this.won ? 'Found!' : 'Failed'}`;

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

        const hasProgress = this.pingHistory.length > 0 && !this.gameOver;

        const difficulties = [
            { id: 'easy', name: 'EASY', desc: '12 nodes, 8 pings, static target' },
            { id: 'standard', name: 'STANDARD', desc: '16 nodes, 9 pings, 40% move chance' },
            { id: 'hard', name: 'HARD', desc: '20 nodes, 9 pings, 50% move (hidden)' }
        ];

        body.innerHTML = `
            <div class="settings-section">
                <h4 style="margin-bottom: 12px; color: var(--color-text-secondary);">DIFFICULTY</h4>
                <div class="difficulty-options" style="display: flex; flex-direction: column; gap: 8px;">
                    ${difficulties.map(d => `
                        <button class="difficulty-btn ${this.difficulty === d.id ? 'active' : ''}" data-difficulty="${d.id}" style="
                            padding: 12px 16px;
                            background: ${this.difficulty === d.id ? 'var(--color-accent)' : 'var(--color-surface)'};
                            border: 2px solid ${this.difficulty === d.id ? 'var(--color-accent)' : 'var(--color-border)'};
                            border-radius: 8px;
                            color: ${this.difficulty === d.id ? 'white' : 'var(--color-text)'};
                            cursor: pointer;
                            text-align: left;
                        ">
                            <div style="font-family: var(--font-mono); font-weight: 600;">${d.name}</div>
                            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">${d.desc}</div>
                        </button>
                    `).join('')}
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

        // Reset all game state
        this.nodes = [];
        this.edges = [];
        this.adjacency = {};
        this.targetNode = null;
        this.startNode = null;
        this.visibleNodes = new Set();
        this.visibleEdges = new Set();
        this.pingedNodes = new Set();
        this.pingHistory = [];
        this.movementCount = 0;
        this.gameOver = false;
        this.won = false;
        this.selectedNode = null;
        this.actionMode = 'ping';

        this.init();
        this.shareSection.classList.add('hidden');
    }
}
