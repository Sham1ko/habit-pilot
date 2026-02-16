import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "token";
const ALG = "HS256";

function getSecret() {
	const raw = process.env.JWT_SECRET;
	if (!raw) {
		throw new Error("JWT_SECRET env variable is not set");
	}
	return new TextEncoder().encode(raw);
}

// ── Payload type ───────────────────────────────────────────────────────

export type JwtPayload = {
	sub: string; // email
	userId: number;
};

// ── Sign / Verify ──────────────────────────────────────────────────────

export async function signToken(payload: JwtPayload): Promise<string> {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: ALG })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(getSecret());
}

export async function verifyToken(
	token: string,
): Promise<JwtPayload | null> {
	try {
		const { payload } = await jwtVerify(token, getSecret());
		return payload as unknown as JwtPayload;
	} catch {
		return null;
	}
}

// ── Cookie helpers (server-only) ───────────────────────────────────────

export async function setAuthCookie(token: string) {
	const jar = await cookies();
	jar.set(COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 7, // 7 days
	});
}

export async function removeAuthCookie() {
	const jar = await cookies();
	jar.delete(COOKIE_NAME);
}

export async function getAuthCookie(): Promise<string | undefined> {
	const jar = await cookies();
	return jar.get(COOKIE_NAME)?.value;
}
