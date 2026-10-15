-- Synthetic recipe data. Run only against the dedicated server, never a development database.
CREATE DATABASE IF NOT EXISTS property_select_recipe;
USE property_select_recipe;
CREATE TABLE IF NOT EXISTS country (id BIGINT UNSIGNED PRIMARY KEY, name VARCHAR(255) NOT NULL);
DELETE FROM country;
INSERT INTO country VALUES (1, 'Recipe France'), (2, 'Recipe United Kingdom');
DROP TABLE IF EXISTS ps_invoice_tag, ps_invoice_ps_tag, ps_line, ps_invoice, ps_customer, ps_address, ps_city, ps_country, ps_tag;
CREATE TABLE IF NOT EXISTS ps_country (id BIGINT PRIMARY KEY, name VARCHAR(100));
CREATE TABLE IF NOT EXISTS ps_city (id BIGINT PRIMARY KEY, name VARCHAR(100), country_id BIGINT);
CREATE TABLE IF NOT EXISTS ps_address (id BIGINT PRIMARY KEY, street VARCHAR(100), city_id BIGINT);
CREATE TABLE IF NOT EXISTS ps_customer (
 id BIGINT PRIMARY KEY, name VARCHAR(100), address_id BIGINT, parent_id BIGINT
);
CREATE TABLE IF NOT EXISTS ps_invoice (
 id BIGINT PRIMARY KEY, number VARCHAR(40), customer_id BIGINT, delivery_address_id BIGINT,
 active TINYINT, amount DECIMAL(12,2), issued_at DATETIME, note VARCHAR(100), p0 VARCHAR(100)
);
CREATE TABLE IF NOT EXISTS ps_line (id BIGINT PRIMARY KEY, invoice_id BIGINT, label VARCHAR(100), quantity INT);
CREATE TABLE IF NOT EXISTS ps_tag (id BIGINT PRIMARY KEY, name VARCHAR(100));
CREATE TABLE IF NOT EXISTS ps_invoice_ps_tag (ps_invoice_id BIGINT, ps_tag_id BIGINT, PRIMARY KEY(ps_invoice_id, ps_tag_id));
DELETE FROM ps_invoice_ps_tag;
DELETE FROM ps_line;
DELETE FROM ps_invoice;
DELETE FROM ps_customer;
DELETE FROM ps_address;
DELETE FROM ps_city;
DELETE FROM ps_country;
DELETE FROM ps_tag;
INSERT INTO ps_country VALUES (1, 'Recipe France'), (2, 'Recipe United Kingdom');
INSERT INTO ps_city VALUES (1, 'Recipe Paris', 1), (2, 'Recipe London', 2), (3, NULL, 1);
INSERT INTO ps_address VALUES (1, '1 Synthetic Street', 1), (2, '2 Synthetic Street', 2), (3, '3 Null Street', 3);
INSERT INTO ps_customer VALUES (1, 'Recipe Alice', 1, 2), (2, 'Recipe Bob', 2, 1), (3, 'Recipe No Address', NULL, NULL);
INSERT INTO ps_invoice VALUES
 (1, 'REC-001', 1, 2, 1, 12.34, '2026-01-01 12:00:00', NULL, 'alias'),
 (2, 'REC-002', 2, 1, 0, 0.00, '2026-01-02 12:00:00', 'Synthetic', 'alias'),
 (3, 'REC-003', 3, NULL, 1, -5.50, NULL, '', 'alias'),
 (4, 'REC-004', NULL, 3, 1, 99.99, '2026-01-04 12:00:00', NULL, 'alias');
INSERT INTO ps_line VALUES (1, 1, 'Recipe A', 2), (2, 1, 'Recipe B', 1), (3, 2, 'Recipe C', 4);
INSERT INTO ps_tag VALUES (1, 'Recipe Red'), (2, 'Recipe Blue');
INSERT INTO ps_invoice_ps_tag VALUES (1, 1), (1, 2), (2, 1);

