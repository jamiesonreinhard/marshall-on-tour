#!/bin/bash
# Revalidate the homepage on Vercel
# Usage: ./scripts/revalidate-homepage.sh

VERCEL_URL="${VERCEL_URL:-https://your-site.vercel.app}"

echo "Revalidating homepage at ${VERCEL_URL}..."

curl -X POST "${VERCEL_URL}/api/revalidate?path=/" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "Done! The homepage should now show all published posts."
