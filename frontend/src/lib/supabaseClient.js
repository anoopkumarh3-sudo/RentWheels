import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hhknvyvetypclkqsdfkr.supabase.co'
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_zOCt_lxXxUfDNd8Iu4qe7w_BNfh50CJ'

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
