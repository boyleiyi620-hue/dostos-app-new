import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sb-publishable-4-4tjlhqrfg5vufryyd4nw.supabase.co'
const supabaseKey = 'sb_publishable_4_4TJlhqRfG5vUFrYDd4nw_txtgCltP'

const supabase = createClient(supabaseUrl, supabaseKey)

// Test connection
const { data, error } = await supabase.from('users').select('count')
if (error) {
  console.log('Connection test - Table does not exist yet (expected)')
} else {
  console.log('Connection successful!')
}
