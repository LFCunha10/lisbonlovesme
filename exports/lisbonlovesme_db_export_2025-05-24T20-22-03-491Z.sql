-- Lisbonlovesme Database Export
-- Date: 2025-05-24T20:22:03.491Z

BEGIN;

-- Table: tours
INSERT INTO tours (id, name, shortDescription, description, imageUrl, duration, maxGroupSize, difficulty, price, badge, badgeColor, isActive) VALUES (2, 'Alfama & Fado Experience', '', 'Wander through the charming streets of Alfama, Lisbon''s oldest district, and enjoy an authentic Fado music performance with dinner.', 'https://pixabay.com/get/g1a4760d97fc50e236c117537b1dbfe42cc1025f194035d2b98ce7c3096f322968be260e68fc90ab5c92388f5211d8ee865a229904078fca59379aedb1f308446_1280.jpg', '4 hours', 10, 'Easy', 6500, 'Evening Tour', 'secondary', TRUE);
INSERT INTO tours (id, name, shortDescription, description, imageUrl, duration, maxGroupSize, difficulty, price, badge, badgeColor, isActive) VALUES (3, 'Panoramic Lisbon Tour', '', 'Experience the best views of Lisbon from various miradouros (viewpoints) across the city''s seven hills, with transportation included.', 'https://images.unsplash.com/photo-1569959220744-ff553533f492', '6 hours', 8, 'Moderate', 7500, 'Full Day', 'accent', TRUE);
INSERT INTO tours (id, name, shortDescription, description, imageUrl, duration, maxGroupSize, difficulty, price, badge, badgeColor, isActive) VALUES (1, 'Historic Belém Tour', 'this is a test', 'Explore the historic Belém district including the iconic Tower, Monument to the Discoveries, and the famous Pastéis de Belém bakery.

![Image](/uploads/fo6WIZB0i2.png)

kdjshgfkjhsdgfjdsgfjgsdkjfgkdsgfkdsgkf
dskjhfgjksdghfkjhdsgfkhsdhjfgksdhfgj

1. sdfkjhlsdkfjhskdjf
- sdfsdfsdfsdfsdfasdfsf', 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b', '3 hours', 4, 'medium', 4500, 'Most Popular', 'orange', TRUE);
INSERT INTO tours (id, name, shortDescription, description, imageUrl, duration, maxGroupSize, difficulty, price, badge, badgeColor, isActive) VALUES (4, 'Tour test', 'dksjhfksdflkhdsjfhlsdhflkdjsfsdf', 'dlfhsdjhflkdjshlfkjhds
dslkfhkdsjhflkjdshlfk

![Image](/uploads/EOnpwxAkaq.jpg)

lsdjhfkdsjhflkhgk
ljfhgkjdhfgkhdlfgk


![Image](/uploads/BJOshMFsJV.jpg)
', '/uploads/Sgbec8khFO.jpeg', '5 hours', 4, 'hard', 150000, 'Best Seller', 'pink', TRUE);

-- Table: availabilities
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (2, 1, '2025-05-24', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (4, 1, '2025-05-25', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (6, 1, '2025-05-26', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (8, 1, '2025-05-27', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (9, 1, '2025-05-28', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (10, 1, '2025-05-28', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (11, 1, '2025-05-29', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (12, 1, '2025-05-29', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (14, 1, '2025-05-31', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (15, 1, '2025-06-01', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (16, 1, '2025-06-01', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (17, 1, '2025-06-02', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (18, 1, '2025-06-02', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (19, 1, '2025-06-04', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (20, 1, '2025-06-04', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (21, 1, '2025-06-05', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (22, 1, '2025-06-05', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (23, 1, '2025-06-07', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (24, 1, '2025-06-07', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (25, 1, '2025-06-08', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (26, 1, '2025-06-08', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (27, 1, '2025-06-09', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (28, 1, '2025-06-09', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (29, 1, '2025-06-10', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (30, 1, '2025-06-10', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (31, 1, '2025-06-11', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (32, 1, '2025-06-11', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (33, 1, '2025-06-12', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (34, 1, '2025-06-12', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (35, 1, '2025-06-15', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (36, 1, '2025-06-15', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (37, 1, '2025-06-16', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (38, 1, '2025-06-16', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (39, 1, '2025-06-17', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (40, 1, '2025-06-17', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (41, 1, '2025-06-18', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (42, 1, '2025-06-18', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (43, 1, '2025-06-19', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (44, 1, '2025-06-19', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (45, 1, '2025-06-21', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (46, 1, '2025-06-21', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (47, 2, '2025-05-24', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (48, 2, '2025-05-24', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (49, 2, '2025-05-25', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (50, 2, '2025-05-25', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (51, 2, '2025-05-26', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (52, 2, '2025-05-26', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (54, 2, '2025-05-27', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (55, 2, '2025-05-28', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (56, 2, '2025-05-28', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (57, 2, '2025-05-29', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (58, 2, '2025-05-29', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (59, 2, '2025-05-31', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (60, 2, '2025-05-31', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (61, 2, '2025-06-01', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (62, 2, '2025-06-01', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (63, 2, '2025-06-02', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (64, 2, '2025-06-02', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (65, 2, '2025-06-04', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (66, 2, '2025-06-04', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (67, 2, '2025-06-05', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (68, 2, '2025-06-05', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (69, 2, '2025-06-07', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (70, 2, '2025-06-07', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (71, 2, '2025-06-08', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (72, 2, '2025-06-08', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (73, 2, '2025-06-09', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (74, 2, '2025-06-09', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (75, 2, '2025-06-10', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (76, 2, '2025-06-10', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (77, 2, '2025-06-11', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (78, 2, '2025-06-11', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (79, 2, '2025-06-12', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (80, 2, '2025-06-12', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (81, 2, '2025-06-15', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (82, 2, '2025-06-15', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (83, 2, '2025-06-16', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (84, 2, '2025-06-16', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (85, 2, '2025-06-17', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (86, 2, '2025-06-17', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (87, 2, '2025-06-18', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (88, 2, '2025-06-18', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (89, 2, '2025-06-19', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (90, 2, '2025-06-19', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (91, 2, '2025-06-21', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (92, 2, '2025-06-21', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (93, 3, '2025-05-24', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (94, 3, '2025-05-24', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (95, 3, '2025-05-25', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (96, 3, '2025-05-25', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (97, 3, '2025-05-26', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (98, 3, '2025-05-26', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (100, 3, '2025-05-27', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (101, 3, '2025-05-28', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (102, 3, '2025-05-28', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (103, 3, '2025-05-29', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (104, 3, '2025-05-29', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (105, 3, '2025-05-31', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (106, 3, '2025-05-31', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (107, 3, '2025-06-01', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (108, 3, '2025-06-01', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (109, 3, '2025-06-02', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (110, 3, '2025-06-02', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (111, 3, '2025-06-04', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (112, 3, '2025-06-04', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (113, 3, '2025-06-05', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (114, 3, '2025-06-05', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (115, 3, '2025-06-07', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (116, 3, '2025-06-07', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (117, 3, '2025-06-08', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (118, 3, '2025-06-08', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (119, 3, '2025-06-09', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (120, 3, '2025-06-09', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (1, 1, '2025-05-24', '09:00', 12, 11);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (53, 2, '2025-05-27', '09:00', 12, 3);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (13, 1, '2025-05-31', '09:00', 12, 11);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (99, 3, '2025-05-27', '09:00', 12, 2);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (3, 1, '2025-05-25', '09:00', 12, 11);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (121, 3, '2025-06-10', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (122, 3, '2025-06-10', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (123, 3, '2025-06-11', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (124, 3, '2025-06-11', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (125, 3, '2025-06-12', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (126, 3, '2025-06-12', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (127, 3, '2025-06-15', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (128, 3, '2025-06-15', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (129, 3, '2025-06-16', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (130, 3, '2025-06-16', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (131, 3, '2025-06-17', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (132, 3, '2025-06-17', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (133, 3, '2025-06-18', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (134, 3, '2025-06-18', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (135, 3, '2025-06-19', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (136, 3, '2025-06-19', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (137, 3, '2025-06-21', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (138, 3, '2025-06-21', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (5, 1, '2025-05-26', '09:00', 12, 7);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (7, 1, '2025-05-27', '09:00', 12, 4);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (139, 1, '2025-05-30', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (140, 1, '2025-05-30', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (141, 1, '2025-06-03', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (142, 1, '2025-06-03', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (143, 1, '2025-06-06', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (144, 1, '2025-06-06', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (145, 1, '2025-06-13', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (146, 1, '2025-06-13', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (147, 1, '2025-06-20', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (148, 1, '2025-06-20', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (149, 1, '2025-06-22', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (150, 1, '2025-06-22', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (151, 2, '2025-05-30', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (152, 2, '2025-05-30', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (153, 2, '2025-06-03', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (154, 2, '2025-06-03', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (155, 2, '2025-06-06', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (156, 2, '2025-06-06', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (157, 2, '2025-06-13', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (158, 2, '2025-06-13', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (159, 2, '2025-06-20', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (160, 2, '2025-06-20', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (161, 2, '2025-06-22', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (162, 2, '2025-06-22', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (163, 3, '2025-05-30', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (164, 3, '2025-05-30', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (165, 3, '2025-06-03', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (166, 3, '2025-06-03', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (167, 3, '2025-06-06', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (168, 3, '2025-06-06', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (169, 3, '2025-06-13', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (170, 3, '2025-06-13', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (171, 3, '2025-06-20', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (172, 3, '2025-06-20', '14:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (173, 3, '2025-06-22', '09:00', 12, 12);
INSERT INTO availabilities (id, tourId, date, time, maxSpots, spotsLeft) VALUES (174, 3, '2025-06-22', '14:00', 12, 12);

-- Table: bookings
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (1, 1, 7, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '7567567', 2, 'LT-VJOQTWZ', 9000, 'completed', '2025-05-23T18:44:32.392Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (2, 1, 53, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '64576987', 1, 'LT-SGJTQRS', 4500, 'completed', '2025-05-23T18:50:25.434Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (3, 1, 99, 'gdhgfhgfh', 'gfhfghfgdhdfg', 'sdsfd@gmail.com', '034328749832749', 1, 'LT-FSDPWGR', 4500, 'completed', '2025-05-23T18:51:48.069Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (4, 1, 5, 'gdhgfhgfh', 'gfhfghfgdhdfg', 'sdsfd@gmail.com', '034328749832749', 1, 'LT-ADNYSL1', 4500, 'completed', '2025-05-23T18:52:26.409Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (5, 1, 5, 'Test', 'User', 'test@example.com', '123456789', 1, 'LT-UF2RKEX', 4500, 'completed', '2025-05-23T18:53:50.882Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (6, 1, 53, 'gdhgfhgfh', 'gfhfghfgdhdfg', 'sdsfd@gmail.com', '034328749832749', 1, 'LT-KW6GT0M', 4500, 'completed', '2025-05-23T18:55:22.861Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (7, 1, 53, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '678687687687687', 1, 'LT-NPYSSAP', 4500, 'completed', '2025-05-23T18:59:34.009Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (8, 1, 53, 'gdhgfhgfh', 'gfhfghfgdhdfg', 'sdsfd@gmail.com', '034328749832749', 4, 'LT-BZTV9GQ', 18000, 'completed', '2025-05-23T19:00:26.587Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (9, 1, 1, 'Test', 'User', 'test@example.com', '123456789', 1, 'LT-FIIO9BT', 4500, 'completed', '2025-05-23T19:00:55.624Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (10, 1, 99, 'erteryewty', 'retwyrtwyetr', 'eyweyet@gma.com', '38468273658746875', 9, 'LT-PCPSVMD', 40500, 'completed', '2025-05-23T19:02:42.038Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (11, 1, 53, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '675675674567', 2, 'LT-LGVJRIK', 9000, 'completed', '2025-05-23T19:07:16.583Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (12, 1, 5, 'gdhgfhgfh', 'gfhfghfgdhdfg', 'sdsfd@gmail.com', '034328749832749', 1, 'LT--LE5EBH', 4500, 'completed', '2025-05-23T19:23:24.031Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (13, 1, 5, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '46523695847395', 2, 'LT-PUSTC9T', 9000, 'completed', '2025-05-23T19:24:16.015Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (14, 1, 7, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '8658658765876587', 5, 'LT-ZUUNRBD', 22500, 'completed', '2025-05-23T19:42:12.748Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (15, 1, 7, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '5758765876587', 1, 'LT-OOZ9QDQ', 4500, 'completed', '2025-05-23T19:45:10.207Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (16, 1, 13, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '8676986798769', 1, 'LT-7D_9DEH', 4500, 'completed', '2025-05-23T19:50:53.106Z', FALSE);
INSERT INTO bookings (id, tourId, availabilityId, customerFirstName, customerLastName, customerEmail, customerPhone, numberOfParticipants, bookingReference, totalAmount, paymentStatus, createdAt, remindersSent) VALUES (17, 1, 3, 'Luiz', 'Cunha', 'cluizfilipe@gmail.com', '345345435345345', 1, 'LT-EO5EIDY', 4500, 'completed', '2025-05-23T19:55:08.100Z', FALSE);

-- Table: testimonials
INSERT INTO testimonials (id, customerName, customerCountry, rating, text, isApproved, tourId) VALUES (1, 'Emma Johnson', 'United Kingdom', 5, 'Our guide Maria was absolutely fantastic! Her knowledge of Lisbon''s history and culture made our tour incredibly enriching. The hidden spots she showed us were magical and away from the tourist crowds.', TRUE, 1);
INSERT INTO testimonials (id, customerName, customerCountry, rating, text, isApproved, tourId) VALUES (2, 'Michael Chen', 'Canada', 5, 'The Belém Tour exceeded our expectations. João was knowledgeable and passionate, and the small group size made it feel very personal. The pasteis de nata at the end were the perfect touch!', TRUE, 1);
INSERT INTO testimonials (id, customerName, customerCountry, rating, text, isApproved, tourId) VALUES (3, 'Thomas Mueller', 'Germany', 5, 'The Fado experience was truly unforgettable. Our guide Ana took us to an authentic venue where we felt like locals. The combination of dinner, music, and the atmospheric streets of Alfama made for a perfect evening.', TRUE, 2);

-- Table: closed_days
INSERT INTO closed_days (id, date, reason, createdAt) VALUES (6, '2025-05-28', 'Manually closed', '2025-05-23T18:39:46.273Z');
INSERT INTO closed_days (id, date, reason, createdAt) VALUES (7, '2025-05-26', 'Manually closed', '2025-05-23T19:44:25.139Z');

-- No data in table: admin_settings

-- No data in table: users

COMMIT;
