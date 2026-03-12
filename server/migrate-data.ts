import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * This script migrates data from the in-memory storage to the database
 * It will populate the database with sample tours, availabilities, and testimonials
 */
async function migrateData() {
  await db.execute(sql`
    DO $$
    DECLARE
      duration_data_type text;
    BEGIN
      SELECT data_type
      INTO duration_data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tours'
        AND column_name = 'duration'
      LIMIT 1;

      IF duration_data_type IN ('json', 'jsonb', 'text', 'character varying') THEN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'tours'
            AND column_name = 'duration_hours'
        ) THEN
          ALTER TABLE tours DROP COLUMN duration_hours;
        END IF;

        IF duration_data_type = 'json' OR duration_data_type = 'jsonb' THEN
          CREATE OR REPLACE FUNCTION public._parse_duration_hours(raw_value text)
          RETURNS integer AS $fn$
          DECLARE
            matched text[];
            parsed numeric;
          BEGIN
            IF raw_value IS NULL THEN
              RETURN 1;
            END IF;

            matched := regexp_match(raw_value, '([0-9]+(?:[.,][0-9]+)?)');
            IF matched IS NULL OR array_length(matched, 1) = 0 THEN
              RETURN 1;
            END IF;

            parsed := replace(matched[1], ',', '.')::numeric;
            IF parsed < 1 THEN
              RETURN 1;
            END IF;

            RETURN GREATEST(1, round(parsed)::integer);
          EXCEPTION WHEN OTHERS THEN
            RETURN 1;
          END;
          $fn$ LANGUAGE plpgsql IMMUTABLE;

          ALTER TABLE tours ADD COLUMN duration_hours integer;

          UPDATE tours
          SET duration_hours = COALESCE(
            CASE
              WHEN jsonb_typeof(duration::jsonb) = 'number'
                THEN GREATEST(1, round((duration::text)::numeric)::integer)
              WHEN jsonb_typeof(duration::jsonb) = 'string'
                THEN public._parse_duration_hours(duration #>> '{}')
              WHEN jsonb_typeof(duration::jsonb) = 'object'
                THEN COALESCE(
                  public._parse_duration_hours(duration->>'en'),
                  public._parse_duration_hours(duration->>'pt'),
                  public._parse_duration_hours(duration->>'ru'),
                  1
                )
              ELSE 1
            END,
            1
          );

          DROP FUNCTION IF EXISTS public._parse_duration_hours(text);
        ELSE
          ALTER TABLE tours ADD COLUMN duration_hours integer;

          UPDATE tours
          SET duration_hours = COALESCE((
            SELECT GREATEST(
              1,
              round(replace(m[1], ',', '.')::numeric)::integer
            )
            FROM regexp_match(duration, '([0-9]+(?:[.,][0-9]+)?)') AS m
          ), 1);
        END IF;

        UPDATE tours
        SET duration_hours = 1
        WHERE duration_hours IS NULL OR duration_hours < 1;

        ALTER TABLE tours ALTER COLUMN duration_hours SET NOT NULL;
        ALTER TABLE tours ALTER COLUMN duration_hours SET DEFAULT 1;

        ALTER TABLE tours DROP COLUMN duration;
        ALTER TABLE tours RENAME COLUMN duration_hours TO duration;
      END IF;
    END $$;
  `);
}
export default migrateData;
