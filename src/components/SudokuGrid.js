// This component draws the 9x9 Sudoku grid on the screen.
// It can be used in both the solver and the future puzzle display.

const SudokuGrid = ({ grid, initialPuzzle, onCellChange, invalidCells = [] }) => {
    // Triggered when the value in a cell changes.
    const handleChange = (e, row, col) => {
        const value = e.target.value;
        // Only allow numbers 1-9 or empty value.
        if (/^[1-9]$/.test(value) || value === '') {
            onCellChange(row, col, value === '' ? 0 : parseInt(value, 10));
        }
    };

    return (
        <div className="sudoku-grid">
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="sudoku-row">
                    {row.map((cell, colIndex) => {
                        // If this cell was filled in the initial puzzle, make it uneditable.
                        const isGiven = initialPuzzle && initialPuzzle[rowIndex][colIndex] !== 0;

                        // Check if this cell is invalid
                        const isInvalid = invalidCells.some(cell => cell.row === rowIndex && cell.col === colIndex);

                        let cellClass = 'sudoku-cell';
                        if (isGiven) cellClass += ' given';
                        if (isInvalid) cellClass += ' invalid';
                        
                        // Add thick borders to highlight 3x3 boxes.
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