export const ONBOARDING_STAGE_VALUES = [
  "set_capacity",
  "add_first_habit",
  "go_plan",
  "completed",
] as const;

export type OnboardingStage = (typeof ONBOARDING_STAGE_VALUES)[number];

export const ONBOARDING_STAGE = {
  SET_CAPACITY: ONBOARDING_STAGE_VALUES[0],
  ADD_FIRST_HABIT: ONBOARDING_STAGE_VALUES[1],
  GO_PLAN: ONBOARDING_STAGE_VALUES[2],
  COMPLETED: ONBOARDING_STAGE_VALUES[3],
} as const;

export const DEFAULT_ONBOARDING_STAGE = ONBOARDING_STAGE.COMPLETED;
