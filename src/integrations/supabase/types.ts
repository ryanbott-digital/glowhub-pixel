export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          consented_at: string
          created_at: string
          email: string
          id: string
        }
        Insert: {
          consented_at?: string
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          consented_at?: string
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          aspect_ratio: string | null
          audio_muted: boolean
          created_at: string
          duration: number | null
          id: string
          mux_asset_id: string | null
          mux_status: string | null
          name: string
          storage_path: string
          type: string
          user_id: string
        }
        Insert: {
          aspect_ratio?: string | null
          audio_muted?: boolean
          created_at?: string
          duration?: number | null
          id?: string
          mux_asset_id?: string | null
          mux_status?: string | null
          name: string
          storage_path: string
          type: string
          user_id: string
        }
        Update: {
          aspect_ratio?: string | null
          audio_muted?: boolean
          created_at?: string
          duration?: number | null
          id?: string
          mux_asset_id?: string | null
          mux_status?: string | null
          name?: string
          storage_path?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pairings: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          pairing_code: string
          screen_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          pairing_code: string
          screen_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          pairing_code?: string
          screen_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pairings_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      playback_logs: {
        Row: {
          id: string
          media_id: string
          played_at: string
          screen_id: string
        }
        Insert: {
          id?: string
          media_id: string
          played_at?: string
          screen_id: string
        }
        Update: {
          id?: string
          media_id?: string
          played_at?: string
          screen_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playback_logs_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playback_logs_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      player_error_logs: {
        Row: {
          created_at: string
          error_message: string
          id: string
          media_id: string | null
          screen_id: string
        }
        Insert: {
          created_at?: string
          error_message: string
          id?: string
          media_id?: string | null
          screen_id: string
        }
        Update: {
          created_at?: string
          error_message?: string
          id?: string
          media_id?: string | null
          screen_id?: string
        }
        Relationships: []
      }
      playlist_items: {
        Row: {
          created_at: string
          id: string
          media_id: string
          override_duration: number | null
          playlist_id: string
          position: number
        }
        Insert: {
          created_at?: string
          id?: string
          media_id: string
          override_duration?: number | null
          playlist_id: string
          position?: number
        }
        Update: {
          created_at?: string
          id?: string
          media_id?: string
          override_duration?: number | null
          playlist_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          id: string
          position: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      premium_widgets: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
          widget_type: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id: string
          widget_type: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          widget_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          granted_pro_until: string | null
          id: string
          screen_packs: number
          single_screen_subs: number
          stripe_customer_id: string | null
          subscription_end: string | null
          subscription_status: string
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          granted_pro_until?: string | null
          id: string
          screen_packs?: number
          single_screen_subs?: number
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string
          subscription_tier?: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          granted_pro_until?: string | null
          id?: string
          screen_packs?: number
          single_screen_subs?: number
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string
          subscription_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          enabled: boolean
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          enabled?: boolean
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          enabled?: boolean
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      remote_trigger_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          payload: string | null
          screen_id: string
          source_ip: string | null
          toggled_off: boolean
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          payload?: string | null
          screen_id: string
          source_ip?: string | null
          toggled_off?: boolean
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          payload?: string | null
          screen_id?: string
          source_ip?: string | null
          toggled_off?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remote_trigger_logs_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_blocks: {
        Row: {
          block_type: string
          color_code: string
          created_at: string
          end_at: string
          id: string
          label: string
          media_id: string | null
          playlist_id: string | null
          priority: number
          recurrence: string
          recurrence_end: string | null
          screen_id: string
          start_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          block_type?: string
          color_code?: string
          created_at?: string
          end_at: string
          id?: string
          label?: string
          media_id?: string | null
          playlist_id?: string | null
          priority?: number
          recurrence?: string
          recurrence_end?: string | null
          screen_id: string
          start_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          block_type?: string
          color_code?: string
          created_at?: string
          end_at?: string
          id?: string
          label?: string
          media_id?: string | null
          playlist_id?: string | null
          priority?: number
          recurrence?: string
          recurrence_end?: string | null
          screen_id?: string
          start_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      screen_activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          playlist_id: string | null
          playlist_title: string | null
          screen_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          playlist_id?: string | null
          playlist_title?: string | null
          screen_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          playlist_id?: string | null
          playlist_title?: string | null
          screen_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screen_activity_logs_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screen_activity_logs_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      screen_broadcasts: {
        Row: {
          broadcast_type: string
          created_at: string
          duration_seconds: number
          id: string
          message: string
          sent_by: string
          target_user_id: string
        }
        Insert: {
          broadcast_type?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          message: string
          sent_by: string
          target_user_id: string
        }
        Update: {
          broadcast_type?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          message?: string
          sent_by?: string
          target_user_id?: string
        }
        Relationships: []
      }
      screen_groups: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      screen_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          playlist_id: string
          screen_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          playlist_id: string
          screen_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          playlist_id?: string
          screen_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "screen_schedules_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screen_schedules_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      screens: {
        Row: {
          audio_enabled: boolean
          audio_mute_on_hype: boolean
          audio_station_name: string | null
          audio_station_url: string | null
          audio_volume: number
          created_at: string
          crossfade_ms: number
          current_media_id: string | null
          current_playlist_id: string | null
          group_id: string | null
          hardware_uuid: string | null
          id: string
          last_ping: string | null
          last_remote_trigger: string | null
          last_screenshot_url: string | null
          launch_on_boot: boolean
          loop_enabled: boolean
          name: string
          orientation: string
          pairing_code: string | null
          status: string
          sync_layout: Json | null
          transition_type: string
          user_id: string
        }
        Insert: {
          audio_enabled?: boolean
          audio_mute_on_hype?: boolean
          audio_station_name?: string | null
          audio_station_url?: string | null
          audio_volume?: number
          created_at?: string
          crossfade_ms?: number
          current_media_id?: string | null
          current_playlist_id?: string | null
          group_id?: string | null
          hardware_uuid?: string | null
          id?: string
          last_ping?: string | null
          last_remote_trigger?: string | null
          last_screenshot_url?: string | null
          launch_on_boot?: boolean
          loop_enabled?: boolean
          name?: string
          orientation?: string
          pairing_code?: string | null
          status?: string
          sync_layout?: Json | null
          transition_type?: string
          user_id: string
        }
        Update: {
          audio_enabled?: boolean
          audio_mute_on_hype?: boolean
          audio_station_name?: string | null
          audio_station_url?: string | null
          audio_volume?: number
          created_at?: string
          crossfade_ms?: number
          current_media_id?: string | null
          current_playlist_id?: string | null
          group_id?: string | null
          hardware_uuid?: string | null
          id?: string
          last_ping?: string | null
          last_remote_trigger?: string | null
          last_screenshot_url?: string | null
          launch_on_boot?: boolean
          loop_enabled?: boolean
          name?: string
          orientation?: string
          pairing_code?: string | null
          status?: string
          sync_layout?: Json | null
          transition_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screens_current_playlist_id_fkey"
            columns: ["current_playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screens_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "screen_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_layouts: {
        Row: {
          canvas_data: Json
          created_at: string
          id: string
          name: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canvas_data?: Json
          created_at?: string
          id?: string
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canvas_data?: Json
          created_at?: string
          id?: string
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_group_screens: {
        Row: {
          bezel_compensation: number
          brightness_offset: number
          color_b: number
          color_g: number
          color_r: number
          created_at: string
          grid_col: number
          grid_row: number
          id: string
          position: number
          resolution_h: number
          resolution_w: number
          screen_id: string
          sync_group_id: string
        }
        Insert: {
          bezel_compensation?: number
          brightness_offset?: number
          color_b?: number
          color_g?: number
          color_r?: number
          created_at?: string
          grid_col?: number
          grid_row?: number
          id?: string
          position?: number
          resolution_h?: number
          resolution_w?: number
          screen_id: string
          sync_group_id: string
        }
        Update: {
          bezel_compensation?: number
          brightness_offset?: number
          color_b?: number
          color_g?: number
          color_r?: number
          created_at?: string
          grid_col?: number
          grid_row?: number
          id?: string
          position?: number
          resolution_h?: number
          resolution_w?: number
          screen_id?: string
          sync_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_group_screens_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_group_screens_sync_group_id_fkey"
            columns: ["sync_group_id"]
            isOneToOne: false
            referencedRelation: "sync_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          orientation: string
          playlist_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          orientation?: string
          playlist_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          orientation?: string
          playlist_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_groups_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          api_key_hash: string
          created_at: string
          id: string
          key_prefix: string
          user_id: string
        }
        Insert: {
          api_key_hash: string
          created_at?: string
          id?: string
          key_prefix: string
          user_id: string
        }
        Update: {
          api_key_hash?: string
          created_at?: string
          id?: string
          key_prefix?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_pro_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
