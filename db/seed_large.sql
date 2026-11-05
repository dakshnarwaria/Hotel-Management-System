-- ============================================================
-- HOTEL MANAGEMENT SYSTEM | db/seed_large.sql
-- Large sample data for hotel_db. Run AFTER db/schema.sql.
-- Run with the LIGHTNING BOLT (run all) in Workbench, or:
--   mysql -u root -p < db/seed_large.sql
--
-- WARNING: this EMPTIES every table first, then reloads.
--
-- Dates are relative to the day you run it, and the data is built
-- around TODAY so no screen is empty:
--   * 6 arrivals today (Confirmed, check_in = today)
--   * 4 departures today (Checked-In, check_out = today)
--   * 10 rooms occupied, 7 reserved, 3 free, 2 in maintenance
--   * 90 days of history, bookings for the next 5 weeks
--   * every status, room type, GST slab, payment method and service
--   * paid, part-paid and unpaid bills (pending balances)
-- Bookings, service orders and payments are random in detail,
-- so numbers differ slightly on every run.
-- ============================================================

USE hotel_db;

-- ---------- 0. Empty everything ----------
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

-- ---------- 1. Room types (5) ----------
INSERT INTO Room_Types (type_id, type_name, price_per_night, capacity) VALUES
(1, 'Standard',            2500.00, 2),
(2, 'Deluxe',              4000.00, 3),
(3, 'Suite',               7500.00, 4),
(4, 'Family',              5500.00, 5),
(5, 'Presidential Suite', 12000.00, 4);

-- ---------- 2. Rooms (22). Floor 0 = Ground ----------
INSERT INTO Rooms (room_no, type_id, floor_no) VALUES
(1,1,0),(2,1,0),(3,1,0),(4,4,0),
(101,1,1),(102,1,1),(103,1,1),(104,1,1),(105,1,1),
(201,2,2),(202,2,2),(203,2,2),(204,2,2),(205,2,2),
(301,3,3),(302,3,3),(303,3,3),(304,2,3),
(401,4,4),(402,4,4),(403,3,4),
(501,5,5);

-- ---------- 3. Employees (10, every role). Ids 1-4 take bookings ----------
INSERT INTO Employees (emp_id, emp_name, role, phone, salary) VALUES
(1,  'Manoj Kumar',     'Manager',      '9899000001', 65000),
(2,  'Ritu Sethi',      'Receptionist', '9899000002', 30000),
(3,  'Deepak Rawat',    'Receptionist', '9899000003', 29000),
(4,  'Pooja Nanda',     'Receptionist', '9899000004', 28500),
(5,  'Sunita Devi',     'Housekeeping', '9899000005', 18000),
(6,  'Imran Qureshi',   'Housekeeping', '9899000006', 17500),
(7,  'Amit Joshi',      'Chef',         '9899000007', 35000),
(8,  'Harpal Singh',    'Security',     '9899000008', 20000),
(9,  'Rakesh Yadav',    'Security',     '9899000009', 19500),
(10, 'Neelam Arora',    'Accountant',   '9899000010', 38000);

-- ---------- 4. Services (10) ----------
INSERT INTO Services (service_id, service_name, price) VALUES
(1,  'Breakfast Buffet',   600),
(2,  'Laundry',            300),
(3,  'Spa Session',       2000),
(4,  'Airport Pickup',    1200),
(5,  'Mini Bar',           400),
(6,  'Room Dining',        750),
(7,  'Extra Bed',         1000),
(8,  'Late Checkout',     1500),
(9,  'City Tour',         2500),
(10, 'Pool and Gym Pass',  500);

-- ---------- 5. Guests (500) ----------
-- Built from 60 first names x 40 surnames x 30 cities, so every guest
-- has a unique name, phone number and email.
DROP TEMPORARY TABLE IF EXISTS tmp_first;
DROP TEMPORARY TABLE IF EXISTS tmp_last;
DROP TEMPORARY TABLE IF EXISTS tmp_city;
DROP TEMPORARY TABLE IF EXISTS tmp_seq;

