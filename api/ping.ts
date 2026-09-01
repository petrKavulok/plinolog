import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Nejjednodušší možná funkce — žádné importy, žádné závislosti.
 * Slouží k rozlišení, jestli se láme nasazení funkcí, nebo až jejich obsah.
 */
export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ pong: true, node: process.version }));
}
