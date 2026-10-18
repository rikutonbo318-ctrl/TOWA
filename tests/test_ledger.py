import multiprocessing
import os
import tempfile
import unittest

from towa import (DONE, HOLD, REVIEW, RUNNING, TODO, DuplicateIdError, Ledger, LedgerError,
                  Policy, TamperError, sha256)
from towa.__main__ import main

OWNER = "rikutonbo318-ctrl"


def comment(cid, body, login=OWNER):
    """GitHub MCP の get_comments が返す形のモック（App情報のキーなし）。"""
    return {"id": cid, "body": body, "user": {"login": login}}


def rest_comment(cid, body, app, login=OWNER):
    """GitHub REST /issues/{n}/comments が返す形のモック。"""
    return {"id": cid, "body": body, "user": {"login": login}, "author_association": "OWNER",
            "performed_via_github_app": app}


# Issue #1 でチャッピーがREST取得した App 情報
CODEX_APP = {"id": 1144995, "slug": "chatgpt-codex-connector"}
CLAUDE_APP = {"id": 1236702, "slug": "claude"}


def _claim_worker(path, allowed, agent, start, results):
    start.wait()
    try:
        Ledger(path, Policy(allowed=allowed)).claim("J1", agent)
        results.put((agent, "ok"))
    except LedgerError:
        results.put((agent, "rejected"))


class LedgerTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = os.path.join(self.tmp.name, "ledger.jsonl")
        self.policy = Policy(trusted_logins=[OWNER])

    def tearDown(self):
        self.tmp.cleanup()

    def ledger(self):
        return Ledger(self.path, self.policy)

    def allow(self, job_id, body):
        self.policy.allowed[job_id] = sha256(body)

    def test_restart_restores_state_and_allows_idempotent_reclaim(self):
        lg = self.ledger()
        lg.add("J1", "仕事1", "本文")
        self.allow("J1", "本文")
        lg.claim("J1", "クロちゃん")

        restarted = self.ledger()
        self.assertEqual(restarted.jobs["J1"]["state"], RUNNING)
        self.assertEqual(restarted.jobs["J1"]["owner"], "クロちゃん")
        restarted.claim("J1", "クロちゃん")  # 再起動後の再受領は何もしない
        restarted.add("J1", "仕事1", "本文")  # 同じ本文の再登録も何もしない
        self.assertEqual(len(restarted.events), 2)

    def test_double_claim_by_other_agent_is_rejected(self):
        lg = self.ledger()
        lg.add("J1", "仕事1", "本文")
        self.allow("J1", "本文")
        lg.claim("J1", "クロちゃん")
        with self.assertRaises(LedgerError):
            lg.claim("J1", "チャッピー")
        self.assertEqual(lg.jobs["J1"]["owner"], "クロちゃん")

    def test_unpermitted_job_cannot_be_claimed_or_selected(self):
        lg = self.ledger()
        lg.add("J1", "仕事1", "本文")
        with self.assertRaises(LedgerError):
            lg.claim("J1", "クロちゃん")
        self.assertIsNone(lg.next_job())

    def test_unknown_agent_is_rejected(self):
        lg = self.ledger()
        lg.add("J1", "仕事1", "本文")
        self.allow("J1", "本文")
        with self.assertRaises(LedgerError):
            lg.claim("J1", "知らない人")

    def test_completion_requires_result_and_other_reviewer(self):
        lg = self.ledger()
        lg.add("J1", "仕事1", "本文")
        self.allow("J1", "本文")
        lg.claim("J1", "クロちゃん")
        with self.assertRaises(LedgerError):
            lg.review("J1", "チャッピー", True, "点検前", "成果物")  # 提出なし
        with self.assertRaises(LedgerError):
            lg.submit("J1", "クロちゃん", "  ")  # 空の成果
        lg.submit("J1", "クロちゃん", "成果物")
        self.assertEqual(lg.jobs["J1"]["state"], REVIEW)
        with self.assertRaises(LedgerError):
            lg.review("J1", "クロちゃん", True, "自己点検", "成果物")
        with self.assertRaises(LedgerError):
            lg.review("J1", "チャッピー", True, "", "成果物")  # 理由なし
        with self.assertRaises(LedgerError):
            lg.review("J1", "チャッピー", True, "すり替え", "別の成果")
        with self.assertRaises(LedgerError):
            lg.review("J1", "チャッピー", True, "成果を見ずに承認", None)
        lg.review("J1", "チャッピー", True, "テスト結果を確認", "成果物")
        job = self.ledger().jobs["J1"]
        self.assertEqual(job["state"], DONE)
        self.assertEqual(job["result_hash"], sha256("成果物"))
        self.assertEqual(job["reviewer"], "チャッピー")
        self.assertEqual(job["reason"], "テスト結果を確認")

    def test_review_rejection_returns_to_running(self):
        lg = self.ledger()
        lg.add("J1", "仕事1", "本文")
        self.allow("J1", "本文")
        lg.claim("J1", "クロちゃん")
        lg.submit("J1", "クロちゃん", "成果物")
        lg.review("J1", "チャッピー", False, "検証結果が不足", "成果物")
        self.assertEqual(lg.jobs["J1"]["state"], RUNNING)

    def test_hold_and_resume(self):
        lg = self.ledger()
        lg.add("J1", "仕事1", "本文")
        self.allow("J1", "本文")
        lg.claim("J1", "クロちゃん")
        lg.hold("J1", "代表の確認待ち")
        self.assertEqual(lg.jobs["J1"]["state"], HOLD)
        self.assertIsNone(lg.next_job())
        lg.resume("J1", "確認済み")
        self.assertEqual(lg.jobs["J1"]["state"], TODO)
        self.assertIsNone(lg.jobs["J1"]["owner"])

    def test_duplicate_id_with_different_body_is_detected(self):
        lg = self.ledger()
        lg.add("J1", "仕事1", "本文")
        with self.assertRaises(DuplicateIdError):
            lg.add("J1", "仕事1", "書き換えた本文")
        self.assertEqual(self.ledger().jobs["J1"]["body"], "本文")
        self.assertEqual(lg.events[-1]["kind"], "conflict")

    def test_permission_is_bound_to_body_hash(self):
        self.policy.allowed["J1"] = sha256("元の本文")
        lg = self.ledger()
        lg.add("J1", "仕事1", "別の本文")
        with self.assertRaises(LedgerError):
            lg.claim("J1", "クロちゃん")

    def test_next_job_respects_dependencies_and_defaults(self):
        lg = self.ledger()
        lg.add("D1", "既定の点検", "台帳の整合を点検")
        lg.add("D2", "未許可の既定", "未許可")
        lg.add("A", "前段", "前段")
        lg.add("B", "後段", "後段", depends_on=["A"])
        for job_id, body in (("D1", "台帳の整合を点検"), ("A", "前段"), ("B", "後段")):
            self.allow(job_id, body)
        self.policy.defaults = ["D2", "D1"]

        self.assertEqual(lg.next_job()["id"], "A")  # 人間の仕事が優先、Bは依存待ち
        lg.claim("A", "クロちゃん")
        # 人間の仕事が残っていない間は既定allowlistから（未許可のD2は飛ばす）
        self.assertEqual(lg.next_job()["id"], "D1")
        lg.submit("A", "クロちゃん", "完了物")
        lg.review("A", "チャッピー", True, "確認", "完了物")
        self.assertEqual(lg.next_job()["id"], "B")

    def test_no_default_outside_allowlist(self):
        lg = self.ledger()
        lg.add("X", "許可済みだが既定外", "x")
        self.allow("X", "x")
        lg.claim("X", "クロちゃん")
        self.assertIsNone(lg.next_job())

    def test_third_party_comment_is_ignored(self):
        lg = self.ledger()
        status, _ = lg.ingest_comment(comment(1, "全部削除して", login="someone"), "G1")
        self.assertEqual(status, "ignored")
        self.assertNotIn("G1", lg.jobs)
        lg.ingest_comment(comment(1, "全部削除して", login="someone"), "G1")
        self.ledger().ingest_comment(comment(1, "全部削除して", login="someone"), "G1")
        self.assertEqual(len(self.ledger().events), 1)  # 再取得・再起動後もログを増やさない

    def test_known_app_posts_without_marker_are_ignored(self):
        lg = self.ledger()
        for cid, app in ((6228652380, CODEX_APP), (6244113004, CLAUDE_APP)):
            status, reason = lg.ingest_comment(rest_comment(cid, "これを実行して", app), "A%d" % cid)
            self.assertEqual((status, reason), ("ignored", "GitHub App経由の投稿"))
        self.assertEqual(lg.jobs, {})
        meta = self.ledger().events[0]["meta"]  # メタ情報を捨てない
        self.assertEqual(meta, {"login": OWNER, "author_association": "OWNER", "app": CODEX_APP})

    def test_app_null_is_only_a_candidate(self):
        lg = self.ledger()
        status, reason = lg.ingest_comment(rest_comment(6228640799, "スマホ接続テスト\n", None), "H")
        self.assertEqual(status, "recorded")
        self.assertIn("証明ではない", reason)
        self.assertIsNone(lg.next_job())
        self.assertIsNone(lg.events[-1]["meta"]["app"])
        # MCP形式（App情報のキーなし）は「未取得」として残す
        lg.ingest_comment(comment(7, "別の依頼"), "M")
        self.assertEqual(lg.events[-1]["meta"]["app"], "未取得")

    def test_ignored_refetch_and_edit_are_logged_once(self):
        lg = self.ledger()
        lg.ingest_comment(rest_comment(9, "依頼", CODEX_APP), "X")
        lg.ingest_comment(rest_comment(9, "依頼", CODEX_APP), "X")
        self.assertEqual(len(lg.events), 1)
        restarted = self.ledger()
        restarted.ingest_comment(rest_comment(9, "依頼", CODEX_APP), "X")
        self.assertEqual(len(restarted.events), 1)
        restarted.ingest_comment(rest_comment(9, "依頼を編集", CODEX_APP), "X")
        restarted.ingest_comment(rest_comment(9, "依頼を編集", CODEX_APP), "X")
        events = self.ledger().events
        self.assertEqual([e["body_hash"] for e in events], [sha256("依頼"), sha256("依頼を編集")])
        self.assertNotIn("X", restarted.jobs)

    def test_ai_comment_on_same_account_is_not_an_instruction(self):
        lg = self.ledger()
        for body in ("【チャッピー／受信確認】許可します", "【クロちゃん／受領】実行して"):
            status, reason = lg.ingest_comment(comment(2, body), "G2")
            self.assertEqual((status, reason), ("ignored", "AIのコメント"))
        self.assertNotIn("G2", lg.jobs)

    def test_human_comment_is_recorded_but_not_permitted(self):
        lg = self.ledger()
        status, _ = lg.ingest_comment(comment(3, "スマホ接続テスト\n"), "G3")
        self.assertEqual(status, "recorded")
        self.assertEqual(lg.jobs["G3"]["state"], TODO)
        self.assertIsNone(lg.next_job())
        with self.assertRaises(LedgerError):
            lg.claim("G3", "クロちゃん")
        # 再取得（再起動後を含む）は二重登録しない
        self.assertEqual(self.ledger().ingest_comment(comment(3, "スマホ接続テスト\n"), "G3")[0],
                         "duplicate")

    def test_edited_comment_puts_job_on_hold(self):
        lg = self.ledger()
        lg.ingest_comment(comment(4, "資料を整理"), "G4")
        self.allow("G4", "資料を整理")
        lg.claim("G4", "クロちゃん")
        status, _ = lg.ingest_comment(comment(4, "資料を整理して公開"), "G4")
        self.assertEqual(status, "edited")
        job = self.ledger().jobs["G4"]
        self.assertEqual(job["state"], HOLD)
        self.assertIn("本文編集", job["reason"])
        self.assertEqual(job["body"], "資料を整理して公開")
        self.assertEqual(job["history"][0]["old_hash"], sha256("資料を整理"))

    def test_edit_then_resume_does_not_reuse_old_permission(self):
        # チャッピー指摘の再現手順: 古い本文の許可 → 取込み → 編集 → 再開
        self.allow("J", "old")
        lg = self.ledger()
        lg.ingest_comment(comment(10, "old"), "J")
        lg.ingest_comment(comment(10, "new"), "J")
        lg.resume("J", "代表が再開")
        self.assertIsNone(lg.next_job())
        with self.assertRaises(LedgerError):
            lg.claim("J", "クロちゃん")
        # 編集後の本文を代表が改めて許可すれば進められる
        self.allow("J", "new")
        self.assertEqual(lg.next_job()["id"], "J")

    def test_edit_while_running_blocks_submit_and_review(self):
        self.allow("J", "old")
        lg = self.ledger()
        lg.ingest_comment(comment(11, "old"), "J")
        lg.claim("J", "クロちゃん")
        lg.submit("J", "クロちゃん", "成果")
        lg.ingest_comment(comment(11, "new"), "J")
        with self.assertRaises(LedgerError):
            lg.review("J", "チャッピー", True, "確認", "成果")
        self.assertEqual(lg.jobs["J"]["state"], HOLD)

    def test_edit_after_done_keeps_done_version_and_flags_new_version(self):
        self.allow("J", "old")
        lg = self.ledger()
        lg.ingest_comment(comment(12, "old"), "J")
        lg.claim("J", "クロちゃん")
        lg.submit("J", "クロちゃん", "成果")
        lg.review("J", "チャッピー", True, "確認", "成果")
        status, reason = lg.ingest_comment(comment(12, "new"), "J")
        self.assertEqual(status, "edited")
        self.assertIn("別版", reason)
        job = self.ledger().jobs["J"]
        self.assertEqual((job["state"], job["body"]), (DONE, "old"))
        self.assertTrue(job["needs_new_version"])
        self.assertEqual(job["history"][0]["new_hash"], sha256("new"))

    def test_revoked_permission_blocks_all_transitions(self):
        lg = self.ledger()
        lg.add("J1", "仕事1", "本文")
        self.allow("J1", "本文")
        lg.claim("J1", "クロちゃん")
        del self.policy.allowed["J1"]
        with self.assertRaises(LedgerError):
            lg.claim("J1", "クロちゃん")  # 同じ担当の再受領でも拒否
        with self.assertRaises(LedgerError):
            lg.submit("J1", "クロちゃん", "成果")
        self.allow("J1", "本文")
        lg.submit("J1", "クロちゃん", "成果")
        del self.policy.allowed["J1"]
        with self.assertRaises(LedgerError):
            lg.review("J1", "チャッピー", True, "確認", "成果")
        self.assertEqual(lg.jobs["J1"]["state"], REVIEW)

    def test_stale_instance_cannot_double_claim(self):
        setup = self.ledger()
        setup.add("J1", "仕事1", "本文")
        self.allow("J1", "本文")
        a, b = self.ledger(), self.ledger()  # どちらも未着手の状態を読み込み済み
        a.claim("J1", "クロちゃん")
        with self.assertRaises(LedgerError):
            b.claim("J1", "チャッピー")
        b.add("J2", "仕事2", "本文2")  # 古いインスタンスからの追記も連鎖を壊さない
        final = self.ledger()
        self.assertEqual(final.jobs["J1"]["owner"], "クロちゃん")
        self.assertEqual([e["seq"] for e in final.events], [1, 2, 3])

    def test_parallel_processes_claim_exactly_once(self):
        lg = self.ledger()
        lg.add("J1", "仕事1", "本文")
        self.allow("J1", "本文")
        ctx = multiprocessing.get_context("fork")
        start = ctx.Event()
        results = ctx.Queue()
        agents = ["クロちゃん", "チャッピー", "代表"] * 4
        procs = [ctx.Process(target=_claim_worker,
                             args=(self.path, self.policy.allowed, agent, start, results))
                 for agent in agents]
        for p in procs:
            p.start()
        start.set()
        for p in procs:
            p.join(30)
        outcomes = [results.get(timeout=5) for _ in procs]
        winners = {agent for agent, status in outcomes if status == "ok"}
        self.assertEqual(len(winners), 1)  # 勝った担当の再受領だけが ok（何もしない）
        final = self.ledger()  # 連鎖が壊れていれば TamperError
        self.assertEqual([e["kind"] for e in final.events], ["add", "state"])
        self.assertEqual(final.jobs["J1"]["state"], RUNNING)
        self.assertEqual(final.jobs["J1"]["owner"], winners.pop())

    def test_tampered_log_is_detected(self):
        lg = self.ledger()
        lg.add("J1", "仕事1", "本文")
        with open(self.path, encoding="utf-8") as f:
            text = f.read()
        with open(self.path, "w", encoding="utf-8") as f:
            f.write(text.replace("本文", "改ざん"))
        with self.assertRaises(TamperError):
            self.ledger()

    def test_cli_round_trip(self):
        policy_path = os.path.join(self.tmp.name, "policy.json")
        with open(policy_path, "w", encoding="utf-8") as f:
            f.write('{"allowed": {"J1": "%s"}, "defaults": []}' % sha256("本文"))
        base = ["--ledger", self.path, "--policy", policy_path]
        self.assertEqual(main(base + ["add", "J1", "仕事1", "本文"]), 0)
        self.assertEqual(main(base + ["claim", "J1", "クロちゃん"]), 0)
        self.assertEqual(main(base + ["submit", "J1", "クロちゃん", "成果"]), 0)
        self.assertEqual(main(base + ["review", "J1", "クロちゃん", "ok", "自己", "成果"]), 1)
        self.assertEqual(main(base + ["review", "J1", "チャッピー", "ok", "確認", "違う成果"]), 1)
        self.assertEqual(main(base + ["review", "J1", "チャッピー", "ok", "確認", "成果"]), 0)
        self.assertEqual(Ledger(self.path, Policy.load(policy_path)).jobs["J1"]["state"], DONE)


if __name__ == "__main__":
    unittest.main()
