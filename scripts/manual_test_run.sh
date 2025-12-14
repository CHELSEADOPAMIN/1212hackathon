#!/bin/bash

BASE_URL="http://localhost:3000"

echo "1. Seeding Database..."
SEED_RESPONSE=$(curl -s -X POST "$BASE_URL/api/seed")
echo "Seed Response: $SEED_RESPONSE"

if [[ "$SEED_RESPONSE" == *"error"* ]]; then
  echo "❌ Seeding failed!"
  exit 1
fi

echo "✅ Database seeded with mock data."

echo "2. Testing Candidate -> Jobs Matching..."
# Profile that should match 'Senior Frontend Engineer' (React, Next.js, etc.)
CANDIDATE_PAYLOAD='{"profile": {"name": "Test Frontend Dev", "skills": ["React", "Next.js", "Tailwind"], "role": "Frontend Engineer", "location": "Remote", "summary": "React expert"}}'
MATCH_JOBS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/recommendations/jobs" \
  -H "Content-Type: application/json" \
  -d "$CANDIDATE_PAYLOAD")

# Check if we got matches
COUNT_JOBS=$(echo "$MATCH_JOBS_RESPONSE" | grep -o "score" | wc -l)
if [ "$COUNT_JOBS" -gt 0 ]; then
    echo "✅ Found $COUNT_JOBS matching jobs for candidate."
else
    echo "❌ No matching jobs found."
    echo "Response: $MATCH_JOBS_RESPONSE"
fi

echo "3. Testing Job -> Candidates Matching..."
# Job that should match 'Alice Chen' (from seed data)
JOB_PAYLOAD='{"job": {"title": "Frontend Engineer", "description": "Looking for React developer", "requirements": ["React", "Tailwind"], "location": "Remote", "company": "TestCorp", "type": "Full-time"}}'
MATCH_CANDIDATES_RESPONSE=$(curl -s -X POST "$BASE_URL/api/recommendations/candidates" \
  -H "Content-Type: application/json" \
  -d "$JOB_PAYLOAD")

# Check if we got matches
COUNT_CANDIDATES=$(echo "$MATCH_CANDIDATES_RESPONSE" | grep -o "score" | wc -l)
if [ "$COUNT_CANDIDATES" -gt 0 ]; then
    echo "✅ Found $COUNT_CANDIDATES matching candidates for job."
else
    echo "❌ No matching candidates found."
    echo "Response: $MATCH_CANDIDATES_RESPONSE"
fi

echo "Done."
