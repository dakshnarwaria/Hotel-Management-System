-- ============================================================
-- HOTEL MANAGEMENT SYSTEM | hotel_db | MySQL 8
-- File: db/schema.sql
-- Run in MySQL Workbench or:  mysql -u root -p < db/schema.sql
-- (DELIMITER lines are for Workbench / mysql CLI only; do not
--  execute this file through mysql2 in the app.)
-- WARNING: this script DROPS and recreates all objects.
-- ============================================================

CREATE DATABASE IF NOT EXISTS hotel_db;
USE hotel_db;

-- ---------- 0. Clean reset (safe to re-run) ----------
SET FOREIGN_KEY_CHECKS = 0;
DROP VIEW IF EXISTS current_stays;
DROP VIEW IF EXISTS booking_bills;
DROP VIEW IF EXISTS available_rooms;
DROP PROCEDURE IF EXISTS book_room;
DROP PROCEDURE IF EXISTS check_in;
DROP PROCEDURE IF EXISTS check_out;
DROP PROCEDURE IF EXISTS cancel_booking;
DROP PROCEDURE IF EXISTS record_payment;
DROP TABLE IF EXISTS Service_Orders;
DROP TABLE IF EXISTS Services;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS Employees;
DROP TABLE IF EXISTS Rooms;
DROP TABLE IF EXISTS Room_Types;
DROP TABLE IF EXISTS Guests;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------- 1. TABLES (DDL) ----------
-- IDs are AUTO_INCREMENT so the app can insert without choosing an id.
-- Explicit ids (seed data) still work.

CREATE TABLE Guests (
  guest_id   INT AUTO_INCREMENT PRIMARY KEY,
  full_name  VARCHAR(50) NOT NULL,
  phone      VARCHAR(15) NOT NULL UNIQUE,
  email      VARCHAR(60),
  city       VARCHAR(30),
  id_proof   VARCHAR(30)
);

CREATE TABLE Room_Types (
  type_id          INT AUTO_INCREMENT PRIMARY KEY,
  type_name        VARCHAR(30) NOT NULL UNIQUE,
  price_per_night  DECIMAL(10,2) NOT NULL CHECK (price_per_night > 0),
  capacity         INT NOT NULL CHECK (capacity > 0)
);

CREATE TABLE Rooms (
  room_no   INT PRIMARY KEY,
  type_id   INT NOT NULL,
  floor_no  INT NOT NULL,
  status    VARCHAR(15) NOT NULL DEFAULT 'Available'
            CHECK (status IN ('Available','Occupied','Maintenance')),
  FOREIGN KEY (type_id) REFERENCES Room_Types(type_id)
);

CREATE TABLE Employees (
  emp_id    INT AUTO_INCREMENT PRIMARY KEY,
  emp_name  VARCHAR(50) NOT NULL,
  role      VARCHAR(30) NOT NULL,
  phone     VARCHAR(15),
  salary    DECIMAL(10,2) CHECK (salary >= 0)
);

CREATE TABLE Bookings (
  booking_id    INT AUTO_INCREMENT PRIMARY KEY,
  guest_id      INT NOT NULL,
  room_no       INT NOT NULL,
  emp_id        INT NOT NULL,
  check_in      DATE NOT NULL,
  check_out     DATE NOT NULL,
  no_of_guests  INT NOT NULL CHECK (no_of_guests > 0),
  status        VARCHAR(15) NOT NULL DEFAULT 'Confirmed'
                CHECK (status IN ('Confirmed','Checked-In','Checked-Out','Cancelled')),
  total_amount  DECIMAL(10,2) NOT NULL DEFAULT 0,   -- room charge, set by trigger
  FOREIGN KEY (guest_id) REFERENCES Guests(guest_id),
  FOREIGN KEY (room_no)  REFERENCES Rooms(room_no),
  FOREIGN KEY (emp_id)   REFERENCES Employees(emp_id),
  CHECK (check_out > check_in)
);

CREATE TABLE Payments (
  payment_id  INT AUTO_INCREMENT PRIMARY KEY,
  booking_id  INT NOT NULL,
  amount      DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  pay_date    DATE NOT NULL,
  method      VARCHAR(10) NOT NULL CHECK (method IN ('Cash','Card','UPI')),
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id)
);

CREATE TABLE Services (
  service_id    INT AUTO_INCREMENT PRIMARY KEY,
  service_name  VARCHAR(40) NOT NULL,
  price         DECIMAL(10,2) NOT NULL CHECK (price > 0)
);

CREATE TABLE Service_Orders (
  order_id    INT AUTO_INCREMENT PRIMARY KEY,
  booking_id  INT NOT NULL,
  service_id  INT NOT NULL,
  quantity    INT NOT NULL CHECK (quantity > 0),
  order_date  DATE NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES Services(service_id)
);

