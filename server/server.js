// server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());
const db = require('./db');

// ==========================================
// Password Validation Helper
// ==========================================
const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('ต้องมีอย่างน้อย 8 ตัวอักษร');
    if (!/[A-Z]/.test(password)) errors.push('ต้องมีตัวพิมพ์ใหญ่ (A-Z)');
    if (!/[a-z]/.test(password)) errors.push('ต้องมีตัวพิมพ์เล็ก (a-z)');
    if (!/[0-9]/.test(password)) errors.push('ต้องมีตัวเลข (0-9)');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('ต้องมีอักขระพิเศษ');
    return errors;
};

// ==========================================
// Email Transporter (Nodemailer)
// ==========================================
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
    }
});

// ถ้าไม่มี config ให้ใช้ Console Mode
const EMAIL_CONFIGURED = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);


// ==========================================
// 1. API: Login / Register / User Management
// ==========================================

app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (username, password_hash, email, role, level, xp, virtual_currency) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, hash, email || null, 'user', 0, 0, 0]
        );
        res.status(201).json({ message: 'Register Success', user: { user_id: result.insertId, username, level: 1 } });
    } catch (err) {
        console.error('❌ Register Error:', err.message);
        res.status(500).json({ error: 'Username already exists', message: 'Username หรือ Email นี้ถูกใช้ไปแล้ว' });
    }
});

