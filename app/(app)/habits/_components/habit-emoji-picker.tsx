"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	EmojiPicker,
	EmojiPickerContent,
	EmojiPickerFooter,
	EmojiPickerSearch,
} from "@/components/ui/emoji-picker";

type HabitEmojiPickerProps = {
	id: string;
	value: string;
	onChange: (nextValue: string) => void;
};

export function HabitEmojiPicker({ id, value, onChange }: HabitEmojiPickerProps) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!open) {
			return;
		}

		const handlePointerDown = (event: MouseEvent | TouchEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) {
				return;
			}

			if (!rootRef.current?.contains(target)) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("touchstart", handlePointerDown);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("touchstart", handlePointerDown);
		};
	}, [open]);

	return (
		<div className="relative" ref={rootRef}>
			<Button
				id={id}
				type="button"
				variant="outline"
				size="icon"
				className="group relative h-10 w-10"
				onClick={() => setOpen((prev) => !prev)}
				aria-expanded={open}
				aria-label="Add emoji"
			>
				{value ? (
					<span className="text-lg leading-none">{value}</span>
				) : (
					<svg
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="1.5"
						xmlns="http://www.w3.org/2000/svg"
						className="-ml-0.5 relative transition-transform will-change-transform group-active:rotate-6 group-active:scale-85"
						viewBox="0 0 16 16"
						aria-hidden
					>
						<title>Add emoji</title>
						<path d="M9 1.07A7 7 0 1 0 14.93 7" />
						<path d="M5.5 9.5S6.25 11 8 11s2.5-1.5 2.5-1.5M6 6h0" />
						<circle cx="6" cy="6" r=".25" />
						<path d="M10 6h0" />
						<circle cx="10" cy="6" r=".25" />
						<path d="M11 3h4m-2-2v4" />
					</svg>
				)}
			</Button>
			{open ? (
				<div className="absolute left-0 top-full z-50 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-md border border-border bg-background p-2 shadow-md">
					<EmojiPicker
						className="h-[360px] w-full"
						onEmojiSelect={({ emoji }) => {
							onChange(emoji);
							setOpen(false);
						}}
					>
						<EmojiPickerSearch />
						<EmojiPickerContent />
						<EmojiPickerFooter />
					</EmojiPicker>
					{value ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="mt-1 h-7 px-2 text-xs"
							onClick={() => {
								onChange("");
								setOpen(false);
							}}
						>
							Clear
						</Button>
					) : null}
				</div>
			) : null}
		</div>
	);
}
