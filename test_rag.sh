#!/bin/bash

# Function to clean up background process on exit
cleanup() {
  if [ -n "$PID" ]; then
    echo "Stopping server (PID $PID)..."
    kill $PID
  fi
}
trap cleanup EXIT

echo "Starting Next.js server..."
pnpm dev > server.log 2>&1 &
PID=$!

echo "Waiting for server to be ready..."
MAX_RETRIES=30
for ((i=1; i<=MAX_RETRIES; i++)); do
  if curl -s http://localhost:3000/api/debug-stats > /dev/null; then
    echo "Server is ready."
    break
  fi
  if [ $i -eq $MAX_RETRIES ]; then
    echo "Server failed to start within time limit."
    cat server.log
    exit 1
  fi
  sleep 2
done

echo "1. Seeding Database..."
SEED_RESPONSE=$(curl -s -X POST http://localhost:3000/api/seed)
echo "Seed Response: $SEED_RESPONSE"

if [[ "$SEED_RESPONSE" == *"error"* ]]; then
  echo "Seeding failed!"
  exit 1
fi

echo "2. Testing Candidate Matching (Candidate -> Jobs)..."
MATCH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/recommendations/jobs \
  -H "Content-Type: application/json" \
  -d '{"profile": {"name": "Test Frontend Dev", "skills": ["React", "Next.js", "Tailwind"], "role": "Frontend Engineer"}}')

echo "Match Response Preview (first 500 chars):"
echo "$MATCH_RESPONSE" | head -c 500
echo ""

if [[ "$MATCH_RESPONSE" == *"matches"* ]]; then
    echo "✅ Matching test passed: Received matches."
else
    echo "❌ Matching test failed: No matches found or error."
    exit 1
fi

echo "Test Sequence Completed Successfully."
