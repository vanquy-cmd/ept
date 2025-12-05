import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script tự động chạy migrations để tạo database tables
 * Chạy lệnh: npm run init-db
 */
async function initDatabase() {
  console.log('🔄 Đang khởi tạo database...\n');

  // Kiểm tra DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ Lỗi: DATABASE_URL không được tìm thấy trong .env');
    process.exit(1);
  }

  let connection;
  try {
    // Kết nối database
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Đã kết nối database thành công\n');

    // Danh sách migrations theo thứ tự
    const migrations = [
      'create_vocabulary_translation_history.sql',
      'add_example_sentence_column.sql',
      'add_asset_url_to_quizzes.sql'
    ];

    // Chạy từng migration
    for (const file of migrations) {
      const filePath = path.join(__dirname, '../migrations', file);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File không tồn tại: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Tách các câu lệnh SQL (phân tách bằng dấu ;)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`📄 Đang chạy: ${file}`);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.query(statement);
          } catch (error) {
            // Bỏ qua lỗi "Duplicate column" hoặc "Table already exists"
            if (
              error.code === 'ER_DUP_FIELDNAME' ||
              error.code === 'ER_TABLE_EXISTS_ERROR' ||
              error.message.includes('already exists') ||
              error.message.includes('Duplicate column')
            ) {
              console.log(`   ⚠️  Đã tồn tại, bỏ qua: ${error.message.split('\n')[0]}`);
            } else {
              throw error;
            }
          }
        }
      }
      
      console.log(`   ✅ Hoàn thành: ${file}\n`);
    }

    console.log('✅ Database đã được khởi tạo thành công!');
    console.log('🚀 Bạn có thể khởi động server với: npm start\n');

  } catch (error) {
    console.error('\n❌ Lỗi khi khởi tạo database:');
    console.error(`   ${error.message}`);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Chạy script
initDatabase();

