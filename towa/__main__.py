"""コマンドライン入口: python -m towa <命令> ...

台帳は既定で data/ledger.jsonl、許可設定は policy.json を使う。
"""

import argparse
import json
import sys

from .ledger import Ledger, LedgerError, Policy


def main(argv=None):
    p = argparse.ArgumentParser(prog="towa", description="共通仕事管理")
    p.add_argument("--ledger", default="data/ledger.jsonl")
    p.add_argument("--policy", default="policy.json")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("status", help="全仕事の状態を表示")
    sub.add_parser("next", help="次に着手してよい仕事を一つ表示")
    a = sub.add_parser("add", help="仕事を登録")
    a.add_argument("job")
    a.add_argument("title")
    a.add_argument("body")
    a.add_argument("--depends-on", nargs="*", default=[])
    c = sub.add_parser("claim", help="受領して実行中にする")
    c.add_argument("job")
    c.add_argument("agent")
    s = sub.add_parser("submit", help="成果を提出して点検待ちにする")
    s.add_argument("job")
    s.add_argument("agent")
    s.add_argument("result")
    r = sub.add_parser("review", help="別担当が、提出された成果を照合して点検する")
    r.add_argument("job")
    r.add_argument("reviewer")
    r.add_argument("verdict", choices=["ok", "ng"])
    r.add_argument("reason")
    r.add_argument("result", help="提出された成果（提出時のハッシュと照合する）")
    h = sub.add_parser("hold", help="保留にする")
    h.add_argument("job")
    h.add_argument("reason")
    u = sub.add_parser("resume", help="保留を未着手に戻す")
    u.add_argument("job")
    u.add_argument("reason")
    args = p.parse_args(argv)

    try:
        ledger = Ledger(args.ledger, Policy.load(args.policy))
        if args.cmd == "status":
            for job in ledger.jobs.values():
                print("%s\t%s\t担当:%s\t%s" % (job["id"], job["state"], job["owner"] or "-", job["title"]))
            return 0
        if args.cmd == "next":
            job = ledger.next_job()
            print(job["id"] if job else "着手できる許可済みの仕事はありません")
            return 0
        if args.cmd == "add":
            job = ledger.add(args.job, args.title, args.body, args.depends_on)
            print("登録: %s 本文sha256=%s" % (job["id"], job["body_hash"]))
            return 0
        if args.cmd == "claim":
            job = ledger.claim(args.job, args.agent)
        elif args.cmd == "submit":
            job = ledger.submit(args.job, args.agent, args.result)
        elif args.cmd == "review":
            job = ledger.review(args.job, args.reviewer, args.verdict == "ok", args.reason,
                                args.result)
        elif args.cmd == "hold":
            job = ledger.hold(args.job, args.reason)
        else:
            job = ledger.resume(args.job, args.reason)
        print(json.dumps({k: job[k] for k in ("id", "state", "owner", "reviewer", "reason")},
                         ensure_ascii=False))
        return 0
    except (LedgerError, OSError, ValueError) as exc:
        print("エラー: %s" % exc, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
