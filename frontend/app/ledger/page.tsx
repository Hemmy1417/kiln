"use client";

import Link from "next/link";
import { Loader2, Scale, CheckCircle2, XCircle } from "lucide-react";
import { useLedger } from "@/lib/hooks/useKiln";
import { AddressDisplay } from "@/components/AddressDisplay";
import { HowTo } from "@/components/HowTo";

export default function LedgerPage() {
  const { data: reports, isLoading } = useLedger(50);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 space-y-8">
      <div>
        <div className="eyebrow mb-1">Public record</div>
        <h1 className="display text-4xl mb-3">Ledger</h1>
        <p className="text-ivory-soft max-w-2xl">
          Every report ruling the panel has ever issued, in order, unredacted —
          so any party can audit how Kiln's trust layer actually behaves.
        </p>
      </div>

      <HowTo
        id="ledger"
        reference="KL-04"
        title="Reading the record"
        clauseLabel="Column"
        items={[
          { label: "Validity", body: "VALID means the panel found the allegation substantiated by the fetched evidence. UNSUBSTANTIATED forfeits the reporter's bond to the protection pool." },
          { label: "Severity", body: "MINOR leaves standing unchanged. SERIOUS moves a CLEAR collection to WATCH. CRITICAL freezes minting and trading and opens holder refunds." },
          { label: "Risk transition", body: "The before → after states show exactly what the ruling changed on-chain — no moderation team, no appeal to an admin." },
          { label: "Drill in", body: "Every entry opens the full adjudication file: allegation, cited evidence, and the panel's reasoning paragraph." },
        ]}
      />

      {isLoading ? (
        <div className="card p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--gold-bright)" }} />
        </div>
      ) : !reports || reports.length === 0 ? (
        <div className="card p-12 text-center">
          <Scale className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-ivory-soft">No rulings on record yet.</p>
          <p className="text-xs text-muted mt-1">The ledger fills as reports are adjudicated.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const valid = r.validity === "VALID";
            return (
              <Link key={r.report_id} href={`/reports/${r.report_id}`}
                    className="card p-4 flex items-center gap-4 flex-wrap hover:border-gold-bright transition-colors block">
                {valid
                  ? <CheckCircle2 className="w-5 h-5 shrink-0"
                                  style={{ color: r.severity === "CRITICAL" ? "var(--danger)" : "var(--gold-bright)" }} />
                  : <XCircle className="w-5 h-5 shrink-0 text-muted" />}
                <div className="flex-1 min-w-[200px]">
                  <div className="text-sm text-ivory">
                    <span className="mono text-muted">#{r.report_id}</span>
                    {" · "}
                    {r.collection_title}
                  </div>
                  <div className="text-xs text-muted mt-0.5 truncate max-w-md">
                    {r.summary || r.reason}
                  </div>
                </div>
                <span className={`chip shrink-0 ${
                  !valid ? "chip-muted" :
                  r.severity === "CRITICAL" ? "chip-frozen" :
                  r.severity === "SERIOUS" ? "chip-watch" : "chip-clear"
                }`}>
                  {valid ? r.severity : "Unsubstantiated"}
                </span>
                <span className="mono text-xs text-muted shrink-0">
                  {r.risk_before} → {r.risk_after}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  <AddressDisplay address={r.reporter} />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