-- 116 additional roots preserve the four original scenarios and create tied sorting values.
INSERT INTO ps_invoice VALUES
 (5, 'REC-005', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (6, 'REC-006', 1, 1, 0, 1.25, NULL, NULL, 'alias'),
 (7, 'REC-007', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (8, 'REC-008', NULL, 3, 0, 1.25, NULL, NULL, 'alias'),
 (9, 'REC-009', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (10, 'REC-010', 2, 2, 0, 1.25, NULL, NULL, 'alias'),
 (11, 'REC-011', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (12, 'REC-012', NULL, 1, 0, 1.25, NULL, NULL, 'alias'),
 (13, 'REC-013', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (14, 'REC-014', 3, 3, 0, 1.25, NULL, NULL, 'alias'),
 (15, 'REC-015', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (16, 'REC-016', NULL, 2, 0, 1.25, NULL, NULL, 'alias'),
 (17, 'REC-017', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (18, 'REC-018', 1, 1, 0, 1.25, NULL, NULL, 'alias'),
 (19, 'REC-019', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (20, 'REC-020', NULL, 3, 0, 1.25, NULL, NULL, 'alias'),
 (21, 'REC-021', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (22, 'REC-022', 2, 2, 0, 1.25, NULL, NULL, 'alias'),
 (23, 'REC-023', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (24, 'REC-024', NULL, 1, 0, 1.25, NULL, NULL, 'alias'),
 (25, 'REC-025', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (26, 'REC-026', 3, 3, 0, 1.25, NULL, NULL, 'alias'),
 (27, 'REC-027', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (28, 'REC-028', NULL, 2, 0, 1.25, NULL, NULL, 'alias'),
 (29, 'REC-029', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (30, 'REC-030', 1, 1, 0, 1.25, NULL, NULL, 'alias'),
 (31, 'REC-031', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (32, 'REC-032', NULL, 3, 0, 1.25, NULL, NULL, 'alias'),
 (33, 'REC-033', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (34, 'REC-034', 2, 2, 0, 1.25, NULL, NULL, 'alias'),
 (35, 'REC-035', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (36, 'REC-036', NULL, 1, 0, 1.25, NULL, NULL, 'alias'),
 (37, 'REC-037', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (38, 'REC-038', 3, 3, 0, 1.25, NULL, NULL, 'alias'),
 (39, 'REC-039', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (40, 'REC-040', NULL, 2, 0, 1.25, NULL, NULL, 'alias'),
 (41, 'REC-041', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (42, 'REC-042', 1, 1, 0, 1.25, NULL, NULL, 'alias'),
 (43, 'REC-043', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (44, 'REC-044', NULL, 3, 0, 1.25, NULL, NULL, 'alias'),
 (45, 'REC-045', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (46, 'REC-046', 2, 2, 0, 1.25, NULL, NULL, 'alias'),
 (47, 'REC-047', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (48, 'REC-048', NULL, 1, 0, 1.25, NULL, NULL, 'alias'),
 (49, 'REC-049', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (50, 'REC-050', 3, 3, 0, 1.25, NULL, NULL, 'alias'),
 (51, 'REC-051', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (52, 'REC-052', NULL, 2, 0, 1.25, NULL, NULL, 'alias'),
 (53, 'REC-053', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (54, 'REC-054', 1, 1, 0, 1.25, NULL, NULL, 'alias'),
 (55, 'REC-055', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (56, 'REC-056', NULL, 3, 0, 1.25, NULL, NULL, 'alias'),
 (57, 'REC-057', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (58, 'REC-058', 2, 2, 0, 1.25, NULL, NULL, 'alias'),
 (59, 'REC-059', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (60, 'REC-060', NULL, 1, 0, 1.25, NULL, NULL, 'alias'),
 (61, 'REC-061', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (62, 'REC-062', 3, 3, 0, 1.25, NULL, NULL, 'alias'),
 (63, 'REC-063', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (64, 'REC-064', NULL, 2, 0, 1.25, NULL, NULL, 'alias'),
 (65, 'REC-065', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (66, 'REC-066', 1, 1, 0, 1.25, NULL, NULL, 'alias'),
 (67, 'REC-067', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (68, 'REC-068', NULL, 3, 0, 1.25, NULL, NULL, 'alias'),
 (69, 'REC-069', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (70, 'REC-070', 2, 2, 0, 1.25, NULL, NULL, 'alias'),
 (71, 'REC-071', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (72, 'REC-072', NULL, 1, 0, 1.25, NULL, NULL, 'alias'),
 (73, 'REC-073', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (74, 'REC-074', 3, 3, 0, 1.25, NULL, NULL, 'alias'),
 (75, 'REC-075', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (76, 'REC-076', NULL, 2, 0, 1.25, NULL, NULL, 'alias'),
 (77, 'REC-077', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (78, 'REC-078', 1, 1, 0, 1.25, NULL, NULL, 'alias'),
 (79, 'REC-079', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (80, 'REC-080', NULL, 3, 0, 1.25, NULL, NULL, 'alias'),
 (81, 'REC-081', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (82, 'REC-082', 2, 2, 0, 1.25, NULL, NULL, 'alias'),
 (83, 'REC-083', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (84, 'REC-084', NULL, 1, 0, 1.25, NULL, NULL, 'alias'),
 (85, 'REC-085', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (86, 'REC-086', 3, 3, 0, 1.25, NULL, NULL, 'alias'),
 (87, 'REC-087', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (88, 'REC-088', NULL, 2, 0, 1.25, NULL, NULL, 'alias'),
 (89, 'REC-089', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (90, 'REC-090', 1, 1, 0, 1.25, NULL, NULL, 'alias'),
 (91, 'REC-091', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (92, 'REC-092', NULL, 3, 0, 1.25, NULL, NULL, 'alias'),
 (93, 'REC-093', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (94, 'REC-094', 2, 2, 0, 1.25, NULL, NULL, 'alias'),
 (95, 'REC-095', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (96, 'REC-096', NULL, 1, 0, 1.25, NULL, NULL, 'alias'),
 (97, 'REC-097', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (98, 'REC-098', 3, 3, 0, 1.25, NULL, NULL, 'alias'),
 (99, 'REC-099', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (100, 'REC-100', NULL, 2, 0, 1.25, NULL, NULL, 'alias'),
 (101, 'REC-101', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (102, 'REC-102', 1, 1, 0, 1.25, NULL, NULL, 'alias'),
 (103, 'REC-103', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (104, 'REC-104', NULL, 3, 0, 1.25, NULL, NULL, 'alias'),
 (105, 'REC-105', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (106, 'REC-106', 2, 2, 0, 1.25, NULL, NULL, 'alias'),
 (107, 'REC-107', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (108, 'REC-108', NULL, 1, 0, 1.25, NULL, NULL, 'alias'),
 (109, 'REC-109', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (110, 'REC-110', 3, 3, 0, 1.25, NULL, NULL, 'alias'),
 (111, 'REC-111', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (112, 'REC-112', NULL, 2, 0, 1.25, NULL, NULL, 'alias'),
 (113, 'REC-113', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (114, 'REC-114', 1, 1, 0, 1.25, NULL, NULL, 'alias'),
 (115, 'REC-115', 2, 2, 1, 1.25, NULL, NULL, 'alias'),
 (116, 'REC-116', NULL, 3, 0, 1.25, NULL, NULL, 'alias'),
 (117, 'REC-117', 1, 1, 1, 1.25, NULL, NULL, 'alias'),
 (118, 'REC-118', 2, 2, 0, 1.25, NULL, NULL, 'alias'),
 (119, 'REC-119', 3, 3, 1, 1.25, NULL, NULL, 'alias'),
 (120, 'REC-120', NULL, 1, 0, 1.25, NULL, NULL, 'alias');
INSERT INTO ps_line VALUES (4, 1, 'Recipe A', 2), (5, 3, NULL, 0);
