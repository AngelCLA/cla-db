import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DocumentationPage } from './docs/DocumentationPage';
import './styles/global.css';

const DocsApp = () => {
    useEffect(() => {
        // The browser can look for a fragment before React mounts its target.
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }, []);

    return (
        <>
            <Header page="docs" />
            <DocumentationPage />
            <Footer />
        </>
    );
};

const container = document.getElementById('root');
if (!container) {
    throw new Error('Missing #root element');
}

createRoot(container).render(
    <StrictMode>
        <DocsApp />
    </StrictMode>
);
