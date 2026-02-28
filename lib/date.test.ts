import { formatDateUTC, getDateContext } from "./date.ts";

function withMockedNow(isoTimestamp: string, fn: () => void) {
	const RealDate = Date;
	const fixed = new RealDate(isoTimestamp);

	class MockDate extends RealDate {
		constructor(...args: ConstructorParameters<typeof Date>) {
			if (args.length === 0) {
				super(fixed.toISOString());
				return;
			}
			super(...args);
		}

		static now() {
			return fixed.getTime();
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(globalThis as any).Date = MockDate;
	try {
		fn();
	} finally {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(globalThis as any).Date = RealDate;
	}
}

describe("date helpers", () => {
	test("formatDateUTC returns input string unchanged", () => {
		expect(formatDateUTC("2026-02-27")).toBe("2026-02-27");
	});

	test("formatDateUTC formats Date as YYYY-MM-DD UTC", () => {
		expect(formatDateUTC(new Date("2026-02-27T13:00:00Z"))).toBe("2026-02-27");
	});

	test("getDateContext resolves week boundaries in UTC", () => {
		withMockedNow("2026-02-11T12:00:00Z", () => {
			const result = getDateContext("UTC");
			expect(result.todayDateString).toBe("2026-02-11");
			expect(result.weekStartDateString).toBe("2026-02-09");
			expect(result.weekEndDateString).toBe("2026-02-15");
		});
	});

	test("getDateContext respects time zone day shift", () => {
		withMockedNow("2026-02-11T23:30:00Z", () => {
			const result = getDateContext("Asia/Tokyo");
			expect(result.todayDateString).toBe("2026-02-12");
			expect(result.weekStartDateString).toBe("2026-02-09");
			expect(result.weekEndDateString).toBe("2026-02-15");
		});
	});

	test("getDateContext falls back when timezone is invalid", () => {
		withMockedNow("2026-02-11T12:00:00Z", () => {
			const result = getDateContext("Invalid/Timezone");
			expect(result.todayDateString).toBe("2026-02-11");
			expect(result.weekStartDateString).toBe("2026-02-09");
			expect(result.weekEndDateString).toBe("2026-02-15");
		});
	});
});
