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
        'child': { removals: 35, labelKey: 'difficulty.child', isSelected: true, level: 0 },
        'easy': { removals: 42, labelKey: 'difficulty.easy', isSelected: true, level: 1 },
        'medium': { removals: 49, labelKey: 'difficulty.medium', isSelected: false, level: 2 },
        'hard': { removals: 56, labelKey: 'difficulty.hard', isSelected: false, level: 3 },
        'expert': { removals: 59, labelKey: 'difficulty.expert', isSelected: false, level: 4 },
        'impossible': { removals: 64, labelKey: 'difficulty.impossible', isSelected: false, level: 5 }
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

        const worker = new Worker(new URL('./sudoku.worker.js', import.meta.url));

        worker.onmessage = async (e) => {
            const generatedPuzzlesForPdf = e.data;
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
        };

        worker.onerror = (error) => {
            console.error('Web Worker hatası:', error);
            setMessage(t("error.generic"));
            setIsError(true);
            setIsLoading(false);
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
            </footer>
        </div>
    );
}

export default App;