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
      customers: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_photos: {
        Row: {
          created_at: string
          id: string
          observacao: string | null
          order_id: string | null
          path: string
          tenant_id: string
          tipo: Database["public"]["Enums"]["photo_kind"]
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          observacao?: string | null
          order_id?: string | null
          path: string
          tenant_id: string
          tipo?: Database["public"]["Enums"]["photo_kind"]
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          observacao?: string | null
          order_id?: string | null
          path?: string
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["photo_kind"]
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_photos_order_same_tenant_fkey"
            columns: ["tenant_id", "order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "order_photos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_photos_vehicle_same_tenant_fkey"
            columns: ["tenant_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          id: string
          metodo: Database["public"]["Enums"]["payment_method"]
          order_id: string
          pago_em: string
          tenant_id: string
          user_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          id?: string
          metodo: Database["public"]["Enums"]["payment_method"]
          order_id: string
          pago_em?: string
          tenant_id: string
          user_id?: string | null
          valor: number
        }
        Update: {
          created_at?: string
          id?: string
          metodo?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          pago_em?: string
          tenant_id?: string
          user_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_same_tenant_fkey"
            columns: ["tenant_id", "order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_order_items: {
        Row: {
          created_at: string
          id: string
          nome: string
          order_id: string
          preco: number
          quantidade: number
          service_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          order_id: string
          preco: number
          quantidade?: number
          service_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          order_id?: string
          preco?: number
          quantidade?: number
          service_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_items_order_same_tenant_fkey"
            columns: ["tenant_id", "order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "service_order_items_service_same_tenant_fkey"
            columns: ["tenant_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "service_order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          acrescimo: number
          created_at: string
          customer_id: string | null
          desconto: number
          employee_id: string | null
          finished_at: string | null
          id: string
          numero: number
          observacoes: string | null
          started_at: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tenant_id: string
          total: number
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          acrescimo?: number
          created_at?: string
          customer_id?: string | null
          desconto?: number
          employee_id?: string | null
          finished_at?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tenant_id: string
          total?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          acrescimo?: number
          created_at?: string
          customer_id?: string | null
          desconto?: number
          employee_id?: string | null
          finished_at?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tenant_id?: string
          total?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_customer_same_tenant_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "service_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_vehicle_same_tenant_fkey"
            columns: ["tenant_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      services: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          duracao_min: number | null
          id: string
          nome: string
          preco: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          duracao_min?: number | null
          id?: string
          nome: string
          preco?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          duracao_min?: number | null
          id?: string
          nome?: string
          preco?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          cor_tema: string | null
          created_at: string
          endereco: string | null
          horario: string | null
          id: string
          logo_url: string | null
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cor_tema?: string | null
          created_at?: string
          endereco?: string | null
          horario?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cor_tema?: string | null
          created_at?: string
          endereco?: string | null
          horario?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          ano: number | null
          cor: string | null
          created_at: string
          customer_id: string | null
          id: string
          marca: string | null
          modelo: string | null
          observacoes: string | null
          placa: string
          placa_normalizada: string
          tenant_id: string
          updated_at: string
          versao: string | null
        }
        Insert: {
          ano?: number | null
          cor?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          observacoes?: string | null
          placa: string
          placa_normalizada: string
          tenant_id: string
          updated_at?: string
          versao?: string | null
        }
        Update: {
          ano?: number | null
          cor?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          observacoes?: string | null
          placa?: string
          placa_normalizada?: string
          tenant_id?: string
          updated_at?: string
          versao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_same_tenant_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      normalize_plate: { Args: { p: string }; Returns: string }
    }
    Enums: {
      app_role: "OWNER" | "MANAGER" | "EMPLOYEE"
      order_status:
        | "AGUARDANDO"
        | "EM_LAVAGEM"
        | "EM_FINALIZACAO"
        | "FINALIZADO"
        | "AGUARDANDO_PAGAMENTO"
        | "PAGO"
        | "ENTREGUE"
        | "CANCELADO"
      payment_method: "DINHEIRO" | "PIX" | "DEBITO" | "CREDITO" | "OUTRO"
      photo_kind: "PLACA" | "FRENTE" | "TRASEIRA" | "LATERAL" | "DANO" | "OUTRO"
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
      app_role: ["OWNER", "MANAGER", "EMPLOYEE"],
      order_status: [
        "AGUARDANDO",
        "EM_LAVAGEM",
        "EM_FINALIZACAO",
        "FINALIZADO",
        "AGUARDANDO_PAGAMENTO",
        "PAGO",
        "ENTREGUE",
        "CANCELADO",
      ],
      payment_method: ["DINHEIRO", "PIX", "DEBITO", "CREDITO", "OUTRO"],
      photo_kind: ["PLACA", "FRENTE", "TRASEIRA", "LATERAL", "DANO", "OUTRO"],
    },
  },
} as const
