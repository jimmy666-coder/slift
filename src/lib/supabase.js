import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mjxmnnbezpfopjlfebpm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qeG1ubmJlenBmb3BqbGZlYnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTk0MzYsImV4cCI6MjA5MDI5NTQzNn0.4N_tlBtwjfo0mZyJYBtdGUtv9tVjIVSaI8jQKvRANl8'

export const supabase = createClient(supabaseUrl, supabaseKey)
