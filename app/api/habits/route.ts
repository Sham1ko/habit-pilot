import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaClient";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

type HabitPayload = {
  title?: string;
  description?: string | null;
  weight_cu?: number | string;
  micro_title?: string | null;
  micro_weight_cu?: number | string;
  freq_type?: string;
  freq_per_week?: number | string;
  context_tags?: string[] | string;
};

function toDecimalString(value: number | string | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed && !Number.isNaN(Number(trimmed))) {
      return trimmed;
    }
  }

  return null;
}

function normalizeText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeTags(value?: string[] | string) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((tag) => tag.trim()).filter(Boolean);
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

const habitSchema = z.object({
  title: z.preprocess(normalizeText, z.string()),
  weight_cu: z.preprocess(toDecimalString, z.string()),
  freq_type: z.preprocess(normalizeText, z.string()),
  freq_per_week: z.preprocess(toDecimalString, z.string()),
  micro_weight_cu: z.preprocess(toDecimalString, z.string()),
});

export async function POST(request: Request) {
  try {
    let payload: HabitPayload;
    try {
      payload = (await request.json()) as HabitPayload;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: data.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const parsed = habitSchema.safeParse(payload);
    if (!parsed.success) {
      const issuePath = parsed.error.issues[0]?.path?.[0];
      const fieldLabel = issuePath ? String(issuePath) : "field";
      return NextResponse.json(
        { error: `${fieldLabel} is required` },
        { status: 400 }
      );
    }

    const { title, weight_cu, freq_type, freq_per_week, micro_weight_cu } =
      parsed.data;

    const description = normalizeText(payload.description);
    const microTitle = normalizeText(payload.micro_title);
    const hasMicro =
      Boolean(microTitle) || Number.parseFloat(micro_weight_cu) > 0;

    const createdHabit = await prisma.habit.create({
      data: {
        user_id: user.id,
        title,
        description,
        weight_cu,
        freq_type,
        freq_per_week,
        has_micro: hasMicro,
        micro_title: microTitle,
        micro_weight_cu,
        context_tags: normalizeTags(payload.context_tags),
        is_active: true,
      },
    });

    return NextResponse.json(
      {
        message: "Habit created",
        habit: createdHabit,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create habit error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: data.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const habits = await prisma.habit.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ habits }, { status: 200 });
  } catch (error) {
    console.error("Fetch habits error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
