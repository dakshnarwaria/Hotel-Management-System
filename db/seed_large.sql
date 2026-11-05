-- ============================================================
-- HOTEL MANAGEMENT SYSTEM | Large sample data | MySQL 8
-- Run AFTER db/schema.sql. In MySQL Workbench, open this file
-- and use "run all" (not only the current statement).
-- This script EMPTIES all hotel data tables before seeding them.
-- Dates are relative to the day this script is run.
-- Bookings, service orders, and payments are randomized, so each
-- run differs slightly.
-- ============================================================

USE hotel_db;

-- ---------- STEP 0: EMPTY EVERYTHING ----------
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Service_Orders;
TRUNCATE TABLE Payments;
TRUNCATE TABLE Bookings;
TRUNCATE TABLE Services;
TRUNCATE TABLE Employees;
TRUNCATE TABLE Rooms;
TRUNCATE TABLE Room_Types;
TRUNCATE TABLE Guests;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------- STEP 1: FIXED DATA ----------
INSERT INTO Room_Types (type_id, type_name, price_per_night, capacity) VALUES
  (1, 'Standard', 2500, 2),
  (2, 'Deluxe', 4000, 3),
  (3, 'Suite', 7500, 4),
  (4, 'Family', 5500, 5),
  (5, 'Presidential Suite', 12000, 4);

-- Room status is omitted so the schema default is used.
INSERT INTO Rooms (room_no, type_id, floor_no) VALUES
  (1, 1, 0), (2, 1, 0), (3, 1, 0), (4, 4, 0),
  (101, 1, 1), (102, 1, 1), (103, 1, 1), (104, 1, 1), (105, 1, 1),
  (201, 2, 2), (202, 2, 2), (203, 2, 2), (204, 2, 2), (205, 2, 2),
  (301, 3, 3), (302, 3, 3), (303, 3, 3), (304, 2, 3),
  (401, 4, 4), (402, 4, 4), (403, 3, 4),
  (501, 5, 5);

INSERT INTO Employees (emp_id, emp_name, role, phone, salary) VALUES
  (1, 'Manoj Kumar', 'Manager', '9820000001', 65000),
  (2, 'Ritu Sethi', 'Receptionist', '9820000002', 30000),
  (3, 'Deepak Rawat', 'Receptionist', '9820000003', 29000),
  (4, 'Pooja Nanda', 'Receptionist', '9820000004', 28500),
  (5, 'Kavita Sharma', 'Housekeeping', '9820000005', 22000),
  (6, 'Suresh Yadav', 'Housekeeping', '9820000006', 21500),
  (7, 'Arjun Menon', 'Chef', '9820000007', 38000),
  (8, 'Iqbal Singh', 'Security', '9820000008', 24000);

INSERT INTO Services (service_id, service_name, price) VALUES
  (1, 'Breakfast Buffet', 600),
  (2, 'Laundry', 300),
  (3, 'Spa Session', 2000),
  (4, 'Airport Pickup', 1200),
  (5, 'Mini Bar', 400),
  (6, 'Room Dining', 750),
  (7, 'Extra Bed', 1000),
  (8, 'Late Checkout', 1500),
  (9, 'City Tour', 2500),
  (10, 'Pool and Gym Pass', 500);

