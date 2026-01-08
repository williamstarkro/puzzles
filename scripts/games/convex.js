/**
 * Convex - The Hidden Polygon Game
 * Discover a hidden convex polygon by probing with points and rays.
 */

import { gameEngine } from '../game-engine.js';
import { createElement } from '../utils/ui-helpers.js';

const DIFFICULTY = {
    standard: {
        gridSize: 15,
        minVertices: 4,
        maxVertices: 6,
        maxProbes: 15
    },
    hard: {
        gridSize: 20,
        minVertices: 5,
        maxVertices: 8,
        maxProbes: 15
    }
};

export class ConvexGame {
    constructor(container, controls, shareSection) {
        this.container = container;
        this.controls = controls;
        this.shareSection = shareSection;
        this.difficulty = 'standard';
        this.config = DIFFICULTY[this.difficulty];
        this.probes = [];
        this.probeCount = 0;
        this.gameOver = false;
        this.won = false;
        this.guessVertices = [];
        this.guessMode = false; // Toggle between probe mode and guess mode

        this.init();
    }

    init() {
        const rng = gameEngine.getRNG();
        const size = this.config.gridSize;

        // Generate random convex polygon
        const numVertices = this.config.minVertices +
            Math.floor(rng.next() * (this.config.maxVertices - this.config.minVertices + 1));

        this.vertices = this.generateConvexPolygon(rng, numVertices, size);

        this.render();
    }

    /**
     * Generate a random convex polygon with n vertices on a grid
     */
    generateConvexPolygon(rng, n, gridSize) {
        // Generate random points and compute convex hull
        const margin = 2;
        const points = [];

        // Generate more points than needed
        for (let i = 0; i < n * 3; i++) {
            points.push({
                x: margin + Math.floor(rng.next() * (gridSize - 2 * margin)),
                y: margin + Math.floor(rng.next() * (gridSize - 2 * margin))
            });
        }

        // Compute convex hull using Graham scan
        const hull = this.convexHull(points);

        // If we got enough vertices, use them; otherwise retry
        if (hull.length >= n) {
            // Take first n vertices
            return hull.slice(0, n);
        }

        // Fallback: generate a regular polygon
        const cx = gridSize / 2;
        const cy = gridSize / 2;
        const radius = (gridSize / 2) - margin;
        const vertices = [];

        for (let i = 0; i < n; i++) {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            vertices.push({
                x: Math.round(cx + radius * Math.cos(angle)),
                y: Math.round(cy + radius * Math.sin(angle))
            });
        }

        return vertices;
    }

    /**
     * Compute convex hull using Graham scan
     */
    convexHull(points) {
        if (points.length < 3) return points;

        // Find bottom-most point (or leftmost in case of tie)
        let start = 0;
        for (let i = 1; i < points.length; i++) {
            if (points[i].y > points[start].y ||
                (points[i].y === points[start].y && points[i].x < points[start].x)) {
                start = i;
            }
        }

        // Swap to first position
        [points[0], points[start]] = [points[start], points[0]];
        const pivot = points[0];

        // Sort by polar angle
        const sorted = points.slice(1).sort((a, b) => {
            const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
            const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
            return angleA - angleB;
        });

        // Build hull
        const hull = [pivot];

        for (const p of sorted) {
            while (hull.length > 1 && this.cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0) {
                hull.pop();
            }
            hull.push(p);
        }

        return hull;
    }

    cross(o, a, b) {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }

    /**
     * Check if a point is inside the polygon
     */
    isInside(x, y) {
        const n = this.vertices.length;
        let inside = true;

        for (let i = 0; i < n; i++) {
            const v1 = this.vertices[i];
            const v2 = this.vertices[(i + 1) % n];

            const cross = (v2.x - v1.x) * (y - v1.y) - (v2.y - v1.y) * (x - v1.x);

            if (cross < 0) {
                inside = false;
                break;
            }
        }

        return inside;
    }

