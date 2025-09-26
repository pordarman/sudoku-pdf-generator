// This file contains the basic logic for Sudoku: creating an empty board,
// checking if a number is valid, and finding solutions.

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

export const findAllSolutions = (grid, limit = 2000) => {
    const solutions = [];
    const find = (currentGrid) => {
        // For performance, we stop after finding a maximum of 'limit' solutions.
        // If we found 'limit' solutions, we inform the user that there may be more.
        if (solutions.length >= limit) return;

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (currentGrid[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (isValid(currentGrid, row, col, num)) {
                            currentGrid[row][col] = num;
                            find(currentGrid);
                            currentGrid[row][col] = 0; // Backtracking
                        }
                    }
                    return;
                }
            }
        }
        solutions.push(JSON.parse(JSON.stringify(currentGrid)));
    };
    find(JSON.parse(JSON.stringify(grid)));

    return shuffle(solutions);
};

export const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const fillGrid = (grid) => {
    for (let i = 0; i < 81; i++) {
        const row = Math.floor(i / 9), col = i % 9;
        if (grid[row][col] === 0) {
            const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            for (const num of numbers) {
                if (isValid(grid, row, col, num)) {
                    grid[row][col] = num;
                    if (fillGrid(grid)) return true;
                    grid[row][col] = 0;
                }
            }
            return false;
        }
    }
    return true;
};

export const generateSudoku = (removals) => {
    let bestPuzzle = null;
    let bestRemovedCount = -1;
    let attempts = 0;
    const maxAttempts = 30; // Limit the number of attempts to avoid infinite loops.

    // Continue the loop until the target number of cells is removed or the maximum number of attempts is reached.
    while (attempts < maxAttempts) {
        const grid = createEmptyGrid();
        fillGrid(grid); // Create a new filled board from scratch for each attempt.

        const solution = JSON.parse(JSON.stringify(grid));
        let puzzle = JSON.parse(JSON.stringify(solution));

        // Create a random removal order by shuffling the cells.
        const cells = shuffle(Array.from({ length: 81 }, (_, i) => i));
        let removedCount = 0;

        for (const cellIndex of cells) {
            if (removedCount >= removals) break; // If the target is reached, exit the loop.

            const row = Math.floor(cellIndex / 9);
            const col = cellIndex % 9;

            // If this cell is already empty, skip it (this shouldn't happen in this loop but it's a good check).
            if (puzzle[row][col] === 0) continue;

            const temp = puzzle[row][col];
            puzzle[row][col] = 0;

            // Check if the solution is still unique.
            const solutions = findAllSolutions(puzzle, 2);
            if (solutions.length !== 1) {
                // If the solution is not unique, restore the removed number.
                puzzle[row][col] = temp;
            } else {
                // If the solution is still unique, confirm the removal.
                removedCount++;
            }
        }

        // Did we reach the target at the end of this attempt?
        if (removedCount >= removals) {
            return { puzzle, solution };
        }

        // If this attempt didn't reach the target but was the best so far, keep it.
        if (removedCount > bestRemovedCount) {
            bestRemovedCount = removedCount;
            bestPuzzle = { puzzle, solution };
        }
        
        attempts++;
    }

    // If the maximum number of attempts has been reached and the target has still not been met,
    // return the best attempt with a warning.
    if (bestRemovedCount < removals) {
        console.warn(`Maximum number of attempts reached (${maxAttempts}). Target was ${removals} cells, best result is a puzzle with ${bestRemovedCount} cells removed.`);
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