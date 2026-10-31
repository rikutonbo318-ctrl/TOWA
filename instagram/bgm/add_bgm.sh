#!/bin/sh
# 無音のリール動画にBGMを入れる:  sh bgm/add_bgm.sh <曲番号> <動画.mp4>
# 動画に声（渦さんの冒頭の一言）が入っていれば残し、声の間だけBGMを -10dB 下げる
set -e
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
python3 bgm/make_bgm.py "$1" "$2" "$tmp/bgm.wav"
if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$2" | grep -q .; then
  ffmpeg -v error -y -i "$2" -i "$tmp/bgm.wav" -filter_complex \
    "[1:a]volume=0.316:enable='between(t,0.1,3.0)'[b];[0:a]volume=1.8[v];[b][v]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$tmp/out.mp4"
else
  ffmpeg -v error -y -i "$2" -i "$tmp/bgm.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k \
    -af loudnorm=I=-14:TP=-1 -shortest -movflags +faststart "$tmp/out.mp4"
fi
mv "$tmp/out.mp4" "$2"
rm -rf "$tmp"
