"use client";

import { Loader2, Shield, Flame, Store, Undo2 } from "lucide-react";
import { useProtocolStats } from "@/lib/hooks/useKiln";
import { formatGen } from "@/lib/utils";
import { HowTo } from "@/components/HowTo";

export default function PoolPage() {
  const { data: stats, isLoading } = useProtocolStats();

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 space-y-8">
      <div>
        <div className="eyebrow mb-1">Holder protection</div>
        <h1 className="display text-4xl">The pool</h1>
      </div>

      <HowTo
        id="pool"
        reference="KL-05"
        title="Constitution of the protection pool"
        intro="Kiln has no owner and no treasury withdrawal. The pool exists for one purpose: refunding holders of frozen collections — and it is funded automatically by the market itself."
        items={[
          { label: "Funding", body: "10% of every mint, 2% of every secondary sale, plus every forfeited report bond. Additive only — there is no withdrawal path except holder refunds." },
          { label: "Trigger", body: "A CRITICAL report ruling freezes a collection and opens refunds for its holders. No admin, no vote — the panel's ruling is the trigger." },
          { label: "Payout", body: "Up to the token's original mint price, capped by the pool balance at claim time, first come first served. The token burns on refund." },
          { label: "Honest limits", body: "This is partial protection, not insurance. A pool drained by one incident cannot fully cover the next — the pool balance below is the real number." },
        ]}
      />

      {isLoading || !stats ? (
        <div className="card p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--gold-bright)" }} />
        </div>
      ) : (
        <>
          <div className="card p-8 text-center" style={{ borderColor: "rgba(252, 213, 53, 0.35)" }}>
            <div className="eyebrow mb-2">Pool balance — live</div>
            <div className="display text-5xl" style={{ color: "var(--gold-bright)" }}>
              {formatGen(stats.refund_pool_wei)} GEN
            </div>
            <div className="text-xs text-muted mt-2">
              {formatGen(stats.total_refunded_wei)} GEN refunded to holders lifetime
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Stat icon={Flame} label="Mint volume"   value={`${formatGen(stats.total_mint_volume_wei)} GEN`}   hint={`${stats.mint_fee_bps / 100}% feeds the pool`} />
            <Stat icon={Store} label="Market volume" value={`${formatGen(stats.total_market_volume_wei)} GEN`} hint={`${stats.market_fee_bps / 100}% feeds the pool`} />
            <Stat icon={Undo2} label="Refunded"      value={`${formatGen(stats.total_refunded_wei)} GEN`}      hint="Paid to holders of frozen collections" />
          </div>

          <div className="card p-6 space-y-4">
            <div className="eyebrow">Standing parameters</div>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted">Mint fee</dt>
              <dd className="mono">{stats.mint_fee_bps / 100}%</dd>
              <dt className="text-muted">Market fee</dt>
              <dd className="mono">{stats.market_fee_bps / 100}%</dd>
              <dt className="text-muted">Report bond</dt>
              <dd className="mono">{formatGen(stats.report_bond_wei)} GEN</dd>
              <dt className="text-muted">Mint price bounds</dt>
              <dd className="mono">{formatGen(stats.min_mint_price_wei)} – {formatGen(stats.max_mint_price_wei)} GEN</dd>
              <dt className="text-muted">Supply bounds</dt>
              <dd className="mono">{stats.min_supply}–{stats.max_supply} editions</dd>
              <dt className="text-muted">Collections / tokens / reports</dt>
              <dd className="mono">{stats.total_collections} / {stats.total_tokens} / {stats.total_reports}</dd>
            </dl>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon, label, value, hint,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string; value: string; hint?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="eyebrow">{label}</span>
        <Icon className="w-4 h-4" style={{ color: "var(--muted)" }} />
      </div>
      <div className="display text-xl leading-none mb-1">{value}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}
