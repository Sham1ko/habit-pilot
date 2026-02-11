"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export default function LogoutButton({
  className,
  children,
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    if (isLoggingOut || isPending) {
      return;
    }
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      startTransition(() => {
        router.replace("/login");
        router.refresh();
      });
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut || isPending}
      className={cn(
        "px-4 py-2 border border-red-600 hover:bg-red-600 disabled:bg-red-400 text-red-600 hover:text-white font-medium text-sm rounded-lg transition duration-200 disabled:cursor-not-allowed",
        className,
      )}
    >
      {isLoggingOut || isPending ? "Logging out..." : (children ?? "Logout")}
    </button>
  );
}
