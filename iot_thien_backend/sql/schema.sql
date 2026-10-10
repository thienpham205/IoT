-- Schema theo Chương 2.6 (Thiết kế cơ sở dữ liệu) của báo cáo IOT_Thien.
-- github_link được bổ sung ngoài bảng users trong docx vì giao diện Profile
-- (theo yêu cầu thiết kế của giảng viên) cần hiển thị thêm liên kết GitHub.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  user_id        INT AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(100) NOT NULL,
  student_id     VARCHAR(20)  UNIQUE,
  email          VARCHAR(100) UNIQUE,
  role           ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  github_link    VARCHAR(255),
  figma_link     VARCHAR(255),
  postman_link   VARCHAR(255),
  pdf_link       VARCHAR(255),
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sensors (
  sensor_id    INT AUTO_INCREMENT PRIMARY KEY,
  sensor_code  VARCHAR(30)  NOT NULL UNIQUE,
  sensor_name  VARCHAR(100) NOT NULL,
  sensor_type  VARCHAR(50)  NOT NULL,
  unit         VARCHAR(20),
  location     VARCHAR(100),
  status       ENUM('ACTIVE','WARNING') NOT NULL DEFAULT 'ACTIVE',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS devices (
  device_id    INT AUTO_INCREMENT PRIMARY KEY,
  device_code  VARCHAR(30)  NOT NULL UNIQUE,
  device_name  VARCHAR(100) NOT NULL,
  device_type  VARCHAR(50)  NOT NULL,
  location     VARCHAR(100),
  status       ENUM('ON','OFF') NOT NULL DEFAULT 'OFF',
  mode         ENUM('AUTO','MANUAL') NOT NULL DEFAULT 'MANUAL',
  last_seen    TIMESTAMP NULL,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sensor_data (
  data_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  sensor_id    INT NOT NULL,
  temperature  DECIMAL(5,2) NOT NULL,
  humidity     DECIMAL(5,2) NOT NULL,
  light        INT NOT NULL,
  status       ENUM('NORMAL','WARNING') NOT NULL DEFAULT 'NORMAL',
  recorded_at  TIMESTAMP NOT NULL,
  CONSTRAINT fk_sensor_data_sensor FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id),
  CONSTRAINT chk_temperature CHECK (temperature BETWEEN -40 AND 125),
  CONSTRAINT chk_humidity CHECK (humidity BETWEEN 0 AND 100),
  CONSTRAINT chk_light CHECK (light >= 0),
  INDEX idx_sensor_data_recorded_at (recorded_at),
  INDEX idx_sensor_data_sensor_id (sensor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS action_history (
  history_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  action_code      VARCHAR(36) NOT NULL UNIQUE,
  device_id        INT NOT NULL,
  user_id          INT NOT NULL,
  action           VARCHAR(20) NOT NULL,
  requested_state  VARCHAR(20) NOT NULL,
  result           ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
  area             VARCHAR(100),
  action_time      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at     TIMESTAMP NULL,
  CONSTRAINT fk_action_history_device FOREIGN KEY (device_id) REFERENCES devices(device_id),
  CONSTRAINT fk_action_history_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  INDEX idx_action_history_action_time (action_time),
  INDEX idx_action_history_device_id (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
