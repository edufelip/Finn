#!/bin/bash
# Quick script to push the env migration to prod Supabase

echo "🔄 Pushing migration to PROD Supabase..."
echo "📍 Project: lohkjtquktypwlsgavin"
echo ""
echo "Copy and paste this SQL into your prod Supabase SQL Editor:"
echo "https://supabase.com/dashboard/project/lohkjtquktypwlsgavin/sql/new"
echo ""
echo "────────────────────────────────────────────────────────────"
cat /Users/eduardosantos/Documents/Hybrid/finn/mobile/supabase/migrations/20260113083008_add_env_to_push_tokens.sql
echo "────────────────────────────────────────────────────────────"
echo ""
echo "After running the SQL, your prod database will be ready! ✅"
