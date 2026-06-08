// All "today" logic is based on Saudi Arabia time (Asia/Riyadh, UTC+3)
// We never rely on the server or browser's local timezone.

const RIYADH_TZ = 'Asia/Riyadh'


export function todayInRiyadh(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: RIYADH_TZ })
  // returns YYYY-MM-DD
}

export function matchDateInRiyadh(kickoffTime: string): string {
  return new Date(kickoffTime).toLocaleDateString('en-CA', { timeZone: RIYADH_TZ })
}

export function isMatchToday(kickoffTime: string): boolean {
  return matchDateInRiyadh(kickoffTime) === todayInRiyadh()
}

export function isMatchLocked(kickoffTime: string, status?: string): boolean {
  if (status === 'finished' || status === 'live') return true
  return new Date() >= new Date(kickoffTime)
}

export function formatKickoffTime(kickoffTime: string): string {
  return new Date(kickoffTime).toLocaleTimeString('ar-SA-u-nu-latn', {
    timeZone: RIYADH_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatMatchDate(kickoffTime: string): string {
  return new Date(kickoffTime).toLocaleDateString('ar-SA', {
    timeZone: RIYADH_TZ,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function getSecondsUntilKickoff(kickoffTime: string): number {
  return Math.max(0, Math.floor((new Date(kickoffTime).getTime() - Date.now()) / 1000))
}
