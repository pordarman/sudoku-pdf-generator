import React, { useState, useEffect } from 'react';
import "./App.css";
import { useTranslation } from 'react-i18next';

// Yeni oluşturduğumuz modülleri içeri aktarıyoruz
import { createEmptyGrid, findAllSolutions, validateGrid } from './utils/sudokuLogic';
import { drawPageLayout } from './utils/pdfUtils';
import Generator from './components/Generator';
import Solver from './components/Solver';

const MAX_SOLUTIONS = 10000;

// jsPDF kütüphanesini asenkron olarak yükleyen fonksiyon
const loadJsPdf = () => new Promise((resolve, reject) => {
    if (window.jspdf) return resolve();
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('jsPDF script could not be loaded.'));
    document.body.appendChild(script);
});

// PDF için gerekli tüm fontları yükleyen fonksiyon
const loadPdfFonts = async (doc) => {
    // Yüklenecek fontları bir dizi içinde tanımlıyoruz
    const fonts = [
        { path: '/sudoku-pdf-generator/fonts/NotoSans-Regular.ttf', name: 'NotoSans' }, // Ana, evrensel font
        { path: '/sudoku-pdf-generator/fonts/NotoSansJP-Regular.ttf', name: 'NotoSansJP' } // CJK dilleri için uzman font
    ];

    try {
        // Promise.all ile tüm fontları paralel olarak çekiyoruz, bu daha hızlıdır.
        await Promise.all(fonts.map(async (font) => {
            const response = await fetch(font.path);
            if (!response.ok) throw new Error(`${font.path} yüklenemedi`);

            const fontBlob = await response.blob();
            const reader = new FileReader();

            const base64 = await new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(fontBlob);
            });

            doc.addFileToVFS(font.path.split('/').pop(), base64);
            doc.addFont(font.path.split('/').pop(), font.name, 'normal');
        }));

        console.log("Tüm PDF fontları başarıyla yüklendi.");
        return true;
    } catch (error) {
        console.error("Font yüklenirken hata oluştu:", error);
        return false;
    }
};

