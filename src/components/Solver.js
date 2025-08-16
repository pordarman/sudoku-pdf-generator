// This component contains the interface for the "Sudoku Solver" tab.
// The Sudoku grid, "Solve" and "Clear" buttons are included here.

import SudokuGrid from './SudokuGrid';

const Solver = ({
    t,
    handleSolve,
    handleClear,
    isLoading,
    allSolutions,
    selectedSolutionIndex,
    handleSolutionSelect,
    grid,
    initialGrid,
    handleCellChange,
    invalidCells
}) => {
    return (
        <div className="solver-container">
            <h2>{t("solver.title")}</h2>
            <p>{t("solver.description")}</p>
            <div className="controls">
                <button onClick={handleSolve} disabled={isLoading}>
                    {t("solver.solveButton")}
                </button>
                <button className="secondary" onClick={handleClear}>
                    {t("solver.clearButton")}
                </button>
            </div>
            {allSolutions.length > 1 && (
                <div className="solution-selector">
                    <label htmlFor="solution-select">{t("solver.solutionsLabel")}:</label>
                    <select
                        id="solution-select"
                        value={selectedSolutionIndex}
                        onChange={(e) => handleSolutionSelect(Number(e.target.value))}
                    >
                        {allSolutions.map((_, index) => (
                            <option key={index} value={index}>
                                {t("solver.solutionLabel", { number: index + 1 })}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            <SudokuGrid grid={grid} initialPuzzle={initialGrid} onCellChange={handleCellChange} invalidCells={invalidCells}/>
        </div>
    );
};

export default Solver;
