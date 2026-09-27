#!/bin/bash
source .venv/bin/activate
echo "Starting Sentinel Real-Time AI Worker..."
python rtsp_consumer.py
