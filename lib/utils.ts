import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getPointsLabel(points: number): string {
  if (points === 3) return 'Exact Score'
  if (points === 1) return 'Correct Result'
  return 'Wrong'
}

export function getPointsColor(points: number): string {
  if (points >= 3) return 'text-brand-gold'
  if (points > 0) return 'text-brand-green'
  return 'text-gray-500'
}

