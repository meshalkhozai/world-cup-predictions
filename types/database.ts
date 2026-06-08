export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          nickname: string
          avatar_url: string | null
          total_points: number
          exact_predictions: number
          correct_predictions: number
          wrong_predictions: number
          is_admin: boolean
          onboarding_completed: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          nickname: string
          avatar_url?: string | null
          total_points?: number
          exact_predictions?: number
          correct_predictions?: number
          wrong_predictions?: number
          is_admin?: boolean
          onboarding_completed?: boolean
          created_at?: string
        }
        Update: {
          nickname?: string
          avatar_url?: string | null
          total_points?: number
          exact_predictions?: number
          correct_predictions?: number
          wrong_predictions?: number
          onboarding_completed?: boolean
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          home_team: string
          away_team: string
          home_team_flag: string | null
          away_team_flag: string | null
          kickoff_time: string
          home_score: number | null
          away_score: number | null
          status: 'upcoming' | 'live' | 'finished'
          stage: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'
          venue: string | null
          created_at: string
        }
        Insert: {
          id?: string
          home_team: string
          away_team: string
          home_team_flag?: string | null
          away_team_flag?: string | null
          kickoff_time: string
          home_score?: number | null
          away_score?: number | null
          status?: 'upcoming' | 'live' | 'finished'
          stage?: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'
          venue?: string | null
          created_at?: string
        }
        Update: {
          home_team?: string
          away_team?: string
          home_team_flag?: string | null
          away_team_flag?: string | null
          kickoff_time?: string
          home_score?: number | null
          away_score?: number | null
          status?: 'upcoming' | 'live' | 'finished'
          stage?: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'
          venue?: string | null
        }
        Relationships: []
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          match_id: string
          predicted_home_score: number
          predicted_away_score: number
          points_awarded: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: string
          predicted_home_score: number
          predicted_away_score: number
          points_awarded?: number
          created_at?: string
        }
        Update: {
          predicted_home_score?: number
          predicted_away_score?: number
        }
        Relationships: [
          {
            foreignKeyName: 'predictions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'predictions_match_id_fkey'
            columns: ['match_id']
            isOneToOne: false
            referencedRelation: 'matches'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_match_points: {
        Args: { p_match_id: string; p_home: number; p_away: number }
        Returns: undefined
      }
      get_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          rank: number
          id: string
          nickname: string
          avatar_url: string | null
          total_points: number
          exact_predictions: number
          correct_predictions: number
          wrong_predictions: number
          created_at: string
        }[]
      }
      get_match_insights: {
        Args: { p_match_id: string }
        Returns: {
          total_predictions: number
          home_win_count: number
          draw_count: number
          away_win_count: number
          home_win_pct: number
          draw_pct: number
          away_win_pct: number
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
