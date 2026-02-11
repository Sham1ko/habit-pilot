import Sidebar from "@/components/sidebar";
import OnboardingModal from "@/components/onboarding-modal";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 p-6 md:px-10 md:py-10">{children}</main>
        <OnboardingModal />
      </div>
    </div>
  );
}
