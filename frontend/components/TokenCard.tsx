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
  action,
}: {
  collectionId: string;
  edition: number;
  title?: string;
  priceWei?: string;
  priceLabel?: string;
  footer?: React.ReactNode;
  dimmed?: boolean;
  /** OpenSea-style hover action — a bar that slides up over the card foot. */
  action?: { label: React.ReactNode; onClick: () => void; disabled?: boolean };
}) {
  return (
    <div
      className="card overflow-hidden flex flex-col group relative transition-all hover:-translate-y-1"
      style={{
        ...(dimmed ? { opacity: 0.55 } : null),
        boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}
    >
      <div
        className="w-full aspect-square transition-transform duration-300 group-hover:scale-[1.03]"
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
            <span className="mono font-medium text-ivory">
              {formatGen(priceWei)} GEN
            </span>
          </div>
        )}
        {footer}
      </div>

      {action && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); action.onClick(); }}
          disabled={action.disabled}
          className="absolute inset-x-0 bottom-0 h-10 text-sm font-semibold text-white translate-y-full group-hover:translate-y-0 transition-transform duration-200 disabled:opacity-60"
          style={{ background: "var(--gold-bright)" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
