/* eslint-disable no-restricted-globals */
import { generateSudoku } from "./utils/sudokuLogic.js";

self.onmessage = (e) => {
    console.log('Worker: Mesaj alındı', e.data);
    const { totalSudokus, chosenDifficulties, difficultySettings } = e.data;

    const generatedPuzzles = [];

    const numSelected = chosenDifficulties.length;
    const sudokusPerDifficulty = Math.floor(totalSudokus / numSelected);
    const remainder = totalSudokus % numSelected;

    let counts = chosenDifficulties.map((_, idx) =>
        sudokusPerDifficulty + (idx < remainder ? 1 : 0)
    );

    for (let d = 0; d < chosenDifficulties.length; d++) {
        const difficultyKey = chosenDifficulties[d];
        const difficulty = difficultySettings[difficultyKey];
        for (let i = 0; i < counts[d]; i++) {

            const { puzzle, solution } = generateSudoku(difficulty.removals);

            generatedPuzzles.push({
                puzzle,
                solution,
                difficulty: difficulty.level,
            });
        }
    }

    // İş bittiğinde, oluşturulan bulmacaları ana thread'e geri gönder.
    console.log('Worker: İşlem tamamlandı, sonuç gönderiliyor.');
    self.postMessage(generatedPuzzles);
};