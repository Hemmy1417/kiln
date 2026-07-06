"use client";

import Link from "next/link";
import { Flame, ShieldCheck, Scale, Undo2, Store, ArrowRight } from "lucide-react";
import { useProtocolStats, useCollections } from "@/lib/hooks/useKiln";
import { formatGen } from "@/lib/utils";
import { tokenArtSvg } from "@/lib/art";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Vetted before mint",
    body: "Every collection faces an AI validator panel before it can sell a single token — creator credibility, claim consistency, originality signals. REJECTED never mints.",
  },
  {
    icon: Scale,
    title: "Reports ruled by consensus",
    body: "Anyone can report a live collection with a bonded claim. The panel adjudicates against fetched evidence — valid reports change the collection's risk state on-chain.",
  },
  {
    icon: Undo2,
    title: "Refunds with real money",
    body: "10% of every mint and 2% of every sale fund the protection pool. A CRITICAL ruling freezes the collection and opens holder refunds — partial protection, honestly labeled.",
  },
  {
    icon: Store,
    title: "Native ownership + market",
    body: "Ownership is created the moment you mint, in the protocol's own registry. List, buy, and transfer without leaving the adjudicated perimeter.",
  },
];

export default function HomePage() {
  const { data: stats } = useProtocolStats();
  const { data: collections } = useCollections(8);
  const approvedAll = (collections ?? []).filter((c) => c.status === "APPROVED");
  const featured = approvedAll.find((c) => c.risk_state !== "FROZEN" && c.minted < c.max_supply) ?? approvedAll[0];
  const approved = approvedAll.slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-5">
      {/* ── OpenSea-style featured banner ── */}
      <section className="pt-6 pb-12">
        <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: 380, border: "1px solid var(--hairline)" }}>
          {/* Banner artwork */}
          <div
            className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-cover"
            style={{ filter: "saturate(1.15)" }}
            dangerouslySetInnerHTML={{
              __html: tokenArtSvg(featured?.collection_id ?? "kiln", 1, 900).replace(
                'viewBox="0 0 300 300"',
                'viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice"',
              ),
            }}
          />
          {/* Gradient scrim */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(180deg, rgba(13,14,18,0.25) 0%, rgba(13,14,18,0.55) 55%, rgba(13,14,18,0.92) 100%)",
          }} />
          {/* Overlaid content */}
          <div className="relative p-8 md:p-12 flex flex-col justify-end" style={{ minHeight: 380 }}>
            <span className="chip chip-watch mb-4 self-start">GenLayer · Studionet</span>
            {featured ? (
              <>
                <h1 className="display text-4xl md:text-6xl leading-[1.05] mb-3">{featured.title}</h1>
                <p className="text-sm md:text-base text-ivory-soft max-w-xl mb-6 line-clamp-2">
                  {featured.description}
                </p>
                <div className="flex items-center gap-6 flex-wrap mb-6">
                  <BannerStat label="Mint price" value={`${formatGen(featured.mint_price_wei)} GEN`} />
                  <BannerStat label="Minted" value={`${featured.minted}/${featured.max_supply}`} />
                  <BannerStat label="Standing" value={featured.risk_state} />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Link href={`/collections/${featured.collection_id}`} className="btn btn-gold">
                    <Flame className="w-4 h-4" />
                    View collection
                  </Link>
                  <Link href="/launchpad" className="btn btn-ghost" style={{ background: "rgba(13,14,18,0.6)" }}>
                    Explore all
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="display text-4xl md:text-6xl leading-[1.05] mb-3">
                  Mint what survives <span style={{ color: "var(--gold-bright)" }}>the fire.</span>
                </h1>
                <p className="text-sm md:text-base text-ivory-soft max-w-xl mb-6">
                  AI validators adjudicate every collection before launch, rule every
                  report after, and govern refunds when trust breaks.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <Link href="/launchpad" className="btn btn-gold">
                    <Flame className="w-4 h-4" />
                    Explore the launchpad
                  </Link>
                  <Link href="/submit" className="btn btn-ghost" style={{ background: "rgba(13,14,18,0.6)" }}>
                    Submit a collection
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Live stats ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-20">
        <Stat label="Collections fired" value={String(stats?.total_collections ?? 0)} />
        <Stat label="Tokens minted"     value={String(stats?.total_tokens ?? 0)} />
        <Stat label="Mint volume"       value={`${formatGen(stats?.total_mint_volume_wei ?? "0")} GEN`} />
        <Stat label="Protection pool"   value={`${formatGen(stats?.refund_pool_wei ?? "0")} GEN`} accent />
      </section>

      {/* ── Live collections strip ── */}
      {approved.length > 0 && (
        <section className="mb-20">
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="eyebrow mb-1">Now minting</div>
              <h2 className="display text-3xl">Fresh from the kiln</h2>
            </div>
            <Link href="/launchpad" className="text-sm hover:underline" style={{ color: "var(--gold-bright)" }}>
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {approved.map((c) => (
              <Link key={c.collection_id} href={`/collections/${c.collection_id}`} className="card overflow-hidden hover:border-gold-bright transition-colors block">
                <div
                  className="w-full aspect-square"
                  dangerouslySetInnerHTML={{ __html: tokenArtSvg(c.collection_id, 1, 400) }}
                />
                <div className="p-3">
                  <div className="text-sm font-semibold text-ivory truncate">{c.title}</div>
                  <div className="flex items-baseline justify-between mt-1 text-xs">
                    <span className="mono" style={{ color: "var(--gold-bright)" }}>
                      {formatGen(c.mint_price_wei)} GEN
                    </span>
                    <span className="text-muted">{c.minted}/{c.max_supply}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Four pillars ── */}
      <section className="mb-20">
        <div className="text-center mb-8">
          <div className="eyebrow mb-2">The perimeter</div>
          <h2 className="display text-3xl">Trust is adjudicated, not assumed</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="card p-6 space-y-3">
                <span
                  className="w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ background: "rgba(32, 129, 226, 0.08)", border: "1px solid rgba(32, 129, 226, 0.25)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "var(--gold-bright)" }} />
                </span>
                <h3 className="display text-lg">{p.title}</h3>
                <p className="text-sm text-ivory-soft leading-relaxed">{p.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Honest boundaries ── */}
      <section className="card-strong p-6 mb-6">
        <div className="eyebrow mb-2">Stated honestly</div>
        <p className="text-sm text-ivory-soft leading-relaxed">
          Reviews are grounded in <span className="text-ivory">text the validators fetch</span> —
          this is creator-claims verification, not visual art authentication. Tokens are{" "}
          <span className="text-ivory">protocol-native</span> (Kiln's own registry), not ERC-721.
          Refunds are <span className="text-ivory">partial protection</span> — up to the mint
          price, capped by the pool balance at claim time.
        </p>
      </section>
    </div>
  );
}

function BannerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-4 py-2.5" style={{ background: "rgba(13,14,18,0.65)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mono text-sm font-semibold text-ivory">{value}</div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card p-5">
      <div className="eyebrow mb-2">{label}</div>
      <div
        className="display text-2xl leading-none"
        style={accent ? { color: "var(--gold-bright)" } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
