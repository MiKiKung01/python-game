-- ============================================================
-- Migration: Database Schema Redesign
-- python_coder_game — ปรับโครงสร้างฐานข้อมูลใหม่
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;

-- ============================================================
-- 1. สร้างตาราง shop_items (ต้องสร้างก่อนเพราะ users จะ FK ไปหา)
-- ============================================================

CREATE TABLE IF NOT EXISTS `shop_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('THEME','MOUSE_EFFECT','PROFILE_FRAME') NOT NULL,
  `rarity` enum('COMMON','RARE','EPIC','LEGENDARY') NOT NULL DEFAULT 'COMMON',
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `preview_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`preview_data`)),
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ข้อมูลเริ่มต้น shop_items (cosmetics ตัวอย่าง)
INSERT INTO `shop_items` (`name`, `description`, `type`, `rarity`, `price`, `preview_data`) VALUES
('Default Theme', 'ธีมเริ่มต้นของเกม', 'THEME', 'COMMON', 0.00, '{"css_class": "theme-default"}'),
('Neon Cyberpunk', 'ธีมสีนีออนสไตล์ Cyberpunk', 'THEME', 'RARE', 500.00, '{"css_class": "theme-neon-cyberpunk"}'),
('Hacker Terminal', 'ธีมสไตล์ Terminal สีเขียว', 'THEME', 'EPIC', 1500.00, '{"css_class": "theme-hacker"}'),

('Default Cursor', 'เคอร์เซอร์เมาส์ปกติ', 'MOUSE_EFFECT', 'COMMON', 0.00, '{"effect": "none"}'),
('Sparkle Trail', 'เมาส์มีประกายแวววาว', 'MOUSE_EFFECT', 'RARE', 300.00, '{"effect": "sparkle", "color": "#FFD700"}'),
('Fire Trail', 'เมาส์มีเปลวไฟตามหลัง', 'MOUSE_EFFECT', 'EPIC', 800.00, '{"effect": "fire", "color": "#FF4500"}'),
('Matrix Rain', 'ตัวอักษรตกลงมาตามเมาส์', 'MOUSE_EFFECT', 'LEGENDARY', 2500.00, '{"effect": "matrix", "color": "#00FF00"}'),

('Basic Frame', 'กรอบโปรไฟล์พื้นฐาน', 'PROFILE_FRAME', 'COMMON', 0.00, '{"border": "2px solid #888"}'),
('Gold Frame', 'กรอบโปรไฟล์สีทอง', 'PROFILE_FRAME', 'RARE', 400.00, '{"border": "3px solid #FFD700", "glow": true}'),
('Diamond Frame', 'กรอบโปรไฟล์เพชร', 'PROFILE_FRAME', 'EPIC', 1200.00, '{"border": "3px solid #00BFFF", "glow": true, "animation": "shimmer"}'),
('Legendary Frame', 'กรอบโปรไฟล์ตำนาน — เปลี่ยนสีอัตโนมัติ', 'PROFILE_FRAME', 'LEGENDARY', 3000.00, '{"border": "4px solid", "glow": true, "animation": "rainbow-cycle"}');


-- ============================================================
-- 2. แก้ไขตาราง users — เพิ่ม cosmetics, ลบ simulation fields
-- ============================================================

-- เพิ่ม cosmetics columns
ALTER TABLE `users`
  ADD COLUMN `equipped_theme_id` int(11) DEFAULT NULL AFTER `current_location_id`,
  ADD COLUMN `equipped_mouse_effect_id` int(11) DEFAULT NULL AFTER `equipped_theme_id`,
  ADD COLUMN `equipped_profile_frame_id` int(11) DEFAULT NULL AFTER `equipped_mouse_effect_id`,
  ADD COLUMN `avatar_url` varchar(255) DEFAULT NULL AFTER `equipped_profile_frame_id`,
  ADD COLUMN `bio` varchar(500) DEFAULT NULL AFTER `avatar_url`;