    /**
     * Check if point is exactly on an edge
     */
    isOnBoundary(x, y) {
        const n = this.vertices.length;
        const epsilon = 0.001;

        for (let i = 0; i < n; i++) {
            const v1 = this.vertices[i];
            const v2 = this.vertices[(i + 1) % n];

            // Check if point is on segment v1-v2
            const d1 = Math.sqrt((x - v1.x) ** 2 + (y - v1.y) ** 2);
            const d2 = Math.sqrt((x - v2.x) ** 2 + (y - v2.y) ** 2);
            const d12 = Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2);

            if (Math.abs(d1 + d2 - d12) < epsilon) {
                return true;
            }
        }

        return false;
    }

    /**
     * Probe a point
     */
    probePoint(x, y) {
        if (this.gameOver) return;
        if (this.probeCount >= this.config.maxProbes) return;

        let result;
        if (this.isOnBoundary(x, y)) {
            result = 'boundary';
        } else if (this.isInside(x, y)) {
            result = 'inside';
        } else {
            result = 'outside';
        }

        this.probes.push({ type: 'point', x, y, result });
        this.probeCount += 1;

        this.render();
    }

    /**
     * Cast a ray and find distance to boundary
     */
    probeRay(x, y, angle) {
        if (this.gameOver) return;
        if (this.probeCount + 2 > this.config.maxProbes) return; // Ray costs 2

        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        let minDist = Infinity;
        let hitPoint = null;

        // Check intersection with each edge
        const n = this.vertices.length;
        for (let i = 0; i < n; i++) {
            const v1 = this.vertices[i];
            const v2 = this.vertices[(i + 1) % n];

            const dist = this.raySegmentIntersect(x, y, dx, dy, v1, v2);
            if (dist !== null && dist > 0.001 && dist < minDist) {
                minDist = dist;
                hitPoint = { x: x + dx * dist, y: y + dy * dist };
            }
        }

        this.probes.push({
            type: 'ray',
            x, y,
            angle,
            distance: minDist === Infinity ? null : minDist,
            hitPoint
        });
        this.probeCount += 2;

        this.render();
    }

    /**
     * Ray-segment intersection
     */
    raySegmentIntersect(rx, ry, dx, dy, v1, v2) {
        const ex = v2.x - v1.x;
        const ey = v2.y - v1.y;

        const denom = dx * ey - dy * ex;
        if (Math.abs(denom) < 0.0001) return null;

        const t = ((v1.x - rx) * ey - (v1.y - ry) * ex) / denom;
        const s = ((v1.x - rx) * dy - (v1.y - ry) * dx) / denom;

        if (t >= 0 && s >= 0 && s <= 1) {
            return t;
        }

        return null;
    }

    /**
     * Toggle between probe mode and guess mode
     */
    toggleGuessMode() {
        this.guessMode = !this.guessMode;
        this.render();
    }

    /**
     * Add a vertex to the guess list
     */
    addGuessVertex(x, y) {
        // Don't add duplicates
        const exists = this.guessVertices.some(v => v.x === x && v.y === y);
        if (!exists && this.guessVertices.length < this.vertices.length) {
            this.guessVertices.push({ x, y });
            this.render();
        }
    }

    /**
     * Remove a vertex from the guess list
     */
    removeGuessVertex(index) {
        this.guessVertices.splice(index, 1);
        this.render();
    }

    /**
     * Clear all guessed vertices
     */
    clearGuessVertices() {
        this.guessVertices = [];
        this.render();
    }

    /**
     * Submit guess for vertices
     */
    submitGuess(vertices) {
        if (this.gameOver) return;

        // Check if guess matches (order-independent, but same set of points)
        const targetSet = new Set(this.vertices.map(v => `${v.x},${v.y}`));
        const guessSet = new Set(vertices.map(v => `${v.x},${v.y}`));

        const correct = targetSet.size === guessSet.size &&
            [...targetSet].every(v => guessSet.has(v));

        if (correct) {
            this.won = true;
            this.gameOver = true;
            gameEngine.recordResult('convex', true, this.probeCount);
            gameEngine.markCompleted('convex');
        } else {
            this.gameOver = true;
            gameEngine.recordResult('convex', false);
            gameEngine.markCompleted('convex');
        }

        this.guessVertices = vertices;
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
        const size = this.config.gridSize;
        const cellSize = Math.min(24, Math.floor(300 / size));

        // Status
        const statusBox = createElement('div', { className: 'game-box mb-4' });
        const statusContent = createElement('div', {
            className: 'flex justify-around',
            style: 'padding: var(--space-3) 0;'
        });

        statusContent.innerHTML = `
            <div class="text-center">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">PROBES</div>
                <div class="text-mono" style="font-size: 1.25rem;">${this.probeCount}/${this.config.maxProbes}</div>
            </div>
            <div class="text-center">
                <div class="text-mono text-xs" style="color: var(--color-text-tertiary);">VERTICES</div>
                <div class="text-mono" style="font-size: 1.25rem;">?/${this.vertices.length}</div>
            </div>
        `;

        statusBox.appendChild(statusContent);
        this.container.appendChild(statusBox);

        // Grid display
        const gridBox = createElement('div', { className: 'game-box mb-4' });
        const gridHeader = createElement('div', { className: 'game-box-header' });
        gridHeader.appendChild(createElement('span', {
            className: 'game-box-title',
            textContent: 'GRID'
        }));
        gridHeader.appendChild(createElement('span', {
            className: 'text-mono text-xs',
            style: `color: ${this.guessMode ? '#a855f7' : 'var(--color-text-secondary)'};`,
            textContent: this.guessMode ? 'Click to mark vertex guess' : 'Click to probe point (cost: 1)'
        }));
        gridBox.appendChild(gridHeader);

        const gridContainer = createElement('div', {
            style: `
                display: flex;
                justify-content: center;
                padding: var(--space-4);
                overflow: auto;
            `
        });

        // Create canvas for rendering
        const canvas = createElement('canvas', {
            width: (size * cellSize).toString(),
            height: (size * cellSize).toString(),
            style: `
                border: 1px solid var(--color-border);
                cursor: crosshair;
                background: var(--color-bg);
            `
        });

        const ctx = canvas.getContext('2d');

        // Draw grid
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= size; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, size * cellSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(size * cellSize, i * cellSize);
            ctx.stroke();
        }

        // Draw probes
        this.probes.forEach(probe => {
            if (probe.type === 'point') {
                const px = probe.x * cellSize + cellSize / 2;
                const py = (size - 1 - probe.y) * cellSize + cellSize / 2;

                ctx.beginPath();
                ctx.arc(px, py, 4, 0, 2 * Math.PI);
                ctx.fillStyle = probe.result === 'inside' ? '#22c55e' :
                    probe.result === 'boundary' ? '#f97316' : '#ef4444';
                ctx.fill();
            } else if (probe.type === 'ray') {
                const px = probe.x * cellSize + cellSize / 2;
                const py = (size - 1 - probe.y) * cellSize + cellSize / 2;

                ctx.beginPath();
                ctx.arc(px, py, 3, 0, 2 * Math.PI);
                ctx.fillStyle = '#3b82f6';
                ctx.fill();

                if (probe.hitPoint) {
                    const hx = probe.hitPoint.x * cellSize + cellSize / 2;
                    const hy = (size - 1 - probe.hitPoint.y) * cellSize + cellSize / 2;

                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(hx, hy);
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(hx, hy, 4, 0, 2 * Math.PI);
                    ctx.fillStyle = '#f97316';
                    ctx.fill();
                }
            }
        });

        // If game is over, draw the actual polygon
        if (this.gameOver) {
            ctx.beginPath();
            const v0 = this.vertices[0];
            ctx.moveTo(v0.x * cellSize + cellSize / 2, (size - 1 - v0.y) * cellSize + cellSize / 2);
            for (let i = 1; i < this.vertices.length; i++) {
                const v = this.vertices[i];
                ctx.lineTo(v.x * cellSize + cellSize / 2, (size - 1 - v.y) * cellSize + cellSize / 2);
            }
            ctx.closePath();
            ctx.strokeStyle = this.won ? '#22c55e' : '#f97316';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = this.won ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)';
            ctx.fill();

            // Draw vertices
            this.vertices.forEach(v => {
                const vx = v.x * cellSize + cellSize / 2;
                const vy = (size - 1 - v.y) * cellSize + cellSize / 2;
                ctx.beginPath();
                ctx.arc(vx, vy, 5, 0, 2 * Math.PI);
                ctx.fillStyle = this.won ? '#22c55e' : '#f97316';
                ctx.fill();
            });
        }

        // Draw guessed vertices (before game over)
        if (!this.gameOver && this.guessVertices.length > 0) {
            this.guessVertices.forEach((v, i) => {
                const vx = v.x * cellSize + cellSize / 2;
                const vy = (size - 1 - v.y) * cellSize + cellSize / 2;

                // Draw diamond shape for guessed vertices
                ctx.beginPath();
                ctx.moveTo(vx, vy - 6);
                ctx.lineTo(vx + 6, vy);
                ctx.lineTo(vx, vy + 6);
                ctx.lineTo(vx - 6, vy);
                ctx.closePath();
                ctx.fillStyle = '#a855f7'; // Purple for guesses
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        }

        // Handle click for point probe or vertex guess
        if (!this.gameOver) {
            canvas.addEventListener('click', (e) => {
                const rect = canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;

                const gridX = Math.floor(mx / cellSize);
                const gridY = size - 1 - Math.floor(my / cellSize);

                if (gridX >= 0 && gridX < size && gridY >= 0 && gridY < size) {
                    if (this.guessMode) {
                        this.addGuessVertex(gridX, gridY);
                    } else {
                        this.probePoint(gridX, gridY);
                    }
                }
            });
        }

        gridContainer.appendChild(canvas);
        gridBox.appendChild(gridContainer);
        this.container.appendChild(gridBox);

        // Probe history
        if (this.probes.length > 0) {
            const historyBox = createElement('div', { className: 'game-box mb-4' });
            const historyHeader = createElement('div', { className: 'game-box-header' });
            historyHeader.appendChild(createElement('span', {
                className: 'game-box-title',
                textContent: 'PROBE HISTORY'
            }));
            historyBox.appendChild(historyHeader);

            const historyContent = createElement('div', {
                className: 'flex flex-col gap-1',
                style: 'max-height: 150px; overflow-y: auto; padding: var(--space-2) 0;'
            });

            this.probes.forEach((p, i) => {
                const row = createElement('div', {
                    className: 'text-mono text-sm flex justify-between',
                    style: 'padding: 4px 8px;'
                });

                if (p.type === 'point') {
                    row.innerHTML = `
                        <span>(${p.x}, ${p.y})</span>
                        <span style="color: ${p.result === 'inside' ? 'var(--color-success)' :
                        p.result === 'boundary' ? 'var(--color-warning)' : 'var(--color-error)'};">
                            ${p.result.toUpperCase()}
                        </span>
                    `;
                } else {
                    row.innerHTML = `
                        <span>Ray (${p.x}, ${p.y}) @ ${Math.round(p.angle * 180 / Math.PI)}°</span>
                        <span style="color: var(--color-accent);">
                            ${p.distance !== null ? `d = ${p.distance.toFixed(2)}` : 'miss'}
                        </span>
                    `;
                }

                historyContent.appendChild(row);
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

            const vertexStr = this.vertices.map(v => `(${v.x},${v.y})`).join(', ');

            if (this.won) {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px;">Solved!</div>
                    <div class="text-mono text-sm" style="color: var(--color-text-secondary);">
                        ${vertexStr}
                    </div>
                    <div style="color: var(--color-text-secondary); margin-top: 8px;">
                        Found in ${this.probeCount} probe points
                    </div>
                `;
            } else {
                resultText.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-error);">Game Over</div>
                    <div style="color: var(--color-text-secondary);">
                        The polygon vertices were:
                    </div>
                    <div class="text-mono text-sm" style="color: var(--color-success); margin-top: 4px;">
                        ${vertexStr}
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

        // Mode toggle button
        const modeSection = createElement('div', { className: 'flex gap-2 justify-center' });

        const probeBtn = createElement('button', {
            className: 'btn',
            textContent: 'PROBE MODE',
            style: `
                flex: 1;
                padding: 8px 16px;
                background: ${!this.guessMode ? 'var(--color-accent)' : 'var(--color-surface)'};
                border: 2px solid var(--color-accent);
                color: ${!this.guessMode ? 'white' : 'var(--color-accent)'};
                font-family: var(--font-mono);
                font-size: 0.75rem;
            `
        });
        probeBtn.addEventListener('click', () => {
            if (this.guessMode) this.toggleGuessMode();
        });
        modeSection.appendChild(probeBtn);

        const guessBtn = createElement('button', {
            className: 'btn',
            textContent: 'GUESS MODE',
            style: `
                flex: 1;
                padding: 8px 16px;
                background: ${this.guessMode ? '#a855f7' : 'var(--color-surface)'};
                border: 2px solid #a855f7;
                color: ${this.guessMode ? 'white' : '#a855f7'};
                font-family: var(--font-mono);
                font-size: 0.75rem;
            `
        });
        guessBtn.addEventListener('click', () => {
            if (!this.guessMode) this.toggleGuessMode();
        });
        modeSection.appendChild(guessBtn);

        controlGroup.appendChild(modeSection);

        if (!this.guessMode) {
            // Ray probe section (only in probe mode)
            const raySection = createElement('div', { className: 'flex flex-col gap-2' });

            const rayLabel = createElement('div', {
                className: 'text-mono text-xs',
                style: 'color: var(--color-text-tertiary);'
            });
            rayLabel.textContent = 'RAY PROBE (cost: 2)';
            raySection.appendChild(rayLabel);

            const rayRow = createElement('div', { className: 'flex gap-2 items-center flex-wrap' });

            const fromLabel = createElement('span', {
                className: 'text-mono text-xs',
                style: 'color: var(--color-text-tertiary);'
            });
            fromLabel.textContent = 'From:';
            rayRow.appendChild(fromLabel);

            const xInput = createElement('input', {
                type: 'number',
                className: 'game-input',
                placeholder: 'x',
                min: '0',
                max: (this.config.gridSize - 1).toString(),
                style: 'width: 50px; text-align: center;'
            });
            rayRow.appendChild(xInput);

            const yInput = createElement('input', {
                type: 'number',
                className: 'game-input',
                placeholder: 'y',
                min: '0',
                max: (this.config.gridSize - 1).toString(),
                style: 'width: 50px; text-align: center;'
            });
            rayRow.appendChild(yInput);

            const angleLabel = createElement('span', {
                className: 'text-mono text-xs',
                style: 'color: var(--color-text-tertiary);'
            });
            angleLabel.textContent = 'Angle:';
            rayRow.appendChild(angleLabel);

            const angleInput = createElement('input', {
                type: 'number',
                className: 'game-input',
                placeholder: '°',
                min: '0',
                max: '360',
                style: 'width: 60px; text-align: center;'
            });
            rayRow.appendChild(angleInput);

            const rayBtn = createElement('button', {
                className: 'game-submit',
                textContent: 'CAST',
                style: 'width: auto; padding: 0 16px; background: var(--color-surface); border: 2px solid var(--color-accent); color: var(--color-accent);'
            });

            rayBtn.addEventListener('click', () => {
                const x = parseInt(xInput.value, 10);
                const y = parseInt(yInput.value, 10);
                const angle = parseFloat(angleInput.value) * Math.PI / 180;

                if (!isNaN(x) && !isNaN(y) && !isNaN(angle)) {
                    this.probeRay(x, y, angle);
                }
            });

            rayRow.appendChild(rayBtn);
            raySection.appendChild(rayRow);
            controlGroup.appendChild(raySection);
        } else {
            // Vertex guess section (only in guess mode)
            const guessSection = createElement('div', { className: 'flex flex-col gap-2' });

            const guessLabel = createElement('div', {
                className: 'text-mono text-xs',
                style: 'color: #a855f7;'
            });
            guessLabel.textContent = `GUESSED VERTICES (${this.guessVertices.length}/${this.vertices.length})`;
            guessSection.appendChild(guessLabel);

            // Display guessed vertices
            const verticesList = createElement('div', {
                className: 'flex flex-wrap gap-2',
                style: 'min-height: 36px; padding: 8px; background: var(--color-surface); border-radius: 4px;'
            });

            if (this.guessVertices.length === 0) {
                verticesList.innerHTML = '<span style="color: var(--color-text-tertiary); font-size: 0.8rem;">Click on grid to mark vertices...</span>';
            } else {
                this.guessVertices.forEach((v, i) => {
                    const chip = createElement('div', {
                        className: 'text-mono text-sm',
                        style: `
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            padding: 4px 8px;
                            background: #a855f7;
                            color: white;
                            border-radius: 4px;
                            cursor: pointer;
                        `
                    });
                    chip.innerHTML = `(${v.x},${v.y}) <span style="opacity: 0.7;">×</span>`;
                    chip.addEventListener('click', () => this.removeGuessVertex(i));
                    verticesList.appendChild(chip);
                });
            }

            guessSection.appendChild(verticesList);

            // Action buttons
            const actionRow = createElement('div', { className: 'flex gap-2' });

            const clearBtn = createElement('button', {
                className: 'btn',
                textContent: 'CLEAR',
                style: `
                    flex: 1;
                    padding: 8px;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    color: var(--color-text);
                    font-family: var(--font-mono);
                    font-size: 0.75rem;
                `
            });
            clearBtn.addEventListener('click', () => this.clearGuessVertices());
            actionRow.appendChild(clearBtn);

            const submitBtn = createElement('button', {
                className: 'game-submit',
                textContent: 'SUBMIT GUESS',
                style: `
                    flex: 2;
                    background: ${this.guessVertices.length === this.vertices.length ? '#a855f7' : 'var(--color-surface)'};
                    border: 2px solid #a855f7;
                    color: ${this.guessVertices.length === this.vertices.length ? 'white' : '#a855f7'};
                    opacity: ${this.guessVertices.length === this.vertices.length ? '1' : '0.5'};
                `
            });

            if (this.guessVertices.length === this.vertices.length) {
                submitBtn.addEventListener('click', () => this.submitGuess(this.guessVertices));
            } else {
                submitBtn.disabled = true;
            }

            actionRow.appendChild(submitBtn);
            guessSection.appendChild(actionRow);
            controlGroup.appendChild(guessSection);
        }

        // Legend
        const legend = createElement('div', {
            className: 'flex gap-3 justify-center flex-wrap text-mono text-xs',
            style: 'color: var(--color-text-tertiary);'
        });
        legend.innerHTML = `
            <span><span style="color: var(--color-success);">●</span> Inside</span>
            <span><span style="color: var(--color-warning);">●</span> Boundary</span>
            <span><span style="color: var(--color-error);">●</span> Outside</span>
            <span><span style="color: var(--color-accent);">●</span> Ray</span>
            <span><span style="color: #a855f7;">◆</span> Guess</span>
        `;
        controlGroup.appendChild(legend);

        this.controls.appendChild(controlGroup);
    }

    showShareSection() {
        this.shareSection.classList.remove('hidden');

        const resultDiv = this.shareSection.querySelector('#share-result');
        const shareBtn = this.shareSection.querySelector('#share-button');

        const puzzleNumber = gameEngine.getPuzzleNumber();
        const pointProbes = this.probes.filter(p => p.type === 'point').length;
        const rayProbes = this.probes.filter(p => p.type === 'ray').length;

        const shareText = `Convex #${puzzleNumber}\nGrid: ${this.config.gridSize}x${this.config.gridSize}\nProbes: ${this.probeCount}/${this.config.maxProbes}\nPoints: ${pointProbes}, Rays: ${rayProbes}\n${this.won ? `Found ${this.vertices.length}-gon!` : 'Failed'}`;

        resultDiv.textContent = shareText;

        shareBtn.onclick = () => {
            navigator.clipboard.writeText(shareText).then(() => {
                shareBtn.textContent = 'COPIED!';
                setTimeout(() => shareBtn.textContent = 'COPY RESULT', 2000);
            });
        };
    }
}
