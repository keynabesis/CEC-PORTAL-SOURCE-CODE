USE cec_portal;
CREATE TABLE IF NOT EXISTS enrollment_lock (id INT PRIMARY KEY) ENGINE=InnoDB;
INSERT IGNORE INTO enrollment_lock (id) VALUES (1);
