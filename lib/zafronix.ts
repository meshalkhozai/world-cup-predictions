// Zafronix World Cup 2026 API client
// Server-side only — API key never exposed to browser

const BASE_URL = 'https://api.zafronix.com/fifa/worldcup/v1'

// API team name (raw from Zafronix) → Arabic display name
const TEAM_NAME_MAP: Record<string, string> = {
  'Mexico': 'المكسيك',
  'South Africa': 'جنوب أفريقيا',
  'Korea Republic': 'كوريا الجنوبية',
  'Czechia': 'التشيك',
  'Canada': 'كندا',
  'Bosnia and Herzegovina': 'البوسنة والهرسك',
  'Qatar': 'قطر',
  'Switzerland': 'سويسرا',
  'Brazil': 'البرازيل',
  'Morocco': 'المغرب',
  'Haiti': 'هايتي',
  'Scotland': 'اسكتلندا',
  'USA': 'الولايات المتحدة',
  'Paraguay': 'باراغواي',
  'Australia': 'أستراليا',
  'Türkiye': 'تركيا',
  'Germany': 'ألمانيا',
  'Curaçao': 'كوراساو',
  'Côte d\'Ivoire': 'ساحل العاج',
  'Ecuador': 'الإكوادور',
  'Netherlands': 'هولندا',
  'Japan': 'اليابان',
  'Sweden': 'السويد',
  'Tunisia': 'تونس',
  'Belgium': 'بلجيكا',
  'Egypt': 'مصر',
  'IR Iran': 'إيران',
  'New Zealand': 'نيوزيلندا',
  'Spain': 'إسبانيا',
  'Cabo Verde': 'الرأس الأخضر',
  'Saudi Arabia': 'السعودية',
  'Uruguay': 'أوروغواي',
  'France': 'فرنسا',
  'Senegal': 'السنغال',
  'Iraq': 'العراق',
  'Norway': 'النرويج',
  'Argentina': 'الأرجنتين',
  'Algeria': 'الجزائر',
  'Austria': 'النمسا',
  'Jordan': 'الأردن',
  'Portugal': 'البرتغال',
  'Congo DR': 'الكونغو الديمقراطية',
  'Uzbekistan': 'أوزبكستان',
  'Colombia': 'كولومبيا',
  'England': 'إنجلترا',
  'Croatia': 'كرواتيا',
  'Ghana': 'غانا',
  'Panama': 'بنما',
};


// Display name → flag emoji (all 48 WC 2026 teams) 
const FLAG_MAP: Record<string, string> = {
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'Korea Republic': '🇰🇷', 'Czechia': '🇨🇿', 'Canada': '🇨🇦', 'Bosnia and Herzegovina': '🇧🇦', 'Qatar': '🇶🇦',
  'Switzerland': '🇨🇭', 'Brazil': '🇧🇷', 'Morocco': '🇲🇦', 'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'USA': '🇺🇸', 'Paraguay': '🇵🇾',
  'Australia': '🇦🇺', 'Türkiye': '🇹🇷', 'Germany': '🇩🇪',
  'Curaçao': '🇨🇼', "Côte d'Ivoire": '🇨🇮', 'Ecuador': '🇪🇨',
  'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Sweden': '🇸🇪',
  'Tunisia': '🇹🇳', 'Belgium': '🇧🇪', 'Egypt': '🇪🇬',
  'IR Iran': '🇮🇷', 'New Zealand': '🇳🇿', 'Spain': '🇪🇸',
  'Cabo Verde': '🇨🇻', 'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾',
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴',
  'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹',
  'Jordan': '🇯🇴', 'Portugal': '🇵🇹', 'Congo DR': '🇨🇩',
  'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Croatia': '🇭🇷', 'Ghana': '🇬🇭', 'Panama': '🇵🇦',
}




// API stageNormalized → our DB stage enum
const STAGE_MAP: Record<string, string> = {
  round_of_32: 'round_of_32',
  round_of_16: 'round_of_16',
  quarter_final: 'quarter_final',
  semi_final: 'semi_final',
  thirdPlace: 'third_place',
  final: 'final',
}

