#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Run migration on dev or prod Supabase
 * Usage: node scripts/run-migration.js [dev|prod]
 */

const fs = require('fs');
const path = require('path');

// Parse environment argument
const env = process.argv[2] || 'dev';
const envFile = env === 'dev' ? '.env.development' : '.env.production';

console.log(`🔄 Running migration on ${env.toUpperCase()} environment...\n`);

// Load environment variables
const envPath = path.join(__dirname, '..', envFile);
if (!fs.existsSync(envPath)) {
  console.error(`❌ Environment file not found: ${envFile}`);
  process.exit(1);
}

// Parse .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(`❌ Missing Supabase credentials in ${envFile}`);
  process.exit(1);
}

console.log(`📍 Supabase URL: ${supabaseUrl}`);

// Read migration SQL
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'add_env_to_push_tokens.sql');
if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Execute migration using Supabase REST API
const runMigration = async () => {
  try {
    // Remove comments and split into individual statements
    const statements = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`\n📝 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ query: stmt })
      });

      if (!response.ok) {
        // Try alternative: use pg_stat_statements or direct SQL execution
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nVerify by running this SQL in Supabase dashboard:');
    console.log('  SELECT column_name FROM information_schema.columns WHERE table_name = \'push_tokens\' AND column_name = \'env\';\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 Alternative: Run migration via Supabase Dashboard:');
    console.log('  1. Go to your Supabase project dashboard');
    console.log('  2. Click SQL Editor');
    console.log('  3. Paste the contents of: supabase/migrations/add_env_to_push_tokens.sql');
    console.log('  4. Click Run\n');
    process.exit(1);
  }
};

runMigration();
