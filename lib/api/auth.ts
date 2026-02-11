import { prisma } from "@/lib/prismaClient";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, type RouteResult } from "@/lib/api/http";

type DbUser = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;

export async function requireAuthUserEmail(): Promise<RouteResult<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  const email = data.user?.email;
  if (error || !email) {
    return { error: errorResponse("Unauthorized", 401) };
  }

  return { data: email };
}

export async function requireDbUser(email: string): Promise<RouteResult<DbUser>> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { error: errorResponse("User not found", 404) };
  }

  return { data: user };
}

export async function requireRequestUser(): Promise<RouteResult<DbUser>> {
  const emailResult = await requireAuthUserEmail();
  if ("error" in emailResult) {
    return emailResult;
  }

  return requireDbUser(emailResult.data);
}
