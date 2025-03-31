#!/bin/bash

# Navigate into the backend directory
cd "$(dirname "$0")"

# Start the FastAPI app
uvicorn app.main:app --host 0.0.0.0 --port $PORT
