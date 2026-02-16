import { CtaSection } from "./_components/cta-section";
import { FaqSection } from "./_components/faq-section";
import { FeaturesSection } from "./_components/features-section";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header";
import { HeroSection } from "./_components/hero-section";
import { HowItWorksSection } from "./_components/how-it-works-section";
import { PreviewSection } from "./_components/preview-section";
import { ProblemSection } from "./_components/problem-section";

export default function HomePage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header />
			<main>
				<HeroSection />
				<ProblemSection />
				<HowItWorksSection />
				<FeaturesSection />
				<PreviewSection />
				<FaqSection />
				<CtaSection />
			</main>
			<Footer />
		</div>
	);
}
