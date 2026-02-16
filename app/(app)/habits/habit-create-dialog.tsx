"use client";

import {
	type ChangeEvent,
	type FormEvent,
	type ReactNode,
	useCallback,
	useState,
} from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { HabitListItem } from "./types";

type HabitFormState = {
	title: string;
	description: string;
	weight_cu: string;
	freq_type: "daily" | "weekly";
	freq_per_week: string;
	micro_title: string;
	micro_weight_cu: string;
};

export type HabitCreateInitialValues = Partial<HabitFormState> & {
	hasMicro?: boolean;
};

const initialState: HabitFormState = {
	title: "",
	description: "",
	weight_cu: "",
	freq_type: "weekly",
	freq_per_week: "3",
	micro_title: "",
	micro_weight_cu: "",
};

type HabitCreateDialogProps = {
	onHabitCreated?: (habit: HabitListItem) => void;
	trigger?: ReactNode;
	initialValues?: HabitCreateInitialValues;
};

export function HabitCreateDialog({
	onHabitCreated,
	trigger,
	initialValues,
}: HabitCreateDialogProps) {
	const buildInitialFormState = useCallback(
		(): HabitFormState => ({
			...initialState,
			...initialValues,
			freq_type:
				initialValues?.freq_type === "daily" ||
				initialValues?.freq_type === "weekly"
					? initialValues.freq_type
					: initialState.freq_type,
		}),
		[initialValues],
	);

	const [open, setOpen] = useState(false);
	const [hasMicro, setHasMicro] = useState(Boolean(initialValues?.hasMicro));
	const [formState, setFormState] = useState<HabitFormState>(
		buildInitialFormState,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const resetForm = useCallback(() => {
		setFormState(buildInitialFormState());
		setHasMicro(Boolean(initialValues?.hasMicro));
		setError(null);
	}, [buildInitialFormState, initialValues?.hasMicro]);

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		resetForm();
		if (!nextOpen) {
			setIsSubmitting(false);
		}
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setFormState((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);

		if (!formState.title.trim()) {
			setError("Name is required.");
			return;
		}

		if (!formState.weight_cu.trim()) {
			setError("Capacity is required.");
			return;
		}

		if (formState.freq_type === "weekly" && !formState.freq_per_week.trim()) {
			setError("Weekly frequency is required.");
			return;
		}

		if (hasMicro && !formState.micro_weight_cu.trim()) {
			setError("Micro capacity is required.");
			return;
		}

		setIsSubmitting(true);

		try {
			const freqPerWeek =
				formState.freq_type === "daily" ? "7" : formState.freq_per_week;

			const response = await fetch("/api/habits", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: formState.title,
					description: formState.description || null,
					weight_cu: formState.weight_cu,
					micro_title: hasMicro ? formState.micro_title || null : null,
					micro_weight_cu: hasMicro ? formState.micro_weight_cu : "0",
					freq_type: formState.freq_type,
					freq_per_week: freqPerWeek,
					context_tags: [],
				}),
			});

			const data = (await response.json().catch(() => null)) as {
				habit?: HabitListItem;
				error?: string;
			} | null;

			if (!response.ok) {
				setError(data?.error ?? "Failed to create habit.");
				return;
			}

			if (data?.habit) {
				onHabitCreated?.(data.habit);
			}

			setOpen(false);
		} catch {
			setError("Failed to create habit.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				{trigger ?? <Button type="button">Add habit</Button>}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[460px]">
				<form onSubmit={handleSubmit} className="space-y-4">
					<DialogHeader>
						<DialogTitle>Create habit</DialogTitle>
						<DialogDescription>
							Define the basics for a new habit. You can refine it later.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4">
						<div className="grid gap-3">
							<Label htmlFor="habit-name">Name</Label>
							<Input
								id="habit-name"
								name="title"
								placeholder="Morning run"
								value={formState.title}
								onChange={handleChange}
							/>
						</div>
						<div className="grid gap-3">
							<Label htmlFor="habit-description">Context / Description</Label>
							<Input
								id="habit-description"
								name="description"
								placeholder="Park, 20 minutes, easy pace"
								value={formState.description}
								onChange={handleChange}
							/>
						</div>
						<div className="grid gap-3">
							<Label htmlFor="habit-capacity">Capacity</Label>
							<Input
								id="habit-capacity"
								name="weight_cu"
								placeholder="10"
								type="number"
								min="0"
								step="0.1"
								value={formState.weight_cu}
								onChange={handleChange}
								required
							/>
						</div>
						<div className="grid gap-3">
							<Label>Frequency</Label>
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant={
										formState.freq_type === "daily" ? "default" : "outline"
									}
									onClick={() =>
										setFormState((prev) => ({
											...prev,
											freq_type: "daily",
										}))
									}
								>
									Daily
								</Button>
								<Button
									type="button"
									variant={
										formState.freq_type === "weekly" ? "default" : "outline"
									}
									onClick={() =>
										setFormState((prev) => ({
											...prev,
											freq_type: "weekly",
										}))
									}
								>
									Weekly
								</Button>
							</div>
							{formState.freq_type === "weekly" ? (
								<div className="flex items-center gap-2">
									<Input
										id="habit-frequency"
										name="freq_per_week"
										placeholder="3"
										type="number"
										min="1"
										max="7"
										step="1"
										value={formState.freq_per_week}
										onChange={handleChange}
										required
									/>
									<span className="text-xs text-muted-foreground">
										times per week
									</span>
								</div>
							) : (
								<p className="text-xs text-muted-foreground">
									Every day (7x per week)
								</p>
							)}
						</div>
						<div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
							<div>
								<Label
									className="text-sm font-medium"
									htmlFor="habit-micro-toggle"
								>
									Microstep
								</Label>
								<p className="text-xs text-muted-foreground">
									Add a smaller version of the habit
								</p>
							</div>
							<Switch
								id="habit-micro-toggle"
								checked={hasMicro}
								onCheckedChange={(next) => {
									setHasMicro(next);
									if (!next) {
										setFormState((prev) => ({
											...prev,
											micro_title: "",
											micro_weight_cu: "",
										}));
										setError(null);
									}
								}}
							/>
						</div>
						{hasMicro ? (
							<>
								<div className="grid gap-3">
									<Label htmlFor="habit-microstep">Microstep</Label>
									<Input
										id="habit-microstep"
										name="micro_title"
										placeholder="Put on running shoes"
										value={formState.micro_title}
										onChange={handleChange}
									/>
								</div>
								<div className="grid gap-3">
									<Label htmlFor="habit-micro-weight">Micro capacity</Label>
									<Input
										id="habit-micro-weight"
										name="micro_weight_cu"
										placeholder="1"
										type="number"
										min="0"
										step="0.1"
										value={formState.micro_weight_cu}
										onChange={handleChange}
										required
									/>
								</div>
							</>
						) : null}
					</div>
					{error ? <p className="text-sm text-destructive">{error}</p> : null}
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</DialogClose>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Adding..." : "Add habit"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
