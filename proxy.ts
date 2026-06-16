import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/accounts(.*)", "/api(.*)"]);
const isPublicApiRoute = createRouteMatcher([
  "/api/oauth(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request) && !isPublicApiRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/dashboard(.*)", "/accounts(.*)", "/api(.*)"],
};
