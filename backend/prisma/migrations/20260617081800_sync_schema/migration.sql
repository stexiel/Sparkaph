-- Sync schema with database
-- Add missing fields if they don't exist

-- Add webhookUrl to App if not exists
DO $$ BEGIN
  ALTER TABLE "App" ADD COLUMN IF NOT EXISTS "webhookUrl" TEXT;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- Create AppType enum if not exists
DO $$ BEGIN
  CREATE TYPE "AppType" AS ENUM ('HOSTED', 'EXTERNAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update App.type column to use AppType enum
DO $$ BEGIN
  -- Drop default first
  ALTER TABLE "App" ALTER COLUMN "type" DROP DEFAULT;
  
  -- Change type
  ALTER TABLE "App" ALTER COLUMN "type" TYPE "AppType" USING (type::"AppType");
  
  -- Set new default
  ALTER TABLE "App" ALTER COLUMN "type" SET DEFAULT 'HOSTED'::"AppType";
EXCEPTION
  WHEN OTHERS THEN
    -- If error, just set default (column might already be AppType)
    ALTER TABLE "App" ALTER COLUMN "type" SET DEFAULT 'HOSTED'::"AppType";
END $$;
