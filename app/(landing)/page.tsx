import { CtaSection } from "./_components/cta-section";
import { FaqSection } from "./_components/faq-section";
import { FeaturesSection } from "./_components/features-section";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header";
import { HeroSection } from "./_components/hero-section";
import { HowItWorksSection } from "./_components/how-it-works-section";
import { PreviewSection } from "./_components/preview-section";
import { ProblemSection } from "./_components/problem-section";
import { getAuthCookie, verifyToken } from "@/lib/auth/jwt";

export default async function HomePage() {
	const token = await getAuthCookie();
	const payload = token ? await verifyToken(token) : null;
	const isAuthenticated = Boolean(payload);

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header isAuthenticated={isAuthenticated} />
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
