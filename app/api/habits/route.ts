import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaClient";
import { createClient } from "@/lib/supabase/server";

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

    const title = normalizeText(payload.title);
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const weightCu = toDecimalString(payload.weight_cu);
    if (weightCu === null) {
      return NextResponse.json(
        { error: "weight_cu is required" },
        { status: 400 }
      );
    }

    const freqType = normalizeText(payload.freq_type);
    if (!freqType) {
      return NextResponse.json(
        { error: "freq_type is required" },
        { status: 400 }
      );
    }

    const freqPerWeek = toDecimalString(payload.freq_per_week);
    if (freqPerWeek === null) {
      return NextResponse.json(
        { error: "freq_per_week is required" },
        { status: 400 }
      );
    }

    const microWeightCu = toDecimalString(payload.micro_weight_cu);
    if (microWeightCu === null) {
      return NextResponse.json(
        { error: "micro_weight_cu is required" },
        { status: 400 }
      );
    }

    const description = normalizeText(payload.description);
    const microTitle = normalizeText(payload.micro_title);
    const hasMicro =
      Boolean(microTitle) || Number.parseFloat(microWeightCu) > 0;

    const createdHabit = await prisma.habit.create({
      data: {
        user_id: user.id,
        title,
        description,
        weight_cu: weightCu,
        freq_type: freqType,
        freq_per_week: freqPerWeek,
        has_micro: hasMicro,
        micro_title: microTitle,
        micro_weight_cu: microWeightCu,
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
