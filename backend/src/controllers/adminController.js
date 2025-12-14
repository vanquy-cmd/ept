import asyncHandler from 'express-async-handler';
import { 
    getAllUsers,
    getUserById,       // <-- Import mới
    createUserAdmin,   // <-- Import mới
    updateUserAdmin,   // <-- Import mới
    deleteUserAdmin,   // <-- Import mới
    getAllLessonsAdmin,
    getAllQuestionsAdmin,
    getAllQuizzesAdmin,
    getAllVocabularySetsAdmin,
    getDashboardStats,
    getAllAttemptsAdmin, // <-- Import mới
    getAttemptDetailsAdmin
} from '../models/adminModel.js';

/**
 * [ADMIN] Lấy danh sách tất cả người dùng (ĐÃ CÓ PHÂN TRANG)
 * GET /api/admin/users
 */
export const handleGetAllUsers = asyncHandler(async (req, res) => {
  // 1. Lấy 'page' và 'limit' từ query params, đặt giá trị mặc định
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10; // Mặc định 10 mục mỗi trang

  // 2. Gọi model với tham số phân trang
  const { users, totalCount } = await getAllUsers(page, limit);

  // 3. Trả về đối tượng JSON chứa dữ liệu và thông tin phân trang
  res.status(200).json({
    data: users,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalCount: totalCount
  });
});

/**
 * [ADMIN] Lấy chi tiết một người dùng
 * GET /api/admin/users/:id
 */
export const handleGetUserById = asyncHandler(async (req, res) => {
    const user = await getUserById(req.params.id);
    if (user) {
        res.status(200).json(user);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng.');
    }
});

/**
 * [ADMIN] Tạo người dùng mới
 * POST /api/admin/users
 */
export const handleCreateUser = asyncHandler(async (req, res) => {
    const { full_name, email, password, role } = req.body;

    // (Chúng ta sẽ thêm validation chi tiết sau)
    if (!full_name || !email || !password) {
        res.status(400);
        throw new Error('Vui lòng cung cấp tên, email và mật khẩu.');
    }

    try {
        const newUserId = await createUserAdmin({ full_name, email, password, role });
        res.status(201).json({ message: 'Tạo người dùng thành công.', userId: newUserId });
    } catch (error) {
        res.status(400); // Lỗi từ model (vd: email trùng)
        throw error;
    }
});

/**
 * [ADMIN] Cập nhật người dùng
 * PUT /api/admin/users/:id
 */
export const handleUpdateUser = asyncHandler(async (req, res) => {
    const { full_name, email, role } = req.body;
    const userId = req.params.id;

    if (!full_name || !email || !role) {
         res.status(400);
        throw new Error('Vui lòng cung cấp tên, email và vai trò.');
    }
    
    // Kiểm tra xem user có tồn tại không
    const userExists = await getUserById(userId);
    if (!userExists) {
        res.status(404);
        throw new Error('Không tìm thấy người dùng.');
    }

    try {
        await updateUserAdmin(userId, { full_name, email, role });
        const updatedUser = await getUserById(userId); // Lấy lại thông tin mới
        res.status(200).json({ message: 'Cập nhật người dùng thành công.', user: updatedUser });
    } catch (error) {
         res.status(400); // Lỗi từ model (vd: email trùng)
        throw error;
    }
});

/**
 * [ADMIN] Xóa người dùng
 * DELETE /api/admin/users/:id
 */
export const handleDeleteUser = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const currentUser = req.user; // User hiện tại đang thực hiện xóa
    const SUPER_ADMIN_EMAIL = 'admin@ept.tdmu.edu.vn';

    // 1. Không cho xóa chính mình
    if (currentUser.id == userId) {
        res.status(400);
        throw new Error('Bạn không thể xóa chính mình.');
    }

    // 2. Lấy thông tin user cần xóa
    const targetUser = await getUserById(userId);
    if (!targetUser) {
        res.status(404);
        throw new Error('Không tìm thấy người dùng.');
    }

    // 3. Kiểm tra quyền xóa
    // - Super admin (admin@ept.tdmu.edu.vn) có thể xóa bất kỳ ai (trừ chính mình)
    // - Admin thường chỉ có thể xóa student
    if (currentUser.email !== SUPER_ADMIN_EMAIL) {
        // Nếu không phải super admin
        if (targetUser.role === 'admin') {
            res.status(403);
            throw new Error('Bạn không có quyền xóa tài khoản admin khác.');
        }
    }
    
    // 4. Thực hiện xóa
    const affectedRows = await deleteUserAdmin(userId);
    if (affectedRows === 0) {
        res.status(404);
        throw new Error('Không tìm thấy người dùng.');
    }
    res.status(200).json({ message: 'Xóa người dùng thành công.' });
});