// Friend's Login API (compatible format)
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    if (!email || !email.includes('@')) {
        return res.status(400).json({ message: 'กรุณากรอกอีเมลที่ถูกต้อง' });
    }

    // Server-side password validation
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
        return res.status(400).json({ message: `รหัสผ่านไม่ผ่านเกณฑ์: ${passwordErrors.join(', ')}` });
    }

    try {
        const [existing] = await db.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Username หรือ Email นี้ถูกใช้ไปแล้ว' });

        const hash = await bcrypt.hash(password, 10);
        // level = 0 → บังคับให้ทำ survey หลัง login
        const [result] = await db.execute(
            'INSERT INTO users (username, password_hash, email, role, level, xp, virtual_currency) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, hash, email, 'user', 0, 0, 0]
        );

        // สร้าง Email Verification Token
        const verifyToken = crypto.randomBytes(32).toString('hex');
        await db.execute(
            'INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
            [result.insertId, verifyToken]
        );

        // ส่ง Verification Email
        const verifyUrl = `http://localhost:3001/api/verify-email/${verifyToken}`;
        if (EMAIL_CONFIGURED) {
            await emailTransporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: '🐍 Python Coder Game — ยืนยันอีเมล',
                html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:20px">
                    <h2>ยินดีต้อนรับ ${username}!</h2>
                    <p>กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
                    <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;font-weight:bold">ยืนยันอีเมล</a>
                    <p style="color:#888;margin-top:20px;font-size:12px">ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง</p>
                </div>`
            });
            console.log(`📧 ส่ง Verification Email ไปที่ ${email}`);
        } else {
            console.log(`📧 [MOCK] Verification Link: ${verifyUrl}`);
        }

        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยัน' });
    } catch (err) {
        console.error('❌ Register Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length > 0 && await bcrypt.compare(password, users[0].password_hash)) {
            res.json({
                success: true,
                user_id: users[0].user_id,
                username: users[0].username,
                email: users[0].email,
                role: users[0].role || 'user',
                level: users[0].level || 1,
                xp: users[0].xp || 0,
                user: { id: users[0].user_id, username: users[0].username }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('❌ Login Error:', err.message);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.post('/user/update', async (req, res) => {
    const { userId, newName } = req.body;
    try {
        await db.execute('UPDATE users SET username = ? WHERE user_id = ?', [newName, userId]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// ==========================================
// 2. API: Simulation & Save/Load
// ==========================================

// ดึงสถานะล่าสุดจาก simulation_saves (แบตเตอรี่, เงิน, ไฟดับ, events)
app.get('/simulation/status/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT s.*, l.name as location_name, l.power_reliability, l.internet_speed
            FROM simulation_saves s
            LEFT JOIN locations l ON s.current_location_id = l.location_id
            WHERE s.user_id = ? AND s.is_active = 1
            LIMIT 1
        `, [userId]);

        if (rows.length === 0) return res.status(404).json({ error: 'No active save found' });

        const save = rows[0];
        if (typeof save.environment_status === 'string') {
            save.environment_status = JSON.parse(save.environment_status);
        }

        // ดึง active events ที่ยังไม่ resolved
        const [activeEvents] = await db.execute(`
            SELECT ae.*, re.event_key, re.name, re.description, re.effect_type, 
                   re.severity, re.force_skip_day, re.auto_resolve, re.affected_systems
            FROM simulation_active_events ae
            JOIN random_events re ON ae.event_id = re.event_id
            WHERE ae.save_id = ? AND ae.is_resolved = 0
        `, [save.save_id]);

        // Parse JSON fields ใน events
        activeEvents.forEach(e => {
            if (typeof e.affected_systems === 'string') e.affected_systems = JSON.parse(e.affected_systems);
        });

        res.json({ ...save, active_events: activeEvents });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// สั่งเสียบปลั๊ก / ถอดปลั๊ก
app.post('/simulation/toggle-plug', async (req, res) => {
    const { userId, isPluggedIn } = req.body;
    try {
        await db.execute(
            'UPDATE simulation_saves SET is_plugged_in = ? WHERE user_id = ? AND is_active = 1',
            [isPluggedIn, userId]
        );
        res.json({ success: true, isPluggedIn });
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle plug' });
    }
});

// ดึง Log เหตุการณ์ล่าสุด
app.get('/simulation/logs/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [logs] = await db.execute(`
            SELECT sl.*, re.name as event_name, re.severity
            FROM simulation_logs sl
            LEFT JOIN random_events re ON sl.event_id = re.event_id
            WHERE sl.user_id = ?
            ORDER BY sl.created_at DESC LIMIT 10
        `, [userId]);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// ดึงรายการ saves ทั้งหมดของ user
app.get('/simulation/saves/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [saves] = await db.execute(
            'SELECT save_id, save_name, sim_money, current_day, current_hour, is_active, updated_at FROM simulation_saves WHERE user_id = ? ORDER BY updated_at DESC',
            [userId]
        );
        res.json(saves);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch saves' });
    }
});

// บันทึก simulation (Save)
app.post('/simulation/save', async (req, res) => {
    const { userId, saveName } = req.body;
    try {
        // ดึง active save ปัจจุบัน
        const [active] = await db.execute(
            'SELECT * FROM simulation_saves WHERE user_id = ? AND is_active = 1 LIMIT 1', [userId]
        );
        if (active.length === 0) return res.status(404).json({ error: 'No active simulation' });

        const save = active[0];
        if (saveName) {
            await db.execute('UPDATE simulation_saves SET save_name = ? WHERE save_id = ?', [saveName, save.save_id]);
        }
        // updated_at จะอัปเดตอัตโนมัติ
        await db.execute('UPDATE simulation_saves SET updated_at = CURRENT_TIMESTAMP WHERE save_id = ?', [save.save_id]);
        res.json({ success: true, save_id: save.save_id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save' });
    }
});

// โหลด simulation (Load) — เปลี่ยน active save
app.post('/simulation/load', async (req, res) => {
    const { userId, saveId } = req.body;
    try {
        // ปิด active save เดิมทั้งหมด
        await db.execute('UPDATE simulation_saves SET is_active = 0 WHERE user_id = ?', [userId]);
        // เปิด save ที่เลือก
        await db.execute('UPDATE simulation_saves SET is_active = 1 WHERE save_id = ? AND user_id = ?', [saveId, userId]);
        res.json({ success: true, save_id: saveId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load save' });
    }
});

// สร้าง save ใหม่ (New Game)
app.post('/simulation/new', async (req, res) => {
    const { userId, saveName } = req.body;
    try {
        // ปิด active save เดิมทั้งหมด
        await db.execute('UPDATE simulation_saves SET is_active = 0 WHERE user_id = ?', [userId]);
        // สร้าง save ใหม่
        const [result] = await db.execute(
            'INSERT INTO simulation_saves (user_id, save_name) VALUES (?, ?)',
            [userId, saveName || 'New Game']
        );
        res.json({ success: true, save_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create new save' });
    }
});

// ดึง active events ทั้งหมดในปัจจุบัน
app.get('/simulation/events/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [events] = await db.execute(`
            SELECT ae.*, re.event_key, re.name, re.description, re.effect_type,
                   re.severity, re.force_skip_day, re.auto_resolve, re.affected_systems, re.duration_minutes
            FROM simulation_active_events ae
            JOIN random_events re ON ae.event_id = re.event_id
            JOIN simulation_saves s ON ae.save_id = s.save_id
            WHERE s.user_id = ? AND s.is_active = 1 AND ae.is_resolved = 0
        `, [userId]);

        events.forEach(e => {
            if (typeof e.affected_systems === 'string') e.affected_systems = JSON.parse(e.affected_systems);
        });

        res.json(events);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// ==========================================
// 3. API: Achievements & Game Rooms (ของเดิม)
// ==========================================

app.get('/achievements/:userId', async (req, res) => {
    const userId = req.params.userId;
    const sql = `
        SELECT a.*,
            (SELECT COUNT(*) FROM user_achievements ua WHERE ua.achievement_id = a.achievement_id) * 100.0 / (SELECT COUNT(*) FROM users) as global_percent,
            CASE WHEN ua_me.id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked
        FROM achievements a
        LEFT JOIN user_achievements ua_me ON a.achievement_id = ua_me.achievement_id AND ua_me.user_id = ?
        ORDER BY CASE a.difficulty WHEN 'Medium' THEN 1 WHEN 'Hard' THEN 2 WHEN 'Very Hard' THEN 3 END ASC
    `;
    try {
        const [rows] = await db.execute(sql, [userId]);
        res.json(rows);
    } catch (err) {
        console.error('❌ Achievements Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
});

app.get('/rooms', async (req, res) => {
    const { search } = req.query;
    let sql = `SELECT * FROM game_rooms WHERE status = 'WAITING'`;
    let params = [];
    if (search) {
        sql += ` AND room_name LIKE ?`;
        params.push(`%${search}%`);
    }
    try {
        const [rooms] = await db.execute(sql, params);
        res.json(rooms);
    } catch (err) {
        console.error('❌ Rooms Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

app.post('/rooms/create', async (req, res) => {
    const { roomName, maxPlayers, password, hostId } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [roomResult] = await connection.execute(
            'INSERT INTO game_rooms (room_name, host_user_id, room_password, max_players, current_players) VALUES (?, ?, ?, ?, 1)',
            [roomName, hostId, password || null, maxPlayers]
        );
        const roomId = roomResult.insertId;
        await connection.execute(
            'INSERT INTO room_participants (room_id, user_id, is_ready) VALUES (?, ?, TRUE)',
            [roomId, hostId]
        );
        await connection.commit();
        res.json({ roomId });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: 'Failed to create room' });
    } finally {
        connection.release();
    }
});

app.get('/rooms/:roomId', async (req, res) => {
    const { roomId } = req.params;
    try {
        const [room] = await db.execute('SELECT * FROM game_rooms WHERE room_id = ?', [roomId]);
        if (room.length === 0) return res.status(404).json({ error: 'Room not found' });

        const [participants] = await db.execute(`
            SELECT u.user_id, u.username, rp.is_ready 
            FROM room_participants rp
            JOIN users u ON rp.user_id = u.user_id
            WHERE rp.room_id = ?
        `, [roomId]);

        res.json({ room: room[0], players: participants });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/rooms/join', async (req, res) => {
    const { roomId, userId } = req.body;
    try {
        const [check] = await db.execute('SELECT * FROM room_participants WHERE room_id = ? AND user_id = ?', [roomId, userId]);
        if (check.length === 0) {
            await db.execute('INSERT INTO room_participants (room_id, user_id) VALUES (?, ?)', [roomId, userId]);
            await db.execute('UPDATE game_rooms SET current_players = (SELECT COUNT(*) FROM room_participants WHERE room_id = ?) WHERE room_id = ?', [roomId, roomId]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to join' });
    }
});

app.post('/rooms/leave', async (req, res) => {
    const { roomId, userId } = req.body;
    try {
        await db.execute('DELETE FROM room_participants WHERE room_id = ? AND user_id = ?', [roomId, userId]);
        const [countResult] = await db.execute('SELECT COUNT(*) as count FROM room_participants WHERE room_id = ?', [roomId]);
        const remaining = countResult[0].count;

        if (remaining === 0) {
            await db.execute('DELETE FROM game_rooms WHERE room_id = ?', [roomId]);
            console.log(`Room ${roomId} deleted because it is empty.`);
        } else {
            await db.execute('UPDATE game_rooms SET current_players = ? WHERE room_id = ?', [remaining, roomId]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to leave' });
    }
});


//สวิตช์สลับโหมดดึงข้อมูล 
const USE_AI_GENERATOR = false;

//1. ดึงงานที่เปิดรับ (Job Feed) 
app.get('/jobs/available', async (req, res) => {
    const sql = "SELECT * FROM contracts WHERE status = 'OFFERED' ORDER BY created_at DESC";
    try {
        const [result] = await db.query(sql);
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

//2. รับงาน
app.post('/jobs/accept', async (req, res) => {
    const { jobId, userId } = req.body;
    try {
        //เช็คก่อนว่าผู้เล่นคนนี้ รับงานนี้ไปแล้วและยังทำไม่เสร็จหรือเปล่า?
        const checkSql = "SELECT * FROM user_contracts WHERE user_id = ? AND contract_id = ? AND status = 'ACTIVE'";
        const [existing] = await db.query(checkSql, [userId, jobId]);

        if (existing.length > 0) {
            return res.status(400).send({ message: "คุณกำลังทำงานนี้อยู่แล้ว ไปที่ My Contracts เพื่อทำต่อ" });
        }

        // บันทึกว่า User รับงานนี้
        const insertSql = "INSERT INTO user_contracts (user_id, contract_id, status) VALUES (?, ?, 'ACTIVE')";
        await db.query(insertSql, [userId, jobId]);

        res.send({ message: "รับงานสำเร็จ", jobId });
    } catch (err) {
        console.error("❌ SQL Error in /jobs/accept:", err);
        res.status(500).send(err);
    }
});

//3. ดึงงานที่กำลังทำอยู่ (My Contracts)
app.get('/jobs/my-active/:userId', async (req, res) => {
    // ดึงข้อมูลงาน จากตาราง contracts โดยเชื่อมกับ user_contracts
    const sql = `
        SELECT c.*, uc.accepted_at, uc.id as user_contract_id
        FROM user_contracts uc
        JOIN contracts c ON uc.contract_id = c.contract_id
        WHERE uc.user_id = ? AND uc.status = 'ACTIVE'
    `;
    try {
        const [result] = await db.query(sql, [req.params.userId]);
        res.send(result);
    } catch (err) {
        console.error("❌ SQL Error in /jobs/my-active:", err);
        res.status(500).send(err);
    }
});

//4. ส่งงาน (Submit Job)
app.post('/jobs/submit', async (req, res) => {
    const { jobId, userId, fileName } = req.body;
    if (!jobId || !userId) {
        return res.status(400).json({ error: 'jobId and userId are required' });
    }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. อัปเดตสถานะ user_contracts เป็น COMPLETED
        const [updateResult] = await connection.execute(
            "UPDATE user_contracts SET status = 'COMPLETED' WHERE user_id = ? AND contract_id = ? AND status = 'ACTIVE'",
            [userId, jobId]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'ไม่พบงานนี้ หรืองานถูกส่งไปแล้ว' });
        }

        // 2. ดึงข้อมูล reward ของงาน
        const [jobRows] = await connection.execute(
            'SELECT reward FROM contracts WHERE contract_id = ?', [jobId]
        );
        const reward = jobRows[0]?.reward || 0;

        // 3. เพิ่มเงินและ reputation ใน simulation_saves + เพิ่ม jobs_completed
        await connection.execute(
            `UPDATE simulation_saves 
             SET sim_money = sim_money + ?, sim_reputation = sim_reputation + ?,
                 jobs_completed = jobs_completed + 1, total_earned = total_earned + ?
             WHERE user_id = ? AND is_active = 1`,
            [reward, 5, reward, userId]
        );

        await connection.commit();
        res.json({ success: true, message: `ส่งงานสำเร็จ! ได้รับ ${reward} ฿`, reward });
    } catch (err) {
        await connection.rollback();
        console.error("❌ SQL Error in /jobs/submit:", err);
        res.status(500).json({ error: 'Failed to submit job' });
    } finally {
        connection.release();
    }
});

// ==========================================
// 5. API: Profile (Public)
// ==========================================

// ดึงข้อมูลโปรไฟล์สาธารณะ (cosmetics, showcase achievements)
app.get('/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [users] = await db.execute(`
            SELECT u.user_id, u.username, u.reputation, u.avatar_url, u.bio, u.created_at,
                   t.name as theme_name, t.preview_data as theme_data,
                   m.name as mouse_effect_name, m.preview_data as mouse_effect_data,
                   f.name as frame_name, f.preview_data as frame_data
            FROM users u
            LEFT JOIN shop_items t ON u.equipped_theme_id = t.item_id
            LEFT JOIN shop_items m ON u.equipped_mouse_effect_id = m.item_id
            LEFT JOIN shop_items f ON u.equipped_profile_frame_id = f.item_id
            WHERE u.user_id = ?
        `, [userId]);

        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = users[0];
        // Parse JSON preview data
        ['theme_data', 'mouse_effect_data', 'frame_data'].forEach(key => {
            if (typeof user[key] === 'string') user[key] = JSON.parse(user[key]);
        });

        // ดึง showcase achievements
        const [showcase] = await db.execute(`
            SELECT a.achievement_id, a.name, a.description, a.difficulty, a.reward_money,
                   ps.display_order
            FROM user_profile_showcase ps
            JOIN achievements a ON ps.achievement_id = a.achievement_id
            WHERE ps.user_id = ?
            ORDER BY ps.display_order ASC
            LIMIT 5
        `, [userId]);

        // ดึงสถิติ simulation ล่าสุด
        const [stats] = await db.execute(
            'SELECT jobs_completed, total_earned, current_day FROM simulation_saves WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
            [userId]
        );

        res.json({
            ...user,
            showcase_achievements: showcase,
            stats: stats[0] || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ==========================================
// 5.5 API: Assets (อุปกรณ์)
// ==========================================

// ดึงอุปกรณ์ทั้งหมดของ user
app.get('/assets/:userId', async (req, res) => {
    try {
        const [assets] = await db.execute('SELECT * FROM assets WHERE user_id = ? ORDER BY type, name', [req.params.userId]);
        res.json(assets);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
});

// ==========================================
// 5.6 API: Financial Ledger (บัญชีรายรับ-รายจ่าย)
// ==========================================

// ดึงรายการบัญชีของ user
app.get('/finance/:userId', async (req, res) => {
    const { userId } = req.params;
    const { limit } = req.query;
    try {
        const [rows] = await db.execute(
            'SELECT * FROM financial_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
            [userId, parseInt(limit) || 20]
        );
        // สรุปยอด
        const [summary] = await db.execute(
            `SELECT 
                SUM(CASE WHEN type='INCOME' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END) as total_expense
             FROM financial_ledger WHERE user_id = ?`,
            [userId]
        );
        res.json({ transactions: rows, summary: summary[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch ledger' });
    }
});

// บันทึกรายรับ-รายจ่าย
app.post('/finance/add', async (req, res) => {
    const { userId, type, category, amount, description } = req.body;
    if (!userId || !type || !category || !amount) {
        return res.status(400).json({ error: 'userId, type, category, amount are required' });
    }
    try {
        await db.execute(
            'INSERT INTO financial_ledger (user_id, type, category, amount, description) VALUES (?, ?, ?, ?, ?)',
            [userId, type, category, amount, description || null]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

// ==========================================
// 5.7 API: Music Tracks (เพลง)
// ==========================================

// ดึงเพลงทั้งหมด
app.get('/music/tracks', async (req, res) => {
    try {
        const [tracks] = await db.execute('SELECT * FROM music_tracks ORDER BY is_default DESC, track_name ASC');
        res.json(tracks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tracks' });
    }
});

// ==========================================
// 5.8 API: Locations (สถานที่)
// ==========================================

// ดึงสถานที่ทั้งหมด
app.get('/locations', async (req, res) => {
    try {
        const [locs] = await db.execute('SELECT * FROM locations ORDER BY entry_fee ASC');
        res.json(locs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
});

// ย้ายสถานที่ (ใน simulation)
app.post('/simulation/move-location', async (req, res) => {
    const { userId, locationId } = req.body;
    try {
        // ตรวจสอบสถานที่
        const [locs] = await db.execute('SELECT * FROM locations WHERE location_id = ?', [locationId]);
        if (locs.length === 0) return res.status(404).json({ error: 'Location not found' });

        const location = locs[0];

        // หักค่าเข้า (ถ้ามี)
        if (parseFloat(location.entry_fee) > 0) {
            const [saves] = await db.execute('SELECT sim_money FROM simulation_saves WHERE user_id = ? AND is_active = 1', [userId]);
            if (saves.length === 0 || parseFloat(saves[0].sim_money) < parseFloat(location.entry_fee)) {
                return res.status(400).json({ error: 'เงินไม่พอสำหรับค่าเข้าสถานที่' });
            }
            await db.execute(
                'UPDATE simulation_saves SET sim_money = sim_money - ?, total_spent = total_spent + ? WHERE user_id = ? AND is_active = 1',
                [location.entry_fee, location.entry_fee, userId]
            );
        }

        // อัปเดต location
        await db.execute('UPDATE simulation_saves SET current_location_id = ? WHERE user_id = ? AND is_active = 1', [locationId, userId]);
        res.json({ success: true, location: location });
    } catch (err) {
        res.status(500).json({ error: 'Failed to move location' });
    }
});

// ==========================================
// 6. API: Shop & Inventory
// ==========================================

// ดึงสินค้าทั้งหมดในร้าน
app.get('/shop/items', async (req, res) => {
    const { type } = req.query;
    let sql = 'SELECT * FROM shop_items WHERE is_available = 1';
    let params = [];
    if (type) {
        sql += ' AND type = ?';
        params.push(type);
    }
    sql += ' ORDER BY type, price ASC';
    try {
        const [items] = await db.execute(sql, params);
        items.forEach(i => {
            if (typeof i.preview_data === 'string') i.preview_data = JSON.parse(i.preview_data);
        });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch shop items' });
    }
});

// ดึง inventory ของ user
app.get('/shop/inventory/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [items] = await db.execute(`
            SELECT si.*, ui.purchased_at
            FROM user_inventory ui
            JOIN shop_items si ON ui.item_id = si.item_id
            WHERE ui.user_id = ?
            ORDER BY ui.purchased_at DESC
        `, [userId]);
        items.forEach(i => {
            if (typeof i.preview_data === 'string') i.preview_data = JSON.parse(i.preview_data);
        });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// ซื้อสินค้า
app.post('/shop/buy', async (req, res) => {
    const { userId, itemId } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // ตรวจสอบว่ามีสินค้านี้อยู่
        const [items] = await connection.execute('SELECT * FROM shop_items WHERE item_id = ? AND is_available = 1', [itemId]);
        if (items.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Item not found' });
        }
        const item = items[0];

        // ตรวจสอบว่าซื้อไปแล้วหรือยัง
        const [owned] = await connection.execute('SELECT * FROM user_inventory WHERE user_id = ? AND item_id = ?', [userId, itemId]);
        if (owned.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'คุณมีไอเทมนี้อยู่แล้ว' });
        }

        // ตรวจสอบเงินใน simulation
        const [saves] = await connection.execute('SELECT sim_money FROM simulation_saves WHERE user_id = ? AND is_active = 1', [userId]);
        if (saves.length === 0 || parseFloat(saves[0].sim_money) < parseFloat(item.price)) {
            await connection.rollback();
            return res.status(400).json({ error: 'เงินไม่พอ' });
        }

        // หักเงินจาก simulation
        await connection.execute(
            'UPDATE simulation_saves SET sim_money = sim_money - ?, total_spent = total_spent + ? WHERE user_id = ? AND is_active = 1',
            [item.price, item.price, userId]
        );

        // เพิ่มเข้า inventory
        await connection.execute('INSERT INTO user_inventory (user_id, item_id) VALUES (?, ?)', [userId, itemId]);

        await connection.commit();
        res.json({ success: true, message: `ซื้อ ${item.name} สำเร็จ!` });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: 'Failed to purchase item' });
    } finally {
        connection.release();
    }
});

// สวมใส่ cosmetic
app.post('/shop/equip', async (req, res) => {
    const { userId, itemId, type } = req.body;
    const columnMap = {
        'THEME': 'equipped_theme_id',
        'MOUSE_EFFECT': 'equipped_mouse_effect_id',
        'PROFILE_FRAME': 'equipped_profile_frame_id'
    };
    const column = columnMap[type];
    if (!column) return res.status(400).json({ error: 'Invalid type' });

    try {
        // ตรวจสอบว่าเป็นเจ้าของ
        if (itemId) {
            const [owned] = await db.execute('SELECT * FROM user_inventory WHERE user_id = ? AND item_id = ?', [userId, itemId]);
            if (owned.length === 0) return res.status(400).json({ error: 'คุณไม่มีไอเทมนี้' });
        }

        await db.execute(`UPDATE users SET ${column} = ? WHERE user_id = ?`, [itemId || null, userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to equip item' });
    }
});

// ==========================================
// 7. Learning Platform APIs (merged from friend's app)
// ==========================================

// --- Friend's Login API (compatible with FriendLogin.jsx) ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(401).json({ message: 'User not found' });
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Wrong password' });
        res.json({
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role || 'user',
            level: user.level || 1,
            xp: user.xp || 0
        });
    } catch (err) {
        console.error('❌ API Login Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Google OAuth Login ---
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        // Decode Google JWT token (ไม่ต้อง verify แบบเต็มถ้าใช้ Google Identity Services)
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        const { email, name, sub: googleId, picture } = payload;

        if (!email) return res.status(400).json({ message: 'ไม่สามารถดึงอีเมลจาก Google ได้' });

        // ตรวจสอบว่ามี user ในระบบแล้วหรือยัง
        const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (existing.length > 0) {
            // Login ถ้ามี user อยู่แล้ว
            const user = existing[0];
            res.json({
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role || 'user',
                level: user.level || 0,
                xp: user.xp || 0,
                email_verified: 1 // Google email ถือว่า verified แล้ว
            });
        } else {
            // สร้าง user ใหม่จาก Google
            const username = name || email.split('@')[0];
            const randomPass = crypto.randomBytes(16).toString('hex');
            const hash = await bcrypt.hash(randomPass, 10);

            const [result] = await db.execute(
                'INSERT INTO users (username, password_hash, email, role, level, xp, virtual_currency) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [username, hash, email, 'user', 0, 0, 0]
            );

            // Google user ถือว่า email verified แล้ว
            await db.execute(
                'INSERT INTO email_verifications (user_id, token, verified_at) VALUES (?, ?, NOW())',
                [result.insertId, 'google-oauth']
            );

            res.json({
                user_id: result.insertId,
                username,
                email,
                role: 'user',
                level: 0,  // ต้องทำ survey
                xp: 0,
                email_verified: 1
            });
        }
    } catch (err) {
        console.error('❌ Google Auth Error:', err.message);
        res.status(500).json({ message: 'Google authentication failed' });
    }
});

// --- Email Verification ---
app.get('/api/verify-email/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const [rows] = await db.execute(
            'SELECT * FROM email_verifications WHERE token = ? AND verified_at IS NULL AND expires_at > NOW()',
            [token]
        );
        if (rows.length === 0) {
            return res.status(400).send(`
                <div style="font-family:sans-serif;text-align:center;padding:60px">
                    <h2 style="color:#ef4444">❌ ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว</h2>
                    <p>กรุณาสมัครสมาชิกใหม่</p>
                </div>
            `);
        }

        await db.execute('UPDATE email_verifications SET verified_at = NOW() WHERE token = ?', [token]);

        res.send(`
            <div style="font-family:sans-serif;text-align:center;padding:60px">
                <h2 style="color:#22c55e">✅ ยืนยันอีเมลสำเร็จ!</h2>
                <p>คุณสามารถกลับไปเข้าสู่ระบบได้เลย</p>
                <a href="http://localhost:5173" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;font-weight:bold">กลับหน้าเข้าสู่ระบบ</a>
            </div>
        `);
    } catch (err) {
        console.error('❌ Email Verify Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// --- Course Content ---
app.get('/api/course-content', async (req, res) => {
    try {
        const [modules] = await db.execute('SELECT module_id, title, order_index, required_level FROM modules ORDER BY order_index');
        const [lessons] = await db.execute('SELECT lesson_id, module_id, title, order_index, required_level FROM lessons ORDER BY order_index');
        const data = modules.map(m => ({
            module_id: m.module_id,
            title: m.title,
            required_level: m.required_level || 0,
            lessons: lessons
                .filter(l => l.module_id === m.module_id)
                .map(l => ({
                    lesson_id: l.lesson_id,
                    id: l.lesson_id,
                    title: l.title,
                    required_level: l.required_level || 0,
                    completed_count: 0,
                    total_count: 10
                }))
        }));
        res.json(data);
    } catch (err) {
        console.error('❌ Course Content Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- Lesson Slides ---
app.get('/api/lessons/:lessonId/slides', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT slide_id, slide_order, slide_title AS title, slide_content, slide_src, slide_type FROM lesson_slides WHERE lesson_id = ? ORDER BY slide_order',
            [req.params.lessonId]
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Lesson Quizzes ---
app.get('/api/lessons/:lessonId/quizzes', async (req, res) => {
    try {
        const [quizRows] = await db.execute('SELECT quiz_id, quiz_type FROM lesson_quizzes WHERE lesson_id = ? ORDER BY quiz_type', [req.params.lessonId]);
        const quizzes = [];
        for (const quiz of quizRows) {
            const [questions] = await db.execute('SELECT question_id, question_text, question_type, correct_answer FROM quiz_questions WHERE quiz_id = ? ORDER BY question_order', [quiz.quiz_id]);
            for (const q of questions) {
                if (q.question_type === 'choice') {
                    const [choices] = await db.execute('SELECT choice_text FROM question_choices WHERE question_id = ? ORDER BY choice_id', [q.question_id]);
                    q.choices = choices;
                } else {
                    q.choices = [];
                }
            }
            quizzes.push({ quiz_type: quiz.quiz_type, questions });
        }
        res.json(quizzes);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- User Level Update ---
app.post('/api/user/update-level', async (req, res) => {
    const { user_id, level } = req.body;
    try {
        await db.execute('UPDATE users SET level = ? WHERE user_id = ?', [level, user_id]);
        res.json({ success: true, level });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Survey ---
app.get('/api/survey', async (req, res) => {
    try {
        const [questions] = await db.execute('SELECT * FROM survey_questions ORDER BY id ASC');
        const [options] = await db.execute(`
            SELECT question_id, option_text AS label, option_description AS description, \`order\`, NULL as level FROM survey_options
            UNION ALL
            SELECT question_id, title AS label, option_description AS description, \`order\`, level FROM level_config
            ORDER BY \`order\` ASC
        `);
        const formatted = questions.map(q => ({
            id: q.id,
            title: q.title,
            text: q.description,
            img: q.image,
            options: options.filter(o => o.question_id === q.id)
        }));
        res.json(formatted);
    } catch (err) {
        console.error('❌ Survey Error:', err.message);
        res.status(500).send(err.message);
    }
});

