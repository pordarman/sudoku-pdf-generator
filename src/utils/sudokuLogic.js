// This file contains the basic logic for Sudoku: creating an empty board,
// checking if a number is valid, and finding solutions.

// --- Precomputed lookup tables ---

// BOX_INDEX[i] = box index (0-8) for flat cell index i
const BOX_INDEX = new Uint8Array(81);
for (let i = 0; i < 81; i++) {
    BOX_INDEX[i] = (((i / 9) | 0) / 3 | 0) * 3 + ((i % 9) / 3 | 0);
}

// BIT_TO_NUM[1 << n] = n, for n in 1..9
const BIT_TO_NUM = new Uint8Array(1024);
for (let n = 1; n <= 9; n++) BIT_TO_NUM[1 << n] = n;

// POPCOUNT[x] = number of set bits in x, for x in 0..1023
const POPCOUNT = new Uint8Array(1024);
for (let i = 1; i < 1024; i++) POPCOUNT[i] = POPCOUNT[i >> 1] + (i & 1);

// Bitmask covering numbers 1-9: bits 1..9 set = 0b1111111110 = 0x3FE
const ALL_BITS = 0x3FE;

// --- Conversion helpers (nested array <-> flat Uint8Array) ---

const toFlat = (grid) => {
    const flat = new Uint8Array(81);
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
            flat[r * 9 + c] = grid[r][c];
    return flat;
};

const toNested = (flat) =>
    Array.from({ length: 9 }, (_, r) =>
        Array.from({ length: 9 }, (_, c) => flat[r * 9 + c])
    );

// Build bitmask state (which numbers are placed) from a flat grid
const buildState = (flat) => {
    const rows = new Int32Array(9);
    const cols = new Int32Array(9);
    const boxes = new Int32Array(9);
    for (let i = 0; i < 81; i++) {
        const v = flat[i];
        if (v !== 0) {
            const bit = 1 << v;
            rows[(i / 9) | 0] |= bit;
            cols[i % 9] |= bit;
            boxes[BOX_INDEX[i]] |= bit;
        }
    }
    return { rows, cols, boxes };
};

// --- Internal backtracking solvers ---
// All operate on flat Uint8Array + Int32Array bitmask state.
// They modify the arrays in place but fully backtrack, so the caller's
// state is restored after the call returns.

// Fill flat with a random complete solution using MRV + shuffled candidates.
const fillFlat = (flat, rows, cols, boxes) => {
    // Find the empty cell with the fewest valid candidates (MRV heuristic)
    let minCount = 11, minCell = -1;
    for (let i = 0; i < 81; i++) {
        if (flat[i] !== 0) continue;
        const avail = ~(rows[(i / 9) | 0] | cols[i % 9] | boxes[BOX_INDEX[i]]) & ALL_BITS;
        if (avail === 0) return false; // dead end: no valid number for this cell
        const cnt = POPCOUNT[avail];
        if (cnt < minCount) {
            minCount = cnt;
            minCell = i;
            if (cnt === 1) break; // can't do better
        }
    }
    if (minCell === -1) return true; // all cells filled

    const r = (minCell / 9) | 0, c = minCell % 9, b = BOX_INDEX[minCell];
    const avail = ~(rows[r] | cols[c] | boxes[b]) & ALL_BITS;

    // Collect candidates and shuffle for a random board
    const candidates = [];
    for (let bits = avail; bits; bits &= bits - 1) candidates.push(bits & -bits);
    shuffle(candidates);

    for (const bit of candidates) {
        flat[minCell] = BIT_TO_NUM[bit];
        rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
        if (fillFlat(flat, rows, cols, boxes)) return true;
        flat[minCell] = 0;
        rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
    }
    return false;
};

// Count solutions up to `limit`. Fully backtracks — caller's state is restored.
const countSolutionsInternal = (flat, rows, cols, boxes, limit) => {
    let minCount = 11, minCell = -1;
    for (let i = 0; i < 81; i++) {
        if (flat[i] !== 0) continue;
        const avail = ~(rows[(i / 9) | 0] | cols[i % 9] | boxes[BOX_INDEX[i]]) & ALL_BITS;
        if (avail === 0) return 0;
        const cnt = POPCOUNT[avail];
        if (cnt < minCount) {
            minCount = cnt;
            minCell = i;
            if (cnt === 1) break;
        }
    }
    if (minCell === -1) return 1; // found a complete solution

    const r = (minCell / 9) | 0, c = minCell % 9, b = BOX_INDEX[minCell];
    let avail = ~(rows[r] | cols[c] | boxes[b]) & ALL_BITS;
    let count = 0;

    while (avail && count < limit) {
        const bit = avail & -avail;
        avail ^= bit;
        flat[minCell] = BIT_TO_NUM[bit];
        rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
        count += countSolutionsInternal(flat, rows, cols, boxes, limit - count);
        flat[minCell] = 0;
        rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
    }
    return count;
};

// Find all solutions up to `limit`, collecting them as nested arrays.
const findSolutionsInternal = (flat, rows, cols, boxes, solutions, limit) => {
    if (solutions.length >= limit) return;

    let minCount = 11, minCell = -1;
    for (let i = 0; i < 81; i++) {
        if (flat[i] !== 0) continue;
        const avail = ~(rows[(i / 9) | 0] | cols[i % 9] | boxes[BOX_INDEX[i]]) & ALL_BITS;
        if (avail === 0) return;
        const cnt = POPCOUNT[avail];
        if (cnt < minCount) {
            minCount = cnt;
            minCell = i;
            if (cnt === 1) break;
        }
    }
    if (minCell === -1) {
        solutions.push(toNested(flat));
        return;
    }

    const r = (minCell / 9) | 0, c = minCell % 9, b = BOX_INDEX[minCell];
    let avail = ~(rows[r] | cols[c] | boxes[b]) & ALL_BITS;

    while (avail && solutions.length < limit) {
        const bit = avail & -avail;
        avail ^= bit;
        flat[minCell] = BIT_TO_NUM[bit];
        rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
        findSolutionsInternal(flat, rows, cols, boxes, solutions, limit);
        flat[minCell] = 0;
        rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
    }
};

