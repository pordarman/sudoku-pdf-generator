// src/components/SudokuGrid.js
// Bu component, 9x9'luk Sudoku tablosunu (grid) ekrana çizer.
// Hem çözücüde hem de ileride bulmaca gösteriminde kullanılabilir.

import React from 'react';

const SudokuGrid = ({ grid, initialPuzzle, onCellChange, invalidCells = [] }) => {
    // Hücredeki değer değiştiğinde tetiklenir.
    const handleChange = (e, row, col) => {
        const value = e.target.value;
        // Sadece 1-9 arası rakamlara veya boş değere izin ver.
        if (/^[1-9]$/.test(value) || value === '') {
            onCellChange(row, col, value === '' ? 0 : parseInt(value, 10));
        }
    };

    return (
        <div className="sudoku-grid">
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="sudoku-row">
                    {row.map((cell, colIndex) => {
                        // Eğer bu hücre, bulmacanın en başında dolu geldiyse, değiştirilemez yap.
                        const isGiven = initialPuzzle && initialPuzzle[rowIndex][colIndex] !== 0;

                        // Bu hücrenin hatalı olup olmadığını kontrol et
                        const isInvalid = invalidCells.some(cell => cell.row === rowIndex && cell.col === colIndex);

                        let cellClass = 'sudoku-cell';
                        if (isGiven) cellClass += ' given';
                        if (isInvalid) cellClass += ' invalid';
                        // 3x3'lük kutuları belirginleştirmek için kalın kenarlıklar ekle.
                        if (rowIndex % 3 === 2 && rowIndex !== 8) cellClass += ' border-bottom';
                        if (colIndex % 3 === 2 && colIndex !== 8) cellClass += ' border-right';
                        
                        return (
                            <input
                                key={`${rowIndex}-${colIndex}`}
                                className={cellClass}
                                type="text"
                                maxLength="1"
                                value={cell === 0 ? '' : cell}
                                onChange={(e) => handleChange(e, rowIndex, colIndex)}
                                readOnly={isGiven}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default SudokuGrid;