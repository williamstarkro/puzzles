/**
 * DOM manipulation utilities
 */

/**
 * Create an element with attributes and children
 */
export function createElement(tag, attributes = {}, ...children) {
    const el = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'textContent') {
            el.textContent = value;
        } else if (key.startsWith('on')) {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            el.setAttribute(key, value);
        }
    });
    children.forEach(child => {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            el.appendChild(child);
        }
    });
    return el;
}

/**
 * Clear container element
 */
export function clearContainer(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

/**
 * Show/hide element
 */
export function show(element) {
    if (element) element.classList.remove('hidden');
}

export function hide(element) {
    if (element) element.classList.add('hidden');
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
    return num.toLocaleString();
}

/**
 * Format percentage
 */
export function formatPercent(num, decimals = 0) {
    if (isNaN(num) || !isFinite(num)) return '—';
    return `${num.toFixed(decimals)}%`;
}

