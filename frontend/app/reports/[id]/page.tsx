"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, ExternalLink, Snowflake } from "lucide-react";
import { useReport } from "@/lib/hooks/useKiln";
import { AddressDisplay } from "@/components/AddressDisplay";

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: report, isLoading } = useReport(params.id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--gold-bright)" }} />
      </div>
    );
  }
  if (!report) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="display text-2xl mb-2">Report not found</h1>
        <Link href="/ledger" className="btn btn-ghost mt-4">Back to ledger</Link>
      </div>
    );
  }

  const valid = report.validity === "VALID";
  const froze = report.risk_after === "FROZEN" && report.risk_before !== "FROZEN";

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 space-y-8">
      <div>
        <div className="eyebrow mb-1">Adjudication · Report #{report.report_id}</div>
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <h1 className="display text-4xl">
            {valid ? `Valid — ${report.severity}` : "Unsubstantiated"}
          </h1>
          {valid
            ? <CheckCircle2 className="w-8 h-8" style={{ color: froze ? "var(--danger)" : "var(--gold-bright)" }} />
            : <XCircle className="w-8 h-8" style={{ color: "var(--muted)" }} />}
        </div>
        <div className="text-sm text-muted flex items-center gap-2 flex-wrap">
          <Link href={`/collections/${report.collection_id}`} className="hover:underline"
                style={{ color: "var(--gold-bright)" }}>
            {report.collection_title}
          </Link>
          <span>·</span>
          <span>Reported by <AddressDisplay address={report.reporter} showCopy /></span>
        </div>
      </div>

      {/* Consequence banner */}
      <div
        className="card-strong p-4 flex items-center gap-3 flex-wrap"
        style={froze ? { borderColor: "rgba(246, 70, 93, 0.4)" } : undefined}
      >
        {froze && <Snowflake className="w-5 h-5 shrink-0" style={{ color: "var(--danger)" }} />}
        <span className="text-sm text-ivory-soft">
          Risk state: <span className="mono">{report.risk_before}</span>
          {" → "}
          <span className="mono font-semibold"
                style={{ color: report.risk_after === "FROZEN" ? "var(--danger)" :
                                report.risk_after === "WATCH" ? "var(--gold-bright)" : "var(--success)" }}>
            {report.risk_after}
          </span>
          {froze && " — minting and trading halted, holder refunds opened."}
        </span>
        <span className="ml-auto text-xs text-muted">
          Bond {report.bond_returned ? "returned to reporter" : "forfeited to the pool"}
        </span>
      </div>

      {/* Panel reasoning */}
      <section className="card p-6 space-y-4">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div className="eyebrow">Panel reasoning</div>
          <span className="mono text-xs text-muted">Confidence {report.confidence}/100</span>
        </div>
        <p className="text-[0.95rem] leading-relaxed text-ivory-soft italic">
          {report.summary || "No reasoning recorded."}
        </p>
      </section>

      {/* Material under review */}
      <section className="card p-6 space-y-4">
        <div className="eyebrow">Material under review</div>
        <div>
          <div className="text-xs text-muted mb-1">Reporter's allegation</div>
          <p className="text-sm text-ivory-soft leading-relaxed whitespace-pre-wrap">{report.reason}</p>
        </div>
        <div className="hairline" />
        <div>
          <div className="text-xs text-muted mb-2">Cited evidence</div>
          <ul className="space-y-1.5">
            {report.evidence_urls.map((u, i) => (
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
    </div>
  );
}
