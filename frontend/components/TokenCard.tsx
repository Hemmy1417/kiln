"use client";

import { tokenArtSvg } from "@/lib/art";
import { formatGen } from "@/lib/utils";

/**
 * The NFT card — generative art plate + edition + price line. The art is
 * deterministic from (collection_id, edition), so every client renders the
 * identical piece with nothing stored off-chain.
 */
export function TokenCard({
  collectionId,
  edition,
  title,
  priceWei,
  priceLabel = "Price",
  footer,
  dimmed = false,
}: {
  collectionId: string;
  edition: number;
  title?: string;
  priceWei?: string;
  priceLabel?: string;
  footer?: React.ReactNode;
  dimmed?: boolean;
}) {
  return (
    <div
      className="card overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5"
      style={dimmed ? { opacity: 0.55 } : undefined}
    >
      <div
        className="w-full aspect-square"
        // Deterministic inline SVG — generated locally, no remote content.
        dangerouslySetInnerHTML={{ __html: tokenArtSvg(collectionId, edition, 400) }}
      />
      <div className="p-3 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-ivory truncate">
            {title ?? `Collection ${collectionId}`}
          </span>
          <span className="mono text-xs text-muted shrink-0">#{edition}</span>
        </div>
        {priceWei && (
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="text-muted">{priceLabel}</span>
            <span className="mono font-medium" style={{ color: "var(--gold-bright)" }}>
              {formatGen(priceWei)} GEN
            </span>
          </div>
        )}
        {footer}
      </div>
    </div>
  );
}
