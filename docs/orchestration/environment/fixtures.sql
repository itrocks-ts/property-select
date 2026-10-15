-- Synthetic recipe data. Run only against the dedicated server, never a development database.
CREATE DATABASE IF NOT EXISTS property_select_recipe;
USE property_select_recipe;
CREATE TABLE IF NOT EXISTS country (id BIGINT UNSIGNED PRIMARY KEY, name VARCHAR(255) NOT NULL);
DELETE FROM country;
INSERT INTO country VALUES (1, 'Recipe France'), (2, 'Recipe United Kingdom');
CREATE TABLE IF NOT EXISTS ps_country (id BIGINT PRIMARY KEY, name VARCHAR(100));
CREATE TABLE IF NOT EXISTS ps_city (id BIGINT PRIMARY KEY, name VARCHAR(100), id_country BIGINT);
CREATE TABLE IF NOT EXISTS ps_address (id BIGINT PRIMARY KEY, street VARCHAR(100), id_city BIGINT);
CREATE TABLE IF NOT EXISTS ps_customer (
 id BIGINT PRIMARY KEY, name VARCHAR(100), id_address BIGINT, id_parent BIGINT
);
CREATE TABLE IF NOT EXISTS ps_invoice (
 id BIGINT PRIMARY KEY, number VARCHAR(40), id_customer BIGINT, id_delivery_address BIGINT,
 active TINYINT, amount DECIMAL(12,2), issued_at DATETIME, note VARCHAR(100)
);
CREATE TABLE IF NOT EXISTS ps_line (id BIGINT PRIMARY KEY, id_invoice BIGINT, label VARCHAR(100), quantity INT);
CREATE TABLE IF NOT EXISTS ps_tag (id BIGINT PRIMARY KEY, name VARCHAR(100));
CREATE TABLE IF NOT EXISTS ps_invoice_tag (id_invoice BIGINT, id_tag BIGINT, PRIMARY KEY(id_invoice, id_tag));
DELETE FROM ps_invoice_tag;
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
 (1, 'REC-001', 1, 2, 1, 12.34, '2026-01-01 12:00:00', NULL),
 (2, 'REC-002', 2, 1, 0, 0.00, '2026-01-02 12:00:00', 'Synthetic'),
 (3, 'REC-003', 3, NULL, 1, -5.50, NULL, ''),
 (4, 'REC-004', NULL, 3, 1, 99.99, '2026-01-04 12:00:00', NULL);
INSERT INTO ps_line VALUES (1, 1, 'Recipe A', 2), (2, 1, 'Recipe B', 1), (3, 2, 'Recipe C', 4);
INSERT INTO ps_tag VALUES (1, 'Recipe Red'), (2, 'Recipe Blue');
INSERT INTO ps_invoice_tag VALUES (1, 1), (1, 2), (2, 1);
