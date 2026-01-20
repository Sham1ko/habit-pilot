import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaClient";
import { createClient } from "@/lib/supabase/server";

async function requireAuthUserEmail() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  const email = data.user?.email;
  if (error || !email) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { email };
}

async function requireDbUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  return { user };
}

const weeklyCapacitySchema = z
  .preprocess((value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value.toString() : "";
    }

    if (typeof value === "string") {
      return value.trim();
    }

    return value;
  }, z.coerce.string())
  .refine((value) => value !== "" && !Number.isNaN(Number(value)), {
    message: "Weekly capacity is required.",
  })
  .refine((value) => Number(value) > 0, {
    message: "Weekly capacity must be greater than 0.",
  });

const updateSchema = z.object({
  weekly_capacity_cu_default: weeklyCapacitySchema,
});

export async function GET() {
  try {
    const { email, error: authError } = await requireAuthUserEmail();
    if (authError) {
      return authError;
    }

    const { user, error: userError } = await requireDbUser(email);
    if (userError) {
      return userError;
    }

    return NextResponse.json(
      {
        weekly_capacity_cu_default:
          user.weekly_capacity_cu_default?.toString() ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch user error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = updateSchema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request body";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { email, error: authError } = await requireAuthUserEmail();
    if (authError) {
      return authError;
    }

    const { user, error: userError } = await requireDbUser(email);
    if (userError) {
      return userError;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        weekly_capacity_cu_default: parsed.data.weekly_capacity_cu_default,
      },
    });

    return NextResponse.json(
      {
        message: "User updated",
        weekly_capacity_cu_default:
          updatedUser.weekly_capacity_cu_default?.toString() ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
