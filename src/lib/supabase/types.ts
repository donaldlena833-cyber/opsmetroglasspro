export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type JobStatus = 'estimate' | 'deposit_received' | 'measured' | 'ordered' | 'installed' | 'closed'

// V2: Expanded expense categories
export type ExpenseCategory = 
  // Job costs
  | 'glass'
  | 'hardware'
  | 'consumables'
  | 'subcontractor'
  // Business expenses
  | 'gas_fuel'
  | 'vehicle'
  | 'tools_equipment'
  | 'office_admin'
  | 'food_meals'
  | 'other'
  // Legacy categories (for backwards compatibility)
  | 'crl'
  | 'glass_fabrication'
  | 'mr_glass'
  | 'home_depot'
  | 'uhaul'
  | 'parking'
  | 'tolls'
  | 'tools'
  | 'meals'
  | 'referral_payout'

export type PaymentMethod = 'stripe' | 'check' | 'zelle' | 'venmo' | 'cashapp' | 'cash' | 'other'
export type PaymentType = 'deposit' | 'final' | 'other'
export type InvoiceStatus = 'sent' | 'deposit_paid' | 'paid'
export type ReminderPriority = 'high' | 'moderate' | 'low'

// V2: Job specification enums
export type GlassType = 'clear' | 'low_iron' | 'frosted' | 'rain' | 'tinted_gray' | 'tinted_bronze' | 'other'
export type GlassThickness = '1/4"' | '5/16"' | '3/8"' | '1/2"' | '5/8"' | '3/4"'
export type HardwareFinish = 'chrome' | 'brushed_nickel' | 'matte_black' | 'oil_rubbed_bronze' | 'polished_brass' | 'satin_brass' | 'gold' | 'other'

// V2: Theme
export type Theme = 'light' | 'dark'

