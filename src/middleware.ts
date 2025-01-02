import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/api/webhooks(.*)"]);

// See https://clerk.com/docs/references/nextjs/auth-middleware
// for more information about configuring your Middleware
export default clerkMiddleware(
  (auth, req) => {
    if (!isPublicRoute(req)) {
      auth.protect();
    }
  },
  { afterSignInUrl: "/chat", afterSignUpUrl: "/chat" },
);

export const config = {
  matcher: [
    // Exclude files with a "." followed by an extension, which are typically static files.
    // Exclude files in the _next directory, which are Next.js internals.
    "/((?!.+\\.[\\w]+$|_next).*)",
    // Re-include any files in the api or trpc folders that might have an extension
    "/(api|trpc)(.*)",
  ],
};
