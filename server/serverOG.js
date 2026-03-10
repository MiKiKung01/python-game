// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// เชื่อมต่อฐานข้อมูล
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'python_coder_game'
});

// --- API: Login / Register ---
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
        await db.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Username already exists' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length > 0 && await bcrypt.compare(password, users[0].password_hash)) {
        res.json({ success: true, user: { id: users[0].user_id, username: users[0].username } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// --- API: Achievements (พร้อมคำนวณ %) ---
app.get('/achievements/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    // Query ซับซ้อนเพื่อดึงข้อมูล + คำนวณ % คนที่ทำได้ + เช็คว่าเราทำได้หรือยัง
    const sql = `
        SELECT 
            a.*,
            (SELECT COUNT(*) FROM user_achievements ua WHERE ua.achievement_id = a.achievement_id) * 100.0 / (SELECT COUNT(*) FROM users) as global_percent,
            CASE WHEN ua_me.id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked
        FROM achievements a
        LEFT JOIN user_achievements ua_me ON a.achievement_id = ua_me.achievement_id AND ua_me.user_id = ?
        ORDER BY 
            CASE a.difficulty 
                WHEN 'Medium' THEN 1 
                WHEN 'Hard' THEN 2 
                WHEN 'Very Hard' THEN 3 
            END ASC
    `;
    
    const [rows] = await db.execute(sql, [userId]);
    res.json(rows);
});

// --- API: Rooms (Join/Create/List) ---
app.get('/rooms', async (req, res) => {
    const { search } = req.query;
    let sql = `SELECT * FROM game_rooms WHERE status = 'WAITING'`;
    let params = [];
    
    if (search) {
        sql += ` AND room_name LIKE ?`;
        params.push(`%${search}%`);
    }
    
    const [rooms] = await db.execute(sql, params);
    res.json(rooms);
});

app.post('/rooms/create', async (req, res) => {
    const { roomName, maxPlayers, password, hostId } = req.body;
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. สร้างห้อง (ตั้งคนเริ่มเป็น 1 คนคือ Host)
        const [roomResult] = await connection.execute(
            'INSERT INTO game_rooms (room_name, host_user_id, room_password, max_players, current_players) VALUES (?, ?, ?, ?, 1)',
            [roomName, hostId, password || null, maxPlayers]
        );
        const roomId = roomResult.insertId;

        // 2. จับ Host ยัดใส่ห้องทันทีในฐานข้อมูล
        await connection.execute(
            'INSERT INTO room_participants (room_id, user_id, is_ready) VALUES (?, ?, TRUE)', // Host พร้อมเสมอ
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

// --- API: Settings (Update Name) ---
app.post('/user/update', async (req, res) => {
    const { userId, newName } = req.body;
    try {
        await db.execute('UPDATE users SET username = ? WHERE user_id = ?', [newName, userId]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// --- API: ดึงข้อมูลห้องและผู้เล่นในห้อง (ใช้สำหรับ Polling) ---
app.get('/rooms/:roomId', async (req, res) => {
    const { roomId } = req.params;
    try {
        // 1. ข้อมูลห้อง
        const [room] = await db.execute('SELECT * FROM game_rooms WHERE room_id = ?', [roomId]);
        if (room.length === 0) return res.status(404).json({ error: 'Room not found' });

        // 2. ข้อมูลผู้เล่นในห้อง
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

// --- API: เข้าร่วมห้อง (Join) ---
app.post('/rooms/join', async (req, res) => {
    const { roomId, userId } = req.body;
    try {
        // เช็คว่าเข้าซ้ำไหม
        const [check] = await db.execute('SELECT * FROM room_participants WHERE room_id = ? AND user_id = ?', [roomId, userId]);
        if (check.length === 0) {
            await db.execute('INSERT INTO room_participants (room_id, user_id) VALUES (?, ?)', [roomId, userId]);
            
            // อัปเดตจำนวนคนในตารางห้อง
            await db.execute('UPDATE game_rooms SET current_players = (SELECT COUNT(*) FROM room_participants WHERE room_id = ?) WHERE room_id = ?', [roomId, roomId]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to join' });
    }
});

// --- API: ออกจากห้อง (Leave) และลบห้องถ้าว่าง ---
app.post('/rooms/leave', async (req, res) => {
    const { roomId, userId } = req.body;
    try {
        // 1. ลบผู้ใช้ออก
        await db.execute('DELETE FROM room_participants WHERE room_id = ? AND user_id = ?', [roomId, userId]);

        // 2. นับจำนวนคนเหลือ
        const [countResult] = await db.execute('SELECT COUNT(*) as count FROM room_participants WHERE room_id = ?', [roomId]);
        const remaining = countResult[0].count;

        if (remaining === 0) {
            // ถ้าไม่มีคนเหลือ -> ลบห้องทิ้ง
            await db.execute('DELETE FROM game_rooms WHERE room_id = ?', [roomId]);
            console.log(`Room ${roomId} deleted because it is empty.`);
        } else {
            // ถ้ายังมีคน -> อัปเดตตัวเลข
            await db.execute('UPDATE game_rooms SET current_players = ? WHERE room_id = ?', [remaining, roomId]);
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to leave' });
    }
});

app.listen(3001, () => console.log('Server running on port 3001'));