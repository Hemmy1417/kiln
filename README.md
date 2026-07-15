# KILN

**The GenLayer-adjudicated NFT launchpad and marketplace.**

Every collection faces an AI validator panel before it can mint. Collectors mint with GEN — ownership created immediately in the protocol's own registry — and trade on the built-in market. Anyone can report a live collection; the panel re-adjudicates, and a CRITICAL ruling freezes it and opens holder refunds from a live protection pool. Every ruling is a public record.

**The pitch in one line:** mint what survives the fire.

---

## Why GenLayer

NFT trust problems are qualitative: is this creator real, do their claims hold up, is this report of fraud substantiated? None of that has a deterministic oracle. GenLayer's primitives make the trust layer itself on-chain:

- `gl.nondet.web.render(url, mode="text")` — validators fetch the creator's (or reporter's) evidence independently and read the **actual content**
- `gl.nondet.exec_prompt(...)` — an LLM rules the submission or report
- `gl.eq_principle.prompt_non_comparative(...)` — validators judge the leader's ruling against **written acceptance criteria** (the nondet fn returns the *input*; the principle runs the LLM — the pattern that avoids UNDETERMINED rounds)
- `emit_transfer(..., on="finalized")` — creator payouts, seller settlements, bond returns, and holder refunds all fire on the same transaction as the decision

Both prompts carry anti-injection guardrails: submitted text and fetched evidence are material under review, never instructions to the panel.

---

## The two rulings

**Launch review** (at submission):

| Dimension           | Levels                                   |
|---------------------|------------------------------------------|
| Creator credibility | `STRONG` · `MODERATE` · `WEAK`           |
| Claim consistency   | `CONSISTENT` · `MIXED` · `CONTRADICTORY` |
| Originality signals | `POSITIVE` · `UNCLEAR` · `NEGATIVE`      |

**APPROVED** requires credibility ≥ `MODERATE`, consistency ≥ `MIXED`, originality not `NEGATIVE`. REJECTED never mints.

**Report adjudication** (any time after launch, 0.05 GEN bond):

| Ruling | Consequence |
|---|---|
| `UNSUBSTANTIATED` | Bond forfeited to the pool. Nothing changes. |
| `VALID · MINOR`   | Bond returned. On the record, standing unchanged. |
| `VALID · SERIOUS` | Bond returned. `CLEAR → WATCH`. |
| `VALID · CRITICAL`| Bond returned. **`FROZEN`** — minting + trading halted, holder refunds open. |

---

## The economics

- **Mint:** creator sets price (0.05–2 GEN) and supply (5–100). At mint, **90% pays the creator instantly, 10% feeds the protection pool.**
- **Market:** list/buy with GEN. **98% to the seller, 2% to the pool.**
- **Refunds:** holders of FROZEN collections claim **up to the mint price, capped by the pool balance**, first come first served. The token burns on refund.
- **No owner, no treasury withdrawal.** The pool's only exit is holder refunds.

---

## Stated honestly