function normalizeName(apiName: string): string {
  return TEAM_NAME_MAP[apiName] ?? apiName
}

function getFlag(displayName: string): string {
  return FLAG_MAP[displayName] ?? '🏳️'
}

function mapStage(stageNormalized: string): string {
  if (stageNormalized.startsWith('group_')) return 'group'
  return STAGE_MAP[stageNormalized] ?? 'group'
}

interface ApiMatch {
  id: string
  kickoffUtc: string
  stageNormalized: string
  homeTeam: string | null
  awayTeam: string | null
  homeRef: string | null
  awayRef: string | null
  homeScore: number | null
  awayScore: number | null
  stadium: string | null
}

interface ApiPage {
  data: ApiMatch[]
  pagination?: {
    hasMore?: boolean
    nextCursor?: string | null
  }
}

export interface ZafronixMatch {
  external_id: string
  home_team: string
  away_team: string
  home_team_flag: string
  away_team_flag: string
  kickoff_time: string
  home_score: number | null
  away_score: number | null
  status: 'upcoming' | 'finished'
  stage: string
  venue: string | null
}

async function fetchPage(cursor?: string): Promise<ApiPage> {
  const url = new URL(`${BASE_URL}/matches`)
  url.searchParams.set('year', '2026')
  if (cursor) url.searchParams.set('cursor', cursor)

  const res = await fetch(url.toString(), {
    headers: { 'X-API-Key': process.env.ZAFRONIX_API_KEY! },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Zafronix API ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

// Fetch bracket to resolve knockout placeholder team names (e.g. "2A" → "Canada")
async function fetchBracketTeamMap(): Promise<Record<string, { home: string | null; away: string | null }>> {
  const res = await fetch(`${BASE_URL}/bracket?year=2026`, {
    headers: { 'X-API-Key': process.env.ZAFRONIX_API_KEY! },
    cache: 'no-store',
  })
  if (!res.ok) return {}

  const data = await res.json()
  const map: Record<string, { home: string | null; away: string | null }> = {}

  for (const matches of Object.values(data.stages ?? {}) as any[][]) {
    for (const m of matches) {
      if (m.matchId) {
        map[m.matchId] = { home: m.home ?? null, away: m.away ?? null }
      }
    }
  }
  return map
}

export async function fetchAllMatches(): Promise<ZafronixMatch[]> {
  const all: ZafronixMatch[] = []
  let cursor: string | undefined

  // Fetch bracket once to resolve knockout team names
  const bracketMap = await fetchBracketTeamMap()

  do {
    const page = await fetchPage(cursor)

    for (const m of page.data) {
      // For knockout matches: use bracket resolved names only (no homeRef fallback)
      const bracket = bracketMap[m.id]
      const resolvedHome = m.homeTeam ?? bracket?.home ?? null
      const resolvedAway = m.awayTeam ?? bracket?.away ?? null
      if (!resolvedHome || !resolvedAway) continue

      const homeTeam = m.homeTeam ? normalizeName(m.homeTeam) : normalizeName(resolvedHome) || resolvedHome
      const awayTeam = m.awayTeam ? normalizeName(m.awayTeam) : normalizeName(resolvedAway) || resolvedAway
      const finished = m.homeScore !== null && m.awayScore !== null

      all.push({
        external_id: m.id,
        home_team: homeTeam,
        away_team: awayTeam,
        home_team_flag: m.homeTeam ? getFlag(m.homeTeam) : (bracket?.home ? getFlag(bracket.home) : '🏳️'),
        away_team_flag: m.awayTeam ? getFlag(m.awayTeam) : (bracket?.away ? getFlag(bracket.away) : '🏳️'),
        kickoff_time: m.kickoffUtc,
        home_score: m.homeScore,
        away_score: m.awayScore,
        status: finished ? 'finished' : 'upcoming',
        stage: mapStage(m.stageNormalized),
        venue: m.stadium ?? null,
      })
    }

    cursor = page.pagination?.hasMore && page.pagination?.nextCursor
      ? page.pagination.nextCursor
      : undefined
  } while (cursor)

  return all
}
