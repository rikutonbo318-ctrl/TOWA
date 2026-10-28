#!/bin/sh
# リール動画を 15MB 以下に縮める（Instagram側でも再圧縮されるので見た目はほぼ変わらない）
set -e
f="$1"
tmp="$f.tmp.mp4"
ffmpeg -v error -y -i "$f" -c:v libx264 -preset slow -crf 23 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -c:a copy -movflags +faststart "$tmp"
mv "$tmp" "$f"
ls -la "$f"