-- ---------- 2. INDEXES ----------
-- (Foreign key columns are indexed automatically by MySQL.)
CREATE INDEX idx_bookings_room_dates ON Bookings (room_no, check_in, check_out);
CREATE INDEX idx_bookings_status     ON Bookings (status);
CREATE INDEX idx_rooms_status        ON Rooms (status);
CREATE INDEX idx_payments_date       ON Payments (pay_date);
CREATE INDEX idx_service_orders_date ON Service_Orders (order_date);

-- ---------- 3. VIEWS ----------
CREATE VIEW available_rooms AS
SELECT r.room_no, t.type_name, r.floor_no, t.capacity, t.price_per_night
FROM Rooms r
JOIN Room_Types t ON r.type_id = t.type_id
WHERE r.status = 'Available';

CREATE VIEW current_stays AS
SELECT b.booking_id, g.full_name, g.phone, b.room_no, t.type_name,
       b.check_in, b.check_out,
       DATEDIFF(b.check_out, CURDATE()) AS nights_remaining,
       b.no_of_guests, e.emp_name AS handled_by
FROM Bookings b
JOIN Guests g     ON b.guest_id = g.guest_id
JOIN Rooms r      ON b.room_no = r.room_no
JOIN Room_Types t ON r.type_id = t.type_id
JOIN Employees e  ON b.emp_id = e.emp_id
WHERE b.status = 'Checked-In';

-- total_amount in Bookings = room charge only; services are added here.
CREATE VIEW booking_bills AS
SELECT x.*,
       x.room_charge + x.services_total            AS grand_total,
       x.room_charge + x.services_total - x.paid   AS balance
FROM (
  SELECT b.booking_id, g.full_name, b.room_no, b.status,
         b.total_amount AS room_charge,
         COALESCE((SELECT SUM(s.price * o.quantity)
                   FROM Service_Orders o
                   JOIN Services s ON s.service_id = o.service_id
                   WHERE o.booking_id = b.booking_id), 0) AS services_total,
         COALESCE((SELECT SUM(p.amount)
                   FROM Payments p
                   WHERE p.booking_id = b.booking_id), 0) AS paid
  FROM Bookings b
  JOIN Guests g ON b.guest_id = g.guest_id
) x;

-- ---------- 4. TRIGGERS ----------
DELIMITER $$

-- Validate a new booking, block double booking, compute room charge.
CREATE TRIGGER trg_bookings_bi
BEFORE INSERT ON Bookings
FOR EACH ROW
BEGIN
  DECLARE v_price  DECIMAL(10,2);
  DECLARE v_cap    INT;
  DECLARE v_status VARCHAR(15);

  SELECT t.price_per_night, t.capacity, r.status
    INTO v_price, v_cap, v_status
  FROM Rooms r
  JOIN Room_Types t ON r.type_id = t.type_id
  WHERE r.room_no = NEW.room_no;

  IF v_price IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room does not exist';
  END IF;

  IF NEW.no_of_guests > v_cap THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Number of guests exceeds room capacity';
  END IF;

  IF NEW.status IN ('Confirmed','Checked-In') THEN
    IF v_status = 'Maintenance' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room is under maintenance';
    END IF;
    IF EXISTS (SELECT 1 FROM Bookings b
               WHERE b.room_no = NEW.room_no
                 AND b.status IN ('Confirmed','Checked-In')
                 AND b.check_in  < NEW.check_out
                 AND b.check_out > NEW.check_in) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room is already booked for these dates';
    END IF;
  END IF;

  SET NEW.total_amount = v_price * DATEDIFF(NEW.check_out, NEW.check_in);
END$$

-- Keep room status in sync after an insert that is already Checked-In.
CREATE TRIGGER trg_bookings_ai
AFTER INSERT ON Bookings
FOR EACH ROW
BEGIN
  IF NEW.status = 'Checked-In' THEN
    UPDATE Rooms SET status = 'Occupied' WHERE room_no = NEW.room_no;
  END IF;
END$$

-- Re-check overlap and recompute charge if room or dates change.
CREATE TRIGGER trg_bookings_bu
BEFORE UPDATE ON Bookings
FOR EACH ROW
BEGIN
  DECLARE v_price DECIMAL(10,2);

  IF NEW.room_no <> OLD.room_no
     OR NEW.check_in <> OLD.check_in
     OR NEW.check_out <> OLD.check_out THEN

    IF OLD.status IN ('Checked-Out','Cancelled') THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Closed bookings cannot be changed';
    END IF;

    IF EXISTS (SELECT 1 FROM Bookings b
               WHERE b.room_no = NEW.room_no
                 AND b.booking_id <> NEW.booking_id
                 AND b.status IN ('Confirmed','Checked-In')
                 AND b.check_in  < NEW.check_out
                 AND b.check_out > NEW.check_in) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room is already booked for these dates';
    END IF;

    SELECT t.price_per_night INTO v_price
    FROM Rooms r JOIN Room_Types t ON r.type_id = t.type_id
    WHERE r.room_no = NEW.room_no;

    SET NEW.total_amount = v_price * DATEDIFF(NEW.check_out, NEW.check_in);
  END IF;
END$$

