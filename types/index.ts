import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Prediction = Database['public']['Tables']['predictions']['Row']


export interface LeaderboardEntry extends Profile {
  rank: number
}


export interface PublicPrediction {
  nickname: string
  avatar_url: string | null
  predicted_home_score: number
  predicted_away_score: number
  points_awarded: number
}
