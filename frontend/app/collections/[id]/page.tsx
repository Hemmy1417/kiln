"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2, Flame, ShieldCheck, AlertTriangle, ExternalLink, Snowflake,
  Megaphone, X, Plus, AlertCircle, CheckCircle2,
} from "lucide-react";
import {
  useCollection, useReview, useReportsByCollection, useMint,
  useReportCollection, useMyTokens, useClaimRefund,
} from "@/lib/hooks/useKiln";
import { useWallet } from "@/lib/genlayer/wallet";
import { formatGen } from "@/lib/utils";
import { tokenArtSvg } from "@/lib/art";
import { error as toastError } from "@/lib/toast";
import { classify, type EvidenceVerdict } from "@/lib/evidence";

const BOND_WEI = BigInt("50000000000000000");

export default function CollectionPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { isConnected, address } = useWallet();

  const { data: coll, isLoading } = useCollection(id);
  const { data: review } = useReview(coll?.review_id ?? null);
  const { data: reports } = useReportsByCollection(id);
  const { data: myTokens } = useMyTokens();
  const { mint, isMinting } = useMint();
  const { claimRefund, isClaiming } = useClaimRefund();

  const [showReport, setShowReport] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-16 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--gold-bright)" }} />
      </div>
    );
  }
  if (!coll) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-16 text-center">
        <h1 className="display text-2xl mb-2">Collection not found</h1>
        <Link href="/launchpad" className="btn btn-ghost mt-4">Back to launchpad</Link>
      </div>
    );
  }

  const approved = coll.status === "APPROVED";
  const frozen = coll.risk_state === "FROZEN";
  const soldOut = coll.minted >= coll.max_supply;
  const canMint = approved && !frozen && !soldOut && isConnected;
  const myHoldings = (myTokens ?? []).filter(
    (t) => t.collection_id === coll.collection_id && !t.refunded,
  );

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 space-y-8">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div
          className="card overflow-hidden"
          dangerouslySetInnerHTML={{ __html: tokenArtSvg(coll.collection_id, 1, 600) }}
        />
        <div className="space-y-4">
          <div>
            <div className="eyebrow mb-1">Collection #{coll.collection_id} · {coll.category}</div>
            <h1 className="display text-3xl mb-2">{coll.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {approved
                ? <span className="chip chip-approved">Approved</span>
                : <span className="chip chip-rejected">Rejected</span>}
              <span className={`chip ${
                coll.risk_state === "CLEAR" ? "chip-clear" :
                coll.risk_state === "WATCH" ? "chip-watch" : "chip-frozen"
              }`}>
                {frozen && <Snowflake className="w-3 h-3" />}
                {coll.risk_state}
              </span>
            </div>
          </div>

          <p className="text-sm text-ivory-soft leading-relaxed">{coll.description}</p>

          <div className="card-strong p-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Mint price</span>
              <span className="mono text-lg" style={{ color: "var(--gold-bright)" }}>
                {formatGen(coll.mint_price_wei)} GEN
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--navy-deep)" }}>
              <div className="h-full rounded-full"
                   style={{
                     width: `${coll.max_supply ? Math.round((coll.minted / coll.max_supply) * 100) : 0}%`,
                     background: soldOut ? "var(--success)" : "var(--gold-bright)",
                   }} />
            </div>
            <div className="flex items-baseline justify-between text-xs text-muted">
              <span>{coll.minted}/{coll.max_supply} minted</span>
              <span>90% to creator · 10% to protection pool</span>
            </div>
            <button
              className="btn btn-gold w-full"
              disabled={!canMint || isMinting}
              onClick={() => mint({ collectionId: coll.collection_id, priceWei: BigInt(coll.mint_price_wei) })}
            >
              {isMinting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Minting…</>
              ) : frozen ? (
                <><Snowflake className="w-4 h-4" /> Frozen — minting halted</>
              ) : soldOut ? (
                "Sold out"
              ) : !approved ? (
                "Not approved"
              ) : (
                <><Flame className="w-4 h-4" /> Mint · {formatGen(coll.mint_price_wei)} GEN</>
              )}
            </button>
            {!isConnected && (
              <p className="text-center text-xs text-muted">Connect your wallet to mint.</p>
            )}
          </div>

          {/* Refund CTA for holders of a frozen collection */}
          {frozen && coll.refunds_enabled && myHoldings.length > 0 && (
            <div className="card p-4 space-y-2" style={{ borderColor: "rgba(229, 72, 77, 0.4)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
                Refunds are open — you hold {myHoldings.length} token{myHoldings.length > 1 ? "s" : ""}
              </div>
              <p className="text-xs text-muted">
                Up to the mint price per token, capped by the protection pool. The token burns on refund.
              </p>
              {myHoldings.map((t) => (
                <button
                  key={t.token_id}
                  className="btn btn-danger w-full"
                  disabled={isClaiming}
                  onClick={() => claimRefund({ tokenId: t.token_id })}
                >
                  {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : `Refund #${t.edition}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Launch review */}
      {review && (
        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" style={{ color: "var(--gold-bright)" }} />
              <span className="eyebrow">Launch review · panel ruling</span>
            </div>
            <span className="mono text-xs text-muted">Confidence {review.confidence}/100</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Dim label="Credibility"  value={review.creator_credibility} />
            <Dim label="Consistency"  value={review.claim_consistency} />
            <Dim label="Originality"  value={review.originality_signals} />
          </div>
          <p className="text-sm text-ivory-soft leading-relaxed italic">{review.summary}</p>
          {review.red_flags.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "var(--danger)" }}>
                <AlertTriangle className="w-3.5 h-3.5" /> Red flags
              </div>
              <ul className="text-sm text-ivory-soft space-y-1 list-disc list-inside">
                {review.red_flags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
          <div>
            <div className="text-xs text-muted mb-1.5">Evidence the panel fetched</div>
            <ul className="space-y-1">
              {coll.evidence_urls.map((u, i) => (
                <li key={i}>
                  <a href={u} target="_blank" rel="noreferrer"
                     className="mono text-xs hover:underline inline-flex items-center gap-1.5 break-all"
                     style={{ color: "var(--gold-bright)" }}>
                    {u} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Reports */}
      {approved && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="eyebrow mb-0.5">Post-launch accountability</div>
              <h2 className="display text-xl">Reports</h2>
            </div>
            {!frozen && (
              <button className="btn btn-ghost" onClick={() => setShowReport((v) => !v)}>
                <Megaphone className="w-4 h-4" />
                {showReport ? "Cancel" : "Report this collection"}
              </button>
            )}
          </div>

          {showReport && !frozen && (
            <ReportForm collectionId={coll.collection_id} onDone={() => setShowReport(false)} />
          )}

          {(reports ?? []).length === 0 ? (
            <div className="card p-6 text-center text-sm text-muted">
              No reports on record — clean standing.
            </div>
          ) : (
            <div className="space-y-3">
              {(reports ?? []).map((r) => (
                <Link key={r.report_id} href={`/reports/${r.report_id}`}
                      className="card p-4 flex items-center gap-4 flex-wrap hover:border-gold-bright transition-colors block">
                  <span className={`chip ${r.validity === "VALID" ? "chip-frozen" : "chip-muted"} shrink-0`}>
                    {r.validity === "VALID" ? r.severity : "Unsubstantiated"}
                  </span>
                  <span className="flex-1 min-w-[200px] text-sm text-ivory-soft truncate">
                    {r.summary || r.reason}
                  </span>
                  <span className="mono text-xs text-muted shrink-0">
                    {r.risk_before} → {r.risk_after}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Dim({ label, value }: { label: string; value: string }) {
  const good = ["STRONG", "CONSISTENT", "POSITIVE"].includes(value);
  const bad = ["WEAK", "CONTRADICTORY", "NEGATIVE"].includes(value);
  return (
    <div className="card-strong p-3">
      <div className="eyebrow mb-1">{label}</div>
      <div className="mono text-sm font-medium"
           style={{ color: good ? "var(--success)" : bad ? "var(--danger)" : "var(--gold-bright)" }}>
        {value}
      </div>
    </div>
  );
}

function ReportForm({ collectionId, onDone }: { collectionId: string; onDone: () => void }) {
  const { reportCollection, isReporting } = useReportCollection();
  const [reason, setReason] = useState("");
  const [urls, setUrls] = useState<string[]>([""]);
  const verdicts: EvidenceVerdict[] = useMemo(() => urls.map(classify), [urls]);
  const hasBlocked = verdicts.some((v, i) => urls[i].trim() && v.status === "block");

  const submit = () => {
    if (reason.trim().length < 40) return toastError("Describe the problem (min 40 chars)");
    const clean = urls.map((u) => u.trim()).filter(Boolean);
    if (clean.length === 0) return toastError("At least one evidence URL is required");
    if (hasBlocked) return toastError("One or more URLs are inadmissible");
    reportCollection(
      { collectionId, reason: reason.trim(), evidenceUrls: clean, bondWei: BOND_WEI },
      { onSuccess: onDone } as any,
    );
  };

  return (
    <div className="card p-5 space-y-4" style={{ borderColor: "rgba(229, 72, 77, 0.35)" }}>
      <div className="text-sm text-ivory-soft">
        Reporting posts a <span className="mono" style={{ color: "var(--gold-bright)" }}>0.05 GEN bond</span> —
        returned if the panel rules your report valid, forfeited to the protection pool if not.
        A CRITICAL ruling freezes the collection and opens holder refunds.
      </div>
      <textarea className="input text-sm min-h-[90px] resize-y"
                placeholder="What's wrong — and what does your evidence show?"
                value={reason} onChange={(e) => setReason(e.target.value)} disabled={isReporting} />
      {urls.map((u, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <input className="input mono text-sm" placeholder="https://…" value={u}
                   onChange={(e) => setUrls((s) => s.map((row, idx) => (idx === i ? e.target.value : row)))}
                   disabled={isReporting} />
            {urls.length > 1 && (
              <button className="btn btn-ghost" disabled={isReporting}
                      onClick={() => setUrls((s) => s.filter((_, idx) => idx !== i))} aria-label="Remove URL">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {u.trim() && verdicts[i].status !== "ok" && (
            <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
                 style={verdicts[i].status === "block"
                   ? { background: "rgba(229, 72, 77, 0.08)", border: "1px solid rgba(229, 72, 77, 0.3)", color: "#e5484d" }
                   : { background: "rgba(32, 129, 226, 0.08)", border: "1px solid rgba(32, 129, 226, 0.3)", color: "#2081e2" }}>
              {verdicts[i].status === "block"
                ? <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
              <span>{verdicts[i].note}</span>
            </div>
          )}
        </div>
      ))}
      {urls.length < 4 && (
        <button className="btn btn-ghost w-full" disabled={isReporting} style={{ borderStyle: "dashed" }}
                onClick={() => setUrls((s) => [...s, ""])}>
          <Plus className="w-3.5 h-3.5" /> Add evidence URL
        </button>
      )}
      {isReporting && (
        <div className="card-strong p-3 flex items-center gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--gold-bright)" }} />
          The panel is adjudicating — one to three minutes.
        </div>
      )}
      <button className="btn btn-danger w-full" onClick={submit} disabled={isReporting || hasBlocked}>
        {isReporting ? "Adjudicating…" : "File report · 0.05 GEN bond"}
      </button>
    </div>
  );
}
