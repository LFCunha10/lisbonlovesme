-- Lisbonlovesme Database Export
-- Date: 2025-05-25T18:01:42.807Z

-- This SQL file contains all schema and data for the Lisbonlovesme tour booking application.
-- It can be imported to a fresh PostgreSQL database to recreate the entire application database.

BEGIN;

-- ===================================
-- SCHEMA CREATION STATEMENTS
-- ===================================

-- Users table schema
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Tours table schema
DROP TABLE IF EXISTS tours CASCADE;
CREATE TABLE tours (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_description TEXT DEFAULT '',
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  duration TEXT NOT NULL,
  max_group_size INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  price INTEGER NOT NULL,
  badge TEXT,
  badge_color TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Availabilities table schema
DROP TABLE IF EXISTS availabilities CASCADE;
CREATE TABLE availabilities (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  max_spots INTEGER NOT NULL,
  spots_left INTEGER NOT NULL
);

-- Bookings table schema
DROP TABLE IF EXISTS bookings CASCADE;
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  availability_id INTEGER NOT NULL REFERENCES availabilities(id) ON DELETE CASCADE,
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  number_of_participants INTEGER NOT NULL,
  special_requests TEXT,
  booking_reference TEXT NOT NULL UNIQUE,
  total_amount INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  additional_info JSONB,
  meeting_point TEXT,
  reminders_sent BOOLEAN DEFAULT FALSE
);

-- Testimonials table schema
DROP TABLE IF EXISTS testimonials CASCADE;
CREATE TABLE testimonials (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_country TEXT NOT NULL,
  rating INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE
);

