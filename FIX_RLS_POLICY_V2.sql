-- Fix RLS Policy for User Signup (Version 2)
-- Run this in Supabase SQL Editor

-- First, let's check the current policies
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- Drop ALL existing policies on users table to start fresh
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile during signup" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new comprehensive policies

-- 1. INSERT policy - Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. SELECT policy - Allow users to view their own profile
CREATE POLICY "Enable read access for own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3. UPDATE policy - Allow users to update their own profile
CREATE POLICY "Enable update for own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. DELETE policy - Allow users to delete their own profile
CREATE POLICY "Enable delete for own profile"
  ON users FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Check the policies (you can run this separately to verify)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'users';
