import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Tải các biến môi trường từ .env
dotenv.config();

// Tạo một "pool" kết nối. Pool hiệu quả hơn việc tạo kết nối mới mỗi lần.
// 'mysql2/promise' cho phép chúng ta dùng async/await
const pool = mysql.createPool(process.env.DATABASE_URL);

// Kiểm tra kết nối
pool.getConnection()
  .then(connection => {
    console.log('✅ Đã kết nối thành công đến MySQL Database!');
    connection.release(); // Trả kết nối về pool
  })
  .catch(err => {
    console.error('⛔ Lỗi kết nối MySQL:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('Kiểm tra xem MySQL server có đang chạy không.');
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error(`Database '${err.sqlMessage.split("'")[1]}' không tồn tại.`);
      console.error('Vui lòng tạo database trong MySQL Workbench.');
    }
  });

// Xuất pool để các modules khác có thể sử dụng để truy vấn
export default pool;