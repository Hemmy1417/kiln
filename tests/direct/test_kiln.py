"""
Direct-mode tests for kiln.py — the deterministic surface of the contract
without GenLayer's AI/consensus stack. Run with:
    python -m pytest tests/direct -q

The genlayer runtime is stubbed (verified attribute names:
gl.message.sender_address / gl.message.value; no block clock). The AI
pipeline is exercised by priming gl.eq_principle.prompt_non_comparative
with canned rulings, so the bookkeeping around every ruling — mint splits,
marketplace escrow, risk-state transitions, bond economics, refund caps,
burns — is proven deterministically.
"""

import importlib.util
import json
import pathlib
import sys
import types
import pytest


CONTRACT_PATH = pathlib.Path(__file__).resolve().parents[2] / "contracts" / "kiln.py"


# ── GenLayer runtime stubs ───────────────────────────────────────────────────

class _UserError(Exception):
    pass


class _VmModule:
    UserError = _UserError


class _TreeMap(dict):
    def get(self, k, default=None):
        return super().get(k, default)


class _U256(int):
    def __new__(cls, v):
        return super().__new__(cls, int(v))


class _PublicViewDeco:
    def __call__(self, fn):
        return fn


class _PublicWriteDeco:
    payable = staticmethod(lambda fn: fn)

    def __call__(self, fn):
        return fn


class _Public:
    view = _PublicViewDeco()
    write = _PublicWriteDeco()


class _FakeEmit:
    def __init__(self):
        self.transfers = []   # (to, value, on)

    def bind(self, to):
        self._to = to
        return self

    def emit_transfer(self, value, on=None):
        self.transfers.append((self._to, int(value), on))

    def total_to(self, addr):
        return sum(v for (t, v, _) in self.transfers if t.lower() == addr.lower())


class _EqPrinciple:
    canned_output = "{}"

    @classmethod
    def prompt_non_comparative(cls, fn, task=None, criteria=None):
        return cls.canned_output


class _NondetWeb:
    @staticmethod
    def render(url, mode="text"):
        return f"stub content for {url}"


class _Nondet:
    web = _NondetWeb()


class _GL:
    class Contract:
        pass

    public = _Public()
    vm = _VmModule
    eq_principle = _EqPrinciple
    nondet = _Nondet()

    class message:
        sender_address = "0x0000000000000000000000000000000000000000"
        value = 0

    _emit = None

    @staticmethod
    def get_contract_at(addr):
        return _GL._emit.bind(str(addr))


def _install_stub():
    mod = types.ModuleType("genlayer")
    mod.gl = _GL
    mod.TreeMap = _TreeMap
    mod.u256 = _U256
    mod.Address = lambda x: x
    mod.__all__ = ["gl", "TreeMap", "u256", "Address"]
    sys.modules["genlayer"] = mod


_install_stub()


