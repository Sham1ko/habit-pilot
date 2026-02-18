import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRequestUser } from "@/lib/api/auth";
import { hasRouteError, parseJsonBody } from "@/lib/api/http";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

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
    const userResult = await requireRequestUser();
    if (hasRouteError(userResult)) {
      return userResult.error;
    }
    const user = userResult.data;

    return NextResponse.json(
      {
        weekly_capacity_cu_default:
          user.weekly_capacity_cu_default?.toString() ?? null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch user error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const bodyResult = await parseJsonBody(request);
    if (hasRouteError(bodyResult)) {
      return bodyResult.error;
    }

    const parsed = updateSchema.safeParse(bodyResult.data);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request body";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const userResult = await requireRequestUser();
    if (hasRouteError(userResult)) {
      return userResult.error;
    }
    const user = userResult.data;

    const db = await getDb();
    const [updatedUser] = await db
      .update(users)
      .set({
        weekly_capacity_cu_default: parsed.data.weekly_capacity_cu_default,
      })
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json(
      {
        message: "User updated",
        weekly_capacity_cu_default:
          updatedUser.weekly_capacity_cu_default?.toString() ?? null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
