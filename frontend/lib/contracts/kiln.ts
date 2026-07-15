import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type {
  Collection, LaunchReview, Token, Listing, Report, ProtocolStats,
  TransactionReceipt,
} from "./types";
import { CONTRACT_ADDRESS } from "../config";

// Resolve the CONNECTED wallet's EIP-1193 provider so writes are signed by the
// wallet the user picked — not genlayer-js's implicit window.ethereum fallback,
// which can be the wrong extension when several are installed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveInjectedProvider(): any {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eth: any = (window as any).ethereum;
  if (!eth) return null;
  if (Array.isArray(eth.providers)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return eth.providers.find((p: any) => p.isMetaMask && !p.isCoinbaseWallet) ?? eth.providers[0] ?? eth;
  }
  return eth;
}

/**
 * Typed wrapper around the deployed Kiln contract. Sibling conventions:
 * - Every u256 is coerced to Number / decimal string HERE so no BigInt
 *   leaks into React Query keys or arithmetic.
 * - waitAndVerify rejects UNDETERMINED/CANCELED and surfaces UserError.
 * - Reads are defensive (null/[] on failure) so a fresh deploy renders
 *   empty states, not error boundaries.
 * - Writes return { receipt, txHash } so toasts can link the explorer.
 */
class Kiln {
  private client: ReturnType<typeof createClient>;
  private address: `0x${string}`;

  constructor(contractAddress: string = CONTRACT_ADDRESS, account?: string | null) {
    this.address = contractAddress as `0x${string}`;
    const config: any = { chain: studionet };
    if (account) {
      config.account = account as `0x${string}`;
      const provider = resolveInjectedProvider();
      if (provider) config.provider = provider;
    }
    this.client = createClient(config);
  }

  // ── helpers ────────────────────────────────────────────────────────────

  private toObj(raw: any): Record<string, any> {
    if (!raw) return {};
    if (raw instanceof Map) return Object.fromEntries(raw.entries());
    if (typeof raw === "object") return raw;
    return {};
  }

  private async waitAndVerify(txHash: `0x${string}`): Promise<TransactionReceipt> {
    const receipt = (await this.client.waitForTransactionReceipt({
      hash: txHash as any,
      status: "ACCEPTED" as any,
      retries: 80,
      interval: 5000,
    })) as any;
    const status = String(receipt?.status ?? "").toUpperCase();
    const lr = receipt?.consensus_data?.leader_receipt;
    const r = Array.isArray(lr) ? lr[0] : lr;
    if (status.includes("UNDETERMINED") || status.includes("CANCELED")) {
      throw new Error("Validators could not reach consensus — try again");
    }
    if (r?.execution_result === "ERROR") {
      const stderr: string = r?.genvm_result?.stderr ?? "";
      const userErr = stderr.match(/UserError: (.+)/)?.[1];
      if (userErr) throw new Error(userErr);
      const lines = stderr.trim().split("\n").filter((l) => l.trim() && !l.startsWith("  "));
      const last = lines[lines.length - 1] || "";
      console.error("[Kiln] contract execution error:", stderr);
      throw new Error(last.replace(/^.*?Error: /, "").slice(0, 200) || "Contract execution error");
    }
    return receipt as TransactionReceipt;
  }

  private async safeRead(functionName: string, args: any[] = []): Promise<any> {
    try {
      return await this.client.readContract({
        address: this.address,
        functionName,
        args,
      });
    } catch (err) {
      console.warn(`[Kiln] safeRead "${functionName}" failed:`, err);
      return null;
    }
  }

  private async write(
    functionName: string,
    args: any[],
    value: bigint = BigInt(0),
  ): Promise<{ receipt: TransactionReceipt; txHash: string }> {
    const txHash = await this.client.writeContract({
      address: this.address,
      functionName,
      args,
      value,
    });
    const receipt = await this.waitAndVerify(txHash);
    return { receipt, txHash: String(txHash) };
  }

  private normCollection(raw: any): Collection {
    const c = this.toObj(raw);
    return {
      ...c,
      collection_id:  String(c.collection_id ?? ""),
      mint_price_wei: String(c.mint_price_wei ?? "0"),
      max_supply:     Number(c.max_supply ?? 0),
      minted:         Number(c.minted ?? 0),
      refunds_enabled: !!c.refunds_enabled,
      evidence_urls:  Array.isArray(c.evidence_urls) ? c.evidence_urls.map(String) : [],
      report_ids:     Array.isArray(c.report_ids) ? c.report_ids.map(String) : [],
    } as Collection;
  }

  private normToken(raw: any): Token {
    const t = this.toObj(raw);
    return {
      ...t,
      token_id:       String(t.token_id ?? ""),
      collection_id:  String(t.collection_id ?? ""),
      edition:        Number(t.edition ?? 0),
      mint_price_wei: String(t.mint_price_wei ?? "0"),
      refunded:       !!t.refunded,
    } as Token;
  }

  private normListing(raw: any): Listing {
    const l = this.toObj(raw);
    return {
      ...l,
      token_id:      String(l.token_id ?? ""),
      collection_id: String(l.collection_id ?? ""),
      price_wei:     String(l.price_wei ?? "0"),
      active:        !!l.active,
    } as Listing;
  }

  private normReport(raw: any): Report {
    const r = this.toObj(raw);
    return {
      ...r,
      report_id:     String(r.report_id ?? ""),
      collection_id: String(r.collection_id ?? ""),
      confidence:    Number(r.confidence ?? 0),
      evidence_urls: Array.isArray(r.evidence_urls) ? r.evidence_urls.map(String) : [],
      bond_returned: !!r.bond_returned,
    } as Report;
  }

