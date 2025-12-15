import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Tải các biến môi trường từ .env
dotenv.config();

// Parse DATABASE_URL và tạo config object
const parseDatabaseUrl = (url) => {
  if (!url) {
    throw new Error('DATABASE_URL không được định nghĩa');
  }

  // Loại bỏ dấu ngoặc kép nếu có (fix lỗi từ serverless env)
  const cleanUrl = url.trim().replace(/^["']|["']$/g, '');

  try {
    // Thử parse URL trực tiếp
    const parsed = new URL(cleanUrl);
    
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 3306,
      user: parsed.username,
      password: parsed.password,
      database: parsed.pathname.slice(1), // Bỏ dấu / đầu tiên
      charset: 'utf8mb4',
      // Cấu hình cho serverless
      connectTimeout: 10000, // 10 giây
      acquireTimeout: 30000, // 30 giây - tăng timeout để chờ connection
      timeout: 30000, // 30 giây - tăng query timeout
      // Connection pool settings cho serverless
      connectionLimit: 5, // Tăng số connection để tránh blocking
      queueLimit: 10, // Cho phép queue requests
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // SSL nếu cần (uncomment nếu database yêu cầu SSL)
      // ssl: {
      //   rejectUnauthorized: false
      // }
    };
  } catch (error) {
    // Nếu parse URL thất bại, thử parse thủ công
    const match = cleanUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?/);
    if (match) {
      return {
        host: match[3],
        port: parseInt(match[4]) || 3306,
        user: match[1],
        password: match[2],
        database: match[5],
        charset: 'utf8mb4',
        connectTimeout: 10000,
        acquireTimeout: 30000,
        timeout: 30000,
        connectionLimit: 5,
        queueLimit: 10,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      };
    }
    throw new Error(`Không thể parse DATABASE_URL: ${error.message}`);
  }
};

// Tạo config từ DATABASE_URL
let dbConfig;
try {
  dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  console.log(`🔗 Đang kết nối đến MySQL: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
} catch (error) {
  console.error('⛔ Lỗi cấu hình database:', error.message);
  throw error;
}

// Tạo pool với config đã parse
const pool = mysql.createPool(dbConfig);

// Kiểm tra kết nối (chỉ log, không throw error để server vẫn khởi động)
pool.getConnection()
  .then(connection => {
    console.log('✅ Đã kết nối thành công đến MySQL Database!');
    connection.release(); // Trả kết nối về pool
  })
  .catch(err => {
    console.error('⛔ Lỗi kết nối MySQL:', err.message);
    console.error('   Code:', err.code);
    if (err.code === 'ECONNREFUSED') {
      console.error('   → Kiểm tra xem MySQL server có đang chạy không.');
      console.error('   → Kiểm tra firewall có chặn kết nối không.');
    }
    if (err.code === 'ETIMEDOUT') {
      console.error('   → Kết nối timeout. Kiểm tra:');
      console.error('      - MySQL server có cho phép kết nối từ IP này không?');
      console.error('      - Firewall có chặn port 3306 không?');
      console.error('      - Network có ổn định không?');
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error(`   → Database '${err.sqlMessage?.split("'")[1]}' không tồn tại.`);
      console.error('   → Vui lòng tạo database trong MySQL Workbench.');
    }
    // Không throw error để server vẫn có thể khởi động
    // Kết nối sẽ được thử lại khi có request
  });

// Xuất pool để các modules khác có thể sử dụng để truy vấn
export default pool;