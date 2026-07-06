"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Kiln from "../contracts/kiln";
import { CONTRACT_ADDRESS, CONTRACT_CONFIGURED, explorerTxUrl } from "../config";
import { useWallet } from "../genlayer/wallet";
import { success, error } from "../toast";
import type {
  Collection, LaunchReview, Token, Listing, Report, ProtocolStats,
} from "../contracts/types";

export function useKilnContract(): Kiln | null {
  const { address } = useWallet();
  return useMemo(() => {
    if (!CONTRACT_CONFIGURED) return null;
    return new Kiln(CONTRACT_ADDRESS, address || null);
  }, [address]);
}

// ── READ HOOKS ──────────────────────────────────────────────────────────────

const READ_DEFAULTS = { refetchOnWindowFocus: true, staleTime: 3000 } as const;

export function useProtocolStats() {
  const contract = useKilnContract();
  return useQuery<ProtocolStats | null, Error>({
    queryKey: ["protocolStats"],
    queryFn: () => (contract ? contract.getProtocolStats() : Promise.resolve(null)),
    ...READ_DEFAULTS,
    enabled: !!contract,
  });
}

export function useCollections(limit = 50) {
  const contract = useKilnContract();
  return useQuery<Collection[], Error>({
    queryKey: ["collections", limit],
    queryFn: () => (contract ? contract.getCollections(limit) : Promise.resolve([])),
    ...READ_DEFAULTS,
    enabled: !!contract,
  });
}

export function useCollection(id: string | null) {
  const contract = useKilnContract();
  return useQuery<Collection | null, Error>({
    queryKey: ["collection", id],
    queryFn: () => (contract && id ? contract.getCollection(id) : Promise.resolve(null)),
    ...READ_DEFAULTS,
    enabled: !!contract && !!id,
  });
}

export function useReview(reviewId: string | null) {
  const contract = useKilnContract();
  return useQuery<LaunchReview | null, Error>({
    queryKey: ["review", reviewId],
    queryFn: () => (contract && reviewId ? contract.getReview(reviewId) : Promise.resolve(null)),
    ...READ_DEFAULTS,
    enabled: !!contract && !!reviewId,
  });
}

export function useMyTokens() {
  const contract = useKilnContract();
  const { address } = useWallet();
  return useQuery<Token[], Error>({
    queryKey: ["myTokens", address],
    queryFn: () =>
      contract && address ? contract.getTokensByOwner(address) : Promise.resolve([]),
    ...READ_DEFAULTS,
    enabled: !!contract && !!address,
  });
}

export function useMyCollections() {
  const contract = useKilnContract();
  const { address } = useWallet();
  return useQuery<Collection[], Error>({
    queryKey: ["myCollections", address],
    queryFn: () =>
      contract && address ? contract.getCollectionsByCreator(address) : Promise.resolve([]),
    ...READ_DEFAULTS,
    enabled: !!contract && !!address,
  });
}

export function useListings(limit = 100) {
  const contract = useKilnContract();
  return useQuery<Listing[], Error>({
    queryKey: ["listings", limit],
    queryFn: () => (contract ? contract.getListings(limit) : Promise.resolve([])),
    ...READ_DEFAULTS,
    enabled: !!contract,
  });
}

export function useListing(tokenId: string | null) {
  const contract = useKilnContract();
  return useQuery<Listing | null, Error>({
    queryKey: ["listing", tokenId],
    queryFn: () =>
      contract && tokenId ? contract.getListing(tokenId) : Promise.resolve(null),
    ...READ_DEFAULTS,
    enabled: !!contract && !!tokenId,
  });
}

export function useReport(reportId: string | null) {
  const contract = useKilnContract();
  return useQuery<Report | null, Error>({
    queryKey: ["report", reportId],
    queryFn: () =>
      contract && reportId ? contract.getReport(reportId) : Promise.resolve(null),
    ...READ_DEFAULTS,
    enabled: !!contract && !!reportId,
  });
}

export function useReportsByCollection(collectionId: string | null) {
  const contract = useKilnContract();
  return useQuery<Report[], Error>({
    queryKey: ["reportsByCollection", collectionId],
    queryFn: () =>
      contract && collectionId
        ? contract.getReportsByCollection(collectionId)
        : Promise.resolve([]),
    ...READ_DEFAULTS,
    enabled: !!contract && !!collectionId,
  });
}

