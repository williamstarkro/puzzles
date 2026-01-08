/**
 * Mathematical Helper Functions
 * Implements modular arithmetic, GCD, prime factorization, etc.
 */

// First 20 primes for reference
export const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];

/**
 * Calculate greatest common divisor using Euclidean algorithm
 */
export function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        [a, b] = [b, a % b];
    }
    return a;
}

/**
 * Check if two numbers are coprime (gcd = 1)
 */
export function isCoprime(a, b) {
    return gcd(a, b) === 1;
}

/**
 * Calculate modular inverse of a mod m
 * Returns a^-1 mod m, or null if no inverse exists
 */
export function modularInverse(a, m) {
    a = ((a % m) + m) % m; // Ensure positive
    
    // Extended Euclidean algorithm
    let [oldR, r] = [a, m];
    let [oldS, s] = [1, 0];
    
    while (r !== 0) {
        const quotient = Math.floor(oldR / r);
        [oldR, r] = [r, oldR - quotient * r];
        [oldS, s] = [s, oldS - quotient * s];
    }
    
    if (oldR > 1) {
        return null; // No inverse exists
    }
    
    return ((oldS % m) + m) % m; // Ensure positive
}

/**
 * Prime factorization with multiplicity
 * Returns Map<prime, multiplicity>
 */
export function primeFactors(n) {
    const factors = new Map();
    let num = Math.abs(n);
    
    // Handle 2 separately
    let count = 0;
    while (num % 2 === 0) {
        num /= 2;
        count++;
    }
    if (count > 0) {
        factors.set(2, count);
    }
    
    // Check odd numbers
    for (let i = 3; i * i <= num; i += 2) {
        count = 0;
        while (num % i === 0) {
            num /= i;
            count++;
        }
        if (count > 0) {
            factors.set(i, count);
        }
    }
    
    // If remaining number is prime
    if (num > 2) {
        factors.set(num, 1);
    }
    
    return factors;
}

/**
 * Get all prime factors (with multiplicity) as array
 */
export function getPrimeFactorsArray(n) {
    const factors = primeFactors(n);
    const result = [];
    for (const [prime, multiplicity] of factors) {
        for (let i = 0; i < multiplicity; i++) {
            result.push(prime);
        }
    }
    return result;
}

/**
 * Calculate least common multiple
 */
export function lcm(...numbers) {
    if (numbers.length === 0) return 1;
    if (numbers.length === 1) return Math.abs(numbers[0]);
    
    let result = Math.abs(numbers[0]);
    for (let i = 1; i < numbers.length; i++) {
        result = (result * Math.abs(numbers[i])) / gcd(result, Math.abs(numbers[i]));
    }
    return result;
}

/**
 * Solve modular equation: aS + b ≡ result (mod m)
 * Returns S mod m (the remainder)
 */
export function solveModularEquation(a, b, result, m) {
    // aS + b ≡ result (mod m)
    // aS ≡ (result - b) (mod m)
    // S ≡ (result - b) * a^-1 (mod m)
    
    const aInv = modularInverse(a, m);
    if (aInv === null) {
        throw new Error(`No modular inverse for ${a} mod ${m}`);
    }
    
    const rhs = ((result - b) % m + m) % m;
    return (rhs * aInv) % m;
}

/**
 * Get all factors of a number (for chain constraint)
 */
export function getFactors(n) {
    const factors = new Set();
    const num = Math.abs(n);
    
    for (let i = 1; i * i <= num; i++) {
        if (num % i === 0) {
            factors.add(i);
            factors.add(num / i);
        }
    }
    
    return Array.from(factors).sort((a, b) => a - b);
}

/**
 * Check if modulus m is blocked by remainder r (for chain constraint)
 * Blocked if gcd(m, r) !== 1
 */
export function isModulusBlocked(modulus, remainder) {
    return !isCoprime(modulus, remainder);
}

/**
 * Get all blocked moduli up to maxModulus for a given remainder
 */
export function getBlockedModuli(remainder, maxModulus) {
    const blocked = [];
    const factors = getFactors(remainder);

    for (let m = 2; m <= maxModulus; m++) {
        // Check if m shares any factor with remainder
        for (const factor of factors) {
            if (factor > 1 && m % factor === 0) {
                blocked.push(m);
                break;
            }
        }
    }

    return blocked;
}

