export const ROOM_DISPLAY_STATUS_SQL = `CASE
  WHEN r.status = 'Maintenance' THEN 'Maintenance'
  WHEN EXISTS (
    SELECT 1 FROM Bookings rs
    WHERE rs.room_no = r.room_no AND rs.status = 'Checked-In'
  ) THEN 'Occupied'
  WHEN EXISTS (
    SELECT 1 FROM Bookings rs
    WHERE rs.room_no = r.room_no
      AND rs.status = 'Confirmed'
      AND rs.check_out > CURDATE()
  ) THEN 'Reserved'
  ELSE 'Available'
END`;