// --- Advanced Validation (ข้อสอบวัดระดับ) ---
app.get('/api/advanced-validation', async (req, res) => {
    try {
        const [questions] = await db.execute('SELECT * FROM advanced_validation ORDER BY id');
        for (const q of questions) {
            const [choices] = await db.execute('SELECT choice_text FROM advanced_validation_choices WHERE question_id = ? ORDER BY id', [q.id]);
            q.choices = choices.map(c => c.choice_text);
        }
        res.json(questions);
    } catch (err) {
        console.error('❌ Assessment Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- Assessment Submit ---
app.post('/api/assessment/submit', async (req, res) => {
    const { user_id, selected_level, score, total_questions } = req.body;
    try {
        const isPassed = score >= Math.ceil(total_questions * 0.6);
        if (isPassed) {
            await db.execute('UPDATE users SET level = ? WHERE user_id = ?', [selected_level, user_id]);
            return res.json({ success: true, message: 'ผ่าน!', new_level: selected_level });
        } else {
            return res.json({ success: false, message: 'ไม่ผ่าน' });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 7.5 API: Day Progression & Game State
// ==========================================

/**
 * GET /simulation/state/:userId
 * ดึง state ครบชุดสำหรับ Desktop (เงิน, วัน, ค่าเช่า, events)
 * แก้ bug: ใช้ user_id ตรงๆ แทน userData.id ที่ client ส่งมาผิด
 */
app.get('/simulation/state/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // ดึง save หลัก
        const [saves] = await db.execute(`
            SELECT s.*, l.name as location_name, l.power_reliability, l.internet_speed
            FROM simulation_saves s
            LEFT JOIN locations l ON s.current_location_id = l.location_id
            WHERE s.user_id = ? AND s.is_active = 1
            LIMIT 1
        `, [userId]);

        if (saves.length === 0) {
            // Auto-create save ถ้าไม่มี
            const [result] = await db.execute(
                'INSERT INTO simulation_saves (user_id, save_name, sim_money) VALUES (?, ?, ?)',
                [userId, 'Auto Save', 0]
            );
            return res.json({
                save_id: result.insertId,
                sim_money: 0,
                current_day: 1,
                current_hour: 8.0,
                battery_percent: 100,
                is_plugged_in: 1,
                jobs_completed: 0,
                total_earned: 0,
                active_events: []
            });
        }

        const save = saves[0];
        if (typeof save.environment_status === 'string') {
            try { save.environment_status = JSON.parse(save.environment_status); } catch { save.environment_status = {}; }
        }

        // ดึง active events
        const [activeEvents] = await db.execute(`
            SELECT ae.*, re.event_key, re.name, re.description, re.severity, re.effect_type
            FROM simulation_active_events ae
            JOIN random_events re ON ae.event_id = re.event_id
            WHERE ae.save_id = ? AND ae.is_resolved = 0
        `, [save.save_id]);

        // ดึงงานที่กำลังทำอยู่ (ACTIVE) เพื่อแสดงในหน้า Desktop
        const [activeJobs] = await db.execute(`
            SELECT c.contract_id, c.title, c.reward, c.difficulty, uc.accepted_at
            FROM user_contracts uc
            JOIN contracts c ON uc.contract_id = c.contract_id
            WHERE uc.user_id = ? AND uc.status = 'ACTIVE'
        `, [userId]);

        res.json({
            ...save,
            active_events: activeEvents,
            active_jobs: activeJobs
        });
    } catch (err) {
        console.error('❌ /simulation/state error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /simulation/next-day
 * จบวันปัจจุบัน — คำนวณรายรับ/รายจ่าย, เช็คค่าเช่า, เช็ค Game Over
 * Body: { userId }
 * Returns: { newDay, money, rentDue, rentPaid, gameOver, summary }
 */
app.post('/simulation/next-day', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. ดึง save ปัจจุบัน
        const [saves] = await connection.execute(
            'SELECT * FROM simulation_saves WHERE user_id = ? AND is_active = 1 LIMIT 1',
            [userId]
        );
        if (saves.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'No active save' });
        }
        const save = saves[0];
        const currentDay = save.current_day;
        const newDay = currentDay + 1;

        // Config ค่าเช่า (ทุก 7 วัน)
        const RENT_AMOUNT = 3000;
        const RENT_CYCLE = 7;

        // 2. ดึงงานที่เพิ่งส่ง (COMPLETED วันนี้) เพื่อสรุปรายรับ
        //    — งานที่ submit ไปแล้วจะถูกนับใน total_earned โดย /jobs/submit อยู่แล้ว
        //    — ดึงแค่ summary ว่าวันนี้ทำงานไปกี่งาน ได้เงินเท่าไร
        const [completedToday] = await connection.execute(`
            SELECT COUNT(*) as count, COALESCE(SUM(c.reward), 0) as earned
            FROM user_contracts uc
            JOIN contracts c ON uc.contract_id = c.contract_id
            WHERE uc.user_id = ? AND uc.status = 'COMPLETED'
            AND DATE(uc.accepted_at) = CURDATE()
        `, [userId]);

        const todayEarned = parseFloat(completedToday[0].earned) || 0;
        const todayJobsDone = completedToday[0].count || 0;

        // 3. เช็คว่าถึงวันจ่ายค่าเช่าหรือเปล่า (ทุก 7 วัน)
        let rentDue = false;
        let rentPaid = false;
        let rentDeducted = 0;
        let moneyAfterRent = parseFloat(save.sim_money);
        const rentEvents = [];

        if (newDay % RENT_CYCLE === 1 || currentDay % RENT_CYCLE === 0) {
            // ถึงวันจ่ายค่าเช่าแล้ว
            rentDue = true;
            if (moneyAfterRent >= RENT_AMOUNT) {
                // จ่ายได้
                rentDeducted = RENT_AMOUNT;
                moneyAfterRent -= RENT_AMOUNT;
                rentPaid = true;

                // บันทึก expense ใน financial_ledger
                await connection.execute(
                    'INSERT INTO financial_ledger (user_id, type, category, amount, description) VALUES (?, ?, ?, ?, ?)',
                    [userId, 'EXPENSE', 'RENT', RENT_AMOUNT, `ค่าเช่าวันที่ ${currentDay}`]
                );
                // อัปเดตยอดเงินและ total_spent
                await connection.execute(
                    'UPDATE simulation_saves SET sim_money = ?, total_spent = total_spent + ? WHERE save_id = ?',
                    [moneyAfterRent, RENT_AMOUNT, save.save_id]
                );

                rentEvents.push(`🏠 จ่ายค่าเช่า -${RENT_AMOUNT.toLocaleString()} ฿`);
            } else {
                // เงินไม่พอจ่ายค่าเช่า → GAME OVER
                await connection.execute(
                    'UPDATE simulation_saves SET is_active = 0 WHERE save_id = ?',
                    [save.save_id]
                );
                // บันทึก log
                await connection.execute(
                    'INSERT INTO simulation_logs (user_id, save_id, event_type, message) VALUES (?, ?, ?, ?)',
                    [userId, save.save_id, 'GAME_OVER', `ไม่มีเงินจ่ายค่าเช่าวันที่ ${currentDay} — Game Over`]
                );
                await connection.commit();
                return res.json({
                    gameOver: true,
                    reason: 'ไม่มีเงินจ่ายค่าเช่า',
                    finalDay: currentDay,
                    finalMoney: parseFloat(save.sim_money),
                    jobsCompleted: save.jobs_completed
                });
            }
        }

        // 4. Advance day
        await connection.execute(
            `UPDATE simulation_saves 
             SET current_day = ?, current_hour = 8.0
             WHERE save_id = ?`,
            [newDay, save.save_id]
        );

        // 5. บันทึก log วันใหม่
        await connection.execute(
            'INSERT INTO simulation_logs (user_id, save_id, event_type, message) VALUES (?, ?, ?, ?)',
            [userId, save.save_id, 'NEW_DAY', `เริ่มวันที่ ${newDay}`]
        );

        // 6. Resolve active events ของวันเก่า
        await connection.execute(
            'UPDATE simulation_active_events SET is_resolved = 1 WHERE save_id = ? AND is_resolved = 0',
            [save.save_id]
        );

        // 7. สร้าง summary กลับไป
        const [freshSave] = await connection.execute(
            'SELECT sim_money, current_day, jobs_completed, total_earned, total_spent FROM simulation_saves WHERE save_id = ?',
            [save.save_id]
        );

        await connection.commit();

        // คำนวณวันค่าเช่าถัดไป
        const daysUntilRent = RENT_CYCLE - (newDay % RENT_CYCLE);

        res.json({
            gameOver: false,
            newDay,
            money: parseFloat(freshSave[0].sim_money),
            totalEarned: parseFloat(freshSave[0].total_earned),
            totalSpent: parseFloat(freshSave[0].total_spent),
            jobsCompleted: freshSave[0].jobs_completed,
            rentDue,
            rentPaid,
            rentDeducted,
            daysUntilRent: daysUntilRent === 0 ? RENT_CYCLE : daysUntilRent,
            rentAmount: RENT_AMOUNT,
            summary: {
                todayEarned,
                todayJobsDone,
                rentEvents,
                day: currentDay
            }
        });
    } catch (err) {
        await connection.rollback();
        console.error('❌ /simulation/next-day error:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

/**
 * POST /simulation/new-game
 * สร้าง save ใหม่และ reset state ทั้งหมด (ใช้หลัง Game Over)
 * Body: { userId }
 */
app.post('/simulation/new-game', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    try {
        // ปิด save เดิมทั้งหมด
        await db.execute('UPDATE simulation_saves SET is_active = 0 WHERE user_id = ?', [userId]);
        // ยกเลิกงานค้างทั้งหมด
        await db.execute(
            "UPDATE user_contracts SET status = 'FAILED' WHERE user_id = ? AND status = 'ACTIVE'",
            [userId]
        );
        // สร้าง save ใหม่
        const [result] = await db.execute(
            `INSERT INTO simulation_saves 
             (user_id, save_name, sim_money, current_day, current_hour, battery_percent, is_plugged_in, jobs_completed, jobs_failed, total_earned, total_spent)
             VALUES (?, 'Auto Save', 0, 1, 8.0, 100, 1, 0, 0, 0, 0)`,
            [userId]
        );
        res.json({ success: true, save_id: result.insertId });
    } catch (err) {
        console.error('❌ /simulation/new-game error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 8. Start Server & Simulation Engine
// ==========================================

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Starting Simulation Engine...");
    startSimulationLoop();
});

// ==========================================
// 8. Simulation Logic (ทำงานเบื้องหลัง)
// ==========================================
function startSimulationLoop() {
    const TICK_RATE = 5000; // 5 วินาที
    const BATTERY_DRAIN_RATE = 2;
    const BATTERY_CHARGE_RATE = 5;
    let simErrorLogged = false;

    setInterval(async () => {
        try {
            // ดึง active saves ทั้งหมด
            const [saves] = await db.execute(`
                SELECT s.*, l.power_reliability, l.internet_speed
                FROM simulation_saves s
                LEFT JOIN locations l ON s.current_location_id = l.location_id
                WHERE s.is_active = 1
            `);

            // ดึง random events ทั้งหมดไว้ใช้
            const [allEvents] = await db.execute('SELECT * FROM random_events');

            for (let save of saves) {
                const reliability = save.power_reliability || 70;

                // Parse environment
                let env = (typeof save.environment_status === 'string')
                    ? JSON.parse(save.environment_status) : (save.environment_status || {});

                // ดึง active events ของ save นี้
                const [currentEvents] = await db.execute(
                    'SELECT ae.*, re.event_key, re.effect_type, re.force_skip_day, re.auto_resolve FROM simulation_active_events ae JOIN random_events re ON ae.event_id = re.event_id WHERE ae.save_id = ? AND ae.is_resolved = 0',
                    [save.save_id]
                );

                // ตรวจสอบ events ที่หมดอายุ → resolve
                for (let ce of currentEvents) {
                    if (ce.auto_resolve && ce.expires_at && new Date(ce.expires_at) <= new Date()) {
                        await db.execute('UPDATE simulation_active_events SET is_resolved = 1 WHERE id = ?', [ce.id]);
                        await db.execute(
                            'INSERT INTO simulation_logs (user_id, save_id, event_id, event_type, message) VALUES (?, ?, ?, ?, ?)',
                            [save.user_id, save.save_id, ce.event_id, ce.event_key + '_RESOLVED', `เหตุการณ์ ${ce.event_key} สิ้นสุดลงแล้ว`]
                        );
                    }
                }

                // ตรวจสอบสถานะปัจจุบัน
                const hasBlackout = currentEvents.some(e => e.event_key === 'BLACKOUT' && !e.is_resolved);
                const hasOverheat = currentEvents.some(e => e.event_key === 'LAPTOP_OVERHEAT' && !e.is_resolved);

                // คำนวณแบตเตอรี่
                const actualPluggedIn = save.is_plugged_in && !hasBlackout;
                let newBattery = save.battery_percent;
                const drainRate = hasOverheat ? BATTERY_DRAIN_RATE * 2 : BATTERY_DRAIN_RATE;

                if (actualPluggedIn) {
                    newBattery = Math.min(100, newBattery + BATTERY_CHARGE_RATE);
                } else {
                    newBattery = Math.max(0, newBattery - drainRate);
                }

                // แบตหมด + ไฟดับ → บังคับข้ามวัน
                let forceSkipDay = false;
                if (newBattery <= 0 && hasBlackout) {
                    forceSkipDay = true;
                    newBattery = 100; // reset แบตหลังวันใหม่
                    // Resolve blackout
                    await db.execute(
                        'UPDATE simulation_active_events SET is_resolved = 1 WHERE save_id = ? AND is_resolved = 0',
                        [save.save_id]
                    );
                    await db.execute(
                        'INSERT INTO simulation_logs (user_id, save_id, event_type, message) VALUES (?, ?, ?, ?)',
                        [save.user_id, save.save_id, 'FORCE_SKIP_DAY', 'แบตเตอรี่หมด! ข้ามไปวันถัดไป ข้อมูลที่ไม่ได้ save หายไปแล้ว']
                    );
                }

                // ===== Random Events System =====
                // กฎ:
                // 1. จำกัดไม่เกิน 3 ครั้ง/วัน (นับจาก env.events_today_count)
                // 2. ต้องมี cooldown อย่างน้อย 60 วินาทีระหว่าง event
                // 3. CRITICAL → หยุดสุ่มวันนั้น แต่ไม่มี fixed timer
                //    - BLACKOUT: ผลตามธรรมชาติ = ชาร์จไม่ได้ → แบตหมด → จบวัน
                //    - LAPTOP_CRASH: บังคับจบวันทันที + หักค่าซ่อม
                // 4. โอกาสเกิดแต่ละระดับต่างกัน (LOW สูง, CRITICAL ต่ำมาก)

                const MAX_EVENTS_PER_DAY = 3;
                const EVENT_COOLDOWN_MS = 60 * 1000; // 60 วินาที

                const eventsToday = env.events_today_count || 0;
                const lastEventTime = env.last_event_time ? new Date(env.last_event_time).getTime() : 0;
                const hasCriticalToday = env.critical_today || false;
                const now = Date.now();

                // สุ่ม events เฉพาะเมื่อ: ยังไม่ถึงลิมิต + ไม่มี critical วันนี้ + cooldown ผ่าน + ไม่ force skip
                const canSpawnEvent = !forceSkipDay
                    && eventsToday < MAX_EVENTS_PER_DAY
                    && !hasCriticalToday
                    && (now - lastEventTime) >= EVENT_COOLDOWN_MS;

                if (canSpawnEvent) {
                    // กรอง events ที่สามารถเกิดได้ (ข้าม BLACKOUT → ใช้ระบบ reliability แยก)
                    const eligibleEvents = allEvents.filter(e => {
                        if (e.event_key === 'BLACKOUT') return false;
                        if (currentEvents.some(ce => ce.event_id === e.event_id && !ce.is_resolved)) return false;
                        return true;
                    });

                    for (let event of eligibleEvents) {
                        const roll = Math.floor(Math.random() * 100) + 1;
                        if (roll <= event.base_chance_percent) {
                            // === เกิดเหตุการณ์! ===
                            const expiresAt = event.duration_minutes
                                ? new Date(now + event.duration_minutes * 60000).toISOString().slice(0, 19).replace('T', ' ')
                                : null;

                            await db.execute(
                                'INSERT INTO simulation_active_events (save_id, event_id, expires_at) VALUES (?, ?, ?)',
                                [save.save_id, event.event_id, expiresAt]
                            );
                            await db.execute(
                                'INSERT INTO simulation_logs (user_id, save_id, event_id, event_type, message) VALUES (?, ?, ?, ?, ?)',
                                [save.user_id, save.save_id, event.event_id, event.event_key, event.description]
                            );

                            // อัปเดต counter + cooldown
                            env.events_today_count = eventsToday + 1;
                            env.last_event_time = new Date(now).toISOString();

                            // ==== จัดการผลกระทบตาม effect_type ====

                            if (event.effect_type === 'MONEY_LOSS') {
                                // หักเงินทันที
                                const penalty = Math.floor(Math.random() * 200) + 100;
                                await db.execute(
                                    'UPDATE simulation_saves SET sim_money = GREATEST(0, sim_money - ?), total_spent = total_spent + ? WHERE save_id = ?',
                                    [penalty, penalty, save.save_id]
                                );
                                await db.execute(
                                    'INSERT INTO simulation_logs (user_id, save_id, event_type, message) VALUES (?, ?, ?, ?)',
                                    [save.user_id, save.save_id, 'MONEY_DEDUCTED', `ถูกหักเงิน ${penalty} ฿`]
                                );
                            }

                            if (event.effect_type === 'INSTANT_END') {
                                // LAPTOP_CRASH: บังคับจบวันทันที + ค่าซ่อม
                                const repairCost = Math.floor(Math.random() * 1000) + 500; // 500-1500 ฿
                                forceSkipDay = true;
                                newBattery = 100;

                                await db.execute(
                                    'UPDATE simulation_saves SET sim_money = GREATEST(0, sim_money - ?), total_spent = total_spent + ? WHERE save_id = ?',
                                    [repairCost, repairCost, save.save_id]
                                );
                                await db.execute(
                                    'UPDATE simulation_active_events SET is_resolved = 1 WHERE save_id = ? AND is_resolved = 0',
                                    [save.save_id]
                                );
                                await db.execute(
                                    'INSERT INTO simulation_logs (user_id, save_id, event_type, message) VALUES (?, ?, ?, ?)',
                                    [save.user_id, save.save_id, 'REPAIR_COST',
                                    `โน๊ตบุ๊คพังต้องซ่อม! เสียค่าซ่อม ${repairCost} ฿ วันนี้จบลงแล้ว`]
                                );
                            }

                            // CRITICAL → หยุดสุ่มต่อวันนี้ (ผลกระทบจะเกิดตามธรรมชาติ)
                            if (event.severity === 'CRITICAL') {
                                env.critical_today = true;
                            }

                            break; // สุ่มได้แค่ 1 event ต่อ tick
                        }
                    }
                }

                // สุ่มไฟดับตาม reliability ของ location (แยกจากระบบ event ทั่วไป)
                // ไฟดับ = ชาร์จไม่ได้ → แบตค่อยๆ หมด → เมื่อแบต 0 จะบังคับจบวัน (จัดการที่ lines 803-817)
                if (!hasBlackout && !forceSkipDay && !hasCriticalToday) {
                    const blackoutRoll = Math.floor(Math.random() * 100) + 1;
                    if (blackoutRoll > reliability) {
                        const blackoutEvent = allEvents.find(e => e.event_key === 'BLACKOUT');
                        if (blackoutEvent) {
                            await db.execute(
                                'INSERT INTO simulation_active_events (save_id, event_id) VALUES (?, ?)',
                                [save.save_id, blackoutEvent.event_id]
                            );
                            await db.execute(
                                'INSERT INTO simulation_logs (user_id, save_id, event_id, event_type, message) VALUES (?, ?, ?, ?, ?)',
                                [save.user_id, save.save_id, blackoutEvent.event_id, 'BLACKOUT', blackoutEvent.description]
                            );

                            // BLACKOUT = CRITICAL → หยุดสุ่ม event อื่นวันนี้
                            // ผลกระทบ: ชาร์จไม่ได้ → แบตค่อยๆ ลด → ถ้าแบตหมดก่อนไฟมา = จบวัน
                            env.critical_today = true;
                            env.events_today_count = (env.events_today_count || 0) + 1;
                            env.last_event_time = new Date(now).toISOString();
                        }
                    }
                }

                // อัปเดต save
                const newDay = forceSkipDay ? save.current_day + 1 : save.current_day;
                const newHour = forceSkipDay ? 8.0 : save.current_hour;

                // reset วันใหม่ → เคลียร์ counter
                if (forceSkipDay) {
                    env.events_today_count = 0;
                    env.last_event_time = null;
                    env.critical_today = false;
                }

                env.is_blackout = hasBlackout && !forceSkipDay;

                await db.execute(
                    `UPDATE simulation_saves SET battery_percent = ?, environment_status = ?, 
                     current_day = ?, current_hour = ? WHERE save_id = ?`,
                    [newBattery, JSON.stringify(env), newDay, newHour, save.save_id]
                );
            }
        } catch (err) {
            if (!simErrorLogged) {
                console.error("⚠️ Sim Error (จะไม่แสดงซ้ำ):", err.message);
                simErrorLogged = true;
            }
        }
    }, TICK_RATE);
}