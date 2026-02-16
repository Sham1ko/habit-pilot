import AppSidebar from "@/components/sidebar";
import { AppHeader } from "@/components/app-header";
import OnboardingModal from "@/components/onboarding-modal";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex flex-1 p-6">{children}</main>
        <OnboardingModal />
      </SidebarInset>
    </SidebarProvider>
  );
}