INSERT INTO Guests (guest_id, full_name, phone, city, id_proof) VALUES
  (1, 'Aarav Sharma', '9810000001', 'Delhi', 'Aadhaar'),
  (2, 'Ananya Verma', '9810000002', 'Mumbai', 'Passport'),
  (3, 'Vivaan Gupta', '9810000003', 'Jaipur', 'Driving License'),
  (4, 'Diya Mehta', '9810000004', 'Kolkata', 'Voter ID'),
  (5, 'Arjun Nair', '9810000005', 'Chennai', 'PAN'),
  (6, 'Ishita Reddy', '9810000006', 'Hyderabad', 'Aadhaar'),
  (7, 'Aditya Rao', '9810000007', 'Bengaluru', 'Passport'),
  (8, 'Saanvi Kulkarni', '9810000008', 'Pune', 'Driving License'),
  (9, 'Reyansh Singh', '9810000009', 'Lucknow', 'Voter ID'),
  (10, 'Myra Kapoor', '9810000010', 'Chandigarh', 'PAN'),
  (11, 'Kabir Malhotra', '9810000011', 'Delhi', 'Aadhaar'),
  (12, 'Aadhya Iyer', '9810000012', 'Chennai', 'Passport'),
  (13, 'Vihaan Joshi', '9810000013', 'Ahmedabad', 'Driving License'),
  (14, 'Pari Chawla', '9810000014', 'Amritsar', 'Voter ID'),
  (15, 'Krishna Das', '9810000015', 'Kolkata', 'PAN'),
  (16, 'Sara Khan', '9810000016', 'Bhopal', 'Aadhaar'),
  (17, 'Atharv Mishra', '9810000017', 'Varanasi', 'Passport'),
  (18, 'Navya Pillai', '9810000018', 'Kochi', 'Driving License'),
  (19, 'Rohan Bansal', '9810000019', 'Jaipur', 'Voter ID'),
  (20, 'Kiara Desai', '9810000020', 'Surat', 'PAN'),
  (21, 'Dhruv Sinha', '9810000021', 'Patna', 'Aadhaar'),
  (22, 'Meera Subramanian', '9810000022', 'Coimbatore', 'Passport'),
  (23, 'Ishaan Chatterjee', '9810000023', 'Kolkata', 'Driving License'),
  (24, 'Tara Menon', '9810000024', 'Bengaluru', 'Voter ID'),
  (25, 'Yash Thakur', '9810000025', 'Shimla', 'PAN'),
  (26, 'Avni Saxena', '9810000026', 'Lucknow', 'Aadhaar'),
  (27, 'Kian Dutta', '9810000027', 'Guwahati', 'Passport'),
  (28, 'Riya Ghosh', '9810000028', 'Bhubaneswar', 'Driving License'),
  (29, 'Mohit Arora', '9810000029', 'Chandigarh', 'Voter ID'),
  (30, 'Zoya Sheikh', '9810000030', 'Hyderabad', 'PAN'),
  (31, 'Nikhil Patil', '9810000031', 'Nashik', 'Aadhaar'),
  (32, 'Pihu Agarwal', '9810000032', 'Agra', 'Passport'),
  (33, 'Siddharth Bose', '9810000033', 'Kolkata', 'Driving License'),
  (34, 'Aisha Qureshi', '9810000034', 'Mumbai', 'Voter ID'),
  (35, 'Manav Bhatia', '9810000035', 'Delhi', 'PAN'),
  (36, 'Ira Shetty', '9810000036', 'Mangaluru', 'Aadhaar'),
  (37, 'Pranav Khandelwal', '9810000037', 'Indore', 'Passport'),
  (38, 'Tanvi Deshmukh', '9810000038', 'Pune', 'Driving License'),
  (39, 'Omkar Jadhav', '9810000039', 'Nagpur', 'Voter ID'),
  (40, 'Simran Kaur', '9810000040', 'Amritsar', 'PAN');

UPDATE Guests
SET email = CONCAT(LOWER(REPLACE(full_name, ' ', '.')), '@mail.com');

-- ---------- STEP 2: GENERATED BOOKINGS ----------
DROP TEMPORARY TABLE IF EXISTS tmp_seed_rooms;
CREATE TEMPORARY TABLE tmp_seed_rooms AS
SELECT r.room_no, rt.capacity
FROM Rooms r
JOIN Room_Types rt ON rt.type_id = r.type_id
ORDER BY r.room_no;

DELIMITER $$

