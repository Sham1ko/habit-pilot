import Image from "next/image";
import { PrismaClient } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./components/LogoutButton";

const prisma = new PrismaClient();

export default async function Home() {
  let dbStatus = "Not connected";
  let dbError = "";

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "✅ Connection to Postgres via Prisma works successfully!";
  } catch (error) {
    dbStatus = "❌ Error connecting to the database";
    dbError = error instanceof Error ? error.message : "Unknown error";
  } finally {
    await prisma.$disconnect();
  }

  // Get authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full flex justify-between items-center">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <LogoutButton />
        </div>
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to Habit Pilot!
          </h1>
          {user && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 rounded-lg">
              <p className="text-green-700 dark:text-green-400 font-medium">
                ✅ Authenticated as: {user.email}
              </p>
            </div>
          )}
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            <strong className="block mb-2 text-zinc-950 dark:text-zinc-50">
              {dbStatus}
            </strong>
            {dbError && (
              <span className="block text-sm text-red-600 dark:text-red-400">
                {dbError}
              </span>
            )}
          </p>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Your authentication system is now set up! You can register, login,
            and access protected routes. All routes are protected by default
            except /login, /register, and /auth/*.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/8 px-5 transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
