/* eslint-disable no-restricted-globals */
import { generateSudoku } from "./utils/sudokuLogic.js";

function numberToTime(estimatedTime) {
    const minutes = Math.floor(estimatedTime / 60000);
    const seconds = Math.floor((estimatedTime % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
}

self.onmessage = (e) => {
    const { totalSudokus, chosenDifficulties, difficultySettings } = e.data;

    const generatedPuzzles = [];

    const numSelected = chosenDifficulties.length;
    const sudokusPerDifficulty = Math.floor(totalSudokus / numSelected);
    const remainder = totalSudokus % numSelected;

    let counts = chosenDifficulties.map((_, idx) =>
        sudokusPerDifficulty + (idx < remainder ? 1 : 0)
    );

    let estimatedTime = counts.reduce((sum, count, idx) => {
        const difficultyKey = chosenDifficulties[idx];
        const difficulty = difficultySettings[difficultyKey];
        return sum + (count * difficulty.estimatedTime);
    }, 0);

    self.postMessage({
        type: 'progress',
        generated: 0,
        total: totalSudokus,
        estimatedTime: numberToTime(estimatedTime)
    });

    for (let d = 0; d < chosenDifficulties.length; d++) {
        const difficultyKey = chosenDifficulties[d];
        const difficulty = difficultySettings[difficultyKey];
        for (let i = 0; i < counts[d]; i++) {

            const result = generateSudoku(difficulty.removals);

            if (result) generatedPuzzles.push({
                puzzle: result.puzzle,
                solution: result.solution,
                difficulty: difficulty.level,
            });

            estimatedTime -= difficulty.estimatedTime;

            // Post the message when a puzzle is generated
            self.postMessage({
                type: 'progress',
                generated: generatedPuzzles.length,
                total: totalSudokus,
                estimatedTime: numberToTime(estimatedTime)
            });
        }
    }

    self.postMessage({
        type: 'result',
        puzzles: generatedPuzzles
    });
};