// src/utils/sudokuLogic.js
// Bu dosya, Sudoku'nun temel mantığını içerir: boş bir tablo oluşturma,
// bir sayının geçerli olup olmadığını kontrol etme ve çözümleri bulma.

export const createEmptyGrid = () => Array(9).fill(null).map(() => Array(9).fill(0));

export const isValid = (grid, row, col, num) => {
    // Satırı kontrol et
    for (let x = 0; x < 9; x++) {
        if (grid[row][x] === num) return false;
    }
    // Sütunu kontrol et
    for (let x = 0; x < 9; x++) {
        if (grid[x][col] === num) return false;
    }
    // 3x3'lük kutuyu kontrol et
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
        // Performans için en fazla limit tane çözüm bulup duruyoruz.
        // Eğer limit tane çözüm bulunduysa kullanıcıya "limit tane çözüm bulundu ama daha fazla olabilir diyoruz"
        if (solutions.length >= limit) return;

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (currentGrid[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (isValid(currentGrid, row, col, num)) {
                            currentGrid[row][col] = num;
                            find(currentGrid);
                            currentGrid[row][col] = 0; // Geri izleme (Backtracking)
                        }
                    }
                    return;
                }
            }
        }
        // Derin bir kopya alarak çözümü kaydet
        solutions.push(JSON.parse(JSON.stringify(currentGrid)));
    };
    // Fonksiyonu başlat
    find(JSON.parse(JSON.stringify(grid)));

    // Sonuçları karıştırarak ver
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
    const grid = createEmptyGrid();
    fillGrid(grid);
    const solution = JSON.parse(JSON.stringify(grid));
    let puzzle = JSON.parse(JSON.stringify(solution));
    const cells = shuffle(Array.from({ length: 81 }, (_, i) => i));
    let removedCount = 0;
    for (const cellIndex of cells) {
        if (removedCount >= removals) break;
        const row = Math.floor(cellIndex / 9), col = cellIndex % 9;
        if (puzzle[row][col] === 0) continue;
        const temp = puzzle[row][col];
        puzzle[row][col] = 0;
        const solutions = findAllSolutions(puzzle, 2);
        if (solutions.length !== 1) {
            puzzle[row][col] = temp;
        } else {
            removedCount++;
        }
    }
    return { puzzle, solution };
};

export const validateGrid = (grid) => {
    const invalidCells = new Set();

    // Helper function to add coordinates to the set
    const addInvalid = (r, c) => invalidCells.add(`${r}-${c}`);

    // 1. Satırları ve Sütunları kontrol et
    for (let i = 0; i < 9; i++) {
        const rowMap = new Map();
        const colMap = new Map();
        for (let j = 0; j < 9; j++) {
            // Satır kontrolü
            const rowCell = grid[i][j];
            if (rowCell !== 0) {
                if (rowMap.has(rowCell)) {
                    addInvalid(i, j);
                    addInvalid(i, rowMap.get(rowCell));
                }
                rowMap.set(rowCell, j);
            }
            // Sütun kontrolü
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

    // 2. 3x3'lük Kutuları kontrol et
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

    // Set'i {row, col} objelerinden oluşan bir array'e dönüştür
    return Array.from(invalidCells).map(coord => {
        const [row, col] = coord.split('-').map(Number);
        return { row, col };
    });
};