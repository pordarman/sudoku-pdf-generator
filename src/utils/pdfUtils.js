// src/utils/pdfUtils.js
// Bu dosya, jsPDF kütüphanesini kullanarak PDF üzerine Sudoku bulmacalarını
// ve diğer bilgileri çizen fonksiyonları içerir.

export const toTitleCase = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const drawSudokuOnPdf = (doc, grid, difficulty, startX, startY, size, t) => {
    const labelFontSize = size * 0.065; // Etiket font boyutu büyütüldü
    doc.setFontSize(labelFontSize);
    doc.setTextColor(100);

    // ID'yi sol üste yazdır
    doc.setFontSize(labelFontSize * 1.62); // Yazı boyutunu büyüt

    // Zorluğu sağ üste yazdır
    doc.text(t("pdf.difficultyLabel", { difficulty }), startX + size, startY - 2, { align: 'right' });

    const cellSize = size / 9;
    doc.setDrawColor(0);
    doc.setTextColor(0);
    // Sudoku içindeki sayıların font boyutu büyütüldü
    doc.setFontSize(size * 0.15);

    for (let i = 0; i <= 9; i++) {
        const lineWidth = (i % 3 === 0) ? 0.7 : 0.2;
        doc.setLineWidth(lineWidth);
        doc.line(startX + i * cellSize, startY, startX + i * cellSize, startY + size);
        doc.line(startX, startY + i * cellSize, startX + size, startY + i * cellSize);
    }

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] !== 0) {
                const text = String(grid[row][col]);
                const textX = startX + col * cellSize + cellSize / 2;
                const textY = startY + row * cellSize + cellSize / 2;
                doc.text(text, textX, textY, { align: 'center', baseline: 'middle' });
            }
        }
    }
};

export const drawPageLayout = (doc, puzzles, layout, t, fetchDifficultyWithLevel) => {
    const MARGIN = 15;
    const A4_WIDTH = 210;
    const HEADER_SPACE = 30; // Üst boşluk arttırıldı
    const TOP_TEXT_OFFSET = 5; // ID/Zorluk yazısı için ek boşluk

    const drawPuzzle = (puzzleData, x, y, size) => {
        const difficultyLabel = toTitleCase(t(fetchDifficultyWithLevel(puzzleData.difficulty).labelKey));
        drawSudokuOnPdf(doc, puzzleData.puzzle, difficultyLabel, x, y + TOP_TEXT_OFFSET, size, t);
    };

    if (layout === 1) {
        const size = 110;
        const x = (A4_WIDTH - size) / 2;
        const y = HEADER_SPACE;
        drawPuzzle(puzzles[0], x, y, size);
    } else if (layout === 2) {
        const size = 85;
        const x = (A4_WIDTH - size) / 2;
        drawPuzzle(puzzles[0], x, HEADER_SPACE, size);
        if (puzzles[1]) drawPuzzle(puzzles[1], x, HEADER_SPACE + size + 25, size); // Aradaki boşluk arttırıldı
    } else if (layout === 3) {
        const size = 70;
        const gap = 18; // Aradaki boşluk arttırıldı
        const y1 = HEADER_SPACE;
        const y2 = y1 + size + gap;
        const y3 = y2 + size + gap;
        const xCenter = (A4_WIDTH - size) / 2;
        if (puzzles[0]) drawPuzzle(puzzles[0], xCenter, y1, size);
        if (puzzles[1]) drawPuzzle(puzzles[1], xCenter, y2, size);
        if (puzzles[2]) drawPuzzle(puzzles[2], xCenter, y3, size);
    } else if (layout === 4) {
        const size = 75;
        const gap = 20; // Aradaki boşluk arttırıldı
        const x1 = MARGIN + (A4_WIDTH / 2 - MARGIN - size) / 2;
        const x2 = A4_WIDTH / 2 + (A4_WIDTH / 2 - MARGIN - size) / 2;
        const y1 = HEADER_SPACE;
        const y2 = y1 + size + gap;
        if (puzzles[0]) drawPuzzle(puzzles[0], x1, y1, size);
        if (puzzles[1]) drawPuzzle(puzzles[1], x2, y1, size);
        if (puzzles[2]) drawPuzzle(puzzles[2], x1, y2, size);
        if (puzzles[3]) drawPuzzle(puzzles[3], x2, y2, size);
    } else if (layout === 5) {
        const size = 70;
        const gap = 18;
        const x1 = MARGIN + (A4_WIDTH / 2 - MARGIN - size) / 2;
        const x2 = A4_WIDTH / 2 + (A4_WIDTH / 2 - MARGIN - size) / 2;
        const y1 = HEADER_SPACE;
        const y2 = y1 + size + gap;
        const y3 = y2 + size + gap;
        const xCenter = (A4_WIDTH - size) / 2;

        // Üstteki iki sudoku
        if (puzzles[0]) drawPuzzle(puzzles[0], x1, y1, size);
        if (puzzles[1]) drawPuzzle(puzzles[1], x2, y1, size);

        // Ortadaki sudoku
        if (puzzles[2]) drawPuzzle(puzzles[2], xCenter, y2, size);

        // Alttaki iki sudoku
        if (puzzles[3]) drawPuzzle(puzzles[3], x1, y3, size);
        if (puzzles[4]) drawPuzzle(puzzles[4], x2, y3, size);
    } else if (layout === 6) {
        const size = 70;
        const gap = 18; // Aradaki boşluk arttırıldı
        const x1 = MARGIN + (A4_WIDTH / 2 - MARGIN - size) / 2;
        const x2 = A4_WIDTH / 2 + (A4_WIDTH / 2 - MARGIN - size) / 2;
        const y1 = HEADER_SPACE;
        const y2 = y1 + size + gap;
        const y3 = y2 + size + gap;
        if (puzzles[0]) drawPuzzle(puzzles[0], x1, y1, size);
        if (puzzles[1]) drawPuzzle(puzzles[1], x2, y1, size);
        if (puzzles[2]) drawPuzzle(puzzles[2], x1, y2, size);
        if (puzzles[3]) drawPuzzle(puzzles[3], x2, y2, size);
        if (puzzles[4]) drawPuzzle(puzzles[4], x1, y3, size);
        if (puzzles[5]) drawPuzzle(puzzles[5], x2, y3, size);
    }
};