export interface LineItem {
  description: string
  qty: number
  unit_price: number
  line_total: number
}

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          billing_address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          billing_address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          billing_address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          client_id: string | null
          job_name: string
          address: string
          area: string | null
          status: JobStatus
          install_date: string | null
          install_end_date: string | null
          notes: string | null
          // V2: Job specs
          glass_type: GlassType | null
          glass_thickness: GlassThickness | null
          hardware_finish: HardwareFinish | null
          configuration: string | null
          dimensions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          job_name: string
          address: string
          area?: string | null
          status?: JobStatus
          install_date?: string | null
          install_end_date?: string | null
          notes?: string | null
          glass_type?: GlassType | null
          glass_thickness?: GlassThickness | null
          hardware_finish?: HardwareFinish | null
          configuration?: string | null
          dimensions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          job_name?: string
          address?: string
          area?: string | null
          status?: JobStatus
          install_date?: string | null
          install_end_date?: string | null
          notes?: string | null
          glass_type?: GlassType | null
          glass_thickness?: GlassThickness | null
          hardware_finish?: HardwareFinish | null
          configuration?: string | null
          dimensions?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          job_id: string | null
          date: string
          amount: number
          vendor: string
          category: ExpenseCategory
          payment_method: PaymentMethod
          note: string | null
          receipt_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          date?: string
          amount: number
          vendor: string
          category?: ExpenseCategory
          payment_method?: PaymentMethod
          note?: string | null
          receipt_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          date?: string
          amount?: number
          vendor?: string
          category?: ExpenseCategory
          payment_method?: PaymentMethod
          note?: string | null
          receipt_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          job_id: string
          invoice_number: number
          invoice_date: string
          due_date: string
          customer_name: string
          customer_address: string | null
          notes: string | null
          line_items_json: LineItem[]
          subtotal: number
          discount_applied: boolean
          discount_percent: number
          discount_amount: number
          tax_applied: boolean
          tax_rate: number
          tax: number
          total: number
          status: InvoiceStatus
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          invoice_number: number
          invoice_date?: string
          due_date?: string
          customer_name: string
          customer_address?: string | null
          notes?: string | null
          line_items_json?: LineItem[]
          subtotal?: number
          discount_applied?: boolean
          discount_percent?: number
          discount_amount?: number
          tax_applied?: boolean
          tax_rate?: number
          tax?: number
          total?: number
          status?: InvoiceStatus
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          invoice_number?: number
          invoice_date?: string
          due_date?: string
          customer_name?: string
          customer_address?: string | null
          notes?: string | null
          line_items_json?: LineItem[]
          subtotal?: number
          discount_applied?: boolean
          discount_percent?: number
          discount_amount?: number
          tax_applied?: boolean
          tax_rate?: number
          tax?: number
          total?: number
          status?: InvoiceStatus
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          job_id: string
          invoice_id: string | null
          date: string
          amount: number
          // V2: Stripe fee tracking
          gross_amount: number | null
          stripe_fee: number
          payment_type: PaymentType
          method: PaymentMethod
          note: string | null
          confirmation_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          invoice_id?: string | null
          date?: string
          amount: number
          gross_amount?: number | null
          stripe_fee?: number
          payment_type?: PaymentType
          method?: PaymentMethod
          note?: string | null
          confirmation_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          invoice_id?: string | null
          date?: string
          amount?: number
          gross_amount?: number | null
          stripe_fee?: number
          payment_type?: PaymentType
          method?: PaymentMethod
          note?: string | null
          confirmation_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          job_id: string | null
          title: string
          reminder_date: string
          priority: ReminderPriority
          done: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          title: string
          reminder_date?: string
          priority?: ReminderPriority
          done?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          title?: string
          reminder_date?: string
          priority?: ReminderPriority
          done?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      invoice_sequence: {
        Row: {
          id: number
          last_number: number
        }
        Insert: {
          id?: number
          last_number?: number
        }
        Update: {
          id?: number
          last_number?: number
        }
      }
      // V2: User preferences
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: Theme
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: Theme
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: Theme
          created_at?: string
          updated_at?: string
        }
      }
      // V2: Monthly reports
      monthly_reports: {
        Row: {
          id: string
          report_month: string
          total_revenue: number
          total_expenses: number
          net_profit: number
          jobs_completed: number
          jobs_created: number
          expenses_by_category: Json
          payments_by_method: Json
          top_clients: Json
          generated_at: string
          pdf_url: string | null
        }
        Insert: {
          id?: string
          report_month: string
          total_revenue?: number
          total_expenses?: number
          net_profit?: number
          jobs_completed?: number
          jobs_created?: number
          expenses_by_category?: Json
          payments_by_method?: Json
          top_clients?: Json
          generated_at?: string
          pdf_url?: string | null
        }
        Update: {
          id?: string
          report_month?: string
          total_revenue?: number
          total_expenses?: number
          net_profit?: number
          jobs_completed?: number
          jobs_created?: number
          expenses_by_category?: Json
          payments_by_method?: Json
          top_clients?: Json
          generated_at?: string
          pdf_url?: string | null
        }
      }
    }
    Functions: {
      get_next_invoice_number: {
        Args: Record<string, never>
        Returns: number
      }
      generate_monthly_report: {
        Args: { report_date: string }
        Returns: string
      }
    }
    Enums: {
      job_status: JobStatus
      expense_category: ExpenseCategory
      payment_method: PaymentMethod
      payment_type: PaymentType
      invoice_status: InvoiceStatus
      reminder_priority: ReminderPriority
      glass_type: GlassType
      glass_thickness: GlassThickness
      hardware_finish: HardwareFinish
    }
  }
}

// Helper types
export type Client = Database['public']['Tables']['clients']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Reminder = Database['public']['Tables']['reminders']['Row']
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
export type MonthlyReport = Database['public']['Tables']['monthly_reports']['Row']

export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type JobInsert = Database['public']['Tables']['jobs']['Insert']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type ReminderInsert = Database['public']['Tables']['reminders']['Insert']

// Extended types with relations
export type JobWithClient = Job & {
  clients: Client | null
}

export type JobWithRelations = Job & {
  clients: Client | null
  expenses: Expense[]
  payments: Payment[]
  invoices: Invoice[]
}

// V2: Job with total invoice value
export type JobWithValue = Job & {
  clients: Client | null
  total_invoice_value: number
  invoice_count: number
}

export type InvoiceWithJob = Invoice & {
  jobs: (Job & {
    clients: Client | null
  }) | null
}

export type ExpenseWithJob = Expense & {
  jobs: Job | null
}

export type PaymentWithJob = Payment & {
  jobs: Job
  invoices: Invoice | null
}

export type ReminderWithJob = Reminder & {
  jobs: Job | null
}

// V2: Client stats for dashboard
export type ClientStats = {
  client_id: string
  client_name: string
  total_jobs: number
  total_invoiced: number
  total_paid: number
  outstanding_balance: number
}
