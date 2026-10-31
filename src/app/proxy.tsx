import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const publicRoute = ["/", "/signin", "/signup"]

export default clerkMiddleware(async (auth, req) => {

    const { userId } = await auth();
    const { pathname } = req.nextUrl;

    const isPublicRoute = publicRoute.includes(pathname);
    const isAuthRoute = pathname === "/signin" || pathname === "/signup";

    const isPublicApiRoute = pathname === "/api/videos" || pathname.startsWith("/api/videos/");

    const isApiRequest = pathname.startsWith("/api");

    // Allow public API routes
    if (isPublicApiRoute) {
        return NextResponse.next();
    }

    //Redirecting authenticated users away from signin/signup
    if (userId && isAuthRoute) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    //Protecting API routes
    if (isApiRequest && !userId) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    //Protecting all non-public pages
    if (!isPublicRoute) {
        await auth.protect();
    }

    return NextResponse.next();
})


export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}