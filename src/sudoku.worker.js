/* eslint-disable no-restricted-globals */
import { generateSudoku } from "./utils/sudokuLogic.js";

function numberToTime(estimatedTime) {
    const minutes = Math.floor(estimatedTime / 60000);
    const seconds = Math.floor((estimatedTime % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
}

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

    let estimatedTime = counts.reduce((sum, count, idx) => {
        const difficultyKey = chosenDifficulties[idx];
        const difficulty = difficultySettings[difficultyKey];
        return sum + (count * difficulty.estimatedTime);
    }, 0);

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

            // YENİ: Her bir bulmaca üretildikten sonra ilerleme mesajı gönder.
            self.postMessage({
                type: 'progress',
                generated: generatedPuzzles.length,
                total: totalSudokus,
                estimatedTime: numberToTime(estimatedTime)
            });
        }
    }

    // İş bittiğinde, oluşturulan bulmacaları ana thread'e geri gönder.
    console.log('Worker: İşlem tamamlandı, sonuç gönderiliyor.');
    // YENİ: İş bittiğinde, sonuçları farklı bir tipte gönder.
    self.postMessage({
        type: 'result',
        puzzles: generatedPuzzles
    });
};