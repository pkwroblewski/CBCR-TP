// Clerk JWT issuer domain for Convex authentication
// Update this to match your Clerk instance domain
const CLERK_DOMAIN = "https://grown-cobra-44.clerk.accounts.dev";

export default {
  providers: [
    {
      domain: CLERK_DOMAIN,
      applicationID: "convex",
    },
  ],
};
