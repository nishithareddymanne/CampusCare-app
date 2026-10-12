-- Optional: Hibernate (ddl-auto=update) creates all tables automatically, and the app can
-- create the database itself (createDatabaseIfNotExist=true). Run this only if you prefer
-- to prepare MySQL manually or want a dedicated user instead of root.

CREATE DATABASE IF NOT EXISTS campuscare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'campuscare'@'localhost' IDENTIFIED BY 'ChangeThisPassword1';
GRANT ALL PRIVILEGES ON campuscare.* TO 'campuscare'@'localhost';
FLUSH PRIVILEGES;

-- Departments are inserted by the application on startup (DataInitializer).
-- Equivalent SQL, in case you want to seed them manually after the tables exist:
-- INSERT INTO departments (name, contact_email) VALUES
--   ('Maintenance', 'maintenance@campuscare.edu'),
--   ('Hostel',      'hostel@campuscare.edu'),
--   ('Laboratory',  'laboratory@campuscare.edu'),
--   ('Facilities',  'facilities@campuscare.edu');

-- Useful checks
-- SELECT user_id, name, email, role FROM users;
-- SELECT complaint_id, title, status, department_id FROM complaints;
-- SELECT * FROM complaint_updates ORDER BY updated_at DESC;
