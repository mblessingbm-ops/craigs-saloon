export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          amount_charged: number
          client_id: string | null
          completed_processed: boolean
          course_enrolment_id: string | null
          created_at: string
          id: string
          location_id: string
          notes: string | null
          patch_test_ok: boolean
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          reminder_1h_sent_at: string | null
          reminder_24h_sent_at: string | null
          room_id: string | null
          scheduled_end: string
          scheduled_start: string
          service_id: string | null
          source: Database["public"]["Enums"]["appt_source"]
          status: Database["public"]["Enums"]["appt_status"]
          therapist_id: string | null
        }
        Insert: {
          amount_charged?: number
          client_id?: string | null
          completed_processed?: boolean
          course_enrolment_id?: string | null
          created_at?: string
          id?: string
          location_id: string
          notes?: string | null
          patch_test_ok?: boolean
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reminder_1h_sent_at?: string | null
          reminder_24h_sent_at?: string | null
          room_id?: string | null
          scheduled_end: string
          scheduled_start: string
          service_id?: string | null
          source?: Database["public"]["Enums"]["appt_source"]
          status?: Database["public"]["Enums"]["appt_status"]
          therapist_id?: string | null
        }
        Update: {
          amount_charged?: number
          client_id?: string | null
          completed_processed?: boolean
          course_enrolment_id?: string | null
          created_at?: string
          id?: string
          location_id?: string
          notes?: string | null
          patch_test_ok?: boolean
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reminder_1h_sent_at?: string | null
          reminder_24h_sent_at?: string | null
          room_id?: string | null
          scheduled_end?: string
          scheduled_start?: string
          service_id?: string | null
          source?: Database["public"]["Enums"]["appt_source"]
          status?: Database["public"]["Enums"]["appt_status"]
          therapist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_course_enrolment_id_fkey"
            columns: ["course_enrolment_id"]
            isOneToOne: false
            referencedRelation: "course_enrolments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          detail: Json | null
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          detail?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          detail?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contraindications: string | null
          created_at: string
          id: string
          last_visit_date: string | null
          marketing_consent: boolean
          name: string | null
          phone_number: string
          preferred_therapist_id: string | null
          skin_notes: string | null
          status: Database["public"]["Enums"]["client_status"]
          total_visits: number
        }
        Insert: {
          contraindications?: string | null
          created_at?: string
          id?: string
          last_visit_date?: string | null
          marketing_consent?: boolean
          name?: string | null
          phone_number: string
          preferred_therapist_id?: string | null
          skin_notes?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          total_visits?: number
        }
        Update: {
          contraindications?: string | null
          created_at?: string
          id?: string
          last_visit_date?: string | null
          marketing_consent?: boolean
          name?: string | null
          phone_number?: string
          preferred_therapist_id?: string | null
          skin_notes?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          total_visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "clients_preferred_therapist_id_fkey"
            columns: ["preferred_therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrolments: {
        Row: {
          amount_paid: number
          client_id: string
          course_id: string
          created_at: string
          expiry_date: string | null
          id: string
          purchase_date: string
          sessions_remaining: number | null
          sessions_total: number
          sessions_used: number
          status: Database["public"]["Enums"]["enrolment_status"]
        }
        Insert: {
          amount_paid?: number
          client_id: string
          course_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          purchase_date?: string
          sessions_total: number
          sessions_used?: number
          status?: Database["public"]["Enums"]["enrolment_status"]
        }
        Update: {
          amount_paid?: number
          client_id?: string
          course_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          purchase_date?: string
          sessions_total?: number
          sessions_used?: number
          status?: Database["public"]["Enums"]["enrolment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "course_enrolments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrolments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          course_price: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          service_id: string
          total_sessions: number
          validity_days: number
        }
        Insert: {
          course_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          service_id: string
          total_sessions: number
          validity_days?: number
        }
        Update: {
          course_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          service_id?: string
          total_sessions?: number
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "courses_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reconciliation: {
        Row: {
          business_date: string
          confirmed_at: string | null
          confirmed_by: string | null
          counted_card: number
          counted_cash: number
          counted_mobile: number
          id: string
          location_id: string
          resolution_note: string | null
          retail_total: number
          service_total: number
          system_total: number
          variance: number | null
          variance_status: Database["public"]["Enums"]["variance_status"]
        }
        Insert: {
          business_date: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          counted_card?: number
          counted_cash?: number
          counted_mobile?: number
          id?: string
          location_id: string
          resolution_note?: string | null
          retail_total?: number
          service_total?: number
          system_total?: number
          variance_status?: Database["public"]["Enums"]["variance_status"]
        }
        Update: {
          business_date?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          counted_card?: number
          counted_cash?: number
          counted_mobile?: number
          id?: string
          location_id?: string
          resolution_note?: string | null
          retail_total?: number
          service_total?: number
          system_total?: number
          variance_status?: Database["public"]["Enums"]["variance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "daily_reconciliation_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reconciliation_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity_change: number
          reason: string | null
          recorded_by: string | null
          type: Database["public"]["Enums"]["inventory_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity_change: number
          reason?: string | null
          recorded_by?: string | null
          type: Database["public"]["Enums"]["inventory_type"]
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity_change?: number
          reason?: string | null
          recorded_by?: string | null
          type?: Database["public"]["Enums"]["inventory_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          contact_number: string | null
          created_at: string
          id: string
          name: string
          operating_hours: Json | null
          status: Database["public"]["Enums"]["location_status"]
        }
        Insert: {
          address?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          name: string
          operating_hours?: Json | null
          status?: Database["public"]["Enums"]["location_status"]
        }
        Update: {
          address?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          name?: string
          operating_hours?: Json | null
          status?: Database["public"]["Enums"]["location_status"]
        }
        Relationships: []
      }
      product_sales: {
        Row: {
          appointment_id: string | null
          client_id: string | null
          created_at: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          product_id: string
          quantity: number
          sold_by: string | null
          total: number | null
          unit_price: number
        }
        Insert: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          product_id: string
          quantity: number
          sold_by?: string | null
          unit_price?: number
        }
        Update: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          product_id?: string
          quantity?: number
          sold_by?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_sales_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          cost_price: number
          created_at: string
          current_stock: number
          id: string
          is_active: boolean
          name: string
          reorder_level: number
          retail_price: number
          sku: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["product_category"]
          cost_price?: number
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean
          name: string
          reorder_level?: number
          retail_price?: number
          sku?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          cost_price?: number
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean
          name?: string
          reorder_level?: number
          retail_price?: number
          sku?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          location_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          services_trained: Database["public"]["Enums"]["service_category"][]
          short_name: string | null
          working_hours: Json | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          location_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          services_trained?: Database["public"]["Enums"]["service_category"][]
          short_name?: string | null
          working_hours?: Json | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          services_trained?: Database["public"]["Enums"]["service_category"][]
          short_name?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_lines: {
        Row: {
          created_at: string
          id: string
          reconciliation_id: string
          resolution_note: string | null
          station_id: string | null
          system_total: number
          till_total: number
          variance: number | null
          variance_status: Database["public"]["Enums"]["variance_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          reconciliation_id: string
          resolution_note?: string | null
          station_id?: string | null
          system_total?: number
          till_total?: number
          variance?: number | null
          variance_status?: Database["public"]["Enums"]["variance_status"]
        }
        Update: {
          created_at?: string
          id?: string
          reconciliation_id?: string
          resolution_note?: string | null
          station_id?: string | null
          system_total?: number
          till_total?: number
          variance?: number | null
          variance_status?: Database["public"]["Enums"]["variance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_lines_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "daily_reconciliation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_lines_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          assigned_therapist_id: string | null
          created_at: string
          id: string
          location_id: string
          name: string
          service_category: Database["public"]["Enums"]["service_category"]
          status: Database["public"]["Enums"]["room_status"]
        }
        Insert: {
          assigned_therapist_id?: string | null
          created_at?: string
          id?: string
          location_id: string
          name: string
          service_category?: Database["public"]["Enums"]["service_category"]
          status?: Database["public"]["Enums"]["room_status"]
        }
        Update: {
          assigned_therapist_id?: string | null
          created_at?: string
          id?: string
          location_id?: string
          name?: string
          service_category?: Database["public"]["Enums"]["service_category"]
          status?: Database["public"]["Enums"]["room_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rooms_assigned_therapist_id_fkey"
            columns: ["assigned_therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          duration_minutes: number
          id: string
          is_active: boolean
          is_course_based: boolean
          name: string
          requires_patch_test: boolean
        }
        Insert: {
          base_price?: number
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_course_based?: boolean
          name: string
          requires_patch_test?: boolean
        }
        Update: {
          base_price?: number
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_course_based?: boolean
          name?: string
          requires_patch_test?: boolean
        }
        Relationships: []
      }
      treatment_records: {
        Row: {
          after_photo_ref: string | null
          appointment_id: string | null
          before_photo_ref: string | null
          client_id: string
          contraindications: string | null
          created_at: string
          id: string
          observations: string | null
          patch_test_result: Database["public"]["Enums"]["patch_result"]
          products_used: string | null
          settings_used: string | null
          therapist_id: string | null
        }
        Insert: {
          after_photo_ref?: string | null
          appointment_id?: string | null
          before_photo_ref?: string | null
          client_id: string
          contraindications?: string | null
          created_at?: string
          id?: string
          observations?: string | null
          patch_test_result?: Database["public"]["Enums"]["patch_result"]
          products_used?: string | null
          settings_used?: string | null
          therapist_id?: string | null
        }
        Update: {
          after_photo_ref?: string | null
          appointment_id?: string | null
          before_photo_ref?: string | null
          client_id?: string
          contraindications?: string | null
          created_at?: string
          id?: string
          observations?: string | null
          patch_test_result?: Database["public"]["Enums"]["patch_result"]
          products_used?: string | null
          settings_used?: string | null
          therapist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_records_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          client_id: string | null
          content: string | null
          conversation_state: Database["public"]["Enums"]["convo_state"] | null
          created_at: string
          direction: Database["public"]["Enums"]["msg_direction"]
          handled_by: Database["public"]["Enums"]["handled_by"]
          id: string
          message_type: Database["public"]["Enums"]["msg_type"]
          related_appointment_id: string | null
        }
        Insert: {
          client_id?: string | null
          content?: string | null
          conversation_state?: Database["public"]["Enums"]["convo_state"] | null
          created_at?: string
          direction: Database["public"]["Enums"]["msg_direction"]
          handled_by?: Database["public"]["Enums"]["handled_by"]
          id?: string
          message_type?: Database["public"]["Enums"]["msg_type"]
          related_appointment_id?: string | null
        }
        Update: {
          client_id?: string | null
          content?: string | null
          conversation_state?: Database["public"]["Enums"]["convo_state"] | null
          created_at?: string
          direction?: Database["public"]["Enums"]["msg_direction"]
          handled_by?: Database["public"]["Enums"]["handled_by"]
          id?: string
          message_type?: Database["public"]["Enums"]["msg_type"]
          related_appointment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_related_appointment_id_fkey"
            columns: ["related_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_location_id: { Args: never; Returns: string }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_manager: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      appt_source: "walk_in" | "phone" | "whatsapp"
      appt_status:
        | "booked"
        | "checked_in"
        | "in_progress"
        | "completed"
        | "no_show"
        | "cancelled"
      client_status: "active" | "blocked"
      convo_state:
        | "booking_flow"
        | "reminder"
        | "self_service"
        | "human_handoff"
        | "completed"
      enrolment_status: "active" | "completed" | "expired" | "refunded"
      handled_by: "bot" | "staff"
      inventory_type: "restock" | "sale" | "adjustment" | "write_off"
      location_status: "active" | "inactive"
      msg_direction: "inbound" | "outbound"
      msg_type: "text" | "interactive" | "template" | "media"
      patch_result: "not_required" | "pending" | "passed" | "reaction"
      payment_method: "cash" | "card" | "mobile_money" | "course" | "split"
      product_category: "serum" | "lotion" | "roll_on" | "gel" | "other"
      room_status: "active" | "inactive" | "maintenance"
      service_category:
        | "hair"
        | "nails"
        | "barber"
        | "beauty"
        | "general"
        | "other"
      user_role: "owner" | "admin" | "technician" | "client"
      variance_status: "matched" | "flagged" | "resolved"
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
      appt_source: ["walk_in", "phone", "whatsapp"],
      appt_status: [
        "booked",
        "checked_in",
        "in_progress",
        "completed",
        "no_show",
        "cancelled",
      ],
      client_status: ["active", "blocked"],
      convo_state: [
        "booking_flow",
        "reminder",
        "self_service",
        "human_handoff",
        "completed",
      ],
      enrolment_status: ["active", "completed", "expired", "refunded"],
      handled_by: ["bot", "staff"],
      inventory_type: ["restock", "sale", "adjustment", "write_off"],
      location_status: ["active", "inactive"],
      msg_direction: ["inbound", "outbound"],
      msg_type: ["text", "interactive", "template", "media"],
      patch_result: ["not_required", "pending", "passed", "reaction"],
      payment_method: ["cash", "card", "mobile_money", "course", "split"],
      product_category: ["serum", "lotion", "roll_on", "gel", "other"],
      room_status: ["active", "inactive", "maintenance"],
      service_category: [
        "hair",
        "nails",
        "barber",
        "beauty",
        "general",
        "other",
      ],
      user_role: ["owner", "admin", "technician", "client"],
      variance_status: ["matched", "flagged", "resolved"],
    },
  },
} as const