DROP PROCEDURE IF EXISTS seed_bookings$$
CREATE PROCEDURE seed_bookings()
BEGIN
  DECLARE v_done BOOLEAN DEFAULT FALSE;
  DECLARE v_room_no INT;
  DECLARE v_capacity INT;
  DECLARE v_day INT;
  DECLARE v_nights INT;
  DECLARE v_check_in DATE;
  DECLARE v_check_out DATE;
  DECLARE v_booking_status VARCHAR(15);
  DECLARE v_room_cursor CURSOR FOR
    SELECT room_no, capacity FROM tmp_seed_rooms ORDER BY room_no;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

  OPEN v_room_cursor;
  room_loop: LOOP
    FETCH v_room_cursor INTO v_room_no, v_capacity;
    IF v_done THEN
      LEAVE room_loop;
    END IF;

    SET v_day = -60 + FLOOR(RAND() * 3);
    stay_loop: WHILE v_day < 35 DO
      SET v_nights = 1 + FLOOR(RAND() * 5);
      SET v_check_in = DATE_ADD(CURDATE(), INTERVAL v_day DAY);
      SET v_check_out = DATE_ADD(v_check_in, INTERVAL v_nights DAY);

      IF v_room_no IN (104, 304) AND v_check_out >= CURDATE() THEN
        LEAVE stay_loop;
      END IF;

      IF v_check_out < CURDATE() THEN
        SET v_booking_status =
          IF(RAND() < 0.07, 'Cancelled', 'Checked-Out');
      ELSEIF v_check_in <= CURDATE() THEN
        SET v_booking_status = 'Checked-In';
      ELSE
        SET v_booking_status =
          IF(RAND() < 0.08, 'Cancelled', 'Confirmed');
      END IF;

      INSERT INTO Bookings
        (guest_id, room_no, emp_id, check_in, check_out, no_of_guests, status)
      VALUES
        (1 + FLOOR(RAND() * 40),
         v_room_no,
         1 + FLOOR(RAND() * 4),
         v_check_in,
         v_check_out,
         1 + FLOOR(RAND() * v_capacity),
         v_booking_status);

      SET v_day = v_day + v_nights + FLOOR(RAND() * 4);
    END WHILE stay_loop;
  END LOOP room_loop;
  CLOSE v_room_cursor;
END$$

CALL seed_bookings()$$
DROP PROCEDURE seed_bookings$$
DELIMITER ;

DROP TEMPORARY TABLE IF EXISTS tmp_seed_rooms;

UPDATE Rooms
SET status = 'Maintenance'
WHERE room_no IN (104, 304);

-- ---------- STEP 3: GENERATED SERVICE ORDERS ----------
INSERT INTO Service_Orders (booking_id, service_id, quantity, order_date)
SELECT b.booking_id,
       1 + FLOOR(RAND() * 10),
       1 + FLOOR(RAND() * 3),
       DATE_ADD(
         b.check_in,
         INTERVAL FLOOR(
           RAND() * (
             DATEDIFF(LEAST(b.check_out, CURDATE()), b.check_in) + 1
           )
         ) DAY
       )
FROM Bookings b
CROSS JOIN (SELECT 1 AS order_slot UNION SELECT 2 UNION SELECT 3) slots
WHERE b.status IN ('Checked-In', 'Checked-Out')
  AND RAND() < 0.40;

-- ---------- STEP 4: GENERATED PAYMENTS ----------
-- Snapshot bill totals before inserting payments, since the view's paid
-- and remaining values change as each payment is inserted.
DROP TEMPORARY TABLE IF EXISTS tmp_seed_payment_bookings;
CREATE TEMPORARY TABLE tmp_seed_payment_bookings AS
SELECT b.booking_id, b.status, bb.grand_total, b.check_in, b.check_out
FROM booking_bills bb
JOIN Bookings b ON b.booking_id = bb.booking_id
WHERE b.status <> 'Cancelled';

DELIMITER $$

