import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan",
};

export default function PlanLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
