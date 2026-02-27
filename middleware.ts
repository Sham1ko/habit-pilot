import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth"];
const AUTH_PAGES = ["/login", "/register"];

function isPublic(pathname: string) {
    return PUBLIC_PATHS.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
}

function isAuthPage(pathname: string) {
    return AUTH_PAGES.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname === "/app" || pathname.startsWith("/app/")) {
        const url = request.nextUrl.clone();
        url.pathname = "/today";
        return NextResponse.redirect(url);
    }

    const token = request.cookies.get("token")?.value;

    if (isAuthPage(pathname) && token) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            await jwtVerify(token, secret);
            const url = request.nextUrl.clone();
            url.pathname = "/today";
            return NextResponse.redirect(url);
        } catch {
            // Invalid token on auth pages should not block access to login/register
            const response = NextResponse.next();
            response.cookies.delete("token");
            return response;
        }
    }

    // Allow public routes through
    if (isPublic(pathname)) {
        return NextResponse.next();
    }

    if (!token) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);
        return NextResponse.next();
    } catch {
        // Invalid / expired token → redirect to login
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        const response = NextResponse.redirect(url);
        response.cookies.delete("token");
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
