-- ============================================================
-- Migration: เพิ่มตารางจาก my-learning-app เข้า MySQL
-- สร้างตารางใหม่สำหรับระบบเรียนรู้ Python
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;

-- ============================================================
-- 1. เพิ่มคอลัมน์ใน users สำหรับระบบ learning
-- ============================================================

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `email` varchar(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `role` varchar(20) DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS `level` int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `xp` int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `virtual_currency` int DEFAULT 0;


-- ============================================================
-- 2. ตาราง modules (หมวดบทเรียน)
-- ============================================================

CREATE TABLE IF NOT EXISTS `modules` (
  `module_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `required_level` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `modules` (`module_id`, `title`, `order_index`, `required_level`) VALUES
(1, 'พื้นฐาน Python', 1, 0),
(2, 'ตัวแปรและชนิดข้อมูล', 2, 0),
(3, 'เงื่อนไขและลูป', 3, 2),
(4, 'ฟังก์ชัน', 4, 4),
(5, 'โครงสร้างข้อมูล', 5, 6),
(6, 'ไฟล์และ Exception', 6, 8);


-- ============================================================
-- 3. ตาราง lessons (บทเรียนแต่ละบท)
-- ============================================================

CREATE TABLE IF NOT EXISTS `lessons` (
  `lesson_id` int(11) NOT NULL AUTO_INCREMENT,
  `module_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `required_level` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`lesson_id`),
  KEY `idx_lessons_module` (`module_id`),
  CONSTRAINT `fk_lessons_module` FOREIGN KEY (`module_id`) REFERENCES `modules` (`module_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `lessons` (`lesson_id`, `module_id`, `title`, `order_index`, `required_level`) VALUES
-- Module 1: พื้นฐาน Python
(1, 1, 'Hello World & print()', 1, 0),
(2, 1, 'Comments และการเขียนโค้ด', 2, 0),
(3, 1, 'Input จากผู้ใช้', 3, 0),
-- Module 2: ตัวแปรและชนิดข้อมูล
(4, 2, 'ตัวแปร (Variables)', 1, 0),
(5, 2, 'ชนิดข้อมูล (Data Types)', 2, 0),
(6, 2, 'Type Conversion', 3, 0),
-- Module 3: เงื่อนไขและลูป
(7, 3, 'If-Else', 1, 2),
(8, 3, 'For Loop', 2, 2),
(9, 3, 'While Loop', 3, 3),
-- Module 4: ฟังก์ชัน
(10, 4, 'การสร้างฟังก์ชัน', 1, 4),
(11, 4, 'Parameters & Return', 2, 5),
-- Module 5: โครงสร้างข้อมูล
(12, 5, 'List', 1, 6),
(13, 5, 'Dictionary', 2, 7),
-- Module 6: ไฟล์และ Exception
(14, 6, 'อ่าน/เขียนไฟล์', 1, 8),
(15, 6, 'Try-Except', 2, 9);


-- ============================================================
-- 4. ตาราง lesson_slides (สไลด์ในแต่ละบทเรียน)
-- ============================================================

CREATE TABLE IF NOT EXISTS `lesson_slides` (
  `slide_id` int(11) NOT NULL AUTO_INCREMENT,
  `lesson_id` int(11) NOT NULL,
  `slide_order` int(11) NOT NULL DEFAULT 0,
  `slide_title` varchar(200) DEFAULT NULL,
  `slide_content` text DEFAULT NULL,
  `slide_src` varchar(500) DEFAULT NULL,
  `slide_type` varchar(20) DEFAULT 'text',
  PRIMARY KEY (`slide_id`),
  KEY `idx_slides_lesson` (`lesson_id`),
  CONSTRAINT `fk_slides_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`lesson_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ตัวอย่างสไลด์สำหรับบทเรียนที่ 1 (Hello World)
INSERT INTO `lesson_slides` (`lesson_id`, `slide_order`, `slide_title`, `slide_content`, `slide_src`, `slide_type`) VALUES
(1, 1, 'Python คืออะไร?', 'Python เป็นภาษาโปรแกรมที่ใช้งานง่าย เหมาะสำหรับผู้เริ่มต้น\nสร้างโดย Guido van Rossum ในปี 1991', '/gif/first_print.gif', 'text'),
(1, 2, 'คำสั่ง print()', 'ใช้คำสั่ง print() เพื่อแสดงผลลัพธ์\nตัวอย่าง: print("Hello World!")', NULL, 'text'),
(1, 3, 'ลองเขียนโค้ด', 'print("Hello World!")\nprint("สวัสดีชาว Python!")', NULL, 'code'),
-- ตัวอย่างสไลด์สำหรับบทเรียนที่ 2 (Comments)
(2, 1, 'Comments คืออะไร?', 'Comments คือข้อความอธิบายโค้ดที่ Python จะข้ามไม่ประมวลผล\nใช้เครื่องหมาย # นำหน้า', '/gif/comments.gif', 'text'),
(2, 2, 'ตัวอย่าง Comment', '# นี่คือ Comment\nprint("Hello") # Comment ท้ายบรรทัด\n\n# หลายบรรทัด\n# ใช้ # หลายตัว', NULL, 'code'),
-- ตัวอย่างสไลด์สำหรับบทเรียนที่ 3 (Input)
(3, 1, 'รับข้อมูลจากผู้ใช้', 'ใช้คำสั่ง input() เพื่อรับข้อมูลจาก keyboard\nข้อมูลที่ได้จะเป็น string เสมอ', '/gif/input.gif', 'text'),
(3, 2, 'ลองเขียน Input', 'name = input("ชื่ออะไร: ")\nprint("สวัสดี", name)', NULL, 'code'),
-- ตัวอย่างสไลด์สำหรับบทเรียนที่ 4 (Variables)
(4, 1, 'ตัวแปรคืออะไร?', 'ตัวแปร (Variable) คือ "กล่อง" เก็บข้อมูล\nใน Python ไม่ต้องประกาศชนิดล่วงหน้า', '/gif/python4.gif', 'text'),
(4, 2, 'การตั้งชื่อตัวแปร', 'x = 10\nname = "John"\nmy_list = [1, 2, 3]\n\n# กฎการตั้งชื่อ:\n# - เริ่มด้วยตัวอักษรหรือ _\n# - ห้ามเริ่มด้วยตัวเลข\n# - case-sensitive', NULL, 'code'),
-- บทเรียนที่ 6 (Type Conversion)
(6, 1, 'Type Conversion', 'การแปลงชนิดข้อมูล เช่น str เป็น int\nใช้ int(), float(), str()', '/gif/typeconversion.gif', 'text'),
(6, 2, 'ตัวอย่าง Type Conversion', 'x = "100"\ny = int(x)  # แปลง str เป็น int\nprint(y + 50)  # ผลลัพธ์ 150\n\nz = float("3.14")\nprint(z)  # 3.14', NULL, 'code');


-- ============================================================
-- 5. ตาราง lesson_quizzes (ข้อสอบก่อน/หลังเรียน)
-- ============================================================

CREATE TABLE IF NOT EXISTS `lesson_quizzes` (
  `quiz_id` int(11) NOT NULL AUTO_INCREMENT,
  `lesson_id` int(11) NOT NULL,
  `quiz_type` varchar(10) NOT NULL DEFAULT 'pre',
  PRIMARY KEY (`quiz_id`),
  KEY `idx_quizzes_lesson` (`lesson_id`),
  CONSTRAINT `fk_quizzes_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`lesson_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Pre/Post test สำหรับบทเรียนที่ 1
INSERT INTO `lesson_quizzes` (`quiz_id`, `lesson_id`, `quiz_type`) VALUES
(1, 1, 'pre'),
(2, 1, 'post'),
(3, 2, 'pre'),
(4, 2, 'post'),
(5, 3, 'pre'),
(6, 3, 'post');


-- ============================================================
-- 6. ตาราง quiz_questions (คำถามในข้อสอบ)
-- ============================================================

CREATE TABLE IF NOT EXISTS `quiz_questions` (
  `question_id` int(11) NOT NULL AUTO_INCREMENT,
  `quiz_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `question_type` varchar(20) NOT NULL DEFAULT 'choice',
  `correct_answer` text NOT NULL,
  `question_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`question_id`),
  KEY `idx_questions_quiz` (`quiz_id`),
  CONSTRAINT `fk_questions_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `lesson_quizzes` (`quiz_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- คำถาม Pre-Test บทที่ 1
INSERT INTO `quiz_questions` (`quiz_id`, `question_text`, `question_type`, `correct_answer`, `question_order`) VALUES
(1, 'คำสั่งใดใช้แสดงผลข้อความใน Python?', 'choice', 'print()', 1),
(1, 'ผลลัพธ์ของ print("Hello") คืออะไร?', 'fill', 'Hello', 2),
-- คำถาม Post-Test บทที่ 1
(2, 'print("Python") จะแสดงผลอะไร?', 'fill', 'Python', 1),
(2, 'คำสั่งใดถูกต้อง?', 'choice', 'print("สวัสดี")', 2),
(2, 'Python เป็นภาษาแบบใด?', 'choice', 'Interpreted', 3),
-- คำถาม Pre-Test บทที่ 2 (Comments)
(3, 'Comment ใน Python ใช้เครื่องหมายอะไร?', 'choice', '#', 1),
(3, 'Comment มีผลต่อการทำงานของโปรแกรมหรือไม่?', 'choice', 'ไม่มีผล', 2),
-- คำถาม Post-Test บทที่ 2
(4, 'เครื่องหมาย # ใน Python มีความหมายว่าอะไร?', 'choice', 'Comment', 1),
(4, 'บรรทัดใดเป็น Comment ที่ถูกต้อง?', 'choice', '# This is a comment', 2),
-- คำถาม Pre-Test บทที่ 3 (Input)
(5, 'คำสั่งใดใช้รับข้อมูลจากผู้ใช้?', 'choice', 'input()', 1),
(5, 'ผลลัพธ์ของ input() มีชนิดข้อมูลเป็นอะไร?', 'choice', 'str', 2),
-- คำถาม Post-Test บทที่ 3
(6, 'name = input("ชื่อ: ") ค่าของ name เป็นชนิดใด?', 'choice', 'str', 1),
(6, 'ถ้าต้องการรับตัวเลขจาก input ต้องทำอย่างไร?', 'choice', 'ใช้ int(input())', 2);


-- ============================================================
-- 7. ตาราง question_choices (ตัวเลือกของคำถาม choice)
-- ============================================================

CREATE TABLE IF NOT EXISTS `question_choices` (
  `choice_id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `choice_text` varchar(500) NOT NULL,
  PRIMARY KEY (`choice_id`),
  KEY `idx_choices_question` (`question_id`),
  CONSTRAINT `fk_choices_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`question_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ตัวเลือกสำหรับ Pre-Test บทที่ 1, ข้อ 1
INSERT INTO `question_choices` (`question_id`, `choice_text`) VALUES
(1, 'print()'),
(1, 'echo()'),
(1, 'write()'),
(1, 'console.log()'),
-- Post-Test บทที่ 1, ข้อ 2
(4, 'print("สวัสดี")'),
(4, 'echo("สวัสดี")'),
(4, 'say "สวัสดี"'),
(4, 'output("สวัสดี")'),
-- Post-Test บทที่ 1, ข้อ 3
(5, 'Compiled'),
(5, 'Interpreted'),
(5, 'Assembly'),
(5, 'Machine Language'),
-- Pre-Test บทที่ 2, ข้อ 1
(6, '#'),
(6, '//'),
(6, '/*'),
(6, '--'),
-- Pre-Test บทที่ 2, ข้อ 2
(7, 'ไม่มีผล'),
(7, 'ทำให้โปรแกรมเร็วขึ้น'),
(7, 'ทำให้เกิด Error'),
(7, 'แสดงผลบนหน้าจอ'),
-- Post-Test บทที่ 2, ข้อ 1
(8, 'Comment'),
(8, 'ตัวแปร'),
(8, 'ฟังก์ชัน'),
(8, 'Operator'),
-- Post-Test บทที่ 2, ข้อ 2
(9, '# This is a comment'),
(9, '// This is a comment'),
(9, '/* This is a comment */'),
(9, '-- This is a comment'),
-- Pre-Test บทที่ 3, ข้อ 1
(10, 'input()'),
(10, 'read()'),
(10, 'scanf()'),
(10, 'get()'),
-- Pre-Test บทที่ 3, ข้อ 2
(11, 'str'),
(11, 'int'),
(11, 'float'),
(11, 'bool'),
-- Post-Test บทที่ 3, ข้อ 1
(12, 'str'),
(12, 'int'),
(12, 'float'),
(12, 'list'),
-- Post-Test บทที่ 3, ข้อ 2
(13, 'ใช้ int(input())'),
(13, 'ใช้ input(int)'),
(13, 'ใช้ number(input())'),
(13, 'ไม่ต้องทำอะไร');


-- ============================================================
-- 8. ตาราง survey_questions (คำถามแบบสำรวจ)
-- ============================================================

CREATE TABLE IF NOT EXISTS `survey_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `survey_questions` (`id`, `title`, `description`, `image`) VALUES
(1, 'คุณเรียนรู้ได้ดีที่สุดด้วยวิธีใด?', 'เราจะปรับเส้นทางการเรียนรู้ให้เหมาะกับคุณ', 'cat-coding.png'),
(2, 'คุณอยากเรียน Python ไปทำอะไร?', 'เป้าหมายจะช่วยให้เราแนะนำเนื้อหาที่เหมาะกับคุณ', 'cat-mascot.png'),
(3, 'ประสบการณ์ของคุณ', 'เลือกระดับที่ตรงกับคุณมากที่สุด', 'cat-logo.png');


-- ============================================================
-- 9. ตาราง survey_options (ตัวเลือกแบบสำรวจ)
-- ============================================================

CREATE TABLE IF NOT EXISTS `survey_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `option_text` varchar(200) NOT NULL,
  `option_description` varchar(500) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_survey_opts_question` (`question_id`),
  CONSTRAINT `fk_survey_opts_question` FOREIGN KEY (`question_id`) REFERENCES `survey_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `survey_options` (`question_id`, `option_text`, `option_description`, `order`) VALUES
(1, 'ดูวิดีโอ', 'เรียนรู้ผ่านวิดีโอและตัวอย่าง', 1),
(1, 'ลงมือทำ', 'เรียนรู้ผ่านการฝึกเขียนโค้ดจริง', 2),
(1, 'อ่านบทความ', 'เรียนรู้ผ่านเนื้อหาและเอกสาร', 3),
(2, 'พัฒนาเว็บไซต์', 'สร้างเว็บแอปพลิเคชัน', 1),
(2, 'วิเคราะห์ข้อมูล', 'Data Science & Analytics', 2),
(2, 'สร้างเกม', 'Game Development', 3),
(2, 'ทั่วไป', 'เรียนรู้พื้นฐานเพื่อใช้งานทั่วไป', 4);


-- ============================================================
-- 10. ตาราง level_config (ตัวเลือกระดับประสบการณ์)
-- ============================================================

CREATE TABLE IF NOT EXISTS `level_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `option_description` varchar(500) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `level` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_level_config_question` (`question_id`),
  CONSTRAINT `fk_level_config_question` FOREIGN KEY (`question_id`) REFERENCES `survey_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `level_config` (`question_id`, `title`, `option_description`, `order`, `level`) VALUES
(3, 'Beginner', 'ไม่เคยเขียนโปรแกรมมาก่อนเลย', 1, 1),
(3, 'Advanced', 'เคยเขียน Python หรือภาษาอื่นมาบ้าง ต้องการข้ามบทพื้นฐาน', 2, 10);


-- ============================================================
-- 11. ตาราง advanced_validation (ข้อสอบวัดระดับ Advanced)
-- ============================================================

CREATE TABLE IF NOT EXISTS `advanced_validation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_text` text NOT NULL,
  `correct_answer` varchar(500) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `advanced_validation` (`question_text`, `correct_answer`) VALUES
('ผลลัพธ์ของ len([1, 2, 3]) คืออะไร?', '3'),
('คำสั่งใดใช้สร้าง Dictionary ว่าง?', '{}'),
('ผลลัพธ์ของ "Hello"[1] คืออะไร?', 'e'),
('คำสั่ง for i in range(3) จะวนลูปกี่รอบ?', '3'),
('ผลลัพธ์ของ type(3.14) คืออะไร?', "float"),
('try-except ใช้ทำอะไร?', 'จัดการ Error'),
('ฟังก์ชัน def greet(): return "Hi" เรียกใช้อย่างไร?', 'greet()'),
('list.append(x) ทำอะไร?', 'เพิ่ม x ต่อท้าย list'),
('ผลลัพธ์ของ 10 // 3 คืออะไร?', '3'),
('คำสั่ง import ใช้ทำอะไร?', 'นำเข้าโมดูล');

-- ตัวเลือกสำหรับข้อสอบ advanced_validation
CREATE TABLE IF NOT EXISTS `advanced_validation_choices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `choice_text` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_adv_choices_question` (`question_id`),
  CONSTRAINT `fk_adv_choices_question` FOREIGN KEY (`question_id`) REFERENCES `advanced_validation` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `advanced_validation_choices` (`question_id`, `choice_text`) VALUES
-- ข้อ 1: len([1, 2, 3])
(1, '3'), (1, '2'), (1, '4'), (1, 'Error'),
-- ข้อ 2: Dictionary ว่าง
(2, '{}'), (2, '[]'), (2, '()'), (2, 'dict[]'),
-- ข้อ 3: "Hello"[1]
(3, 'e'), (3, 'H'), (3, 'l'), (3, 'Error'),
-- ข้อ 4: range(3)
(4, '3'), (4, '2'), (4, '4'), (4, '1'),
-- ข้อ 5: type(3.14)
(5, 'float'), (5, 'int'), (5, 'str'), (5, 'double'),
-- ข้อ 6: try-except
(6, 'จัดการ Error'), (6, 'วนลูป'), (6, 'สร้างตัวแปร'), (6, 'นำเข้าไฟล์'),
-- ข้อ 7: def greet()
(7, 'greet()'), (7, 'call greet'), (7, 'run greet'), (7, 'def greet'),
-- ข้อ 8: list.append(x)
(8, 'เพิ่ม x ต่อท้าย list'), (8, 'ลบ x ออกจาก list'), (8, 'แทนที่ค่าใน list'), (8, 'สร้าง list ใหม่'),
-- ข้อ 9: 10 // 3
(9, '3'), (9, '3.33'), (9, '1'), (9, '10'),
-- ข้อ 10: import
(10, 'นำเข้าโมดูล'), (10, 'สร้างฟังก์ชัน'), (10, 'ลบไฟล์'), (10, 'แสดงผล');

COMMIT;
