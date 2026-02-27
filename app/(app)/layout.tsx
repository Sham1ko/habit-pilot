import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import OnboardingModal from "@/components/onboarding-modal";
import AppSidebar from "@/components/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireRequestUser } from "@/lib/api/auth";
import { hasRouteError } from "@/lib/api/http";

const SIDEBAR_COOKIE_NAME = "sidebar_state";

export default async function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const userResult = await requireRequestUser();
	if (hasRouteError(userResult)) {
		redirect("/login?clearToken=1");
	}

	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<AppSidebar />
			<SidebarInset>
				<AppHeader />
				<main className="flex flex-1 p-4 md:p-6">{children}</main>
				<OnboardingModal />
			</SidebarInset>
		</SidebarProvider>
	);
}
