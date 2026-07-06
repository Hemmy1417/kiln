// Deterministic generative token art. Every token renders the same SVG on
// every machine from (collection_id, edition) alone — no images stored
// anywhere, which is the honest way to demo protocol-native NFTs.
//
// Composition: a graphite plate with 5-9 geometric forms (arcs, diamonds,
// bars, rings) laid out on a seeded grid, in a per-collection palette
// drawn from the Kiln system colors plus two derived hues.

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(collectionId: string, edition: number): number {
  let h = 2166136261;
  const s = `${collectionId}:${edition}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PALETTES: string[][] = [
  ["#fcd535", "#0ecb81", "#eaecef"],
  ["#fcd535", "#f6465d", "#b7bdc6"],
  ["#0ecb81", "#2dbdb6", "#fcd535"],
  ["#f6465d", "#fcd535", "#eaecef"],
  ["#fcd535", "#eaecef", "#707a8a"],
  ["#2dbdb6", "#fcd535", "#f6465d"],
];

/**
 * Returns a full <svg> string for a token. Deterministic per
 * (collectionId, edition). ~1kB, safe to inline via dangerouslySetInnerHTML
 * or a data: URL.
 */
export function tokenArtSvg(collectionId: string, edition: number, size = 300): string {
  const rand = mulberry32(seedFrom(collectionId, edition));
  const palette = PALETTES[Math.floor(rand() * PALETTES.length)];
  const pick = () => palette[Math.floor(rand() * palette.length)];

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="${size}" height="${size}">`,
    `<rect width="300" height="300" fill="#14181d"/>`,
    // subtle plate texture
    `<rect x="10" y="10" width="280" height="280" rx="14" fill="#1e2329" stroke="#2b3139"/>`,
  );

  const n = 5 + Math.floor(rand() * 5);
  for (let i = 0; i < n; i++) {
    const kind = Math.floor(rand() * 4);
    const cx = 40 + rand() * 220;
    const cy = 40 + rand() * 220;
    const c = pick();
    const op = (0.55 + rand() * 0.45).toFixed(2);
    if (kind === 0) {
      // ring
      const r = 14 + rand() * 46;
      const w = 3 + rand() * 8;
      parts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${c}" stroke-width="${w.toFixed(1)}" opacity="${op}"/>`);
    } else if (kind === 1) {
      // diamond
      const s = 12 + rand() * 34;
      parts.push(`<rect x="${(cx - s / 2).toFixed(1)}" y="${(cy - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${c}" opacity="${op}" transform="rotate(45 ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`);
    } else if (kind === 2) {
      // bar
      const w = 30 + rand() * 110;
      const h = 6 + rand() * 16;
      const rot = Math.floor(rand() * 4) * 45;
      parts.push(`<rect x="${(cx - w / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${(h / 2).toFixed(1)}" fill="${c}" opacity="${op}" transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`);
    } else {
      // arc
      const r = 20 + rand() * 50;
      const start = rand() * Math.PI * 2;
      const sweep = Math.PI * (0.4 + rand() * 0.8);
      const x1 = cx + Math.cos(start) * r;
      const y1 = cy + Math.sin(start) * r;
      const x2 = cx + Math.cos(start + sweep) * r;
      const y2 = cy + Math.sin(start + sweep) * r;
      const large = sweep > Math.PI ? 1 : 0;
      parts.push(`<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${c}" stroke-width="${(3 + rand() * 6).toFixed(1)}" stroke-linecap="round" opacity="${op}"/>`);
    }
  }

  // edition stamp
  parts.push(
    `<text x="270" y="282" text-anchor="end" font-family="ui-monospace,monospace" font-size="11" fill="#707a8a">#${edition}</text>`,
    `</svg>`,
  );
  return parts.join("");
}

/** data: URL form for <img src>. */
export function tokenArtDataUrl(collectionId: string, edition: number, size = 300): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(tokenArtSvg(collectionId, edition, size))}`;
}
