/**
 * setup_database.js — ลบตารางทั้งหมด + สร้างใหม่ใน python_coder_game
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'python_coder_game';

async function runSQLFile(connection, filePath, label) {
    console.log(`\n📄 กำลัง import: ${label}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    try {
        await connection.query(sql);
        console.log(`  ✅ import สำเร็จ!`);
    } catch (err) {
        console.error(`  ❌ Batch failed: ${err.message.substring(0, 150)}`);
        console.log(`  🔄 ลองทีละ statement...`);

        const statements = sql
            .replace(/\/\*![\s\S]*?\*\//g, '')
            .split(/;\s*\n/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        let success = 0, failed = 0;
        for (const stmt of statements) {
            const clean = stmt.replace(/--[^\n]*/g, '').trim();
            if (!clean) continue;
            try {
                await connection.query(stmt);
                success++;
            } catch (e) {
                failed++;
                if (failed <= 5) console.error(`    ⚠️ ${e.message.substring(0, 100)}`);
            }
        }
        console.log(`  📊 สำเร็จ ${success}, ล้มเหลว ${failed}`);
    }
}

async function main() {
    console.log('🔧 === Setup Database: python_coder_game ===\n');

    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: DB_NAME,
        multipleStatements: true
    });
    console.log('✅ เชื่อมต่อ MySQL สำเร็จ');

    // ลบตารางทั้งหมด
    console.log('\n🗑️ กำลังลบตารางทั้งหมด...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const [tables] = await connection.query('SHOW TABLES');
    for (const t of tables) {
        const name = Object.values(t)[0];
        await connection.query(`DROP TABLE IF EXISTS \`${name}\``);
        console.log(`  🗑️ ${name}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`  ✅ ลบ ${tables.length} ตารางสำเร็จ\n`);

    // Import files
    const baseDir = __dirname;
    const parentDir = path.join(baseDir, '..');

    const files = [
        [path.join(parentDir, 'python_coder_game.sql'), 'python_coder_game.sql (base schema)'],
        [path.join(baseDir, 'migration.sql'), 'migration.sql (shop + simulation)'],
        [path.join(baseDir, 'migration_friend.sql'), 'migration_friend.sql (learning platform)']
    ];

    for (const [filePath, label] of files) {
        if (fs.existsSync(filePath)) {
            await runSQLFile(connection, filePath, label);
        }
    }

    // Summary
    console.log('\n📊 === ตารางทั้งหมด ===');
    const [finalTables] = await connection.query('SHOW TABLES');
    finalTables.forEach((t, i) => console.log(`  ${i + 1}. ${Object.values(t)[0]}`));
    console.log(`\n🎉 เสร็จสิ้น! มีทั้งหมด ${finalTables.length} ตาราง`);

    await connection.end();
}

main().catch(err => {
    console.error('❌ Fatal Error:', err.message);
    process.exit(1);
});
