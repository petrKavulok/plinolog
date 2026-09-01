/**
 * Diagnostika nasazení. Schválně nic neimportuje — když tenhle endpoint
 * odpoví a ostatní ne, je problém v závislostech nebo v env proměnných.
 * Hlásí jen, jestli proměnná existuje, nikdy její hodnotu.
 */
export function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      env: {
        DATABASE_URL: Boolean(process.env.DATABASE_URL),
        AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
        INVITE_CODE: Boolean(process.env.INVITE_CODE),
      },
      node: process.version,
    }),
    { headers: { "content-type": "application/json", "cache-control": "no-store" } },
  );
}