CREATE TEMPORARY TABLE tmp_first (id INT PRIMARY KEY, nm VARCHAR(20));
INSERT INTO tmp_first VALUES
(0,'Aarav'),(1,'Ananya'),(2,'Vivaan'),(3,'Priya'),(4,'Aditya'),(5,'Sneha'),
(6,'Arjun'),(7,'Isha'),(8,'Rohan'),(9,'Neha'),(10,'Karan'),(11,'Kavya'),
(12,'Rahul'),(13,'Meera'),(14,'Vikram'),(15,'Pooja'),(16,'Siddharth'),(17,'Ritika'),
(18,'Nikhil'),(19,'Tanvi'),(20,'Harsh'),(21,'Divya'),(22,'Manish'),(23,'Simran'),
(24,'Gaurav'),(25,'Shruti'),(26,'Varun'),(27,'Aarti'),(28,'Tarun'),(29,'Lakshmi'),
(30,'Mohit'),(31,'Zoya'),(32,'Yash'),(33,'Nisha'),(34,'Dev'),(35,'Bhavna'),
(36,'Rajat'),(37,'Anjali'),(38,'Sandeep'),(39,'Mansi'),(40,'Abhishek'),(41,'Diya'),
(42,'Ishaan'),(43,'Myra'),(44,'Kabir'),(45,'Saanvi'),(46,'Reyansh'),(47,'Kiara'),
(48,'Aryan'),(49,'Riya'),(50,'Ayaan'),(51,'Aditi'),(52,'Krishna'),(53,'Pallavi'),
(54,'Pranav'),(55,'Swati'),(56,'Sameer'),(57,'Nandini'),(58,'Neeraj'),(59,'Radhika');

CREATE TEMPORARY TABLE tmp_last (id INT PRIMARY KEY, nm VARCHAR(20));
INSERT INTO tmp_last VALUES
(0,'Sharma'),(1,'Verma'),(2,'Gupta'),(3,'Mehta'),(4,'Singh'),(5,'Kapoor'),(6,'Nair'),(7,'Iyer'),
(8,'Reddy'),(9,'Rao'),(10,'Joshi'),(11,'Desai'),(12,'Patel'),(13,'Agarwal'),(14,'Bansal'),(15,'Chopra'),
(16,'Malhotra'),(17,'Kulkarni'),(18,'Saxena'),(19,'Menon'),(20,'Yadav'),(21,'Kaur'),(22,'Bhatt'),(23,'Banerjee'),
(24,'Chauhan'),(25,'Mishra'),(26,'Ahuja'),(27,'Narayan'),(28,'Ali'),(29,'Khan'),(30,'Thakur'),(31,'Rathore'),
(32,'Sethi'),(33,'Pandey'),(34,'Das'),(35,'Kohli'),(36,'Jain'),(37,'Tiwari'),(38,'Pillai'),(39,'Bose');

CREATE TEMPORARY TABLE tmp_city (id INT PRIMARY KEY, nm VARCHAR(30));
INSERT INTO tmp_city VALUES
(0,'Delhi'),(1,'Mumbai'),(2,'Jaipur'),(3,'Kolkata'),(4,'Chennai'),(5,'Hyderabad'),
(6,'Bengaluru'),(7,'Pune'),(8,'Lucknow'),(9,'Chandigarh'),(10,'Ahmedabad'),(11,'Kochi'),
(12,'Bhopal'),(13,'Surat'),(14,'Indore'),(15,'Amritsar'),(16,'Patna'),(17,'Nagpur'),
(18,'Kanpur'),(19,'Coimbatore'),(20,'Varanasi'),(21,'Ludhiana'),(22,'Dehradun'),(23,'Shimla'),
(24,'Gurugram'),(25,'Noida'),(26,'Jodhpur'),(27,'Udaipur'),(28,'Guwahati'),(29,'Raipur');