  private normReview(raw: any): LaunchReview {
    const v = this.toObj(raw);
    return {
      ...v,
      review_id:     String(v.review_id ?? ""),
      collection_id: String(v.collection_id ?? ""),
      confidence:    Number(v.confidence ?? 0),
      red_flags:     Array.isArray(v.red_flags) ? v.red_flags.map(String) : [],
    } as LaunchReview;
  }

  // ── reads ──────────────────────────────────────────────────────────────

  async getProtocolStats(): Promise<ProtocolStats | null> {
    const raw = await this.safeRead("get_protocol_stats");
    if (!raw) return null;
    const s = this.toObj(raw);
    return {
      ...s,
      min_mint_price_wei:  String(s.min_mint_price_wei ?? "0"),
      max_mint_price_wei:  String(s.max_mint_price_wei ?? "0"),
      min_supply:          Number(s.min_supply ?? 5),
      max_supply:          Number(s.max_supply ?? 100),
      mint_fee_bps:        Number(s.mint_fee_bps ?? 1000),
      market_fee_bps:      Number(s.market_fee_bps ?? 200),
      report_bond_wei:     String(s.report_bond_wei ?? "0"),
      refund_pool_wei:     String(s.refund_pool_wei ?? "0"),
      total_mint_volume_wei:   String(s.total_mint_volume_wei ?? "0"),
      total_market_volume_wei: String(s.total_market_volume_wei ?? "0"),
      total_refunded_wei:      String(s.total_refunded_wei ?? "0"),
      total_collections:   Number(s.total_collections ?? 0),
      total_tokens:        Number(s.total_tokens ?? 0),
      total_reports:       Number(s.total_reports ?? 0),
    } as ProtocolStats;
  }

  async getCollection(id: string): Promise<Collection | null> {
    const raw = await this.safeRead("get_collection", [id]);
    return raw ? this.normCollection(raw) : null;
  }

  async getCollections(limit = 50): Promise<Collection[]> {
    const raw = await this.safeRead("get_collections", [limit]);
    return Array.isArray(raw) ? raw.map((c) => this.normCollection(c)) : [];
  }

  async getCollectionsByCreator(creator: string): Promise<Collection[]> {
    const raw = await this.safeRead("get_collections_by_creator", [creator]);
    return Array.isArray(raw) ? raw.map((c) => this.normCollection(c)) : [];
  }

  async getReview(reviewId: string): Promise<LaunchReview | null> {
    const raw = await this.safeRead("get_review", [reviewId]);
    return raw ? this.normReview(raw) : null;
  }

  async getToken(tokenId: string): Promise<Token | null> {
    const raw = await this.safeRead("get_token", [tokenId]);
    return raw ? this.normToken(raw) : null;
  }

  async getTokensByOwner(owner: string): Promise<Token[]> {
    const raw = await this.safeRead("get_tokens_by_owner", [owner]);
    return Array.isArray(raw) ? raw.map((t) => this.normToken(t)) : [];
  }

  async getListings(limit = 100): Promise<Listing[]> {
    const raw = await this.safeRead("get_listings", [limit]);
    return Array.isArray(raw) ? raw.map((l) => this.normListing(l)) : [];
  }

  async getListing(tokenId: string): Promise<Listing | null> {
    const raw = await this.safeRead("get_listing", [tokenId]);
    const l = this.toObj(raw);
    return l.token_id ? this.normListing(l) : null;
  }

  async getReport(reportId: string): Promise<Report | null> {
    const raw = await this.safeRead("get_report", [reportId]);
    return raw ? this.normReport(raw) : null;
  }

  async getReportsByCollection(collectionId: string): Promise<Report[]> {
    const raw = await this.safeRead("get_reports_by_collection", [collectionId]);
    return Array.isArray(raw) ? raw.map((r) => this.normReport(r)) : [];
  }

  async getLedger(limit = 50): Promise<Report[]> {
    const raw = await this.safeRead("get_ledger", [limit]);
    return Array.isArray(raw) ? raw.map((r) => this.normReport(r)) : [];
  }

  // ── writes ─────────────────────────────────────────────────────────────

  async submitCollection(args: {
    title: string;
    description: string;
    category: string;
    evidenceUrls: string[];
    mintPriceWei: bigint;
    maxSupply: number;
  }) {
    return this.write("submit_collection", [
      args.title, args.description, args.category,
      args.evidenceUrls, args.mintPriceWei, args.maxSupply,
    ]);
  }

  async mint(collectionId: string, priceWei: bigint) {
    return this.write("mint", [collectionId], priceWei);
  }

  async listToken(tokenId: string, priceWei: bigint) {
    return this.write("list_token", [tokenId, priceWei]);
  }

  async delistToken(tokenId: string) {
    return this.write("delist_token", [tokenId]);
  }

  async buyToken(tokenId: string, priceWei: bigint) {
    return this.write("buy_token", [tokenId], priceWei);
  }

  async transferToken(tokenId: string, to: string) {
    return this.write("transfer_token", [tokenId, to]);
  }

  async reportCollection(args: {
    collectionId: string;
    reason: string;
    evidenceUrls: string[];
    bondWei: bigint;
  }) {
    return this.write(
      "report_collection",
      [args.collectionId, args.reason, args.evidenceUrls],
      args.bondWei,
    );
  }

  async claimRefund(tokenId: string) {
    return this.write("claim_refund", [tokenId]);
  }
}

export default Kiln;
