import { NextResponse } from "next/server";

export type RouteResult<T> = { data: T } | { error: NextResponse };

export function hasRouteError<T>(
	result: RouteResult<T>,
): result is { error: NextResponse } {
	return "error" in result;
}

export function errorResponse(message: string, status: number) {
	return NextResponse.json({ error: message }, { status });
}

export async function parseJsonBody<T = unknown>(
	request: Request,
): Promise<RouteResult<T>> {
	try {
		return { data: (await request.json()) as T };
	} catch {
		return { error: errorResponse("Invalid JSON body", 400) };
	}
}
