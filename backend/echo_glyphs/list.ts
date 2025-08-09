import { api } from "encore.dev/api";
import { echoGlyphsDB } from "./db";

export interface EchoGlyph {
  id: string;
  name: string;
  resonance_type: string;
  linked_nodes: string[];
  glyph_image_url: string | null;
  timestamp: Date;
  notes: string | null;
}

interface ListEchoGlyphsResponse {
  glyphs: EchoGlyph[];
}

// Retrieves all echo glyphs from the resonance map.
export const list = api<void, ListEchoGlyphsResponse>(
  { expose: true, method: "GET", path: "/echo-glyphs" },
  async () => {
    const glyphs = await echoGlyphsDB.queryAll<EchoGlyph>`
      SELECT id, name, resonance_type, linked_nodes, glyph_image_url, timestamp, notes
      FROM echo_glyph_records
      ORDER BY timestamp DESC
    `;

    return { glyphs };
  }
);