DROP PROCEDURE IF EXISTS seed_payments$$
CREATE PROCEDURE seed_payments()
BEGIN
  DECLARE v_done BOOLEAN DEFAULT FALSE;
  DECLARE v_booking_id INT;
  DECLARE v_status VARCHAR(15);
  DECLARE v_grand_total DECIMAL(10,2);
  DECLARE v_check_in DATE;
  DECLARE v_check_out DATE;
  DECLARE v_choice DECIMAL(10,8);
  DECLARE v_amount DECIMAL(10,2);
  DECLARE v_first_amount DECIMAL(10,2);
  DECLARE v_second_amount DECIMAL(10,2);
  DECLARE v_method VARCHAR(10);
  DECLARE v_payment_cursor CURSOR FOR
    SELECT booking_id, status, grand_total, check_in, check_out
    FROM tmp_seed_payment_bookings
    ORDER BY booking_id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

  OPEN v_payment_cursor;
  payment_loop: LOOP
    FETCH v_payment_cursor
      INTO v_booking_id, v_status, v_grand_total, v_check_in, v_check_out;
    IF v_done THEN
      LEAVE payment_loop;
    END IF;

    SET v_method = ELT(
      1 + FLOOR(RAND() * 3),
      'Cash', 'Card', 'UPI'
    );

    IF v_status = 'Checked-Out' THEN
      SET v_choice = RAND();
      IF v_choice < 0.85 THEN
        IF RAND() < 0.40 THEN
          SET v_first_amount = ROUND(v_grand_total / 2, 2);
          SET v_second_amount = ROUND(v_grand_total - v_first_amount, 2);
          INSERT INTO Payments (booking_id, amount, pay_date, method)
          VALUES (v_booking_id, v_first_amount, v_check_in, v_method);
          INSERT INTO Payments (booking_id, amount, pay_date, method)
          VALUES (
            v_booking_id,
            v_second_amount,
            v_check_out,
            ELT(1 + FLOOR(RAND() * 3), 'Cash', 'Card', 'UPI')
          );
        ELSE
          INSERT INTO Payments (booking_id, amount, pay_date, method)
          VALUES (v_booking_id, ROUND(v_grand_total, 2), v_check_out, v_method);
        END IF;
      ELSEIF v_choice < 0.95 THEN
        SET v_amount = ROUND(
          v_grand_total * (0.50 + RAND() * 0.40),
          2
        );
        INSERT INTO Payments (booking_id, amount, pay_date, method)
        VALUES (v_booking_id, v_amount, v_check_out, v_method);
      END IF;
    ELSEIF v_status = 'Checked-In' AND RAND() < 0.70 THEN
      SET v_amount = ROUND(
        v_grand_total * (0.30 + RAND() * 0.30),
        2
      );
      INSERT INTO Payments (booking_id, amount, pay_date, method)
      VALUES (v_booking_id, v_amount, v_check_in, v_method);
    ELSEIF v_status = 'Confirmed' AND RAND() < 0.45 THEN
      SET v_amount = ROUND(v_grand_total * 0.25, 2);
      INSERT INTO Payments (booking_id, amount, pay_date, method)
      VALUES (
        v_booking_id,
        v_amount,
        DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 5) DAY),
        v_method
      );
    END IF;
  END LOOP payment_loop;
  CLOSE v_payment_cursor;
END$$

CALL seed_payments()$$
DROP PROCEDURE seed_payments$$
DELIMITER ;

DROP TEMPORARY TABLE IF EXISTS tmp_seed_payment_bookings;

-- ---------- STEP 5: SUMMARY OUTPUT ----------
SELECT 'Guests' AS table_name, COUNT(*) AS row_count FROM Guests
UNION ALL
SELECT 'Room_Types', COUNT(*) FROM Room_Types
UNION ALL
SELECT 'Rooms', COUNT(*) FROM Rooms
UNION ALL
SELECT 'Employees', COUNT(*) FROM Employees
UNION ALL
SELECT 'Bookings', COUNT(*) FROM Bookings
UNION ALL
SELECT 'Services', COUNT(*) FROM Services
UNION ALL
SELECT 'Service_Orders', COUNT(*) FROM Service_Orders
UNION ALL
SELECT 'Payments', COUNT(*) FROM Payments;

SELECT status, COUNT(*) AS booking_count
FROM Bookings
GROUP BY status
ORDER BY status;

SELECT status, COUNT(*) AS room_count
FROM Rooms
GROUP BY status
ORDER BY status;