import { clerkMiddleware, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
const publicRoutes = ["/", "/sign-in", "/sign-up", "/api/webhook/register"];
export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated, redirectToSignIn, userId } = await auth();
  if (!publicRoutes.includes(req.nextUrl.pathname) && !isAuthenticated) {
    return redirectToSignIn();
  }
  if (isAuthenticated) {
    try {
      const user = await (await clerkClient()).users.getUser(userId);
      console.log(`userdetails : : : ${user}`);
      const role = user?.privateMetadata?.role;
      console.log(`user role : : : ${role}`);
      if (role === "admin" && req.nextUrl.pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      if (role != "admin" && req.nextUrl.pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      if (publicRoutes.includes(req.nextUrl.pathname)) {
        return NextResponse.redirect(
          new URL(
            role === "admin" ? "/admin/dashboard" : "/dashboard",
            req.url,
          ),
        );
      }
    } catch (error) {
      console.log(error);
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
