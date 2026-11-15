import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const currentUrl = new URL(req.url);

  const pathname = currentUrl.pathname;

  // Public routes
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname === "/home";

  // Public API routes
  const isPublicApiRoute = pathname === "/api/videos";

  const isAccessingDashboard = pathname === "/home";
  const isApiRequest = pathname.startsWith("/api");

  // Redirect authenticated users accessing public API routes
  if (userId && isPublicApiRoute && !isAccessingDashboard) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  if (!userId) {
    // Redirect unauthenticated users from protected routes
    if (!isPublicRoute && !isPublicApiRoute) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // Redirect unauthorized API requests
    if (isApiRequest && !isPublicApiRoute) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",

    "/(api|trpc)(.*)",

    "/__clerk/(.*)",
  ],
};
