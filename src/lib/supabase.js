import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://amgalubxzsgomrwtuydc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZ2FsdWJ4enNnb21yd3R1eWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzE1NzYsImV4cCI6MjA5NzU0NzU3Nn0.RZE6yjIfyLoH3j845rv6fgs6212_E4ZcLNKuH-Wkk7k'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
