/**
 * Quick test of FreeWebAPI (RapidAPI tennisapi1) rankings response.
 * Run: npx tsx scripts/test-freewebapi.ts
 * Loads .env.local from project root.
 */
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

const key = process.env.RAPIDAPI_KEY || process.env.FREEWEBAPI_RAPIDAPI_KEY;
const host = process.env.RAPIDAPI_TENNIS_HOST || 'tennisapi1.p.rapidapi.com';
const url = `https://${host}/api/tennis/rankings/atp`;

async function main() {
  console.log('Testing FreeWebAPI rankings...\n');
  console.log('URL:', url);
  console.log('Key set:', !!key, key ? `${key.slice(0, 8)}...` : '');
  if (!key) {
    console.error('Set RAPIDAPI_KEY or FREEWEBAPI_RAPIDAPI_KEY in .env.local');
    process.exit(1);
  }

  const res = await fetch(url, {
    headers: {
      'x-rapidapi-host': host,
      'x-rapidapi-key': key,
    },
  });
  const raw = await res.json().catch((e) => ({ parseError: e.message }));

  console.log('\n--- Response status ---');
  console.log(res.status, res.statusText);
  console.log('\n--- Raw response (top-level keys) ---');
  console.log(typeof raw === 'object' && raw !== null ? Object.keys(raw) : raw);
  console.log('\n--- Raw response (full JSON, truncated if large) ---');
  const str = JSON.stringify(raw, null, 2);
  console.log(str.length > 3000 ? str.slice(0, 3000) + '\n... [truncated]' : str);

  // Quick parse: if we have an array or rankings array, show first 3
  const list = Array.isArray(raw) ? raw : raw?.rankings ?? raw?.data ?? raw?.results ?? [];
  if (Array.isArray(list) && list.length > 0) {
    console.log('\n--- First 3 entries (sample) ---');
    console.log(JSON.stringify(list.slice(0, 3), null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
