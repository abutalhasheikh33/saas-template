import { clerkMiddleware, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
const publicRoutes = ["/", "/sign-in", "/sign-up", "/api/webhook/register"];

// Routes where we actually need to check the user's role
const needsRoleCheck = (pathname: string) =>
  pathname.startsWith("/dashboard") ||
  pathname.startsWith("/admin") ||
  publicRoutes.includes(pathname);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const { isAuthenticated, redirectToSignIn, userId } = await auth();

  if (!publicRoutes.includes(pathname) && !isAuthenticated) {
    return redirectToSignIn();
  }

  // Only fetch user details when role-based routing is needed.
  // This avoids making an expensive API call on every single request
  // (JS, CSS, images, fonts, etc.) which was causing OOM crashes.
  if (isAuthenticated && needsRoleCheck(pathname)) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const role = user?.privateMetadata?.role;

      if (role === "admin" && pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      if (role !== "admin" && pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      if (publicRoutes.includes(pathname)) {
        return NextResponse.redirect(
          new URL(
            role === "admin" ? "/admin/dashboard" : "/dashboard",
            req.url,
          ),
        );
      }
    } catch (error) {
      console.error("Middleware role check failed:", error);
      return NextResponse.redirect(new URL("/error", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes
    "/__clerk/(.*)",
  ],
};
