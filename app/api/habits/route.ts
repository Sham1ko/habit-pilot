import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaClient";

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

const MOCK_USER_EMAIL = "mock@habit.local";

function toDecimalString(value: number | string | undefined, fallback: string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed && !Number.isNaN(Number(trimmed))) {
      return trimmed;
    }
  }

  return fallback;
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
    let payload: HabitPayload = {};

    try {
      const contentLength = request.headers.get("content-length");
      if (!contentLength || contentLength !== "0") {
        payload = (await request.json()) as HabitPayload;
      }
    } catch {
      payload = {};
    }

    const user = await prisma.user.upsert({
      where: { email: MOCK_USER_EMAIL },
      update: {},
      create: {
        email: MOCK_USER_EMAIL,
        name: "Mock User",
      },
    });

    const title = normalizeText(payload.title) ?? "New habit";
    const description = normalizeText(payload.description);
    const microTitle = normalizeText(payload.micro_title);
    const weightCu = toDecimalString(payload.weight_cu, "1");
    const freqPerWeek = toDecimalString(payload.freq_per_week, "3");
    const microWeightCu = toDecimalString(payload.micro_weight_cu, "0");
    const hasMicro =
      Boolean(microTitle) || Number.parseFloat(microWeightCu) > 0;

    const createdHabit = await prisma.habit.create({
      data: {
        user_id: user.id,
        title,
        description,
        weight_cu: weightCu,
        freq_type: payload.freq_type?.trim() || "weekly",
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
