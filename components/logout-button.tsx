"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function useLogout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogout = async (): Promise<boolean> => {
    if (isLoggingOut || isPending) {
      return false;
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
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      return false;
    }
  };

  return { handleLogout, isLoggingOut: isLoggingOut || isPending };
}

type LogoutConfirmDialogProps = {
  trigger: (state: {
    isLoggingOut: boolean;
    Trigger: typeof DialogTrigger;
  }) => React.ReactNode;
};

export function LogoutConfirmDialog({ trigger }: LogoutConfirmDialogProps) {
  const { handleLogout, isLoggingOut } = useLogout();
  const [open, setOpen] = useState(false);

  const confirmLogout = async () => {
    const didLogout = await handleLogout();
    if (didLogout) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isLoggingOut && setOpen(next)}>
      {trigger({ isLoggingOut, Trigger: DialogTrigger })}
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Log out?</DialogTitle>
          <DialogDescription>Are you sure you want to log out?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={confirmLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Logging out..." : "Yes, log out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type LogoutButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export default function LogoutButton({
  className,
  children,
}: LogoutButtonProps) {
  return (
    <LogoutConfirmDialog
      trigger={({ isLoggingOut, Trigger }) => (
        <Trigger asChild>
          <button
            type="button"
            disabled={isLoggingOut}
            className={cn(
              "px-4 py-2 border border-red-600 hover:bg-red-600 disabled:bg-red-400 text-red-600 hover:text-white font-medium text-sm rounded-lg transition duration-200 disabled:cursor-not-allowed",
              className,
            )}
          >
            {isLoggingOut ? "Logging out..." : (children ?? "Logout")}
          </button>
        </Trigger>
      )}
    />
  );
}