-- FK constraints สำหรับ cosmetics
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_theme` FOREIGN KEY (`equipped_theme_id`) REFERENCES `shop_items` (`item_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_users_mouse_effect` FOREIGN KEY (`equipped_mouse_effect_id`) REFERENCES `shop_items` (`item_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_users_profile_frame` FOREIGN KEY (`equipped_profile_frame_id`) REFERENCES `shop_items` (`item_id`) ON DELETE SET NULL;


-- ============================================================
-- 3. สร้างตาราง simulation_saves
-- ============================================================

CREATE TABLE IF NOT EXISTS `simulation_saves` (
  `save_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `save_name` varchar(50) NOT NULL DEFAULT 'Save 1',
  `sim_money` decimal(15,2) NOT NULL DEFAULT 0.00,
  `sim_reputation` int(11) NOT NULL DEFAULT 10,
  `battery_percent` int(11) NOT NULL DEFAULT 100,
  `is_plugged_in` tinyint(1) NOT NULL DEFAULT 1,
  `current_location_id` int(11) DEFAULT 1,
  `current_day` int(11) NOT NULL DEFAULT 1,
  `current_hour` decimal(4,1) NOT NULL DEFAULT 8.0,
  `jobs_completed` int(11) NOT NULL DEFAULT 0,
  `jobs_failed` int(11) NOT NULL DEFAULT 0,
  `total_earned` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_spent` decimal(15,2) NOT NULL DEFAULT 0.00,
  `environment_status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`environment_status`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`save_id`),
  KEY `idx_sim_saves_user` (`user_id`),
  KEY `idx_sim_saves_active` (`user_id`, `is_active`),
  CONSTRAINT `fk_sim_saves_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sim_saves_location` FOREIGN KEY (`current_location_id`) REFERENCES `locations` (`location_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Migrate ข้อมูลเดิมจาก users → simulation_saves
INSERT INTO `simulation_saves` (`user_id`, `save_name`, `sim_money`, `sim_reputation`, `battery_percent`, `is_plugged_in`, `current_location_id`, `environment_status`)
SELECT `user_id`, 'Auto Save', `current_money`, `reputation`, `battery_current_charge`, `is_plugged_in`, `current_location_id`, `environment_status`
FROM `users`;


-- ============================================================
-- 4. สร้างตาราง random_events
-- ============================================================

CREATE TABLE IF NOT EXISTS `random_events` (
  `event_id` int(11) NOT NULL AUTO_INCREMENT,
  `event_key` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `effect_type` enum('POWER_CUT','INTERNET_CUT','BATTERY_DRAIN','SPEED_BOOST','MONEY_LOSS') NOT NULL,
  `severity` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
  `base_chance_percent` int(11) NOT NULL DEFAULT 5,
  `duration_minutes` int(11) DEFAULT NULL COMMENT 'NULL = ถาวรจนจบวัน',
  `force_skip_day` tinyint(1) NOT NULL DEFAULT 0,
  `auto_resolve` tinyint(1) NOT NULL DEFAULT 0,
  `affected_systems` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`affected_systems`)),
  PRIMARY KEY (`event_id`),
  UNIQUE KEY `uk_event_key` (`event_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ข้อมูลเริ่มต้น random events
INSERT INTO `random_events` (`event_key`, `name`, `description`, `effect_type`, `severity`, `base_chance_percent`, `duration_minutes`, `force_skip_day`, `auto_resolve`, `affected_systems`) VALUES
('BLACKOUT', '⚡ ไฟฟ้าดับ', 'ไฟฟ้าดับกะทันหัน! โน๊ตบุ๊คจะไม่ถูกชาร์จ หากแบตหมดจะบังคับข้ามไปวันถัดไป ข้อมูลที่ไม่ได้ save จะหายไป', 'POWER_CUT', 'CRITICAL', 0, NULL, 1, 0, '["charging","save_warning"]'),
('INTERNET_DOWN', '🌐 อินเทอร์เน็ตขัดข้อง', 'อินเทอร์เน็ตเกิดปัญหา! ไม่สามารถเข้าหน้าเว็บงานได้ ส่งงานหรือรับงานไม่ได้ชั่วคราว', 'INTERNET_CUT', 'MEDIUM', 8, 30, 0, 1, '["job_browse","job_submit","job_accept"]'),
('HEAVY_RAIN', '🌧️ ฝนตกหนัก', 'ฝนตกหนัก! สัญญาณอินเทอร์เน็ตไม่เสถียร อาจใช้งานเว็บได้ช้าลง', 'INTERNET_CUT', 'LOW', 15, 15, 0, 1, '["job_browse","job_submit"]'),
('LAPTOP_OVERHEAT', '🔥 โน๊ตบุ๊คร้อนจัด', 'โน๊ตบุ๊คร้อนมาก! แบตเตอรี่จะหมดเร็วขึ้น 2 เท่า', 'BATTERY_DRAIN', 'MEDIUM', 5, 20, 0, 1, '["battery_drain_rate"]'),
('ELECTRICITY_BILL', '💸 ค่าไฟเพิ่มขึ้น', 'ได้รับแจ้งเตือน ค่าไฟฟ้าเดือนนี้สูงผิดปกติ! ถูกหักเงินเพิ่ม', 'MONEY_LOSS', 'LOW', 3, 0, 0, 1, '["money"]'),
('CAFE_DISCOUNT', '☕ โปรโมชั่นร้านกาแฟ', 'ร้าน Starbugs Cafe มีโปรลดราคา! ทำงานได้เร็วขึ้น 20%', 'SPEED_BOOST', 'LOW', 10, 30, 0, 1, '["work_speed"]');


-- ============================================================
-- 5. สร้างตาราง simulation_active_events
-- ============================================================

CREATE TABLE IF NOT EXISTS `simulation_active_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `save_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_resolved` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_active_events_save` (`save_id`, `is_resolved`),
  CONSTRAINT `fk_active_events_save` FOREIGN KEY (`save_id`) REFERENCES `simulation_saves` (`save_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_active_events_event` FOREIGN KEY (`event_id`) REFERENCES `random_events` (`event_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================
-- 6. สร้างตาราง user_inventory
-- ============================================================

CREATE TABLE IF NOT EXISTS `user_inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `purchased_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_item` (`user_id`, `item_id`),
  KEY `idx_inventory_user` (`user_id`),
  CONSTRAINT `fk_inventory_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inventory_item` FOREIGN KEY (`item_id`) REFERENCES `shop_items` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================
-- 7. สร้างตาราง user_profile_showcase
-- ============================================================

CREATE TABLE IF NOT EXISTS `user_profile_showcase` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `achievement_id` int(11) NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_achievement_showcase` (`user_id`, `achievement_id`),
  KEY `idx_showcase_user` (`user_id`),
  CONSTRAINT `fk_showcase_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_showcase_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`achievement_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================
-- 8. ปรับ simulation_logs เพิ่ม save_id, event_id
-- ============================================================

ALTER TABLE `simulation_logs`
  ADD COLUMN `save_id` int(11) DEFAULT NULL AFTER `user_id`,
  ADD COLUMN `event_id` int(11) DEFAULT NULL AFTER `save_id`;

ALTER TABLE `simulation_logs`
  ADD CONSTRAINT `fk_sim_logs_save` FOREIGN KEY (`save_id`) REFERENCES `simulation_saves` (`save_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_sim_logs_event` FOREIGN KEY (`event_id`) REFERENCES `random_events` (`event_id`) ON DELETE SET NULL;


-- ============================================================
-- 9. ลบ simulation columns ออกจาก users (ย้ายไป simulation_saves แล้ว)
-- ============================================================

ALTER TABLE `users`
  DROP COLUMN `battery_current_charge`,
  DROP COLUMN `is_plugged_in`,
  DROP COLUMN `environment_status`,
  DROP COLUMN `current_location_id`,
  DROP COLUMN `current_money`,
  DROP COLUMN `due_date`;


COMMIT;
