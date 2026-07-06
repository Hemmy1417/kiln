export type CollectionStatus = "APPROVED" | "REJECTED";
export type RiskState = "CLEAR" | "WATCH" | "FROZEN";

export type Collection = {
  collection_id: string;
  creator: string;
  title: string;
  description: string;
  category: string;
  evidence_urls: string[];
  mint_price_wei: string;
  max_supply: number;
  minted: number;
  status: CollectionStatus;
  risk_state: RiskState;
  refunds_enabled: boolean;
  review_id: string;
  report_ids: string[];
};

export type LaunchReview = {
  review_id: string;
  collection_id: string;
  creator_credibility: string;   // STRONG | MODERATE | WEAK
  claim_consistency: string;     // CONSISTENT | MIXED | CONTRADICTORY
  originality_signals: string;   // POSITIVE | UNCLEAR | NEGATIVE
  overall: CollectionStatus;
  initial_risk: string;
  confidence: number;
  red_flags: string[];
  summary: string;
};

export type Token = {
  token_id: string;
  collection_id: string;
  edition: number;
  owner: string;
  minted_by: string;
  mint_price_wei: string;
  refunded: boolean;
};

export type Listing = {
  token_id: string;
  collection_id: string;
  seller: string;
  price_wei: string;
  active: boolean;
  sold_to?: string;
};

export type Report = {
  report_id: string;
  collection_id: string;
  collection_title: string;
  reporter: string;
  reason: string;
  evidence_urls: string[];
  validity: string;      // VALID | UNSUBSTANTIATED
  severity: string;      // NONE | MINOR | SERIOUS | CRITICAL
  confidence: number;
  summary: string;
  risk_before: string;
  risk_after: string;
  bond_returned: boolean;
};

export type ProtocolStats = {
  min_mint_price_wei: string;
  max_mint_price_wei: string;
  min_supply: number;
  max_supply: number;
  mint_fee_bps: number;
  market_fee_bps: number;
  report_bond_wei: string;
  refund_pool_wei: string;
  total_mint_volume_wei: string;
  total_market_volume_wei: string;
  total_refunded_wei: string;
  total_collections: number;
  total_tokens: number;
  total_reports: number;
};

export type TransactionReceipt = Record<string, unknown>;
