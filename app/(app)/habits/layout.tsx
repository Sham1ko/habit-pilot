import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Habits",
};

export default function HabitsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
