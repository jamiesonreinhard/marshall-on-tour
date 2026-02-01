/**
 * Load 2026 ATP Calendar from official PDF data
 * 
 * This script loads the complete 2026 ATP calendar into the atp_calendar table.
 * Run with: npx tsx scripts/load-atp-calendar-2026.ts
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Surface mapping from calendar codes
const SURFACE_MAP: Record<string, string> = {
  'H': 'Hard',
  'CL': 'Clay',
  'G': 'Grass',
  'IH': 'Indoor Hard',
};

// Category mapping
const CATEGORY_MAP: Record<string, string> = {
  'ATP 250': 'ATP 250',
  'ATP 500': 'ATP 500',
  'ATP MASTERS 1000': 'ATP 1000',
  'GRAND SLAM': 'Grand Slam',
  'ATP FINALS': 'ATP Finals',
  'UNITED CUP': 'United Cup',
  'DAVIS CUP': 'Davis Cup',
  'LAVER CUP': 'Laver Cup',
};

// Generate tournament ID from name and date
function generateTournamentId(name: string, startDate: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const datePart = startDate.replace(/-/g, '');
  return `${slug}-${datePart}`;
}

// Calculate end date based on tournament category and start date
function calculateEndDate(startDate: string, category: string, draws?: number): string {
  const start = new Date(startDate);
  let days = 7; // Default 1 week

  if (category === 'Grand Slam') {
    days = 14; // 2 weeks
  } else if (category === 'ATP 1000') {
    // Most ATP 1000s are 1 week, but some span 2 weeks
    // Indian Wells, Miami, Madrid, Rome, Canada, Cincinnati, Shanghai are 2 weeks
    const twoWeekTournaments = [
      'BNP Paribas Open',
      'Miami Open',
      'Mutua Madrid Open',
      'Internazionali BNL d\'Italia',
      'National Bank Open',
      'Cincinnati Open',
      'Rolex Shanghai Masters',
    ];
    const name = startDate; // We'll check this in the data
    days = 14;
  } else if (category === 'ATP Finals') {
    days = 8; // 1 week + 1 day
  } else {
    days = 7; // Most tournaments are 1 week
  }

  const end = new Date(start);
  end.setDate(start.getDate() + days - 1);
  return end.toISOString().split('T')[0];
}

// 2026 ATP Calendar data parsed from official PDF
const tournaments = [
  // JANUARY 2026
  {
    name: 'United Cup',
    start_date: '2026-01-02',
    end_date: '2026-01-11', // Approximate, spans multiple cities
    city: 'Perth, Sydney',
    country: 'Australia',
    category: 'United Cup',
    surface: 'Hard',
  },
  {
    name: 'Brisbane International presented by ANZ',
    start_date: '2026-01-05',
    end_date: '2026-01-11',
    city: 'Brisbane',
    country: 'Australia',
    category: 'ATP 250',
    surface: 'Hard',
  },
  {
    name: 'Bank of China Hong Kong Tennis Open',
    start_date: '2026-01-05',
    end_date: '2026-01-11',
    city: 'Hong Kong',
    country: 'Hong Kong',
    category: 'ATP 250',
    surface: 'Hard',
  },
  {
    name: 'Adelaide International',
    start_date: '2026-01-12',
    end_date: '2026-01-18',
    city: 'Adelaide',
    country: 'Australia',
    category: 'ATP 250',
    surface: 'Hard',
  },
  {
    name: 'ASB Classic',
    start_date: '2026-01-12',
    end_date: '2026-01-18',
    city: 'Auckland',
    country: 'New Zealand',
    category: 'ATP 250',
    surface: 'Hard',
  },
  {
    name: 'Australian Open',
    start_date: '2026-01-18',
    end_date: '2026-02-01',
    city: 'Melbourne',
    country: 'Australia',
    category: 'Grand Slam',
    surface: 'Hard',
  },
  // FEBRUARY 2026
  {
    name: 'Open Occitanie',
    start_date: '2026-02-02',
    end_date: '2026-02-08',
    city: 'Montpellier',
    country: 'France',
    category: 'ATP 250',
    surface: 'Indoor Hard',
  },
  {
    name: 'Dallas Open',
    start_date: '2026-02-09',
    end_date: '2026-02-15',
    city: 'Dallas',
    country: 'USA',
    category: 'ATP 500',
    surface: 'Indoor Hard',
  },
  {
    name: 'ABN AMRO Open',
    start_date: '2026-02-09',
    end_date: '2026-02-15',
    city: 'Rotterdam',
    country: 'Netherlands',
    category: 'ATP 500',
    surface: 'Indoor Hard',
  },
  {
    name: 'IEB+ Argentina Open',
    start_date: '2026-02-09',
    end_date: '2026-02-15',
    city: 'Buenos Aires',
    country: 'Argentina',
    category: 'ATP 250',
    surface: 'Clay',
  },
  {
    name: 'Qatar ExxonMobil Open',
    start_date: '2026-02-16',
    end_date: '2026-02-22',
    city: 'Doha',
    country: 'Qatar',
    category: 'ATP 500',
    surface: 'Hard',
  },
  {
    name: 'Rio Open presented by Claro',
    start_date: '2026-02-16',
    end_date: '2026-02-22',
    city: 'Rio de Janeiro',
    country: 'Brazil',
    category: 'ATP 500',
    surface: 'Clay',
  },
  {
    name: 'Delray Beach Open',
    start_date: '2026-02-16',
    end_date: '2026-02-22',
    city: 'Delray Beach',
    country: 'USA',
    category: 'ATP 250',
    surface: 'Hard',
  },
  {
    name: 'Abierto Mexicano Telcel presentado por HSBC',
    start_date: '2026-02-23',
    end_date: '2026-03-01',
    city: 'Acapulco',
    country: 'Mexico',
    category: 'ATP 500',
    surface: 'Hard',
  },
  {
    name: 'Dubai Duty Free Tennis Championships',
    start_date: '2026-02-23',
    end_date: '2026-03-01',
    city: 'Dubai',
    country: 'UAE',
    category: 'ATP 500',
    surface: 'Hard',
  },
  {
    name: 'BCI Seguros Chile Open',
    start_date: '2026-02-23',
    end_date: '2026-03-01',
    city: 'Santiago',
    country: 'Chile',
    category: 'ATP 250',
    surface: 'Clay',
  },
  // MARCH 2026
  {
    name: 'BNP Paribas Open',
    start_date: '2026-03-04',
    end_date: '2026-03-16',
    city: 'Indian Wells',
    country: 'USA',
    category: 'ATP 1000',
    surface: 'Hard',
  },
  {
    name: 'Miami Open presented by Itaú',
    start_date: '2026-03-18',
    end_date: '2026-03-30',
    city: 'Miami',
    country: 'USA',
    category: 'ATP 1000',
    surface: 'Hard',
  },
  {
    name: 'Tiriac Open',
    start_date: '2026-03-30',
    end_date: '2026-04-05',
    city: 'Bucharest',
    country: 'Romania',
    category: 'ATP 250',
    surface: 'Clay',
  },
  {
    name: 'Fayez Sarofim & Co. U.S. Men\'s Clay Court Championship',
    start_date: '2026-03-30',
    end_date: '2026-04-05',
    city: 'Houston',
    country: 'USA',
    category: 'ATP 250',
    surface: 'Clay',
  },
  {
    name: 'Grand Prix Hassan II',
    start_date: '2026-03-30',
    end_date: '2026-04-05',
    city: 'Marrakech',
    country: 'Morocco',
    category: 'ATP 250',
    surface: 'Clay',
  },
  // APRIL 2026
  {
    name: 'Rolex Monte-Carlo Masters',
    start_date: '2026-04-05',
    end_date: '2026-04-12',
    city: 'Monte Carlo',
    country: 'Monaco',
    category: 'ATP 1000',
    surface: 'Clay',
  },
  {
    name: 'Barcelona Open Banc Sabadell',
    start_date: '2026-04-13',
    end_date: '2026-04-19',
    city: 'Barcelona',
    country: 'Spain',
    category: 'ATP 500',
    surface: 'Clay',
  },
  {
    name: 'BMW Open by Bitpanda',
    start_date: '2026-04-13',
    end_date: '2026-04-19',
    city: 'Munich',
    country: 'Germany',
    category: 'ATP 500',
    surface: 'Clay',
  },
  {
    name: 'Mutua Madrid Open',
    start_date: '2026-04-22',
    end_date: '2026-05-03',
    city: 'Madrid',
    country: 'Spain',
    category: 'ATP 1000',
    surface: 'Clay',
  },
  // MAY 2026
  {
    name: 'Internazionali BNL d\'Italia',
    start_date: '2026-05-06',
    end_date: '2026-05-17',
    city: 'Rome',
    country: 'Italy',
    category: 'ATP 1000',
    surface: 'Clay',
  },
  {
    name: 'Bitpanda Hamburg Open',
    start_date: '2026-05-17',
    end_date: '2026-05-23',
    city: 'Hamburg',
    country: 'Germany',
    category: 'ATP 500',
    surface: 'Clay',
  },
  {
    name: 'Gonet Geneva Open',
    start_date: '2026-05-17',
    end_date: '2026-05-23',
    city: 'Geneva',
    country: 'Switzerland',
    category: 'ATP 250',
    surface: 'Clay',
  },
  {
    name: 'Roland-Garros',
    start_date: '2026-05-24',
    end_date: '2026-06-07',
    city: 'Paris',
    country: 'France',
    category: 'Grand Slam',
    surface: 'Clay',
  },
  // JUNE 2026
  {
    name: 'Libema Open',
    start_date: '2026-06-08',
    end_date: '2026-06-14',
    city: '\'s-Hertogenbosch',
    country: 'Netherlands',
    category: 'ATP 250',
    surface: 'Grass',
  },
  {
    name: 'Boss Open',
    start_date: '2026-06-08',
    end_date: '2026-06-14',
    city: 'Stuttgart',
    country: 'Germany',
    category: 'ATP 250',
    surface: 'Grass',
  },
  {
    name: 'Terra Wortmann Open',
    start_date: '2026-06-15',
    end_date: '2026-06-21',
    city: 'Halle',
    country: 'Germany',
    category: 'ATP 500',
    surface: 'Grass',
  },
  {
    name: 'HSBC Championships',
    start_date: '2026-06-15',
    end_date: '2026-06-21',
    city: 'London',
    country: 'United Kingdom',
    category: 'ATP 500',
    surface: 'Grass',
  },
  {
    name: 'Mallorca Championships presented by Ecotrans Group',
    start_date: '2026-06-21',
    end_date: '2026-06-27',
    city: 'Mallorca',
    country: 'Spain',
    category: 'ATP 250',
    surface: 'Grass',
  },
  {
    name: 'Lexus Eastbourne Open',
    start_date: '2026-06-22',
    end_date: '2026-06-28',
    city: 'Eastbourne',
    country: 'United Kingdom',
    category: 'ATP 250',
    surface: 'Grass',
  },
  {
    name: 'The Championships, Wimbledon',
    start_date: '2026-06-29',
    end_date: '2026-07-12',
    city: 'London',
    country: 'United Kingdom',
    category: 'Grand Slam',
    surface: 'Grass',
  },
  // JULY 2026
  {
    name: 'Nordea Open',
    start_date: '2026-07-13',
    end_date: '2026-07-19',
    city: 'Båstad',
    country: 'Sweden',
    category: 'ATP 250',
    surface: 'Clay',
  },
  {
    name: 'EFG Swiss Open Gstaad',
    start_date: '2026-07-13',
    end_date: '2026-07-19',
    city: 'Gstaad',
    country: 'Switzerland',
    category: 'ATP 250',
    surface: 'Clay',
  },
  {
    name: 'Plava Laguna Croatia Open Umag',
    start_date: '2026-07-13',
    end_date: '2026-07-19',
    city: 'Umag',
    country: 'Croatia',
    category: 'ATP 250',
    surface: 'Clay',
  },
  {
    name: 'Generali Open',
    start_date: '2026-07-20',
    end_date: '2026-07-26',
    city: 'Kitzbühel',
    country: 'Austria',
    category: 'ATP 250',
    surface: 'Clay',
  },
  {
    name: 'Millennium Estoril Open',
    start_date: '2026-07-20',
    end_date: '2026-07-26',
    city: 'Estoril',
    country: 'Portugal',
    category: 'ATP 250',
    surface: 'Clay',
  },
  {
    name: 'Mubadala Citi DC Open',
    start_date: '2026-07-27',
    end_date: '2026-08-02',
    city: 'Washington, D.C.',
    country: 'USA',
    category: 'ATP 500',
    surface: 'Hard',
  },
  {
    name: 'Mifel Tennis Open by Telcel OPPO',
    start_date: '2026-07-27',
    end_date: '2026-08-02',
    city: 'Los Cabos',
    country: 'Mexico',
    category: 'ATP 250',
    surface: 'Hard',
  },
  // AUGUST 2026
  {
    name: 'National Bank Open presented by Rogers',
    start_date: '2026-08-02',
    end_date: '2026-08-09',
    city: 'Montreal',
    country: 'Canada',
    category: 'ATP 1000',
    surface: 'Hard',
  },
  {
    name: 'Cincinnati Open',
    start_date: '2026-08-13',
    end_date: '2026-08-23',
    city: 'Cincinnati',
    country: 'USA',
    category: 'ATP 1000',
    surface: 'Hard',
  },
  {
    name: 'Winston-Salem Open',
    start_date: '2026-08-23',
    end_date: '2026-08-29',
    city: 'Winston-Salem',
    country: 'USA',
    category: 'ATP 250',
    surface: 'Hard',
  },
  {
    name: 'US Open',
    start_date: '2026-08-31',
    end_date: '2026-09-13',
    city: 'New York',
    country: 'USA',
    category: 'Grand Slam',
    surface: 'Hard',
  },
  // SEPTEMBER 2026
  {
    name: 'Chengdu Open',
    start_date: '2026-09-23',
    end_date: '2026-09-29',
    city: 'Chengdu',
    country: 'China',
    category: 'ATP 250',
    surface: 'Hard',
  },
  {
    name: 'Lynk & Co Hangzhou Open',
    start_date: '2026-09-23',
    end_date: '2026-09-29',
    city: 'Hangzhou',
    country: 'China',
    category: 'ATP 250',
    surface: 'Hard',
  },
  {
    name: 'Kinoshita Group Japan Open Tennis Championships',
    start_date: '2026-09-30',
    end_date: '2026-10-06',
    city: 'Tokyo',
    country: 'Japan',
    category: 'ATP 500',
    surface: 'Hard',
  },
  {
    name: 'China Open',
    start_date: '2026-09-30',
    end_date: '2026-10-06',
    city: 'Beijing',
    country: 'China',
    category: 'ATP 500',
    surface: 'Hard',
  },
  // OCTOBER 2026
  {
    name: 'Rolex Shanghai Masters',
    start_date: '2026-10-07',
    end_date: '2026-10-18',
    city: 'Shanghai',
    country: 'China',
    category: 'ATP 1000',
    surface: 'Hard',
  },
  {
    name: 'Almaty Open',
    start_date: '2026-10-19',
    end_date: '2026-10-25',
    city: 'Almaty',
    country: 'Kazakhstan',
    category: 'ATP 250',
    surface: 'Indoor Hard',
  },
  {
    name: 'BNP Paribas Fortis European Open',
    start_date: '2026-10-19',
    end_date: '2026-10-25',
    city: 'Brussels',
    country: 'Belgium',
    category: 'ATP 250',
    surface: 'Indoor Hard',
  },
  {
    name: 'Grand Prix Auvergne-Rhone-Alpes',
    start_date: '2026-10-19',
    end_date: '2026-10-25',
    city: 'Lyon',
    country: 'France',
    category: 'ATP 250',
    surface: 'Indoor Hard',
  },
  {
    name: 'Swiss Indoors Basel',
    start_date: '2026-10-26',
    end_date: '2026-11-01',
    city: 'Basel',
    country: 'Switzerland',
    category: 'ATP 500',
    surface: 'Indoor Hard',
  },
  {
    name: 'Erste Bank Open',
    start_date: '2026-10-26',
    end_date: '2026-11-01',
    city: 'Vienna',
    country: 'Austria',
    category: 'ATP 500',
    surface: 'Indoor Hard',
  },
  // NOVEMBER 2026
  {
    name: 'Rolex Paris Masters',
    start_date: '2026-11-02',
    end_date: '2026-11-08',
    city: 'Paris',
    country: 'France',
    category: 'ATP 1000',
    surface: 'Indoor Hard',
  },
  {
    name: 'BNP Paribas Nordic Open',
    start_date: '2026-11-08',
    end_date: '2026-11-14',
    city: 'Stockholm',
    country: 'Sweden',
    category: 'ATP 250',
    surface: 'Indoor Hard',
  },
  {
    name: 'Nitto ATP Finals',
    start_date: '2026-11-15',
    end_date: '2026-11-22',
    city: 'Turin',
    country: 'Italy',
    category: 'ATP Finals',
    surface: 'Indoor Hard',
  },
];

async function loadTournaments() {
  console.log(`Loading ${tournaments.length} tournaments into atp_calendar...\n`);

  let success = 0;
  let errors = 0;

  for (const tournament of tournaments) {
    const tournamentId = generateTournamentId(tournament.name, tournament.start_date);

    const { error } = await supabase
      .from('atp_calendar')
      .upsert({
        tournament_id: tournamentId,
        name: tournament.name,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        location: {
          city: tournament.city,
          country: tournament.country,
        },
        category: tournament.category,
        surface: tournament.surface,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'tournament_id',
      });

    if (error) {
      console.error(`❌ Error loading ${tournament.name}:`, error.message);
      errors++;
    } else {
      console.log(`✅ ${tournament.name} (${tournament.start_date} - ${tournament.end_date})`);
      success++;
    }
  }

  console.log(`\n📊 Summary: ${success} loaded, ${errors} errors`);
}

// Run the script
loadTournaments()
  .then(() => {
    console.log('\n✅ Calendar loading complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
