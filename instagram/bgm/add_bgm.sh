#!/bin/sh
# 無音のリール動画にBGMを入れる:  sh bgm/add_bgm.sh <曲番号> <動画.mp4>
set -e
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
python3 bgm/make_bgm.py "$1" "$2" "$tmp/bgm.wav"
ffmpeg -v error -y -i "$2" -i "$tmp/bgm.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k \
  -af loudnorm=I=-14:TP=-1 -shortest -movflags +faststart "$tmp/out.mp4"
mv "$tmp/out.mp4" "$2"
rm -rf "$tmp"
