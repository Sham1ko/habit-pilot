import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Registration",
};

export default function RegisterLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return children;
}