export function useLedger(limit = 50) {
  const contract = useKilnContract();
  return useQuery<Report[], Error>({
    queryKey: ["ledger", limit],
    queryFn: () => (contract ? contract.getLedger(limit) : Promise.resolve([])),
    ...READ_DEFAULTS,
    enabled: !!contract,
  });
}

// ── WRITE HOOKS ─────────────────────────────────────────────────────────────

function useKilnMutation<TArgs>(opts: {
  run: (contract: Kiln, args: TArgs) => Promise<{ receipt: any; txHash: string }>;
  successTitle: (args: TArgs, data: any) => string;
  successDescription?: (args: TArgs, data: any) => string;
  errorTitle: string;
}) {
  const contract = useKilnContract();
  const qc = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const mutation = useMutation({
    mutationFn: async (args: TArgs) => {
      if (!contract) throw new Error("Contract not configured");
      setIsPending(true);
      const out = await opts.run(contract, args);
      return { ...out, args };
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries();
      setIsPending(false);
      success(opts.successTitle(data.args, data), {
        description: opts.successDescription?.(data.args, data),
        explorerUrl: explorerTxUrl(data?.txHash),
      });
    },
    onError: (err: any) => {
      setIsPending(false);
      error(opts.errorTitle, { description: err?.message || "Please try again." });
    },
  });

  return { mutate: mutation.mutate, isPending };
}

export function useSubmitCollection() {
  const m = useKilnMutation<{
    title: string; description: string; category: string;
    evidenceUrls: string[]; mintPriceWei: bigint; maxSupply: number;
  }>({
    run: (c, a) => c.submitCollection(a),
    successTitle: () => "Review complete",
    successDescription: () =>
      "The panel has ruled on your collection — check the launchpad for the verdict.",
    errorTitle: "Submission failed",
  });
  return { submitCollection: m.mutate, isSubmitting: m.isPending };
}

export function useMint() {
  const m = useKilnMutation<{ collectionId: string; priceWei: bigint }>({
    run: (c, a) => c.mint(a.collectionId, a.priceWei),
    successTitle: () => "Minted!",
    successDescription: () => "Ownership created — the token is in your gallery.",
    errorTitle: "Mint failed",
  });
  return { mint: m.mutate, isMinting: m.isPending };
}

export function useListToken() {
  const m = useKilnMutation<{ tokenId: string; priceWei: bigint }>({
    run: (c, a) => c.listToken(a.tokenId, a.priceWei),
    successTitle: () => "Listed on the market",
    errorTitle: "Listing failed",
  });
  return { listToken: m.mutate, isListing: m.isPending };
}

export function useDelistToken() {
  const m = useKilnMutation<{ tokenId: string }>({
    run: (c, a) => c.delistToken(a.tokenId),
    successTitle: () => "Delisted",
    errorTitle: "Delist failed",
  });
  return { delistToken: m.mutate, isDelisting: m.isPending };
}

export function useBuyToken() {
  const m = useKilnMutation<{ tokenId: string; priceWei: bigint }>({
    run: (c, a) => c.buyToken(a.tokenId, a.priceWei),
    successTitle: () => "Purchase complete",
    successDescription: () => "Ownership transferred to your wallet.",
    errorTitle: "Purchase failed",
  });
  return { buyToken: m.mutate, isBuying: m.isPending };
}

export function useTransferToken() {
  const m = useKilnMutation<{ tokenId: string; to: string }>({
    run: (c, a) => c.transferToken(a.tokenId, a.to),
    successTitle: () => "Transferred",
    errorTitle: "Transfer failed",
  });
  return { transferToken: m.mutate, isTransferring: m.isPending };
}

export function useReportCollection() {
  const m = useKilnMutation<{
    collectionId: string; reason: string; evidenceUrls: string[]; bondWei: bigint;
  }>({
    run: (c, a) => c.reportCollection(a),
    successTitle: () => "Report adjudicated",
    successDescription: () =>
      "The panel has ruled — check the ledger for the verdict and any risk-state change.",
    errorTitle: "Report failed",
  });
  return { reportCollection: m.mutate, isReporting: m.isPending };
}

export function useClaimRefund() {
  const m = useKilnMutation<{ tokenId: string }>({
    run: (c, a) => c.claimRefund(a.tokenId),
    successTitle: () => "Refund claimed",
    successDescription: () => "The token was burned and the refund sent to your wallet.",
    errorTitle: "Refund failed",
  });
  return { claimRefund: m.mutate, isClaiming: m.isPending };
}