-- Room becomes Occupied on check-in, Available on check-out / cancel after stay.
CREATE TRIGGER trg_bookings_au
AFTER UPDATE ON Bookings
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    IF NEW.status = 'Checked-In' THEN
      UPDATE Rooms SET status = 'Occupied' WHERE room_no = NEW.room_no;
    ELSEIF OLD.status = 'Checked-In' AND NEW.status IN ('Checked-Out','Cancelled') THEN
      UPDATE Rooms SET status = 'Available' WHERE room_no = NEW.room_no;
    END IF;
  END IF;
END$$

-- Do not accept payments larger than the outstanding bill.
CREATE TRIGGER trg_payments_bi
BEFORE INSERT ON Payments
FOR EACH ROW
BEGIN
  DECLARE v_room_charge DECIMAL(10,2);
  DECLARE v_services    DECIMAL(10,2);
  DECLARE v_paid        DECIMAL(10,2);

  SELECT total_amount INTO v_room_charge
  FROM Bookings WHERE booking_id = NEW.booking_id;

  SELECT COALESCE(SUM(s.price * o.quantity), 0) INTO v_services
  FROM Service_Orders o JOIN Services s ON s.service_id = o.service_id
  WHERE o.booking_id = NEW.booking_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_paid
  FROM Payments WHERE booking_id = NEW.booking_id;

  IF v_paid + NEW.amount > v_room_charge + v_services THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment exceeds the outstanding balance';
  END IF;
END$$

-- Services can only be ordered for guests who are staying (or just stayed).
CREATE TRIGGER trg_service_orders_bi
BEFORE INSERT ON Service_Orders
FOR EACH ROW
BEGIN
  DECLARE v_status VARCHAR(15);
  SELECT status INTO v_status FROM Bookings WHERE booking_id = NEW.booking_id;
  IF v_status = 'Cancelled' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot order services on a cancelled booking';
  END IF;
END$$

-- ---------- 5. STORED PROCEDURES ----------

CREATE PROCEDURE book_room (
  IN  p_guest_id INT,
  IN  p_room_no  INT,
  IN  p_emp_id   INT,
  IN  p_check_in DATE,
  IN  p_check_out DATE,
  IN  p_guests   INT,
  OUT p_booking_id INT
)
BEGIN
  IF p_check_in < CURDATE() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Check-in date cannot be in the past';
  END IF;

  INSERT INTO Bookings (guest_id, room_no, emp_id, check_in, check_out, no_of_guests, status)
  VALUES (p_guest_id, p_room_no, p_emp_id, p_check_in, p_check_out, p_guests, 'Confirmed');

  SET p_booking_id = LAST_INSERT_ID();
END$$

CREATE PROCEDURE check_in (IN p_booking_id INT)
BEGIN
  DECLARE v_status VARCHAR(15);
  SELECT status INTO v_status FROM Bookings WHERE booking_id = p_booking_id;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking not found';
  ELSEIF v_status <> 'Confirmed' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only confirmed bookings can be checked in';
  END IF;

  UPDATE Bookings SET status = 'Checked-In' WHERE booking_id = p_booking_id;
END$$

-- Returns the final bill as a result set.
CREATE PROCEDURE check_out (IN p_booking_id INT)
BEGIN
  DECLARE v_status VARCHAR(15);
  SELECT status INTO v_status FROM Bookings WHERE booking_id = p_booking_id;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking not found';
  ELSEIF v_status <> 'Checked-In' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only checked-in bookings can be checked out';
  END IF;

  UPDATE Bookings SET status = 'Checked-Out' WHERE booking_id = p_booking_id;

  SELECT * FROM booking_bills WHERE booking_id = p_booking_id;
END$$

CREATE PROCEDURE cancel_booking (IN p_booking_id INT)
BEGIN
  DECLARE v_status VARCHAR(15);
  SELECT status INTO v_status FROM Bookings WHERE booking_id = p_booking_id;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking not found';
  ELSEIF v_status <> 'Confirmed' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only confirmed bookings can be cancelled';
  END IF;

  UPDATE Bookings SET status = 'Cancelled' WHERE booking_id = p_booking_id;
END$$

CREATE PROCEDURE record_payment (
  IN  p_booking_id INT,
  IN  p_amount     DECIMAL(10,2),
  IN  p_method     VARCHAR(10),
  OUT p_payment_id INT
)
BEGIN
  INSERT INTO Payments (booking_id, amount, pay_date, method)
  VALUES (p_booking_id, p_amount, CURDATE(), p_method);

  SET p_payment_id = LAST_INSERT_ID();
END$$

DELIMITER ;

-- ---------- 6. QUICK SANITY CHECK (after loading seed data) ----------
-- SELECT * FROM available_rooms;
-- SELECT * FROM current_stays;
-- SELECT * FROM booking_bills WHERE balance > 0;
-- CALL book_room(1, 102, 2, '2026-12-01', '2026-12-03', 2, @id); SELECT @id;
-- CALL check_in(@id);
-- CALL check_out(@id);