CREATE TEMPORARY TABLE tmp_seq (n INT PRIMARY KEY);
INSERT INTO tmp_seq
SELECT a.d + 10 * b.d + 100 * c.d + 1
FROM (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
      UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
CROSS JOIN
     (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
      UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b
CROSS JOIN
     (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4) c
WHERE a.d + 10 * b.d + 100 * c.d + 1 <= 500;

INSERT INTO Guests (guest_id, full_name, phone, city, id_proof)
SELECT s.n,
       CONCAT(f.nm, ' ', l.nm),
       CONCAT('9', LPAD(800000000 + s.n * 7919, 9, '0')),
       c.nm,
       ELT(1 + (s.n MOD 10), 'Aadhaar', 'Aadhaar', 'Aadhaar', 'Aadhaar', 'Passport',
                             'Passport', 'Driving License', 'Driving License', 'Voter ID', 'PAN')
FROM tmp_seq s
JOIN tmp_first f ON f.id = (s.n - 1) MOD 60
JOIN tmp_last  l ON l.id = ((s.n - 1) DIV 60 * 4 + ((s.n - 1) MOD 60) * 3) MOD 40
JOIN tmp_city  c ON c.id = (s.n * 7) MOD 30;

UPDATE Guests
SET email = CONCAT(LOWER(REPLACE(full_name, ' ', '.')), '@mail.com');

DROP TEMPORARY TABLE tmp_first;
DROP TEMPORARY TABLE tmp_last;
DROP TEMPORARY TABLE tmp_city;
DROP TEMPORARY TABLE tmp_seq;

-- ---------- 6. Bookings (about 550 to 600) ----------
-- Every room follows a "plan" so today always looks busy and varied:
--   MAINT  104, 304            past stays only, then set to Maintenance
--   FREE   2, 105, 402         past stays only, nothing today or later (Available)
--   MID    1, 101, 201, 202,   guest checked in a few days ago, leaves in 1-4 days
--          301, 501            (Occupied)
--   LEAVE  203, 401            guest checked in, LEAVES TODAY (departure today)
--   TURN   3, 102              guest LEAVES TODAY and a new guest ARRIVES TODAY
--   ARRIVE 103, 204, 302, 403  empty now, guest ARRIVES TODAY (Confirmed, Reserved)
--   SOON   4, 205, 303         first guest arrives in 1-3 days (Reserved)
-- On top of that, each room gets a chain of 90 days of past stays
-- and (except MAINT/FREE) back-to-back future bookings up to 5 weeks ahead.
-- The triggers fill total_amount and set rooms Occupied for Checked-In stays.
-- Frequent guests: lower guest ids are picked more often (repeat guests).

DROP PROCEDURE IF EXISTS seed_bookings;
DROP TEMPORARY TABLE IF EXISTS tmp_plan;

CREATE TEMPORARY TABLE tmp_plan AS
SELECT r.room_no, t.capacity,
       CASE
         WHEN r.room_no IN (104, 304)              THEN 'MAINT'
         WHEN r.room_no IN (2, 105, 402)           THEN 'FREE'
         WHEN r.room_no IN (1, 101, 201, 202, 301, 501) THEN 'MID'
         WHEN r.room_no IN (203, 401)              THEN 'LEAVE'
         WHEN r.room_no IN (3, 102)                THEN 'TURN'
         WHEN r.room_no IN (103, 204, 302, 403)    THEN 'ARRIVE'
         ELSE 'SOON'
       END AS scenario
FROM Rooms r
JOIN Room_Types t ON r.type_id = t.type_id;

DELIMITER $$
CREATE PROCEDURE seed_bookings()
BEGIN
  DECLARE done    INT DEFAULT 0;
  DECLARE v_room  INT;
  DECLARE v_cap   INT;
  DECLARE v_sc    VARCHAR(10);
  DECLARE a       INT;
  DECLARE b       INT;
  DECLARE pivot   INT;
  DECLARE e       INT;
  DECLARE d       INT;
  DECLARE n       INT;
  DECLARE v_first INT;
  DECLARE v_status VARCHAR(15);
  DECLARE cur CURSOR FOR SELECT room_no, capacity, scenario FROM tmp_plan ORDER BY room_no;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  room_loop: LOOP
    FETCH cur INTO v_room, v_cap, v_sc;
    IF done = 1 THEN LEAVE room_loop; END IF;

    SET pivot = -1;      -- last day (offset from today) a past stay may end
    SET d     = NULL;    -- offset of the first stay from today onward

    -- the guest who is in the room right now
    IF v_sc IN ('MID', 'LEAVE', 'TURN') THEN
      SET a = 1 + FLOOR(RAND() * 3);                          -- arrived a days ago
      SET b = IF(v_sc = 'MID', 1 + FLOOR(RAND() * 4), 0);     -- leaves in b days (0 = today)
      SET pivot = -a;
      INSERT INTO Bookings (guest_id, room_no, emp_id, check_in, check_out, no_of_guests, status)
      VALUES (LEAST(500, 1 + FLOOR(POW(RAND(), 1.4) * 500)), v_room, 1 + FLOOR(RAND() * 4),
              DATE_SUB(CURDATE(), INTERVAL a DAY), DATE_ADD(CURDATE(), INTERVAL b DAY),
              1 + FLOOR(RAND() * v_cap), 'Checked-In');
      SET d = b + CASE v_sc WHEN 'MID'   THEN FLOOR(RAND() * 3)
                            WHEN 'LEAVE' THEN 1 + FLOOR(RAND() * 2)
                            ELSE 0 END;                       -- TURN: next guest arrives today
    ELSEIF v_sc = 'ARRIVE' THEN
      SET d = 0;
    ELSEIF v_sc = 'SOON' THEN
      SET d = 1 + FLOOR(RAND() * 3);
    END IF;

    -- past history: back-to-back stays ending on or before the pivot day
    SET e = -90 + FLOOR(RAND() * 3);
    SET n = 1 + FLOOR(RAND() * 5);
    WHILE e + n <= pivot DO
      INSERT INTO Bookings (guest_id, room_no, emp_id, check_in, check_out, no_of_guests, status)
      VALUES (LEAST(500, 1 + FLOOR(POW(RAND(), 1.4) * 500)), v_room, 1 + FLOOR(RAND() * 4),
              DATE_ADD(CURDATE(), INTERVAL e DAY), DATE_ADD(CURDATE(), INTERVAL e + n DAY),
              1 + FLOOR(RAND() * v_cap), IF(RAND() < 0.07, 'Cancelled', 'Checked-Out'));
      SET e = e + n + FLOOR(RAND() * 4);
      SET n = 1 + FLOOR(RAND() * 5);
    END WHILE;

    -- future bookings (the first one is always Confirmed, never cancelled)
    IF d IS NOT NULL THEN
      SET v_first = 1;
      WHILE d < 35 DO
        SET n = 1 + FLOOR(RAND() * 5);
        IF v_first = 1 THEN
          SET v_status = 'Confirmed';
        ELSE
          SET v_status = IF(RAND() < 0.08, 'Cancelled', 'Confirmed');
        END IF;
        INSERT INTO Bookings (guest_id, room_no, emp_id, check_in, check_out, no_of_guests, status)
        VALUES (LEAST(500, 1 + FLOOR(POW(RAND(), 1.4) * 500)), v_room, 1 + FLOOR(RAND() * 4),
                DATE_ADD(CURDATE(), INTERVAL d DAY), DATE_ADD(CURDATE(), INTERVAL d + n DAY),
                1 + FLOOR(RAND() * v_cap), v_status);
        SET v_first = 0;
        SET d = d + n + FLOOR(RAND() * 3);
      END WHILE;
    END IF;
  END LOOP room_loop;
  CLOSE cur;
END$$
DELIMITER ;

CALL seed_bookings();
DROP PROCEDURE seed_bookings;
DROP TEMPORARY TABLE tmp_plan;

UPDATE Rooms SET status = 'Maintenance' WHERE room_no IN (104, 304);

-- ---------- 7. Service orders ----------
-- Up to 3 random orders per booking: 40% chance each for finished stays,
-- 60% for guests staying now. Dated within the stay, never in the future.
INSERT INTO Service_Orders (booking_id, service_id, quantity, order_date)
SELECT b.booking_id,
       1 + FLOOR(RAND() * 10),
       1 + FLOOR(RAND() * 3),
       DATE_ADD(b.check_in,
                INTERVAL FLOOR(RAND() * (DATEDIFF(LEAST(b.check_out, CURDATE()), b.check_in) + 1)) DAY)
FROM Bookings b
JOIN (SELECT 1 AS n UNION SELECT 2 UNION SELECT 3) k
WHERE (b.status = 'Checked-Out' AND RAND() < 0.40)
   OR (b.status = 'Checked-In'  AND RAND() < 0.60);

-- ---------- 8. Payments (based on each booking's GST-inclusive bill) ----------
-- Checked-Out : 85% paid in full (40% of those in two parts), 10% part paid, 5% unpaid
-- Checked-In  : 70% paid an advance; guests leaving today: half settle in full today
-- Confirmed   : 45% paid a deposit; guests arriving today: 80% paid a deposit today
-- Payments never exceed the bill (the trigger would reject them).

DROP PROCEDURE IF EXISTS seed_payments;
DROP TEMPORARY TABLE IF EXISTS tmp_bills;

CREATE TEMPORARY TABLE tmp_bills AS
SELECT bb.booking_id, bb.status, bb.grand_total, b.check_in, b.check_out
FROM booking_bills bb
JOIN Bookings b ON b.booking_id = bb.booking_id
WHERE bb.status <> 'Cancelled';

DELIMITER $$
CREATE PROCEDURE seed_payments()
BEGIN
  DECLARE done     INT DEFAULT 0;
  DECLARE v_id     INT;
  DECLARE v_status VARCHAR(15);
  DECLARE v_total  DECIMAL(12,2);
  DECLARE v_in     DATE;
  DECLARE v_out    DATE;
  DECLARE v_first  DECIMAL(12,2);
  DECLARE r        DOUBLE;
  DECLARE cur CURSOR FOR SELECT booking_id, status, grand_total, check_in, check_out FROM tmp_bills;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  pay_loop: LOOP
    FETCH cur INTO v_id, v_status, v_total, v_in, v_out;
    IF done = 1 THEN LEAVE pay_loop; END IF;
    SET r = RAND();

    IF v_status = 'Checked-Out' THEN
      IF r < 0.85 THEN
        IF RAND() < 0.40 THEN
          SET v_first = ROUND(v_total * 0.5, 2);
          INSERT INTO Payments (booking_id, amount, pay_date, method)
          VALUES (v_id, v_first, v_in, ELT(1 + FLOOR(RAND() * 3), 'Cash', 'Card', 'UPI'));
          INSERT INTO Payments (booking_id, amount, pay_date, method)
          VALUES (v_id, v_total - v_first, v_out, ELT(1 + FLOOR(RAND() * 3), 'Cash', 'Card', 'UPI'));
        ELSE
          INSERT INTO Payments (booking_id, amount, pay_date, method)
          VALUES (v_id, v_total, v_out, ELT(1 + FLOOR(RAND() * 3), 'Cash', 'Card', 'UPI'));
        END IF;
      ELSEIF r < 0.95 THEN
        INSERT INTO Payments (booking_id, amount, pay_date, method)
        VALUES (v_id, ROUND(v_total * (0.5 + RAND() * 0.4), 2), v_out,
                ELT(1 + FLOOR(RAND() * 3), 'Cash', 'Card', 'UPI'));
      END IF;

    ELSEIF v_status = 'Checked-In' THEN
      IF v_out = CURDATE() AND r < 0.50 THEN
        INSERT INTO Payments (booking_id, amount, pay_date, method)
        VALUES (v_id, v_total, CURDATE(), ELT(1 + FLOOR(RAND() * 3), 'Cash', 'Card', 'UPI'));
      ELSEIF r < 0.70 THEN
        INSERT INTO Payments (booking_id, amount, pay_date, method)
        VALUES (v_id, ROUND(v_total * (0.3 + RAND() * 0.3), 2), v_in,
                ELT(1 + FLOOR(RAND() * 3), 'Cash', 'Card', 'UPI'));
      END IF;

    ELSE
      IF v_in = CURDATE() THEN
        IF r < 0.80 THEN
          INSERT INTO Payments (booking_id, amount, pay_date, method)
          VALUES (v_id, ROUND(v_total * 0.25, 2), CURDATE(),
                  ELT(1 + FLOOR(RAND() * 3), 'Cash', 'Card', 'UPI'));
        END IF;
      ELSEIF r < 0.45 THEN
        INSERT INTO Payments (booking_id, amount, pay_date, method)
        VALUES (v_id, ROUND(v_total * 0.25, 2),
                DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 5) DAY),
                ELT(1 + FLOOR(RAND() * 3), 'Cash', 'Card', 'UPI'));
      END IF;
    END IF;
  END LOOP pay_loop;
  CLOSE cur;
END$$
DELIMITER ;

CALL seed_payments();
DROP PROCEDURE seed_payments;
DROP TEMPORARY TABLE tmp_bills;

-- ---------- 9. Summary ----------
SELECT 'Guests' AS tbl, COUNT(*) AS `rows` FROM Guests
UNION ALL SELECT 'Room_Types',     COUNT(*) FROM Room_Types
UNION ALL SELECT 'Rooms',          COUNT(*) FROM Rooms
UNION ALL SELECT 'Employees',      COUNT(*) FROM Employees
UNION ALL SELECT 'Services',       COUNT(*) FROM Services
UNION ALL SELECT 'Bookings',       COUNT(*) FROM Bookings
UNION ALL SELECT 'Service_Orders', COUNT(*) FROM Service_Orders
UNION ALL SELECT 'Payments',       COUNT(*) FROM Payments;

SELECT status, COUNT(*) AS bookings FROM Bookings GROUP BY status;

SELECT 'Arrivals today'   AS today, COUNT(*) AS total FROM Bookings WHERE status = 'Confirmed'  AND check_in  = CURDATE()
UNION ALL SELECT 'Departures today', COUNT(*) FROM Bookings WHERE status = 'Checked-In' AND check_out = CURDATE()
UNION ALL SELECT 'In-house guests',  COUNT(*) FROM Bookings WHERE status = 'Checked-In'
UNION ALL SELECT 'Arriving in 7 days', COUNT(*) FROM Bookings
          WHERE status = 'Confirmed' AND check_in BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY);

SELECT status AS room_status, COUNT(*) AS rooms FROM Rooms GROUP BY status;
