// Restore data from test_export.sql into current schema safely.
// 1) Transforms the export to create and fill legacy_* tables (no drops).
// 2) Copies rows from legacy_* into current tables, converting types as needed.

import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

async function main() {
  const root = process.cwd();
  const exportPath = path.join(root, 'test_export.sql');
  if (!fs.existsSync(exportPath)) {
    throw new Error('test_export.sql not found at repo root');
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL not set in environment');
  }

  const original = fs.readFileSync(exportPath, 'utf8');

  // List of base tables present in the export
  const tables = [
    'users',
    'tours',
    'availabilities',
    'bookings',
    'testimonials',
    'closed_days',
    'admin_settings',
  ];

  // Remove any dangerous drops
  let transformed = original
    .split('\n')
    .filter((line) => !/^\s*DROP TABLE IF EXISTS\b/i.test(line))
    .join('\n');

  // Rewrite DDL and DML to use legacy_* tables, and fix FKs
  for (const t of tables) {
    const reCreate = new RegExp(`\\bCREATE\\s+TABLE\\s+${t}\\b`, 'gi');
    transformed = transformed.replace(reCreate, (m) => m.replace(t, `legacy_${t}`));

    const reInsert = new RegExp(`\\bINSERT\\s+INTO\\s+${t}\\b`, 'gi');
    transformed = transformed.replace(reInsert, (m) => m.replace(t, `legacy_${t}`));

    const reRef = new RegExp(`\\bREFERENCES\\s+${t}\\b`, 'gi');
    transformed = transformed.replace(reRef, (m) => m.replace(t, `legacy_${t}`));
  }

  // Execute the transformed SQL in one go. It contains BEGIN/COMMIT already.
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    console.log('Creating legacy_* tables and importing data from export...');
    await client.query(transformed);
    console.log('Legacy import completed. Copying into current schema...');

    // Copy order: tours -> availabilities -> bookings -> testimonials
    // Note: We intentionally do NOT overwrite closed_days or admin_settings.

    // Tours: map TEXT fields to JSON objects for multilingual columns
    await client.query(`
      INSERT INTO public.tours (
        id, name, short_description, description, image_url,
        duration, max_group_size, difficulty, price, badge,
        badge_color, is_active, price_type
      )
      SELECT
        id,
        json_build_object('en', name, 'pt', '', 'ru', ''),
        json_build_object('en', short_description, 'pt', '', 'ru', ''),
        json_build_object('en', description, 'pt', '', 'ru', ''),
        image_url,
        json_build_object('en', duration, 'pt', '', 'ru', ''),
        max_group_size,
        json_build_object('en', difficulty, 'pt', '', 'ru', ''),
        price,
        json_build_object('en', COALESCE(badge, ''), 'pt', '', 'ru', ''),
        badge_color,
        is_active,
        'per_person'
      FROM public.legacy_tours
      ORDER BY id;
    `);

    // Availabilities: straight copy
    await client.query(`
      INSERT INTO public.availabilities (
        id, tour_id, date, time, max_spots, spots_left
      )
      SELECT id, tour_id, date, time, max_spots, spots_left
      FROM public.legacy_availabilities
      ORDER BY id;
    `);

    // Bookings: align column names and defaults
    await client.query(`
      INSERT INTO public.bookings (
        id, tour_id, availability_id,
        customer_first_name, customer_last_name, customer_email, customer_phone,
        number_of_participants, special_requests, booking_reference, total_amount,
        payment_status, stripe_payment_intent_id, created_at, additional_info,
        meeting_point, reminders_sent
      )
      SELECT
        id, tour_id, availability_id,
        customer_first_name, customer_last_name, customer_email, customer_phone,
        number_of_participants, special_requests, booking_reference, total_amount,
        payment_status, stripe_payment_intent_id, created_at, additional_info,
        meeting_point, reminders_sent
      FROM public.legacy_bookings
      ORDER BY id;
    `);

    // Testimonials: straight copy
    await client.query(`
      INSERT INTO public.testimonials (
        id, customer_name, customer_country, rating, text, is_approved, tour_id
      )
      SELECT id, customer_name, customer_country, rating, text, is_approved, tour_id
      FROM public.legacy_testimonials
      ORDER BY id;
    `);

    // Reset sequences to max(id)
    const seqFix = `
      SELECT setval(pg_get_serial_sequence('public.tours', 'id'), COALESCE((SELECT MAX(id) FROM public.tours), 1));
      SELECT setval(pg_get_serial_sequence('public.availabilities', 'id'), COALESCE((SELECT MAX(id) FROM public.availabilities), 1));
      SELECT setval(pg_get_serial_sequence('public.bookings', 'id'), COALESCE((SELECT MAX(id) FROM public.bookings), 1));
      SELECT setval(pg_get_serial_sequence('public.testimonials', 'id'), COALESCE((SELECT MAX(id) FROM public.testimonials), 1));
    `;
    await client.query(seqFix);

    console.log('Copy complete. Verifying row counts...');
    const counts = await client.query(`
      SELECT 'tours' AS t, COUNT(*) FROM public.tours
      UNION ALL SELECT 'availabilities', COUNT(*) FROM public.availabilities
      UNION ALL SELECT 'bookings', COUNT(*) FROM public.bookings
      UNION ALL SELECT 'testimonials', COUNT(*) FROM public.testimonials;
    `);
    for (const r of counts.rows) {
      console.log(`${r.t}: ${r.count}`);
    }

    console.log('\nSuccess. Legacy tables kept (legacy_*) for audit.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

