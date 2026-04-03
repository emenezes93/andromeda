import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { PainSection } from './components/PainSection';
import { HowItWorks } from './components/HowItWorks';
import { SocialProof } from './components/SocialProof';
import { Features } from './components/Features';
import { ForProfessionals } from './components/ForProfessionals';
import { ForPatients } from './components/ForPatients';
import { Pricing } from './components/Pricing';
import { Testimonials } from './components/Testimonials';
import { FAQ } from './components/FAQ';
import { CTASection } from './components/CTASection';
import { Footer } from './components/Footer';

export function App() {
  return (
    <div className="min-h-screen bg-white">
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="main-content" aria-label="Conteúdo principal">
        <Hero />
        <PainSection />
        <HowItWorks />
        <SocialProof />
        <Features />
        <ForProfessionals />
        <ForPatients />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
