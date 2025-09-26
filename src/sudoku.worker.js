/* eslint-disable no-restricted-globals */
import { generateSudoku } from "./utils/sudokuLogic.js";

function numberToTime(estimatedTime) {
    const minutes = Math.floor(estimatedTime / 60000);
    const seconds = Math.floor((estimatedTime % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
}

self.onmessage = (e) => {
    const { totalSudokus, chosenDifficulties, difficultySettings, isCustomMode } = e.data;
    
    let estimatedTime = 0;
    const generationPlan = [];
    const generatedPuzzles = [];

    if (isCustomMode) {
        chosenDifficulties.forEach(item => {
            if (item.count > 0) {
                const difficulty = difficultySettings[item.difficulty];
                generationPlan.push({
                    difficultyKey: item.difficulty,
                    count: item.count,
                    settings: difficulty
                });
                estimatedTime += item.count * difficulty.estimatedTime;
            }
        });
    } else {
        const numSelected = chosenDifficulties.length;
        const sudokusPerDifficulty = Math.floor(totalSudokus / numSelected);
        const remainder = totalSudokus % numSelected;

        chosenDifficulties.forEach((difficultyKey, idx) => {
            const count = sudokusPerDifficulty + (idx < remainder ? 1 : 0);
            const difficulty = difficultySettings[difficultyKey];
            generationPlan.push({
                difficultyKey: difficultyKey,
                count: count,
                settings: difficulty
            });
            estimatedTime += count * difficulty.estimatedTime;
        });
    }

    self.postMessage({
        type: 'progress',
        generated: 0,
        total: totalSudokus,
        estimatedTime: numberToTime(estimatedTime)
    });

    for (const plan of generationPlan) {
        console.log(`Generating ${plan.count} puzzles of difficulty ${plan.difficultyKey}`);
        for (let i = 0; i < plan.count; i++) {
            const result = generateSudoku(plan.settings.removals);

            if (result) {
                generatedPuzzles.push({
                    puzzle: result.puzzle,
                    solution: result.solution,
                    difficulty: plan.settings.level,
                });
            }

            estimatedTime -= plan.settings.estimatedTime;

            self.postMessage({
                type: 'progress',
                generated: generatedPuzzles.length,
                total: totalSudokus,
                estimatedTime: numberToTime(Math.max(0, estimatedTime))
            });
        }
    }
    
    self.postMessage({
        type: 'result',
        puzzles: generatedPuzzles
    });
};