const fs = require('fs');
require('dotenv').config();
const url = process.env.SUPABASE_URL || '';
const anon = process.env.SUPABASE_ANON_KEY || '';
const content = `window.SUPABASE_URL = '${url}';\nwindow.SUPABASE_ANON_KEY = '${anon}';`;
fs.writeFileSync('supabase-env.js', content);
