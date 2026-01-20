"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        "px-4 py-2 border border-red-600 hover:bg-red-600 disabled:bg-red-400 text-red-600 hover:text-white font-medium text-sm rounded-lg transition duration-200 disabled:cursor-not-allowed",
        className,
      )}
    >
      {loading ? "Logging out..." : (children ?? "Logout")}
    </button>
  );
}
