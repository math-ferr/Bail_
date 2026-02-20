#!/bin/bash

echo "Stopping bot..."
pkill -f index.js

sleep 1

echo "Starting bot..."
node index.js