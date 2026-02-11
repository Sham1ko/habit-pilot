import AppSidebar from "@/components/sidebar";
import OnboardingModal from "@/components/onboarding-modal";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-6">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-6 md:px-10 md:py-10">{children}</main>
        <OnboardingModal />
      </SidebarInset>
    </SidebarProvider>
  );
}