// --- Public API ---

export const createEmptyGrid = () => Array(9).fill(null).map(() => Array(9).fill(0));

export const isValid = (grid, row, col, num) => {
    // Check the row
    for (let x = 0; x < 9; x++) {
        if (grid[row][x] === num) return false;
    }
    // Check the column
    for (let x = 0; x < 9; x++) {
        if (grid[x][col] === num) return false;
    }
    // Check the 3x3 box
    const startRow = row - (row % 3), startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[i + startRow][j + startCol] === num) return false;
        }
    }
    return true;
};

export const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const fillGrid = (grid) => {
    const flat = toFlat(grid);
    const { rows, cols, boxes } = buildState(flat);
    const result = fillFlat(flat, rows, cols, boxes);
    if (result) {
        for (let r = 0; r < 9; r++)
            for (let c = 0; c < 9; c++)
                grid[r][c] = flat[r * 9 + c];
    }
    return result;
};

export const findAllSolutions = (grid, limit = 2000) => {
    const flat = toFlat(grid);
    const { rows, cols, boxes } = buildState(flat);
    const solutions = [];
    findSolutionsInternal(flat, rows, cols, boxes, solutions, limit);
    return shuffle(solutions);
};

export const generateSudoku = (removals) => {
    let bestPuzzle = null;
    let bestRemovedCount = -1;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
        // Generate a complete random solution
        const flat = new Uint8Array(81);
        const rows = new Int32Array(9);
        const cols = new Int32Array(9);
        const boxes = new Int32Array(9);
        fillFlat(flat, rows, cols, boxes);

        const solution = flat.slice();

        // Puzzle starts as a copy of the solution; cells get removed one by one
        const puzzle = flat.slice();
        const pRows = rows.slice();
        const pCols = cols.slice();
        const pBoxes = boxes.slice();

        const cells = shuffle(Array.from({ length: 81 }, (_, i) => i));
        let removedCount = 0;

        for (const idx of cells) {
            if (removedCount >= removals) break;
            if (puzzle[idx] === 0) continue;

            const r = (idx / 9) | 0, c = idx % 9, b = BOX_INDEX[idx];
            const savedVal = puzzle[idx];
            const bit = 1 << savedVal;

            // Tentatively remove the cell
            puzzle[idx] = 0;
            pRows[r] ^= bit; pCols[c] ^= bit; pBoxes[b] ^= bit;

            // Uniqueness check: countSolutionsInternal fully backtracks,
            // so puzzle/pRows/pCols/pBoxes are restored after the call
            if (countSolutionsInternal(puzzle, pRows, pCols, pBoxes, 2) === 1) {
                removedCount++;
            } else {
                // Not unique — restore the cell
                puzzle[idx] = savedVal;
                pRows[r] |= bit; pCols[c] |= bit; pBoxes[b] |= bit;
            }
        }

        if (removedCount >= removals) {
            return { puzzle: toNested(puzzle), solution: toNested(solution) };
        }

        if (removedCount > bestRemovedCount) {
            bestRemovedCount = removedCount;
            bestPuzzle = { puzzle: toNested(puzzle), solution: toNested(solution) };
        }

        attempts++;
    }

    if (bestRemovedCount < removals) {
        console.warn(`Maximum attempts reached (${maxAttempts}). Target: ${removals}, best: ${bestRemovedCount}`);
    }

    return bestPuzzle;
};

export const validateGrid = (grid) => {
    const invalidCells = new Set();

    // Helper function to add coordinates to the set
    const addInvalid = (r, c) => invalidCells.add(`${r}-${c}`);

    // 1. Check rows and columns
    for (let i = 0; i < 9; i++) {
        const rowMap = new Map();
        const colMap = new Map();
        for (let j = 0; j < 9; j++) {
            // Row check
            const rowCell = grid[i][j];
            if (rowCell !== 0) {
                if (rowMap.has(rowCell)) {
                    addInvalid(i, j);
                    addInvalid(i, rowMap.get(rowCell));
                }
                rowMap.set(rowCell, j);
            }
            // Column check
            const colCell = grid[j][i];
            if (colCell !== 0) {
                if (colMap.has(colCell)) {
                    addInvalid(j, i);
                    addInvalid(colMap.get(colCell), i);
                }
                colMap.set(colCell, j);
            }
        }
    }

    // 2. Check 3x3 boxes
    for (let boxRow = 0; boxRow < 9; boxRow += 3) {
        for (let boxCol = 0; boxCol < 9; boxCol += 3) {
            const boxMap = new Map();
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const r = boxRow + i;
                    const c = boxCol + j;
                    const cellValue = grid[r][c];
                    if (cellValue !== 0) {
                        if (boxMap.has(cellValue)) {
                            const [prev_r, prev_c] = boxMap.get(cellValue);
                            addInvalid(r, c);
                            addInvalid(prev_r, prev_c);
                        }
                        boxMap.set(cellValue, [r, c]);
                    }
                }
            }
        }
    }

    // Convert the Set to an array of {row, col} objects
    return Array.from(invalidCells).map(coord => {
        const [row, col] = coord.split('-').map(Number);
        return { row, col };
    });
};
