import { api, APIError } from "encore.dev/api";
import { echoGlyphsDB } from "./db";
import type { EchoGlyph } from "./list";

interface GetEchoGlyphParams {
  id: string;
}

// Retrieves a specific echo glyph by ID.
export const get = api<GetEchoGlyphParams, EchoGlyph>(
  { expose: true, method: "GET", path: "/echo-glyphs/:id" },
  async ({ id }) => {
    const glyph = await echoGlyphsDB.queryRow<EchoGlyph>`
      SELECT id, name, resonance_type, linked_nodes, glyph_image_url, timestamp, notes
      FROM echo_glyph_records
      WHERE id = ${id}
    `;

    if (!glyph) {
      throw APIError.notFound("echo glyph not found");
    }

    return glyph;
  }
);
