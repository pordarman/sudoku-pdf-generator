import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PdfViewer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const storedPdfData = localStorage.getItem(`pdf-${id}`);
        console.log(storedPdfData, `pdf-${id}`);

        if (storedPdfData) {
            const { url, timestamp } = JSON.parse(storedPdfData);
            const TEN_MINUTES = 10 * 60 * 1000;
            const isLinkExpired = Date.now() - timestamp > TEN_MINUTES;

            if (isLinkExpired) {
                setIsExpired(true);
                localStorage.removeItem(`pdf-${id}`);
            } else {
                setPdfUrl(url);
            }
        } else {
            setIsExpired(true);
        }
    }, [id]);

    if (isExpired) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2>{t("pdfViewer.expiredTitle")}</h2>
                <p>{t("pdfViewer.expiredMessage")}</p>
                <button onClick={() => navigate('/')}>{t("pdfViewer.goBack")}</button>
            </div>
        );
    }

    if (!pdfUrl) {
        return <p>{t("pdfViewer.loading")}</p>;
    }

    return (
        <div className="pdf-viewer-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <iframe src={pdfUrl} title="Sudoku PDF" style={{ flex: 1, border: 'none' }} />
        </div>
    );
};

export default PdfViewer;