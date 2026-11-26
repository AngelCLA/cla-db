import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { StackBar } from './components/StackBar';
import { Install } from './components/Install';
import { Features } from './components/Features';
import { Architecture } from './components/Architecture';
import { TechnicalOverview } from './components/TechnicalOverview';
import { Docs } from './components/Docs';
import { Footer } from './components/Footer';

export const App = () => (
    <div id="top">
        <Header />
        <main className="container">
            <Hero />
            <StackBar />
            <Install />
            <Features />
            <TechnicalOverview />
            <Architecture />
            <Docs />
        </main>
        <Footer />
    </div>
);
