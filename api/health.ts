import { json, route } from "./_lib/http";

/**
 * Diagnostika nasazení. Hlásí jen, jestli proměnná existuje, nikdy hodnotu.
 */
export default route({
  GET: () =>
    json({
      ok: true,
      env: {
        DATABASE_URL: Boolean(process.env.DATABASE_URL),
        AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
        INVITE_CODE: Boolean(process.env.INVITE_CODE),
      },
      node: process.version,
    }),
});