def _load_contract():
    spec = importlib.util.spec_from_file_location("kiln_contract", CONTRACT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# ── Fixtures + helpers ───────────────────────────────────────────────────────

CREATOR  = "0xccc1111111111111111111111111111111111111"
MINTER   = "0xaaa2222222222222222222222222222222222222"
BUYER    = "0xbbb3333333333333333333333333333333333333"
REPORTER = "0xddd4444444444444444444444444444444444444"

GEN = 10 ** 18
PRICE = GEN // 10        # 0.1 GEN mint price
BOND = 5 * (10 ** 16)    # report bond


@pytest.fixture
def module():
    m = _load_contract()
    m.gl._emit = _FakeEmit()
    return m


@pytest.fixture
def contract(module):
    module.gl.message.sender_address = CREATOR
    module.gl.message.value = 0
    return module.Kiln()


def _as(module, sender, value=0):
    module.gl.message.sender_address = sender
    module.gl.message.value = value


def _launch_ruling(overall="APPROVED", risk="CLEAR", credibility="STRONG",
                   consistency="CONSISTENT", originality="POSITIVE"):
    return json.dumps({
        "creator_credibility": credibility,
        "claim_consistency":   consistency,
        "originality_signals": originality,
        "overall":             overall,
        "initial_risk":        risk,
        "confidence":          90,
        "red_flags":           [],
        "summary":             "Stub launch ruling grounded in the evidence.",
    })


def _report_ruling(validity="VALID", severity="CRITICAL", confidence=92):
    return json.dumps({
        "validity":   validity,
        "severity":   severity,
        "confidence": confidence,
        "summary":    "Stub report ruling grounded in the evidence.",
    })


def _submit(module, contract, overall="APPROVED", risk="CLEAR",
            price=PRICE, supply=10, creator=CREATOR):
    module.gl.eq_principle.canned_output = _launch_ruling(overall=overall, risk=risk)
    _as(module, creator)
    return contract.submit_collection(
        "Molten Forms",
        "A generative series of kiln-fired geometric compositions exploring heat gradients across ceramic surfaces.",
        "generative-art",
        ["https://example.org/project"],
        price,
        supply,
    )


def _mint(module, contract, collection_id, minter=MINTER, value=PRICE):
    _as(module, minter, value=value)
    return contract.mint(collection_id)


def _report(module, contract, collection_id, validity="VALID", severity="CRITICAL",
            reporter=REPORTER):
    module.gl.eq_principle.canned_output = _report_ruling(validity, severity)
    _as(module, reporter, value=BOND)
    return contract.report_collection(
        collection_id,
        "The creator's roadmap page has been deleted and the linked prior work belongs to a different artist entirely.",
        ["https://example.org/evidence"],
    )


# ── Launchpad ────────────────────────────────────────────────────────────────

def test_submit_approved(module, contract):
    c = _submit(module, contract)
    assert c["collection_id"] == "1"
    assert c["status"] == "APPROVED"
    assert c["risk_state"] == "CLEAR"
    assert c["review"]["overall"] == "APPROVED"
    review = contract.get_review(c["review_id"])
    assert review["creator_credibility"] == "STRONG"
    assert contract.get_collections_by_creator(CREATOR)[0]["collection_id"] == "1"


def test_submit_rejected_blocks_minting(module, contract):
    c = _submit(module, contract, overall="REJECTED", risk="WATCH")
    assert c["status"] == "REJECTED"
    with pytest.raises(_UserError):
        _mint(module, contract, c["collection_id"])


def test_submit_validation(module, contract):
    module.gl.eq_principle.canned_output = _launch_ruling()
    _as(module, CREATOR)
    with pytest.raises(_UserError):   # short description
        contract.submit_collection("t", "too short", "art", ["https://e.org"], PRICE, 10)
    with pytest.raises(_UserError):   # price below floor
        contract.submit_collection("t", "x" * 70, "art", ["https://e.org"], 10 ** 15, 10)
    with pytest.raises(_UserError):   # supply above cap
        contract.submit_collection("t", "x" * 70, "art", ["https://e.org"], PRICE, 500)
    with pytest.raises(_UserError):   # no evidence
        contract.submit_collection("t", "x" * 70, "art", [], PRICE, 10)


# ── Mint ─────────────────────────────────────────────────────────────────────

def test_mint_splits_90_10(module, contract):
    c = _submit(module, contract)
    t = _mint(module, contract, c["collection_id"])

    assert t["token_id"] == "1"
    assert t["edition"] == 1
    assert t["owner"] == MINTER
    fee = PRICE * 1000 // 10_000
    assert module.gl._emit.total_to(CREATOR) == PRICE - fee
    stats = contract.get_protocol_stats()
    assert int(stats["refund_pool_wei"]) == fee
    assert int(stats["total_mint_volume_wei"]) == PRICE
    assert contract.get_tokens_by_owner(MINTER)[0]["token_id"] == "1"


def test_mint_wrong_value(module, contract):
    c = _submit(module, contract)
    with pytest.raises(_UserError):
        _mint(module, contract, c["collection_id"], value=PRICE - 1)


def test_mint_sellout(module, contract):
    c = _submit(module, contract, supply=5)
    for _ in range(5):
        _mint(module, contract, c["collection_id"])
    assert contract.get_collection(c["collection_id"])["minted"] == 5
    with pytest.raises(_UserError):
        _mint(module, contract, c["collection_id"])


def test_mint_frozen_blocked(module, contract):
    c = _submit(module, contract)
    _report(module, contract, c["collection_id"], severity="CRITICAL")
    with pytest.raises(_UserError):
        _mint(module, contract, c["collection_id"])


# ── Marketplace ──────────────────────────────────────────────────────────────

def test_list_buy_flow(module, contract):
    c = _submit(module, contract)
    t = _mint(module, contract, c["collection_id"])
    ask = PRICE * 3

    _as(module, MINTER)
    listing = contract.list_token(t["token_id"], ask)
    assert listing["active"] is True

    _as(module, BUYER, value=ask)
    sold = contract.buy_token(t["token_id"])
    assert sold["owner"] == BUYER

    fee = ask * 200 // 10_000
    assert module.gl._emit.total_to(MINTER) == ask - fee
    stats = contract.get_protocol_stats()
    assert int(stats["total_market_volume_wei"]) == ask
    # pool = mint fee + market fee
    assert int(stats["refund_pool_wei"]) == PRICE * 1000 // 10_000 + fee

    assert contract.get_tokens_by_owner(BUYER)[0]["token_id"] == t["token_id"]
    assert contract.get_tokens_by_owner(MINTER) == []
    assert contract.get_listing(t["token_id"])["active"] is False


def test_list_owner_only_and_positive_price(module, contract):
    c = _submit(module, contract)
    t = _mint(module, contract, c["collection_id"])
    _as(module, BUYER)
    with pytest.raises(_UserError):
        contract.list_token(t["token_id"], PRICE)
    _as(module, MINTER)
    with pytest.raises(_UserError):
        contract.list_token(t["token_id"], 0)


def test_buy_guards(module, contract):
    c = _submit(module, contract)
    t = _mint(module, contract, c["collection_id"])
    _as(module, MINTER)
    contract.list_token(t["token_id"], PRICE)

    _as(module, MINTER, value=PRICE)      # own listing
    with pytest.raises(_UserError):
        contract.buy_token(t["token_id"])
    _as(module, BUYER, value=PRICE - 1)   # wrong price
    with pytest.raises(_UserError):
        contract.buy_token(t["token_id"])


def test_freeze_halts_trading(module, contract):
    c = _submit(module, contract)
    t = _mint(module, contract, c["collection_id"])
    _as(module, MINTER)
    contract.list_token(t["token_id"], PRICE)

    _report(module, contract, c["collection_id"], severity="CRITICAL")

    _as(module, BUYER, value=PRICE)
    with pytest.raises(_UserError):       # buy blocked
        contract.buy_token(t["token_id"])
    _as(module, MINTER)
    with pytest.raises(_UserError):       # relist blocked
        contract.list_token(t["token_id"], PRICE)


def test_transfer_guards(module, contract):
    c = _submit(module, contract)
    t = _mint(module, contract, c["collection_id"])
    _as(module, MINTER)
    contract.list_token(t["token_id"], PRICE)
    with pytest.raises(_UserError):       # listed → must delist first
        contract.transfer_token(t["token_id"], BUYER)
    contract.delist_token(t["token_id"])
    moved = contract.transfer_token(t["token_id"], BUYER)
    assert moved["owner"] == BUYER
    _as(module, MINTER)
    with pytest.raises(_UserError):       # no longer the owner
        contract.transfer_token(t["token_id"], CREATOR)


# ── Reports ──────────────────────────────────────────────────────────────────

def test_valid_critical_freezes_and_returns_bond(module, contract):
    c = _submit(module, contract)
    r = _report(module, contract, c["collection_id"], severity="CRITICAL")

    assert r["validity"] == "VALID"
    assert r["risk_before"] == "CLEAR"
    assert r["risk_after"] == "FROZEN"
    assert r["bond_returned"] is True
    assert module.gl._emit.total_to(REPORTER) == BOND

    updated = contract.get_collection(c["collection_id"])
    assert updated["risk_state"] == "FROZEN"
    assert updated["refunds_enabled"] is True


def test_valid_serious_moves_to_watch(module, contract):
    c = _submit(module, contract)
    r = _report(module, contract, c["collection_id"], severity="SERIOUS")
    assert r["risk_after"] == "WATCH"
    updated = contract.get_collection(c["collection_id"])
    assert updated["risk_state"] == "WATCH"
    assert updated["refunds_enabled"] is False
    # minting continues on WATCH
    _mint(module, contract, c["collection_id"])


def test_unsubstantiated_forfeits_bond(module, contract):
    c = _submit(module, contract)
    pool_before = int(contract.get_protocol_stats()["refund_pool_wei"])
    r = _report(module, contract, c["collection_id"],
                validity="UNSUBSTANTIATED", severity="CRITICAL")
    assert r["validity"] == "UNSUBSTANTIATED"
    assert r["severity"] == "NONE"         # forced to NONE
    assert r["bond_returned"] is False
    assert module.gl._emit.total_to(REPORTER) == 0
    stats = contract.get_protocol_stats()
    assert int(stats["refund_pool_wei"]) == pool_before + BOND
    assert contract.get_collection(c["collection_id"])["risk_state"] == "CLEAR"


def test_report_guards(module, contract):
    c = _submit(module, contract, overall="REJECTED", risk="WATCH")
    module.gl.eq_principle.canned_output = _report_ruling()
    _as(module, REPORTER, value=BOND)
    with pytest.raises(_UserError):       # not approved
        contract.report_collection(c["collection_id"], "x" * 50, ["https://e.org"])

    c2 = _submit(module, contract)
    _as(module, REPORTER, value=BOND - 1)  # wrong bond
    with pytest.raises(_UserError):
        contract.report_collection(c2["collection_id"], "x" * 50, ["https://e.org"])


# ── Refunds ──────────────────────────────────────────────────────────────────

def _frozen_with_holder(module, contract, supply=10, mints=3):
    c = _submit(module, contract, supply=supply)
    tokens = [_mint(module, contract, c["collection_id"]) for _ in range(mints)]
    _report(module, contract, c["collection_id"], severity="CRITICAL")
    return c, tokens


def test_refund_pays_and_burns(module, contract):
    c, tokens = _frozen_with_holder(module, contract)
    pool = int(contract.get_protocol_stats()["refund_pool_wei"])
    transfers_before = module.gl._emit.total_to(MINTER)

    _as(module, MINTER)
    out = contract.claim_refund(tokens[0]["token_id"])

    expected = min(PRICE, pool)
    assert int(out["refunded_wei"]) == expected
    assert module.gl._emit.total_to(MINTER) == transfers_before + expected

    t = contract.get_token(tokens[0]["token_id"])
    assert t["refunded"] is True
    assert t["owner"].startswith("0x000000")
    remaining_ids = [x["token_id"] for x in contract.get_tokens_by_owner(MINTER)]
    assert tokens[0]["token_id"] not in remaining_ids


def test_refund_guards(module, contract):
    c, tokens = _frozen_with_holder(module, contract)
    _as(module, BUYER)                    # not the owner
    with pytest.raises(_UserError):
        contract.claim_refund(tokens[0]["token_id"])
    _as(module, MINTER)
    contract.claim_refund(tokens[0]["token_id"])
    with pytest.raises(_UserError):       # double refund
        contract.claim_refund(tokens[0]["token_id"])

    # not open on a healthy collection
    c2 = _submit(module, contract)
    t2 = _mint(module, contract, c2["collection_id"])
    _as(module, MINTER)
    with pytest.raises(_UserError):
        contract.claim_refund(t2["token_id"])


def test_refund_capped_by_pool(module, contract):
    # 3 mints at 0.1 GEN → pool = 3 * 0.01 = 0.03 GEN. Each refund wants
    # 0.1 GEN but the pool caps it — partial protection, honestly.
    c, tokens = _frozen_with_holder(module, contract, mints=3)
    pool = int(contract.get_protocol_stats()["refund_pool_wei"])
    assert pool == 3 * (PRICE * 1000 // 10_000)

    _as(module, MINTER)
    out1 = contract.claim_refund(tokens[0]["token_id"])
    assert int(out1["refunded_wei"]) == pool          # took everything available
    assert int(out1["pool_remaining_wei"]) == 0
    with pytest.raises(_UserError):                    # pool exhausted
        contract.claim_refund(tokens[1]["token_id"])


# ── Views ────────────────────────────────────────────────────────────────────

def test_collections_and_ledger_ordering(module, contract):
    c1 = _submit(module, contract)
    c2 = _submit(module, contract)
    listed = contract.get_collections(10)
    assert [c["collection_id"] for c in listed] == [c2["collection_id"], c1["collection_id"]]

    r1 = _report(module, contract, c1["collection_id"], severity="MINOR")
    r2 = _report(module, contract, c2["collection_id"], severity="MINOR")
    ledger = contract.get_ledger(10)
    assert [r["report_id"] for r in ledger] == [r2["report_id"], r1["report_id"]]
