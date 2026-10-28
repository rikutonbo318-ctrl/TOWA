#!/bin/sh
# 1話を書き出して BGM・圧縮まで：sh make_reel.sh 05 1   （話数, 曲番号 1/2）
# 書き出し済みなら render を飛ばす（remotion/out/epNN.mp4 があれば使う）
set -e
cd "$(dirname "$0")"
n="$1"; song="$2"
HS=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
if [ ! -s remotion/out/ep$n.mp4 ]; then
  (cd remotion && [ -d node_modules ] || npm ci)
  (cd remotion && npx remotion render src/index.ts Ep$n out/ep$n.mp4 --gl=swangle --browser-executable=$HS --concurrency=4 --crf=18 --log=error)
fi
cp remotion/out/ep$n.mp4 videos/reel$n.mp4
sh bgm/add_bgm.sh "$song" videos/reel$n.mp4
sh bgm/compress.sh videos/reel$n.mp4
