// src/components/Generator.js
// Bu component, "PDF Oluşturucu" sekmesinin arayüzünü içerir.
// Zorluk seçimi, sayfa ayarları ve PDF oluşturma butonu burada yer alır.

import React from 'react';

const Generator = ({
    t,
    selectedDifficulties,
    handleDifficultyChange,
    numPages,
    setNumPages,
    sudokusPerPage,
    setSudokusPerPage,
    handleCreatePdf,
    isLoading,
}) => {
    return (
        <div className="generator-container">
            <div className="pdf-controls">
                <h3>{t("generator.title")}</h3>
                <div className="control-section">
                    <h4>{t("generator.difficultyTitle")}</h4>
                    <div className="difficulty-options">
                        {Object.keys(selectedDifficulties).map(level => (
                            <label key={level} htmlFor={`diff-${level}`}>
                                <input
                                    type="checkbox"
                                    id={`diff-${level}`}
                                    checked={selectedDifficulties[level].isSelected}
                                    onChange={() => handleDifficultyChange(level)}
                                />
                                {t(selectedDifficulties[level].labelKey)}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="control-section">
                    <h4>{t("generator.pageSettingsTitle")}</h4>
                    <div className="page-settings">
                        <div className="pdf-control-group">
                            <label htmlFor="num-pages">{t("generator.pageCountLabel")}</label>
                            <input
                                type="number"
                                id="num-pages"
                                value={numPages}
                                onChange={(e) => setNumPages(Math.max(1, Number(e.target.value)))}
                                min="1"
                            />
                        </div>
                        <div className="pdf-control-group">
                            <label htmlFor="sudokus-per-page">{t("generator.sudokusPerPageLabel")}</label>
                            <select
                                id="sudokus-per-page"
                                value={sudokusPerPage}
                                onChange={(e) => setSudokusPerPage(Number(e.target.value))}
                            >
                                <option value="1">{t("generator.one")}</option>
                                <option value="2">{t("generator.two")}</option>
                                <option value="3">{t("generator.three")}</option>
                                <option value="4">{t("generator.four")}</option>
                                <option value="5">{t("generator.five")}</option>
                                <option value="6">{t("generator.six")}</option>
                            </select>
                        </div>
                    </div>
                </div>
                <button onClick={handleCreatePdf} disabled={isLoading}>
                    {isLoading ? t("generator.creating") : t("generator.createPdfButton")}
                </button>
            </div>
        </div>
    );
};

export default Generator;
