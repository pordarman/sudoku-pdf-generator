/* eslint-disable no-restricted-globals */
import { findAllSolutions } from "./utils/sudokuLogic.js";

self.onmessage = (e) => {
    const { puzzle, maxSolutions } = e.data;

    const solutions = findAllSolutions(puzzle, maxSolutions);
    self.postMessage({
        type: 'result',
        solutions
    });
};