// DEMO: single fixed org + actor. Swap for Clerk org/user lookup in production.
export const DEMO_ORGANIZATION_ID = "demo-organization";
export const DEMO_USER_ID = "demo-user";

export const demoScope = {
  organization_id: DEMO_ORGANIZATION_ID,
  created_by: DEMO_USER_ID,
  updated_by: DEMO_USER_ID,
} as const;
