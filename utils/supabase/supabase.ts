import { createClient } from "@supabase/supabase-js"

// Usar los valores directamente para asegurar que funcione en producción
const supabaseUrl = "https://zabvosjuoeieiljltiad.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphYnZvc2p1b2VpZWlsamx0aWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1ODAwNzYsImV4cCI6MjA2MzE1NjA3Nn0.8jrBn_xopRaGVDpmiWZXaPaJyp7DABe1vIX6GssOvFo"

export const supabase = createClient(supabaseUrl, supabaseKey)