/**
 * [ADMIN] Lấy danh sách tất cả các bài học (ĐÃ CÓ PHÂN TRANG)
 * GET /api/admin/lessons
 */
export const handleGetAllLessons = asyncHandler(async (req, res) => {
  // 1. Lấy 'page' và 'limit' từ query params
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10; // Mặc định 10 mục

  // 2. Gọi model
  const { lessons, totalCount } = await getAllLessonsAdmin(page, limit);

  // 3. Trả về đối tượng JSON
  res.status(200).json({
    data: lessons, // <-- Đổi tên 'users' thành 'data' (hoặc 'lessons')
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalCount: totalCount
  });
});

/**
 * [ADMIN] Lấy danh sách tất cả các câu hỏi (ĐÃ CÓ PHÂN TRANG)
 * GET /api/admin/questions
 */
export const handleGetAllQuestions = asyncHandler(async (req, res) => {
  // 1. Lấy 'page' và 'limit'
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  // 2. Gọi model
  const { questions, totalCount } = await getAllQuestionsAdmin(page, limit);

  // 3. Trả về
  res.status(200).json({
    data: questions, // Dùng 'data' cho nhất quán
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalCount: totalCount
  });
});

/**
 * [ADMIN] Lấy danh sách tất cả các đề thi (ĐÃ CÓ PHÂN TRANG)
 * GET /api/admin/quizzes
 */
export const handleGetAllQuizzes = asyncHandler(async (req, res) => {
  // 1. Lấy 'page' và 'limit'
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  // 2. Gọi model
  const { quizzes, totalCount } = await getAllQuizzesAdmin(page, limit);

  // 3. Trả về
  res.status(200).json({
    data: quizzes, // Dùng 'data' cho nhất quán
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalCount: totalCount
  });
});

/**
 * [ADMIN] Lấy danh sách tất cả các bộ từ vựng (ĐÃ CÓ PHÂN TRANG)
 * GET /api/admin/vocabulary-sets
 */
export const handleGetAllVocabularySets = asyncHandler(async (req, res) => {
  // 1. Lấy 'page' và 'limit'
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  // 2. Gọi model
  const { sets, totalCount } = await getAllVocabularySetsAdmin(page, limit);

  // 3. Trả về
  res.status(200).json({
    data: sets, // Dùng 'data' cho nhất quán
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalCount: totalCount
  });
});

/**
 * [ADMIN] Lấy dữ liệu thống kê cho Dashboard
 * GET /api/admin/dashboard-stats
 */
export const handleGetDashboardStats = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();
  res.status(200).json(stats);
});

/**
 * [ADMIN] Lấy danh sách tất cả các lượt làm bài (CÓ PHÂN TRANG)
 * GET /api/admin/attempts
 */
export const handleGetAllAttempts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const { attempts, totalCount } = await getAllAttemptsAdmin(page, limit);

  res.status(200).json({
    data: attempts, // Dùng 'data' cho nhất quán
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalCount: totalCount
  });
});

/**
 * [ADMIN] Lấy chi tiết một lượt làm bài
 * GET /api/admin/attempts/:id
 */
export const handleGetAttemptDetailsAdmin = asyncHandler(async (req, res) => {
    const attemptId = req.params.id;
    const attemptDetails = await getAttemptDetailsAdmin(attemptId);
    
    if (attemptDetails) {
        res.status(200).json(attemptDetails);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy lượt làm bài.');
    }
});