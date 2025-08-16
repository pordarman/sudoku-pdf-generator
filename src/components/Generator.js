// This component contains the interface for the "PDF Generator" tab.
// Difficulty selection, page settings, and the PDF creation button are included here.

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
    generationProgress
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
                {isLoading && generationProgress && (
                        <div className="progress-container">
                            <p>
                                {t("generator.generatingStatus", {
                                    generated: generationProgress.generated, 
                                    total: generationProgress.total,
                                    estimatedTime: generationProgress.estimatedTime
                                })}
                            </p>
                            <div className="progress-bar-background">
                                <div 
                                    className="progress-bar-foreground" 
                                    style={{ width: `${(generationProgress.generated / generationProgress.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                <button onClick={handleCreatePdf} disabled={isLoading}>
                    {isLoading ? t("generator.creating") : t("generator.createPdfButton")}
                </button>
            </div>
        </div>
    );
};

export default Generator;
