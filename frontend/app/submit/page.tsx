"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Flame, Plus, X, AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { useSubmitCollection, useProtocolStats } from "@/lib/hooks/useKiln";
import { useWallet } from "@/lib/genlayer/wallet";
import { parseGen, formatGen } from "@/lib/utils";
import { error as toastError } from "@/lib/toast";
import { HowTo } from "@/components/HowTo";
import { classify, type EvidenceVerdict } from "@/lib/evidence";

const MAX_URLS = 4;
const MIN_DESC = 60;

export default function SubmitPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const { data: stats } = useProtocolStats();
  const { submitCollection, isSubmitting } = useSubmitCollection();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("generative-art");
  const [description, setDescription] = useState("");
  const [priceText, setPriceText] = useState("0.1");
  const [supply, setSupply] = useState(10);
  const [urls, setUrls] = useState<string[]>([""]);

  const verdicts: EvidenceVerdict[] = useMemo(() => urls.map(classify), [urls]);
  const hasBlocked = verdicts.some((v, i) => urls[i].trim() && v.status === "block");

  const priceWei = useMemo(() => {
    try { return parseGen(priceText); } catch { return BigInt(0); }
  }, [priceText]);

  const addUrl = () => urls.length < MAX_URLS && setUrls((s) => [...s, ""]);
  const setUrl = (i: number, v: string) => setUrls((s) => s.map((row, idx) => (idx === i ? v : row)));
  const removeUrl = (i: number) => setUrls((s) => (s.length === 1 ? s : s.filter((_, idx) => idx !== i)));

  const submit = () => {
    if (!isConnected) return toastError("Connect your wallet");
    if (!title.trim()) return toastError("Give the collection a title");
    if (description.trim().length < MIN_DESC)
      return toastError(`Description too short — pitch the collection (min ${MIN_DESC} chars)`);
    const clean = urls.map((u) => u.trim()).filter(Boolean);
    if (clean.length === 0) return toastError("At least one evidence URL is required");
    for (const u of clean) {
      if (!/^https?:\/\//i.test(u)) return toastError("URLs must start with http(s)://");
    }
    if (hasBlocked) return toastError("One or more URLs are on the panel's inadmissible list.");
    if (priceWei < BigInt("50000000000000000")) return toastError("Minimum mint price is 0.05 GEN");
    if (priceWei > BigInt("2000000000000000000")) return toastError("Maximum mint price is 2 GEN");
    if (supply < 5 || supply > 100) return toastError("Supply must be 5–100");

    submitCollection(
      {
        title: title.trim(),
        description: description.trim(),
        category,
        evidenceUrls: clean,
        mintPriceWei: priceWei,
        maxSupply: supply,
      },
      { onSuccess: () => router.push("/launchpad") } as any,
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 space-y-8">
      <div className="text-center max-w-xl mx-auto">
        <div className="eyebrow mb-2">Launch review</div>
        <h1 className="display text-4xl mb-3">Submit a collection</h1>
        <p className="text-ivory-soft">
          The panel fetches your evidence, rules creator credibility, claim
          consistency and originality signals — and if approved, minting opens
          on the same transaction.
        </p>
      </div>

      <HowTo
        id="submit"
        reference="KL-02"
        title="What survives launch review"
        clauseLabel="Item"
        intro="Validators read text, not pixels. This is creator-claims verification — the panel judges whether your evidence shows a real, active creator whose claims hold up, not whether your art is good."
        items={[
          { label: "Strong evidence", body: "A live project page, a public GitHub with prior work, published writing, a portfolio that matches the identity making this submission." },
          { label: "Weak evidence", body: "Pages that merely restate your claims, brand-new accounts with no history, evidence that contradicts your description. The panel rejected circular evidence in test runs — it will again." },
          { label: "Inadmissible", body: "Twitter/X live pages, Mirror.xyz bodies, anything behind auth — validators receive an empty shell and the item counts as missing." },
          { label: "The verdict is on-chain", body: "APPROVED opens minting immediately; REJECTED is permanent for this submission and the reasoning is public. Resubmission means a new collection entry." },
        ]}
      />

      <div className="card p-6 space-y-5">
        <Field label="Collection title">
          <input className="input" placeholder="Molten Forms" value={title}
                 onChange={(e) => setTitle(e.target.value)} disabled={isSubmitting} />
        </Field>

        <Field label="Category">
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isSubmitting}>
            <option value="generative-art">Generative art</option>
            <option value="photography">Photography</option>
            <option value="illustration">Illustration</option>
            <option value="music">Music</option>
            <option value="writing">Writing</option>
            <option value="utility">Utility / membership</option>
          </select>
        </Field>

        <Field label="Description & claims" hint={`Min ${MIN_DESC} chars. The panel checks these claims against your evidence — say only what the evidence shows.`}>
          <textarea className="input text-sm min-h-[120px] resize-y"
                    placeholder="What is this collection, who are you, and what have you made before?"
                    value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Mint price (GEN)" hint={`${formatGen(stats?.min_mint_price_wei ?? "50000000000000000")} – ${formatGen(stats?.max_mint_price_wei ?? "2000000000000000000")} GEN`}>
            <input className="input mono" type="number" step="0.05" min="0.05" max="2"
                   value={priceText} onChange={(e) => setPriceText(e.target.value)} disabled={isSubmitting} />
          </Field>
          <Field label="Supply" hint={`${stats?.min_supply ?? 5}–${stats?.max_supply ?? 100} editions`}>
            <input className="input mono" type="number" min="5" max="100"
                   value={supply} onChange={(e) => setSupply(Number(e.target.value))} disabled={isSubmitting} />
          </Field>
        </div>

        <div className="space-y-3">
          <div>
            <div className="eyebrow mb-1.5">Evidence URLs (1–{MAX_URLS})</div>
            <p className="text-xs text-muted">
              Project site, GitHub, portfolio, published work — pages the validators can fetch.
            </p>
          </div>
          {urls.map((u, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input className="input mono text-sm" placeholder="https://…" value={u}
                       onChange={(e) => setUrl(i, e.target.value)} disabled={isSubmitting} />
                {urls.length > 1 && (
                  <button className="btn btn-ghost" onClick={() => removeUrl(i)} disabled={isSubmitting} aria-label="Remove URL">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <EvidencePill verdict={verdicts[i]} url={u} />
            </div>
          ))}
          {urls.length < MAX_URLS && (
            <button className="btn btn-ghost w-full" onClick={addUrl} disabled={isSubmitting} style={{ borderStyle: "dashed" }}>
              <Plus className="w-3.5 h-3.5" />
              Add evidence URL
            </button>
          )}
        </div>

        {hasBlocked && (
          <div className="p-3 rounded-md flex items-start gap-2 text-sm"
               style={{ background: "rgba(246, 70, 93, 0.08)", border: "1px solid rgba(246, 70, 93, 0.3)" }}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--danger)" }} />
            <span>At least one URL is on the panel's inadmissible list — replace it before submitting.</span>
          </div>
        )}

        {isSubmitting && (
          <div className="card-strong p-4 flex items-start gap-3">
            <Loader2 className="w-5 h-5 mt-0.5 animate-spin" style={{ color: "var(--gold-bright)" }} />
            <div className="text-sm">
              <div className="font-medium text-ivory">The panel is reviewing your submission</div>
              <div className="text-xs text-muted mt-1">
                Independent fetch → three-dimension ruling → consensus → verdict on-chain. One to three minutes.
              </div>
            </div>
          </div>
        )}

        <button className="btn btn-gold w-full" onClick={submit} disabled={isSubmitting || hasBlocked || !isConnected}>
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Under review…</>
          ) : (
            <><Flame className="w-4 h-4" /> Submit for review</>
          )}
        </button>

        {!isConnected && (
          <p className="text-center text-xs text-muted flex items-center justify-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Connect your wallet to submit.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block eyebrow mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted mt-1.5">{hint}</p>}
    </div>
  );
}

function EvidencePill({ verdict, url }: { verdict: EvidenceVerdict; url: string }) {
  if (!url.trim()) return null;
  const palette = verdict.status === "ok"
    ? { bg: "rgba(14, 203, 129, 0.08)", border: "rgba(14, 203, 129, 0.3)", fg: "#0ecb81", Icon: CheckCircle2 }
    : verdict.status === "warn"
    ? { bg: "rgba(252, 213, 53, 0.08)", border: "rgba(252, 213, 53, 0.3)", fg: "#fcd535", Icon: AlertTriangle }
    : { bg: "rgba(246, 70, 93, 0.08)",  border: "rgba(246, 70, 93, 0.3)",  fg: "#f6465d", Icon: AlertCircle };
  const { Icon } = palette;
  return (
    <div className="flex items-start gap-1.5 mt-1.5 px-2.5 py-1.5 rounded-md text-xs"
         style={{ background: palette.bg, border: `1px solid ${palette.border}`, color: palette.fg }}>
      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span className="leading-snug">{verdict.note ?? ""}</span>
    </div>
  );
}