/**
 * Prime factorization returning object {prime: exponent}
 */
export function primeFactorize(n) {
    const factors = {};
    let num = Math.abs(n);

    if (num <= 1) return factors;

    // Handle 2 separately
    let count = 0;
    while (num % 2 === 0) {
        num /= 2;
        count++;
    }
    if (count > 0) {
        factors[2] = count;
    }

    // Check odd numbers
    for (let i = 3; i * i <= num; i += 2) {
        count = 0;
        while (num % i === 0) {
            num /= i;
            count++;
        }
        if (count > 0) {
            factors[i] = count;
        }
    }

    // If remaining number is prime
    if (num > 2) {
        factors[num] = 1;
    }

    return factors;
}

/**
 * Check if a number is prime
 */
export function isPrime(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i * i <= n; i += 2) {
        if (n % i === 0) return false;
    }
    return true;
}

/**
 * Generate partitions of n
 */
export function generatePartitions(n, maxPart = n) {
    const partitions = [];

    function generate(remaining, current, max) {
        if (remaining === 0) {
            partitions.push([...current]);
            return;
        }

        for (let i = Math.min(remaining, max); i >= 1; i--) {
            current.push(i);
            generate(remaining - i, current, i);
            current.pop();
        }
    }

    generate(n, [], maxPart);
    return partitions;
}

/**
 * Count partitions of n (partition function p(n))
 */
export function partitionCount(n) {
    if (n < 0) return 0;
    if (n === 0) return 1;

    const dp = new Array(n + 1).fill(0);
    dp[0] = 1;

    for (let i = 1; i <= n; i++) {
        for (let j = i; j <= n; j++) {
            dp[j] += dp[j - i];
        }
    }

    return dp[n];
}

/**
 * Calculate factorial
 */
export function factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

/**
 * Generate all permutations of [1, 2, ..., n]
 */
export function generatePermutations(n) {
    const result = [];
    const arr = Array.from({ length: n }, (_, i) => i + 1);

    function permute(current, remaining) {
        if (remaining.length === 0) {
            result.push([...current]);
            return;
        }

        for (let i = 0; i < remaining.length; i++) {
            current.push(remaining[i]);
            permute(current, [...remaining.slice(0, i), ...remaining.slice(i + 1)]);
            current.pop();
        }
    }

    permute([], arr);
    return result;
}

/**
 * Get cycle notation of a permutation
 * Input: array where perm[i] is the image of i+1
 * Output: array of cycles, e.g., [[1,3,2], [4,5]]
 */
export function getCycles(perm) {
    const n = perm.length;
    const visited = new Array(n).fill(false);
    const cycles = [];

    for (let i = 0; i < n; i++) {
        if (visited[i]) continue;

        const cycle = [];
        let current = i;

        while (!visited[current]) {
            visited[current] = true;
            cycle.push(current + 1); // 1-indexed
            current = perm[current] - 1; // perm is 1-indexed
        }

        if (cycle.length > 0) {
            cycles.push(cycle);
        }
    }

    return cycles;
}

/**
 * Get cycle type (sorted list of cycle lengths)
 */
export function getCycleType(perm) {
    const cycles = getCycles(perm);
    return cycles.map(c => c.length).sort((a, b) => b - a);
}

/**
 * Compose two permutations: result = sigma composed with tau
 * (apply tau first, then sigma)
 */
export function composePermutations(sigma, tau) {
    const n = sigma.length;
    const result = new Array(n);

    for (let i = 0; i < n; i++) {
        // tau maps i+1 to tau[i], sigma then maps tau[i] to sigma[tau[i]-1]
        result[i] = sigma[tau[i] - 1];
    }

    return result;
}

/**
 * Get conjugate partition (transpose Young diagram)
 */
export function conjugatePartition(partition) {
    if (partition.length === 0) return [];

    const maxPart = partition[0];
    const conjugate = [];

    for (let i = 1; i <= maxPart; i++) {
        const count = partition.filter(p => p >= i).length;
        if (count > 0) {
            conjugate.push(count);
        }
    }

    return conjugate;
}

