#!/data/data/com.termux/files/usr/bin/bash

set -e

echo "[1/5] Update package list..."
pkg update -y

echo "[2/5] Install dependencies..."
pkg install -y git nodejs python ffmpeg imagemagick libwebp

echo "[3/5] Install npm dependencies..."
if [ -f package.json ]; then
    npm install
fi

echo "[4/5] Install python dependencies..."
if [ -f requirements.txt ]; then
    pip install -r requirements.txt
fi

echo "[5/5] Starting bot..."
node index.js