- **Validators read text, not pixels.** Launch review is creator-claims verification — a live project page, verifiable prior work, consistent identity — not visual art authentication.
- **Tokens are protocol-native** (Kiln's own registry), not ERC-721 — fully functional inside Kiln, not interoperable with external marketplaces.
- **Refunds are partial protection**, not insurance. The pool balance on `/pool` is the real number.
- **Token art is deterministic generative SVG** from `(collection_id, edition)` — identical on every client, nothing stored off-chain.

---

## Evidence sources — what actually works

The submit and report forms pre-flight every URL against the empirical fetch matrix before you pay a transaction.

**✅ Fetch-friendly:** public GitHub repos and Gists (raw URLs), project sites served as plain HTML, ethereum.org-style docs, Wikipedia, published datasets.

**❌ Inadmissible:** Twitter/X live pages, Mirror.xyz bodies, LinkedIn, anything behind auth — validators receive an empty shell and the item counts as missing.

---

## Project structure

```
Kiln/
├── contracts/kiln.py               # the Intelligent Contract (largest sibling)
├── deploy/deployScript.ts
├── gltest.config.yaml
├── tests/direct/                   # 20-test direct-mode pytest suite
└── frontend/                       # Next.js 16 (Turbopack) — OpenSea-style dark marketplace design
    ├── app/
    │   ├── page.tsx                # hero + live stats + now-minting strip
    │   ├── launchpad/              # adjudicated collections, filter tabs
    │   ├── submit/                 # creator flow + evidence preflight
    │   ├── collections/[id]/       # mint + launch review + reports + refunds
    │   ├── gallery/                # my tokens — list / delist / send
    │   ├── market/                 # active listings, buy
    │   ├── reports/[id]/           # full adjudication file
    │   ├── ledger/                 # public record of rulings
    │   └── pool/                   # protection pool + parameters
    ├── components/                 # Nav, HowTo (KL-01..05), LiveBackdrop, TokenCard
    └── lib/                        # wallet, evidence preflight, art.ts, typed wrapper, hooks
```

---

## Contract

- **Address:** `0x39500183e53d865f883BD59Ee1f4e297754668Df`

> **Payout fix (July 2026).** Wallet payouts are sent as EVM external messages (an empty `@gl.evm.contract_interface` proxy executed by the contract's ghost account). The previous GenVM-call pattern errored at finalization on plain wallets and stranded the value; the contract was redeployed at the address above with the corrected transfer path.

- **Network:** GenLayer Studionet (chainId `61999`, RPC `https://studio.genlayer.com/api`)
- **Constructor:** no arguments — no protocol owner

Read state:
```bash
genlayer call 0x39500183e53d865f883BD59Ee1f4e297754668Df get_protocol_stats
```

---

## Local development

### Contract tests
```bash
python -m pytest tests/direct -q     # 20 tests, no Studio required
```

### Deploy to Studionet
```bash
genlayer network set studionet
genlayer account unlock              # cache keystore in the OS credential store
genlayer deploy --contract contracts/kiln.py
```

### Frontend
```bash
cd frontend
cp .env.Example .env.local           # fill in the contract address
npm install
npm run dev
```

---

## Environment variables

**`frontend/.env.local`** (also set on Vercel):

- `NEXT_PUBLIC_CONTRACT_ADDRESS` — the deployed contract
- `NEXT_PUBLIC_GENLAYER_RPC_URL` — `https://studio.genlayer.com/api`
- `NEXT_PUBLIC_GENLAYER_CHAIN_ID` — `61999`
- `NEXT_PUBLIC_GENLAYER_CHAIN_NAME` — `GenLayer Studio`
- `NEXT_PUBLIC_GENLAYER_SYMBOL` — `GEN`
- `NEXT_PUBLIC_GENLAYER_EXPLORER_URL` — optional, defaults to `https://explorer-studio.genlayer.com`

---

## Runbook

1. **Creator submits.** `/submit` — title, claims, evidence URLs, price, supply. The panel rules on the same transaction; APPROVED opens minting.
2. **Collectors mint.** `/collections/<id>` — pay the mint price, ownership lands in your `/gallery` immediately. 90% to the creator, 10% to the pool.
3. **Trade.** List from the gallery, buy on `/market`. 2% of every sale feeds the pool.
4. **Report.** Anything wrong post-launch → bonded report from the collection page. The panel rules; consequences apply on-chain, no moderators.
5. **Refunds.** If a collection is FROZEN, holders claim from the collection page — up to mint price, while the pool lasts.
6. **Audit everything.** `/ledger` for rulings, `/pool` for the money, the explorer link in the footer for every transaction.

---

## Signed writes

Contract writes are signed by the **connected wallet's own EIP-1193 provider**. The
contract wrapper resolves the injected provider (preferring MetaMask when several
wallets are installed) and binds it into the genlayer-js client, so every transaction
is signed by the wallet the user actually picked — never an implicit `window.ethereum`
fallback that could be the wrong extension. A repository-level test
(`frontend/tests/signed-write.test.ts`) proves the write path routes
`eth_sendTransaction` through that provider with the correct `from`.
