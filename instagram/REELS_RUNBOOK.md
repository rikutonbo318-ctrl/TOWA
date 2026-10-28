# リール制作・自動投稿の手順（代表が止めるまで毎日続ける）

## 毎日の流れ
1. **20:30 JST** GitHub Actions（instagram.yml）が `queue.csv` の予定時刻を過ぎた未投稿を1本投稿し、
   続けて `stats.py` で全投稿の数字を `stats.csv`・`stats_latest.md` に記録する。
2. **毎日の制作**（Claude の定期タスク）が次をやる：
   - `stats_latest.md` を読み、伸びた回・伸びなかった回の差（冒頭の言葉、渦さんのセリフ、長さ、テーマ）を見る
   - 予約が **3日分** 先まで埋まっているように、次の話を作る
   - 作った回を書き出し → BGM → 圧縮 → `queue.csv` に追加 → push
   - 気づいたことを下の「改善メモ」に1行足す

## 動画の作り方（Remotion + three.js、`instagram/remotion`）
- 1話 = 20秒（600フレーム, 30fps, 1080x1920）。`src/house/EpNN.tsx` を作り、`src/Root.tsx` に登録。
- 型は Ep02 / Ep03 をまねる：カメラ `camTrack`、工程 `STEPS`（8個・最後は「次は〜」）、人物 `Person3D`。
- **渦さん（必須）**：現場監督は必ず `suit={UZU.suit} vest={UZU.vest} uzu`（白ヘルに黒い渦マーク）。
  `OverlayV2` の `uzu={[[開始, 終了, '関西弁の一言'], ...]}` で吹き出しを2回出す（保存の声かけ 300〜368 とは重ねない）。
- 動画内に寸法・価格は出さない。注記「AI・CGの架空の工程イメージです／渦巻建設の施工実績ではありません」は常時表示（OverlayV2 が出す）。
- 話の順番は `/mnt/project-files/instagram-plan/reels/remotion/mokuzou_v2/series_v2_sekou_jun.md`（全22話）。終わったら外構シリーズへ。

### 書き出し
```
cd instagram/remotion
HS=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx remotion still src/index.ts Ep03 /tmp/check.png --frame=150 --gl=swangle --browser-executable=$HS   # まず静止画で確認
npx remotion render src/index.ts Ep03 out/ep03.mp4 --gl=swangle --browser-executable=$HS --concurrency=4 --crf=18
cd .. && cp remotion/out/ep03.mp4 videos/reel03.mp4 && sh bgm/add_bgm.sh 1 videos/reel03.mp4 && sh bgm/compress.sh videos/reel03.mp4
```
- BGM は自作（`bgm/make_bgm.py`）。曲番号 1/2 を交互に。投稿後は音を変えられない。
- `compress.sh` で 15MB 以下にする（リポジトリを重くしない）。

### 予約に足す
`queue.csv` に1行：`日時(JST),videos/reelNN.mp4,captions/reelNN.txt,固定コメント,,`
キャプションは `captions/reel02.txt` の形（1行目フック、工程の要約、保存の声かけ、note・DMの案内、注記、ハッシュタグ）。

## 数字の見方
- 優先順：**保存率（保存÷リーチ）> シェア > 平均視聴時間 > 再生**。
- 再生・保存・シェアは `instagram_business_manage_insights` の許可が必要。無い間はいいね・コメントのみ。

## 改善メモ（新しい順）
- 2026-10-28 渦さん（現場監督・渦マークのヘルメット＋吹き出し）を全話に入れる。#1は渦さんなし・音なしで投稿済み。
