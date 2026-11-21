-- =====================================================
-- FoodieHub — QR Restaurant Management System
-- MySQL 8+ schema.  Run:  mysql -u root -p < database/schema.sql
-- =====================================================
CREATE DATABASE IF NOT EXISTS qr_restaurant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qr_restaurant;

CREATE TABLE IF NOT EXISTS admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,            -- bcrypt hash, created by the backend (never plain text)
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id    VARCHAR(40) PRIMARY KEY,                  -- slug: pizza, burger ...
  name  VARCHAR(40) NOT NULL UNIQUE,
  icon  VARCHAR(40) NOT NULL DEFAULT 'fa-utensils'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS menu_items (
  id           VARCHAR(20) PRIMARY KEY,           -- M01, M02 ...
  category_id  VARCHAR(40) NOT NULL,
  name         VARCHAR(80) NOT NULL,
  description  VARCHAR(255) NOT NULL,
  price        DECIMAL(10,2) NOT NULL CHECK (price > 0),
  is_veg       TINYINT(1) NOT NULL DEFAULT 1,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  prep_minutes INT NOT NULL DEFAULT 15,
  rating       DECIMAL(2,1) NOT NULL DEFAULT 4.5,
  image_url    MEDIUMTEXT,                        -- URL or small base64 image
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_menu_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_menu_cat (category_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  table_number INT NOT NULL UNIQUE,               -- number printed in the QR code
  seats        INT NOT NULL CHECK (seats BETWEEN 1 AND 20),
  area         ENUM('Indoor','Outdoor','Family','VIP') NOT NULL DEFAULT 'Indoor',
  status       ENUM('Available','Occupied','Reserved','Cleaning') NOT NULL DEFAULT 'Available'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(80) NOT NULL,
  phone      CHAR(10) NOT NULL UNIQUE,
  email      VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id            INT AUTO_INCREMENT PRIMARY KEY,   -- shown as ORD-<1000+id>
  customer_id   INT NOT NULL,
  table_id      INT NOT NULL,
  status        ENUM('Pending','Confirmed','Preparing','Ready','Served') NOT NULL DEFAULT 'Pending',
  payment_status ENUM('Paid','Unpaid') NOT NULL DEFAULT 'Unpaid',
  payment_method ENUM('UPI','Card','Cash') NULL,
  note          VARCHAR(140) NULL,
  subtotal      DECIMAL(10,2) NOT NULL,
  discount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax           DECIMAL(10,2) NOT NULL,           -- 5% GST (calculated by the server)
  total         DECIMAL(10,2) NOT NULL,
  invoice_no    VARCHAR(20) NULL UNIQUE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ord_cust  FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_ord_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
  INDEX idx_ord_status (status), INDEX idx_ord_created (created_at), INDEX idx_ord_cust (customer_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  menu_item_id VARCHAR(20) NULL,                  -- stays NULL-able so deleting a menu item keeps old bills
  item_name   VARCHAR(80) NOT NULL,               -- name + price copied at order time
  unit_price  DECIMAL(10,2) NOT NULL,
  quantity    INT NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_menu  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL,
  INDEX idx_oi_order (order_id)
) ENGINE=InnoDB;
