"use client";

import Link from "next/link";
import { Loader2, Store } from "lucide-react";
import { useListings, useCollections, useBuyToken, useMyTokens } from "@/lib/hooks/useKiln";
import { useWallet } from "@/lib/genlayer/wallet";
import { TokenCard } from "@/components/TokenCard";
import { HowTo } from "@/components/HowTo";
import { formatGen } from "@/lib/utils";

export default function MarketPage() {
  const { isConnected, address } = useWallet();
  const { data: listings, isLoading } = useListings(100);
  const { data: collections } = useCollections(50);
  const { buyToken, isBuying } = useBuyToken();

  const collMap = new Map((collections ?? []).map((c) => [c.collection_id, c]));
  const active = (listings ?? []).filter((l) => l.active);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 space-y-8">
      <div>
        <div className="eyebrow mb-1">Secondary trading · adjudicated perimeter</div>
        <h1 className="display text-4xl">Market</h1>
      </div>

      <HowTo
        id="market"
        reference="KL-03"
        title="Trading inside the perimeter"
        clauseLabel="Rule"
        items={[
          { label: "Settlement is instant", body: "Buy pays the seller on the same transaction — 98% to the seller, 2% to the protection pool that backs holder refunds." },
          { label: "Frozen means frozen", body: "A CRITICAL report ruling halts trading for the entire collection. Listings on frozen collections cannot execute." },
          { label: "Provenance is native", body: "Every token's ownership history lives in the protocol registry. What you buy is exactly what the registry says it is." },
          { label: "Risk state travels", body: "Check the collection's risk chip before buying — WATCH means a valid report or a reserved approval stands against it." },
        ]}
      />

      {isLoading ? (
        <div className="card p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--gold-bright)" }} />
        </div>
      ) : active.length === 0 ? (
        <div className="card p-12 text-center">
          <Store className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-ivory-soft">No active listings.</p>
          <p className="text-xs text-muted mt-1">List a token from your gallery to open the market.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {active.map((l) => {
            const coll = collMap.get(l.collection_id);
            const frozen = coll?.risk_state === "FROZEN";
            const mine = !!address && l.seller.toLowerCase() === address.toLowerCase();
            // edition lives on the token; derive from token_id ordering is not
            // possible client-side, so show the token id as the edition label.
            return (
              <div key={l.token_id} className="space-y-2">
                <Link href={`/collections/${l.collection_id}`} className="block">
                  <TokenCard
                    collectionId={l.collection_id}
                    edition={Number(l.token_id)}
                    title={coll?.title}
                    priceWei={l.price_wei}
                    priceLabel="Ask"
                    dimmed={frozen}
                    footer={
                      coll && (
                        <span className={`chip mt-1 ${
                          coll.risk_state === "CLEAR" ? "chip-clear" :
                          coll.risk_state === "WATCH" ? "chip-watch" : "chip-frozen"
                        }`}>
                          {coll.risk_state}
                        </span>
                      )
                    }
                  />
                </Link>
                <button
                  className="btn btn-gold w-full !h-9 text-xs"
                  disabled={!isConnected || isBuying || frozen || mine}
                  onClick={() => buyToken({ tokenId: l.token_id, priceWei: BigInt(l.price_wei) })}
                >
                  {isBuying ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : frozen ? (
                    "Frozen"
                  ) : mine ? (
                    "Your listing"
                  ) : (
                    `Buy · ${formatGen(l.price_wei)} GEN`
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
