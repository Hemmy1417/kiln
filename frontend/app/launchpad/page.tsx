"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Flame, PlusCircle } from "lucide-react";
import { useCollections } from "@/lib/hooks/useKiln";
import { formatGen } from "@/lib/utils";
import { tokenArtSvg } from "@/lib/art";
import { HowTo } from "@/components/HowTo";
import type { Collection } from "@/lib/contracts/types";

const RISK_CHIP: Record<string, string> = {
  CLEAR:  "chip chip-clear",
  WATCH:  "chip chip-watch",
  FROZEN: "chip chip-frozen",
};

type Filter = "all" | "minting" | "watch" | "frozen" | "rejected";

export default function LaunchpadPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <LaunchpadInner />
    </Suspense>
  );
}

function LaunchpadInner() {
  const { data: collections, isLoading } = useCollections(50);
  const [filter, setFilter] = useState<Filter>("all");
  const q = (useSearchParams().get("q") ?? "").trim().toLowerCase();

  const list = (collections ?? []).filter((c) => {
    if (q && !(`${c.title} ${c.category} ${c.description}`.toLowerCase().includes(q)))
      return false;
    if (filter === "all") return true;
    if (filter === "minting")
      return c.status === "APPROVED" && c.risk_state !== "FROZEN" && c.minted < c.max_supply;
    if (filter === "watch")   return c.risk_state === "WATCH";
    if (filter === "frozen")  return c.risk_state === "FROZEN";
    if (filter === "rejected") return c.status === "REJECTED";
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="eyebrow mb-1">Adjudicated collections</div>
          <h1 className="display text-4xl">
            {q ? <>Results for “{q}”</> : "Launchpad"}
          </h1>
        </div>
        <Link href="/submit" className="btn btn-gold">
          <PlusCircle className="w-4 h-4" />
          Submit collection
        </Link>
      </div>

      <HowTo
        id="launchpad"
        reference="KL-01"
        title="Reading a collection's standing"
        clauseLabel="State"
        items={[
          { label: "APPROVED · CLEAR", body: "Passed launch review cleanly. Minting is open until the supply is gone." },
          { label: "APPROVED · WATCH", body: "Approved with reservations, or flagged by a valid SERIOUS report. Minting continues — mind the panel's red flags before buying." },
          { label: "FROZEN", body: "A CRITICAL report ruling halted minting and trading. Holders may claim refunds from the protection pool while it lasts." },
          { label: "REJECTED", body: "Failed launch review. The collection never mints; the review's reasoning is public on its page." },
        ]}
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {([
          ["all", "All"],
          ["minting", "Now minting"],
          ["watch", "On watch"],
          ["frozen", "Frozen"],
          ["rejected", "Rejected"],
        ] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="text-xs px-3 py-1.5 rounded-md border transition-colors font-medium"
            style={
              filter === key
                ? { background: "rgba(32, 129, 226, 0.12)", borderColor: "rgba(32, 129, 226, 0.4)", color: "var(--gold-bright)" }
                : { background: "transparent", borderColor: "var(--hairline)", color: "var(--muted)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--gold-bright)" }} />
        </div>
      ) : list.length === 0 ? (
        <div className="card p-12 text-center">
          <Flame className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-ivory-soft">Nothing here yet.</p>
          <p className="text-xs text-muted mt-1">Be the first — submit a collection for review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c) => <CollectionCard key={c.collection_id} c={c} />)}
        </div>
      )}
    </div>
  );
}

function CollectionCard({ c }: { c: Collection }) {
  const soldOut = c.minted >= c.max_supply;
  const pct = c.max_supply > 0 ? Math.round((c.minted / c.max_supply) * 100) : 0;
  return (
    <Link
      href={`/collections/${c.collection_id}`}
      className="card overflow-hidden hover:border-gold-bright transition-colors block"
      style={c.status === "REJECTED" ? { opacity: 0.55 } : undefined}
    >
      <div
        className="w-full aspect-[3/2] overflow-hidden"
        dangerouslySetInnerHTML={{ __html: tokenArtSvg(c.collection_id, 1, 480) }}
      />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-ivory truncate">{c.title}</div>
            <div className="text-xs text-muted mt-0.5">{c.category}</div>
          </div>
          {c.status === "REJECTED" ? (
            <span className="chip chip-rejected shrink-0">Rejected</span>
          ) : (
            <span className={`${RISK_CHIP[c.risk_state] ?? "chip chip-muted"} shrink-0`}>
              {c.risk_state}
            </span>
          )}
        </div>

        {c.status === "APPROVED" && (
          <>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--navy-deep)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: soldOut ? "var(--success)" : "var(--gold-bright)",
                }}
              />
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="mono" style={{ color: "var(--gold-bright)" }}>
                {formatGen(c.mint_price_wei)} GEN
              </span>
              <span className="text-muted">
                {soldOut ? "Sold out" : `${c.minted}/${c.max_supply} minted`}
              </span>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