-- Closed Days table schema
DROP TABLE IF EXISTS closed_days CASCADE;
CREATE TABLE closed_days (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin Settings table schema
DROP TABLE IF EXISTS admin_settings CASCADE;
CREATE TABLE admin_settings (
  id SERIAL PRIMARY KEY,
  auto_close_day BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- ===================================
-- DATA EXPORT FOR ALL TABLES
-- ===================================

-- Table: tours
INSERT INTO tours (id, name, short_description, description, image_url, duration, max_group_size, difficulty, price, badge, badge_color, is_active) VALUES (2, 'Alfama & Fado Experience', '', 'Wander through the charming streets of Alfama, Lisbon''s oldest district, and enjoy an authentic Fado music performance with dinner.', 'https://pixabay.com/get/g1a4760d97fc50e236c117537b1dbfe42cc1025f194035d2b98ce7c3096f322968be260e68fc90ab5c92388f5211d8ee865a229904078fca59379aedb1f308446_1280.jpg', '4 hours', 10, 'Easy', 6500, 'Evening Tour', 'secondary', TRUE);
INSERT INTO tours (id, name, short_description, description, image_url, duration, max_group_size, difficulty, price, badge, badge_color, is_active) VALUES (3, 'Panoramic Lisbon Tour', '', 'Experience the best views of Lisbon from various miradouros (viewpoints) across the city''s seven hills, with transportation included.', 'https://images.unsplash.com/photo-1569959220744-ff553533f492', '6 hours', 8, 'Moderate', 7500, 'Full Day', 'accent', TRUE);
INSERT INTO tours (id, name, short_description, description, image_url, duration, max_group_size, difficulty, price, badge, badge_color, is_active) VALUES (1, 'Historic Belém Tour', 'this is a test', 'Explore the historic Belém district including the iconic Tower, Monument to the Discoveries, and the famous Pastéis de Belém bakery.

![Image](/uploads/fo6WIZB0i2.png)

kdjshgfkjhsdgfjdsgfjgsdkjfgkdsgfkdsgkf
dskjhfgjksdghfkjhdsgfkhsdhjfgksdhfgj

1. sdfkjhlsdkfjhskdjf
- sdfsdfsdfsdfsdfasdfsf', 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b', '3 hours', 4, 'medium', 4500, 'Most Popular', 'orange', TRUE);
INSERT INTO tours (id, name, short_description, description, image_url, duration, max_group_size, difficulty, price, badge, badge_color, is_active) VALUES (4, 'Tour test', 'dksjhfksdflkhdsjfhlsdhflkdjsfsdf', 'dlfhsdjhflkdjshlfkjhds
dslkfhkdsjhflkjdshlfk

![Image](/uploads/EOnpwxAkaq.jpg)

lsdjhfkdsjhflkhgk
ljfhgkjdhfgkhdlfgk


![Image](/uploads/BJOshMFsJV.jpg)
', '/uploads/Sgbec8khFO.jpeg', '5 hours', 4, 'hard', 150000, 'Best Seller', 'pink', TRUE);

-- Table: availabilities
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (2, 1, '2025-05-24', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (4, 1, '2025-05-25', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (6, 1, '2025-05-26', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (8, 1, '2025-05-27', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (9, 1, '2025-05-28', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (10, 1, '2025-05-28', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (11, 1, '2025-05-29', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (12, 1, '2025-05-29', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (14, 1, '2025-05-31', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (15, 1, '2025-06-01', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (16, 1, '2025-06-01', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (17, 1, '2025-06-02', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (18, 1, '2025-06-02', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (19, 1, '2025-06-04', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (20, 1, '2025-06-04', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (21, 1, '2025-06-05', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (22, 1, '2025-06-05', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (23, 1, '2025-06-07', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (24, 1, '2025-06-07', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (25, 1, '2025-06-08', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (26, 1, '2025-06-08', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (27, 1, '2025-06-09', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (28, 1, '2025-06-09', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (29, 1, '2025-06-10', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (30, 1, '2025-06-10', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (31, 1, '2025-06-11', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (32, 1, '2025-06-11', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (33, 1, '2025-06-12', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (34, 1, '2025-06-12', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (35, 1, '2025-06-15', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (36, 1, '2025-06-15', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (37, 1, '2025-06-16', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (38, 1, '2025-06-16', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (39, 1, '2025-06-17', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (40, 1, '2025-06-17', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (41, 1, '2025-06-18', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (42, 1, '2025-06-18', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (43, 1, '2025-06-19', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (44, 1, '2025-06-19', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (45, 1, '2025-06-21', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (46, 1, '2025-06-21', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (47, 2, '2025-05-24', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (48, 2, '2025-05-24', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (49, 2, '2025-05-25', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (50, 2, '2025-05-25', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (51, 2, '2025-05-26', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (52, 2, '2025-05-26', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (54, 2, '2025-05-27', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (55, 2, '2025-05-28', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (56, 2, '2025-05-28', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (57, 2, '2025-05-29', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (58, 2, '2025-05-29', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (59, 2, '2025-05-31', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (60, 2, '2025-05-31', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (61, 2, '2025-06-01', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (62, 2, '2025-06-01', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (63, 2, '2025-06-02', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (64, 2, '2025-06-02', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (65, 2, '2025-06-04', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (66, 2, '2025-06-04', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (67, 2, '2025-06-05', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (68, 2, '2025-06-05', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (69, 2, '2025-06-07', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (70, 2, '2025-06-07', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (71, 2, '2025-06-08', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (72, 2, '2025-06-08', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (73, 2, '2025-06-09', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (74, 2, '2025-06-09', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (75, 2, '2025-06-10', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (76, 2, '2025-06-10', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (77, 2, '2025-06-11', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (78, 2, '2025-06-11', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (79, 2, '2025-06-12', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (80, 2, '2025-06-12', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (81, 2, '2025-06-15', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (82, 2, '2025-06-15', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (83, 2, '2025-06-16', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (84, 2, '2025-06-16', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (85, 2, '2025-06-17', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (86, 2, '2025-06-17', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (87, 2, '2025-06-18', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (88, 2, '2025-06-18', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (89, 2, '2025-06-19', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (90, 2, '2025-06-19', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (91, 2, '2025-06-21', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (92, 2, '2025-06-21', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (93, 3, '2025-05-24', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (94, 3, '2025-05-24', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (95, 3, '2025-05-25', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (96, 3, '2025-05-25', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (97, 3, '2025-05-26', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (98, 3, '2025-05-26', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (100, 3, '2025-05-27', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (101, 3, '2025-05-28', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (102, 3, '2025-05-28', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (103, 3, '2025-05-29', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (104, 3, '2025-05-29', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (105, 3, '2025-05-31', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (106, 3, '2025-05-31', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (107, 3, '2025-06-01', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (108, 3, '2025-06-01', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (109, 3, '2025-06-02', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (110, 3, '2025-06-02', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (111, 3, '2025-06-04', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (112, 3, '2025-06-04', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (113, 3, '2025-06-05', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (114, 3, '2025-06-05', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (115, 3, '2025-06-07', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (116, 3, '2025-06-07', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (117, 3, '2025-06-08', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (118, 3, '2025-06-08', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (119, 3, '2025-06-09', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (120, 3, '2025-06-09', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (1, 1, '2025-05-24', '09:00', 12, 11);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (53, 2, '2025-05-27', '09:00', 12, 3);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (13, 1, '2025-05-31', '09:00', 12, 11);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (99, 3, '2025-05-27', '09:00', 12, 2);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (3, 1, '2025-05-25', '09:00', 12, 11);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (121, 3, '2025-06-10', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (122, 3, '2025-06-10', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (123, 3, '2025-06-11', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (124, 3, '2025-06-11', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (125, 3, '2025-06-12', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (126, 3, '2025-06-12', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (127, 3, '2025-06-15', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (128, 3, '2025-06-15', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (129, 3, '2025-06-16', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (130, 3, '2025-06-16', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (131, 3, '2025-06-17', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (132, 3, '2025-06-17', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (133, 3, '2025-06-18', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (134, 3, '2025-06-18', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (135, 3, '2025-06-19', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (136, 3, '2025-06-19', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (137, 3, '2025-06-21', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (138, 3, '2025-06-21', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (5, 1, '2025-05-26', '09:00', 12, 7);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (7, 1, '2025-05-27', '09:00', 12, 4);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (139, 1, '2025-05-30', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (140, 1, '2025-05-30', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (141, 1, '2025-06-03', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (142, 1, '2025-06-03', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (143, 1, '2025-06-06', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (144, 1, '2025-06-06', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (145, 1, '2025-06-13', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (146, 1, '2025-06-13', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (147, 1, '2025-06-20', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (148, 1, '2025-06-20', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (149, 1, '2025-06-22', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (150, 1, '2025-06-22', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (151, 2, '2025-05-30', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (152, 2, '2025-05-30', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (153, 2, '2025-06-03', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (154, 2, '2025-06-03', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (155, 2, '2025-06-06', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (156, 2, '2025-06-06', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (157, 2, '2025-06-13', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (158, 2, '2025-06-13', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (159, 2, '2025-06-20', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (160, 2, '2025-06-20', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (161, 2, '2025-06-22', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (162, 2, '2025-06-22', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (163, 3, '2025-05-30', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (164, 3, '2025-05-30', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (165, 3, '2025-06-03', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (166, 3, '2025-06-03', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (167, 3, '2025-06-06', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (168, 3, '2025-06-06', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (169, 3, '2025-06-13', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (170, 3, '2025-06-13', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (171, 3, '2025-06-20', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (172, 3, '2025-06-20', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (173, 3, '2025-06-22', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (174, 3, '2025-06-22', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (175, 1, '2025-06-14', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (176, 1, '2025-06-14', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (177, 1, '2025-06-23', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (178, 1, '2025-06-23', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (179, 2, '2025-06-14', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (180, 2, '2025-06-14', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (181, 2, '2025-06-23', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (182, 2, '2025-06-23', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (183, 3, '2025-06-14', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (184, 3, '2025-06-14', '14:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (185, 3, '2025-06-23', '09:00', 12, 12);
INSERT INTO availabilities (id, tour_id, date, time, max_spots, spots_left) VALUES (186, 3, '2025-06-23', '14:00', 12, 12);

-- Table: bookings
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (1, 1, 7, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '7567567', 2, 'LT-VJOQTWZ', 9000, 'completed', '2025-05-23T18:44:32.392Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (2, 1, 53, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '64576987', 1, 'LT-SGJTQRS', 4500, 'completed', '2025-05-23T18:50:25.434Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (3, 1, 99, 'gdhgfhgfh', 'gfhfghfgdhdfg', 'sdsfd@gmail.com', '034328749832749', 1, 'LT-FSDPWGR', 4500, 'completed', '2025-05-23T18:51:48.069Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (4, 1, 5, 'gdhgfhgfh', 'gfhfghfgdhdfg', 'sdsfd@gmail.com', '034328749832749', 1, 'LT-ADNYSL1', 4500, 'completed', '2025-05-23T18:52:26.409Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (5, 1, 5, 'Test', 'User', 'test@example.com', '123456789', 1, 'LT-UF2RKEX', 4500, 'completed', '2025-05-23T18:53:50.882Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (6, 1, 53, 'gdhgfhgfh', 'gfhfghfgdhdfg', 'sdsfd@gmail.com', '034328749832749', 1, 'LT-KW6GT0M', 4500, 'completed', '2025-05-23T18:55:22.861Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (7, 1, 53, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '678687687687687', 1, 'LT-NPYSSAP', 4500, 'completed', '2025-05-23T18:59:34.009Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (8, 1, 53, 'gdhgfhgfh', 'gfhfghfgdhdfg', 'sdsfd@gmail.com', '034328749832749', 4, 'LT-BZTV9GQ', 18000, 'completed', '2025-05-23T19:00:26.587Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (9, 1, 1, 'Test', 'User', 'test@example.com', '123456789', 1, 'LT-FIIO9BT', 4500, 'completed', '2025-05-23T19:00:55.624Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (10, 1, 99, 'erteryewty', 'retwyrtwyetr', 'eyweyet@gma.com', '38468273658746875', 9, 'LT-PCPSVMD', 40500, 'completed', '2025-05-23T19:02:42.038Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (11, 1, 53, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '675675674567', 2, 'LT-LGVJRIK', 9000, 'completed', '2025-05-23T19:07:16.583Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (12, 1, 5, 'gdhgfhgfh', 'gfhfghfgdhdfg', 'sdsfd@gmail.com', '034328749832749', 1, 'LT--LE5EBH', 4500, 'completed', '2025-05-23T19:23:24.031Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (13, 1, 5, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '46523695847395', 2, 'LT-PUSTC9T', 9000, 'completed', '2025-05-23T19:24:16.015Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (14, 1, 7, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '8658658765876587', 5, 'LT-ZUUNRBD', 22500, 'completed', '2025-05-23T19:42:12.748Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (15, 1, 7, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '5758765876587', 1, 'LT-OOZ9QDQ', 4500, 'completed', '2025-05-23T19:45:10.207Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (16, 1, 13, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '8676986798769', 1, 'LT-7D_9DEH', 4500, 'completed', '2025-05-23T19:50:53.106Z', FALSE);
INSERT INTO bookings (id, tour_id, availability_id, customer_first_name, customer_last_name, customer_email, customer_phone, number_of_participants, booking_reference, total_amount, payment_status, created_at, reminders_sent) VALUES (17, 1, 3, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '345345435345345', 1, 'LT-EO5EIDY', 4500, 'completed', '2025-05-23T19:55:08.100Z', FALSE);

-- Table: testimonials
INSERT INTO testimonials (id, customer_name, customer_country, rating, text, is_approved, tour_id) VALUES (1, 'Emma Johnson', 'United Kingdom', 5, 'Our guide Maria was absolutely fantastic! Her knowledge of Lisbon''s history and culture made our tour incredibly enriching. The hidden spots she showed us were magical and away from the tourist crowds.', TRUE, 1);
INSERT INTO testimonials (id, customer_name, customer_country, rating, text, is_approved, tour_id) VALUES (2, 'Michael Chen', 'Canada', 5, 'The Belém Tour exceeded our expectations. João was knowledgeable and passionate, and the small group size made it feel very personal. The pasteis de nata at the end were the perfect touch!', TRUE, 1);
INSERT INTO testimonials (id, customer_name, customer_country, rating, text, is_approved, tour_id) VALUES (3, 'Thomas Mueller', 'Germany', 5, 'The Fado experience was truly unforgettable. Our guide Ana took us to an authentic venue where we felt like locals. The combination of dinner, music, and the atmospheric streets of Alfama made for a perfect evening.', TRUE, 2);

-- Table: closed_days
INSERT INTO closed_days (id, date, reason, created_at) VALUES (6, '2025-05-28', 'Manually closed', '2025-05-23T18:39:46.273Z');
INSERT INTO closed_days (id, date, reason, created_at) VALUES (7, '2025-05-26', 'Manually closed', '2025-05-23T19:44:25.139Z');

-- Table: admin_settings
-- No data in table: admin_settings

-- Table: users
-- No data in table: users


COMMIT;