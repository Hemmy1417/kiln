"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Images, Tag, Send, X } from "lucide-react";
import { useMyTokens, useCollections, useListToken, useDelistToken, useTransferToken, useListing } from "@/lib/hooks/useKiln";
import { useWallet } from "@/lib/genlayer/wallet";
import { parseGen } from "@/lib/utils";
import { TokenCard } from "@/components/TokenCard";
import { error as toastError } from "@/lib/toast";
import type { Token } from "@/lib/contracts/types";

export default function GalleryPage() {
  const { isConnected } = useWallet();
  const { data: tokens, isLoading } = useMyTokens();
  const { data: collections } = useCollections(50);
  const titles = new Map((collections ?? []).map((c) => [c.collection_id, c.title]));

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 space-y-8">
      <div>
        <div className="eyebrow mb-1">Your registry entries</div>
        <h1 className="display text-4xl">Gallery</h1>
      </div>

      {!isConnected ? (
        <div className="card p-12 text-center">
          <Images className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-ivory-soft">Connect a wallet to see your tokens.</p>
        </div>
      ) : isLoading ? (
        <div className="card p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--gold-bright)" }} />
        </div>
      ) : (tokens ?? []).length === 0 ? (
        <div className="card p-12 text-center">
          <Images className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-ivory-soft">Nothing in the gallery yet.</p>
          <Link href="/launchpad" className="btn btn-gold mt-4 inline-flex">Mint something</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(tokens ?? []).map((t) => (
            <OwnedToken key={t.token_id} token={t} title={titles.get(t.collection_id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function OwnedToken({ token, title }: { token: Token; title?: string }) {
  const { data: listing } = useListing(token.token_id);
  const { listToken, isListing } = useListToken();
  const { delistToken, isDelisting } = useDelistToken();
  const { transferToken, isTransferring } = useTransferToken();
  const [mode, setMode] = useState<"none" | "list" | "send">("none");
  const [priceText, setPriceText] = useState("0.2");
  const [to, setTo] = useState("");

  const listed = !!listing?.active;
  const busy = isListing || isDelisting || isTransferring;

  const doList = () => {
    let wei: bigint;
    try { wei = parseGen(priceText); } catch { return toastError("Invalid price"); }
    if (wei <= BigInt(0)) return toastError("Price must be positive");
    listToken({ tokenId: token.token_id, priceWei: wei }, { onSuccess: () => setMode("none") } as any);
  };
  const doSend = () => {
    if (!/^0x[0-9a-fA-F]{40}$/.test(to.trim())) return toastError("Full 42-character address required");
    transferToken({ tokenId: token.token_id, to: to.trim() }, { onSuccess: () => setMode("none") } as any);
  };

  return (
    <div className="space-y-2">
      <Link href={`/collections/${token.collection_id}`} className="block">
        <TokenCard
          collectionId={token.collection_id}
          edition={token.edition}
          title={title}
          priceWei={listed ? listing!.price_wei : undefined}
          priceLabel="Listed at"
        />
      </Link>

      {mode === "none" && (
        <div className="flex gap-2">
          {listed ? (
            <button className="btn btn-ghost flex-1 !h-9 text-xs" disabled={busy}
                    onClick={() => delistToken({ tokenId: token.token_id })}>
              {isDelisting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5" /> Delist</>}
            </button>
          ) : (
            <>
              <button className="btn btn-ghost flex-1 !h-9 text-xs" disabled={busy} onClick={() => setMode("list")}>
                <Tag className="w-3.5 h-3.5" /> List
              </button>
              <button className="btn btn-ghost flex-1 !h-9 text-xs" disabled={busy} onClick={() => setMode("send")}>
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </>
          )}
        </div>
      )}

      {mode === "list" && (
        <div className="flex gap-2">
          <input className="input !py-1.5 mono text-xs" type="number" step="0.05" min="0.01"
                 value={priceText} onChange={(e) => setPriceText(e.target.value)} disabled={busy} />
          <button className="btn btn-gold !h-9 text-xs" disabled={busy} onClick={doList}>
            {isListing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "List"}
          </button>
          <button className="btn btn-ghost !h-9 text-xs" disabled={busy} onClick={() => setMode("none")}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {mode === "send" && (
        <div className="flex gap-2">
          <input className="input !py-1.5 mono text-xs" placeholder="0x…"
                 value={to} onChange={(e) => setTo(e.target.value)} disabled={busy} />
          <button className="btn btn-gold !h-9 text-xs" disabled={busy} onClick={doSend}>
            {isTransferring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send"}
          </button>
          <button className="btn btn-ghost !h-9 text-xs" disabled={busy} onClick={() => setMode("none")}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
