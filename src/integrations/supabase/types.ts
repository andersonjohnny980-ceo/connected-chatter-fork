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
      call_signals: {
        Row: {
          call_id: string
          conversation_id: string
          created_at: string
          id: number
          kind: string
          payload: Json
          recipient_id: string
          sender_id: string
        }
        Insert: {
          call_id: string
          conversation_id: string
          created_at?: string
          id?: never
          kind: string
          payload?: Json
          recipient_id: string
          sender_id: string
        }
        Update: {
          call_id?: string
          conversation_id?: string
          created_at?: string
          id?: never
          kind?: string
          payload?: Json
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_signals_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          phone: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          phone?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          direct_key: string
          id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          direct_key: string
          id?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          direct_key?: string
          id?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          pair_key: string | null
          receiver_id: string
          responded_at: string | null
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          pair_key?: string | null
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          pair_key?: string | null
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_hides: {
        Row: {
          created_at: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_hides_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          conversation_id: string
          created_at: string
          emoji: string
          message_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          emoji: string
          message_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          emoji?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          client_id: string
          conversation_id: string
          created_at: string
          deleted: boolean
          delivered_at: string | null
          duration: number | null
          id: string
          kind: string
          media_url: string | null
          read_at: string | null
          reply_to: string | null
          sender_id: string
          wave: Json | null
        }
        Insert: {
          body?: string | null
          client_id: string
          conversation_id: string
          created_at?: string
          deleted?: boolean
          delivered_at?: string | null
          duration?: number | null
          id?: string
          kind?: string
          media_url?: string | null
          read_at?: string | null
          reply_to?: string | null
          sender_id: string
          wave?: Json | null
        }
        Update: {
          body?: string | null
          client_id?: string
          conversation_id?: string
          created_at?: string
          deleted?: boolean
          delivered_at?: string | null
          duration?: number | null
          id?: string
          kind?: string
          media_url?: string | null
          read_at?: string | null
          reply_to?: string | null
          sender_id?: string
          wave?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about: string
          created_at: string
          e2e_pub: string | null
          email: string | null
          id: string
          is_online: boolean
          last_seen: string | null
          name: string
          phone: string | null
          photo_url: string | null
          push_token: string | null
          pv_find: string
          pv_online: string
          pv_phone: string
          pv_photo: string
          pv_seen: string
          setup_done: boolean
          updated_at: string
          username: string | null
          verified: boolean
        }
        Insert: {
          about?: string
          created_at?: string
          e2e_pub?: string | null
          email?: string | null
          id: string
          is_online?: boolean
          last_seen?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          push_token?: string | null
          pv_find?: string
          pv_online?: string
          pv_phone?: string
          pv_photo?: string
          pv_seen?: string
          setup_done?: boolean
          updated_at?: string
          username?: string | null
          verified?: boolean
        }
        Update: {
          about?: string
          created_at?: string
          e2e_pub?: string | null
          email?: string | null
          id?: string
          is_online?: boolean
          last_seen?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          push_token?: string | null
          pv_find?: string
          pv_online?: string
          pv_phone?: string
          pv_photo?: string
          pv_seen?: string
          setup_done?: boolean
          updated_at?: string
          username?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      typing_events: {
        Row: {
          conversation_id: string
          is_typing: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          is_typing?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          is_typing?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      admin_list_users: {
        Args: never
        Returns: {
          about: string
          email: string
          id: string
          is_online: boolean
          last_seen: string
          name: string
          phone: string
          photo_url: string
          username: string
          verified: boolean
        }[]
      }
      are_friends: { Args: { _a: string; _b: string }; Returns: boolean }
      can_view_avatar: { Args: { _owner: string }; Returns: boolean }
      cancel_friend_request: { Args: { _id: string }; Returns: undefined }
      delete_message_for_everyone: {
        Args: { _message: string }
        Returns: undefined
      }
      e2e_public_keys: {
        Args: { _ids: string[] }
        Returns: {
          e2e_pub: string
          id: string
        }[]
      }
      get_or_create_direct_conversation: {
        Args: { _other: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id?: string }
        Returns: boolean
      }
      is_saved_contact: {
        Args: { _owner: string; _target: string }
        Returns: boolean
      }
      mark_messages_received: {
        Args: { _ids: string[]; _read: boolean }
        Returns: undefined
      }
      profiles_by_phones: {
        Args: { _phones: string[] }
        Returns: {
          about: string
          id: string
          is_online: boolean
          last_seen: string
          name: string
          phone: string
          photo_url: string
          username: string
          verified: boolean
        }[]
      }
      profiles_public: {
        Args: { _ids: string[] }
        Returns: {
          about: string
          id: string
          is_online: boolean
          last_seen: string
          name: string
          phone: string
          photo_url: string
          username: string
          verified: boolean
        }[]
      }
      remove_friend: { Args: { _other: string }; Returns: undefined }
      respond_friend_request: {
        Args: { _accept: boolean; _id: string }
        Returns: undefined
      }
      search_profiles: {
        Args: { _q: string }
        Returns: {
          about: string
          id: string
          is_online: boolean
          last_seen: string
          name: string
          phone: string
          photo_url: string
          username: string
          verified: boolean
        }[]
      }
      send_friend_request: { Args: { _to: string }; Returns: string }
      set_profile_verification: {
        Args: { _target: string; _verified: boolean }
        Returns: undefined
      }
      username_available: { Args: { _u: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