function App() {
    const { t, i18n } = useTranslation();

    const languages = [
        { code: 'en', label: '🇬🇧 English' },
        { code: 'tr', label: '🇹🇷 Türkçe' },
        { code: 'de', label: '🇩🇪 Deutsch' },
        { code: 'fr', label: '🇫🇷 Français' },
        { code: 'es', label: '🇪🇸 Español' },
        { code: 'it', label: '🇮🇹 Italiano' },
        { code: 'zh', label: '🇨🇳 中文' },
        { code: 'pt', label: '🇵🇹 Português' },
        { code: 'ru', label: '🇷🇺 Русский' },
        { code: 'ja', label: '🇯🇵 日本語' }
    ];
    const handleLanguageChange = (language) => {
        i18n.changeLanguage(language);
    };
    // --- STATE YÖNETİMİ ---
    const [activeTab, setActiveTab] = useState('generator');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [theme, setTheme] = useState('light');
    const [generationProgress, setGenerationProgress] = useState(null);

    // Çözücü için state'ler
    const [grid, setGrid] = useState(createEmptyGrid());
    const [initialGrid, setInitialGrid] = useState(null);
    const [allSolutions, setAllSolutions] = useState([]);
    const [selectedSolutionIndex, setSelectedSolutionIndex] = useState(0);
    const [invalidCells, setInvalidCells] = useState([]);

    // Oluşturucu için state'ler
    const [numPages, setNumPages] = useState(1);
    const [sudokusPerPage, setSudokusPerPage] = useState(1);
    const [selectedDifficulties, setSelectedDifficulties] = useState({
        'child': { removals: 35, labelKey: 'difficulty.child', isSelected: true, level: 0, estimatedTime: 1000 }, // Tahmini 1 saniyede
        'easy': { removals: 42, labelKey: 'difficulty.easy', isSelected: true, level: 1, estimatedTime: 1500 }, // Tahmini 1.5 saniyede
        'medium': { removals: 49, labelKey: 'difficulty.medium', isSelected: false, level: 2, estimatedTime: 2000 }, // Tahmini 2 saniyede
        'hard': { removals: 56, labelKey: 'difficulty.hard', isSelected: false, level: 3, estimatedTime: 3000 }, // Tahmini 3 saniyede
        'expert': { removals: 59, labelKey: 'difficulty.expert', isSelected: false, level: 4, estimatedTime: 4000 }, // Tahmini 4 saniyede
        'impossible': { removals: 64, labelKey: 'difficulty.impossible', isSelected: false, level: 5, estimatedTime: 5000 } // Tahmini 5 saniyede
    });

    // --- YARDIMCI FONKSİYONLAR ---
    const fetchDifficultyWithLevel = (level) => {
        return Object.values(selectedDifficulties).find(difficulty => difficulty.level === level);
    };

    // Uygulama ilk yüklendiğinde jsPDF'i yükle
    useEffect(() => {
        (async () => {
            await loadJsPdf();
        })();
    }, []);

    // --- EVENT HANDLERS (OLAY YÖNETİCİLERİ) ---

    // PDF Oluşturucu için fonksiyonlar
    const handleDifficultyChange = (difficulty) => {
        setSelectedDifficulties(prev => ({
            ...prev,
            [difficulty]: { ...prev[difficulty], isSelected: !prev[difficulty].isSelected }
        }));
    };

    const handleCreatePdf = async () => {
        const chosenDifficulties = Object.keys(selectedDifficulties).filter(key => selectedDifficulties[key].isSelected);
        if (chosenDifficulties.length === 0) {
            setMessage(t("pdf.noDifficultyError"));
            setIsError(false);
            return;
        }
        setMessage(t("pdf.creatingMessage"));
        setIsError(false);
        setIsLoading(true);
        setGenerationProgress({ generated: 0, total: numPages * sudokusPerPage, estimatedTime: 'Calculating...' });

        const worker = new Worker(new URL('./sudoku.worker.js', import.meta.url));

        worker.onmessage = async (e) => {
            const data = e.data;

            // YENİ: Gelen mesajın tipini kontrol et
            if (data.type === 'progress') {
                // Eğer ilerleme mesajıysa, state'i güncelle ve işlemi bitir.
                setGenerationProgress(data);
                return;
            }

            if (data.type === 'result') {
                const generatedPuzzlesForPdf = data.puzzles;
                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    // PDF oluşturmadan önce fontu yüklüyoruz
                    const fontLoaded = await loadPdfFonts(doc);
                    if (!fontLoaded) {
                        // Eğer font yüklenemezse kullanıcıyı bilgilendir ve işlemi durdur
                        setMessage(t("error.fontLoadError")); // Bu çeviriyi eklemelisin
                        setIsError(true);
                        setIsLoading(false);
                        worker.terminate();
                        return;
                    }

                    const specialFontLanguages = ['ja', 'zh'];

                    // Eğer mevcut dil, uzman font gerektiren dillerden biriyse, NotoSansJP'yi kullan.
                    if (specialFontLanguages.includes(i18n.resolvedLanguage)) {
                        doc.setFont('NotoSansJP');
                    } else {
                        // Diğer tüm diller için (Türkçe, İngilizce, Rusça, Almanca vb.)
                        // evrensel ana fontumuzu kullan.
                        doc.setFont('NotoSans');
                    }

                    let sudokuCounter = 0;
                    for (let page = 0; page < numPages; page++) {
                        if (page > 0) doc.addPage();
                        doc.setFontSize(14);
                        doc.text(t("pdf.pageLabel", { currentPage: page + 1, totalPages: numPages }), 105, 15, { align: 'center' });
                        const puzzlesForPage = generatedPuzzlesForPdf.slice(sudokuCounter, sudokuCounter + sudokusPerPage);
                        drawPageLayout(doc, puzzlesForPage, sudokusPerPage, t, fetchDifficultyWithLevel);
                        sudokuCounter += sudokusPerPage;
                    }

                    const pdfBlob = doc.output('blob');
                    const downloadUrl = URL.createObjectURL(pdfBlob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = 'sudoku.pdf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(downloadUrl);
                    setMessage(t("pdf.successMessage"));
                    setIsError(false);
                } catch (error) {
                    console.error("PDF oluşturma hatası:", error);
                    setMessage(t("error.generic"));
                    setIsError(true);
                } finally {
                    setIsLoading(false);
                    worker.terminate();
                }
            }
        };

        worker.onerror = (error) => {
            console.error('Web Worker hatası:', error);
            setMessage(t("error.generic"));
            setIsError(true);
            setIsLoading(false);
            setGenerationProgress(null);
            worker.terminate();
        };

        const totalSudokus = numPages * sudokusPerPage;
        worker.postMessage({
            totalSudokus,
            chosenDifficulties,
            difficultySettings: selectedDifficulties
        });
    };

    // Sudoku Çözücü için fonksiyonlar
    const handleCellChange = (row, col, value) => {
        const newGrid = JSON.parse(JSON.stringify(grid));
        newGrid[row][col] = value;
        setGrid(newGrid);

        // Her değişiklikten sonra tüm tabloyu kontrol et ve hatalı hücreleri state'e ata
        const conflicts = validateGrid(newGrid);
        setInvalidCells(conflicts);
    };

    const handleSolve = () => {
        // Çöz butonuna basıldığında son bir kez daha kontrol et
        const conflicts = validateGrid(grid);
        setInvalidCells(conflicts);

        if (conflicts.length > 0) {
            setMessage(t("solver.invalidGridError")); // Bu çeviriyi eklemeyi unutma!
            setIsError(true);
            return; // Hata varsa çözme işlemini başlatma
        }

        setMessage(t("solver.searchingMessage"));
        setIsLoading(true);
        setTimeout(() => {
            const solutions = findAllSolutions(grid, MAX_SOLUTIONS);
            setAllSolutions(solutions);
            setInitialGrid(JSON.parse(JSON.stringify(grid)));

            setIsLoading(false);

            if (solutions.length === 0) {
                setMessage(t("solver.noSolutionError"));
                setIsError(true);
                return;
            }
            setSelectedSolutionIndex(0);
            setGrid(solutions[0]);
            setIsError(false);

            if (solutions.length === 1) {
                setMessage(t("solver.solveSuccess"));
            } else if (solutions.length === MAX_SOLUTIONS) {
                setMessage(t("solver.multipleSolutionsFoundMaybeTooMany", { count: solutions.length }));
            } else {
                setMessage(t("solver.multipleSolutionsFound", { count: solutions.length }));
            }
        }, 50);
    };

    const handleSolutionSelect = (index) => {
        setSelectedSolutionIndex(index);
        setGrid(allSolutions[index]);
    };

    const handleClear = () => {
        setGrid(createEmptyGrid());
        setInitialGrid(null);
        setMessage('');
        setIsError(false);
        setAllSolutions([]);
        setSelectedSolutionIndex(0);
        setInvalidCells([]);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    // --- RENDER ---
    return (
        <div className="App">
            <header className="App-header">
                <div className="header-content">
                    <h1>{t("common.appTitle")}</h1>
                    <nav>
                        <button onClick={() => { setActiveTab('generator'); handleClear(); }} className={activeTab === 'generator' ? 'active' : ''}>{t("nav.generator")}</button>
                        <button onClick={() => { setActiveTab('solver'); handleClear(); }} className={activeTab === 'solver' ? 'active' : ''}>{t("nav.solver")}</button>
                    </nav>
                </div>
                <button onClick={toggleTheme} className="theme-toggle-button" title={t("common.toggleTheme")} aria-label={t("common.toggleTheme")}>
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
            </header>
            <main>
                {activeTab === 'generator' && (
                    <Generator
                        t={t}
                        selectedDifficulties={selectedDifficulties}
                        handleDifficultyChange={handleDifficultyChange}
                        numPages={numPages}
                        setNumPages={setNumPages}
                        sudokusPerPage={sudokusPerPage}
                        setSudokusPerPage={setSudokusPerPage}
                        handleCreatePdf={handleCreatePdf}
                        isLoading={isLoading}
                        generationProgress={generationProgress}
                    />
                )}
                {activeTab === 'solver' && (
                    <Solver
                        t={t}
                        handleSolve={handleSolve}
                        handleClear={handleClear}
                        isLoading={isLoading}
                        allSolutions={allSolutions}
                        selectedSolutionIndex={selectedSolutionIndex}
                        handleSolutionSelect={handleSolutionSelect}
                        grid={grid}
                        initialGrid={initialGrid}
                        handleCellChange={handleCellChange}
                        invalidCells={invalidCells}
                    />
                )}
                {message && <p className={`message ${isError ? 'error' : ''}`}>{message}</p>}
            </main>
            <footer>
                <div className="language-switcher">
                    {languages.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={i18n.resolvedLanguage === lang.code ? 'active' : ''}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
                <p>{t("common.footerText")}</p>

                <div className="contact-links">
                    <a href="https://github.com/pordarman" target="_blank" rel="noopener noreferrer" title="GitHub">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                    </a>
                    <a href="https://www.linkedin.com/in/ali-ihsan-celik-thk/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                    </a>
                </div>
            </footer>
        </div>
    );
}

export default App;