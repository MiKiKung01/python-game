const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'python_coder_game',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

(async () => {
    try {
        const connection = await db.getConnection();
        console.log('เชื่อมต่อ MySQL สำเร็จ!');
        connection.release();
    } catch (err) {
        console.error('เชื่อมต่อล้มเหลว:', err.message);
    }
})();

module.exports = db;