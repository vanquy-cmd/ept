import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
// --- Import các Layout và Pages ---
// Layouts
import StudentLayout from './components/StudentLayout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
// Public Pages
import HomePage from './pages/app/HomePage';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
// Student Pages
import DashboardPage from './pages/app/Dashboard';
import LearningPage from './pages/app/LearningPage';
import CategoryDetailPage from './pages/app/CategoryDetailPage';
import LessonDetailPage from './pages/app/LessonDetailPage';
import PracticePage from './pages/app/PracticePage';
import QuizStartPage from './pages/app/QuizStartPage';
import QuizDoingPage from './pages/app/QuizDoingPage';
import QuizResultsPage from './pages/app/QuizResultsPage';
import HistoryPage from './pages/app/HistoryPage';
import VocabularyPage from './pages/app/VocabularyPage';
import VocabularySetDetailPage from './pages/app/VocabularySetDetailPage';
import VocabularyTranslationPage from './pages/app/VocabularyTranslationPage';
import ProfilePage from './pages/app/ProfilePage';
// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUserListPage from './pages/admin/AdminUserListPage';
import AdminUserFormPage from './pages/admin/AdminUserFormPage';
import AdminLessonListPage from './pages/admin/AdminLessonListPage';
import AdminLessonFormPage from './pages/admin/AdminLessonFormPage';
import AdminQuestionListPage from './pages/admin/AdminQuestionListPage';
import AdminQuestionFormPage from './pages/admin/AdminQuestionFormPage';
import AdminQuestionImportPage from './pages/admin/AdminQuestionImportPage';
import AdminQuizListPage from './pages/admin/AdminQuizListPage';
import AdminQuizFormPage from './pages/admin/AdminQuizFormPage';
import AdminCategoryListPage from './pages/admin/AdminCategoryListPage';
import AdminCategoryFormPage from './pages/admin/AdminCategoryFormPage';
import AdminVocabularyListPage from './pages/admin/AdminVocabularyListPage';
import AdminVocabularyFormPage from './pages/admin/AdminVocabularyFormPage';
import AdminAttemptListPage from './pages/admin/AdminAttemptListPage';
import AdminAttemptDetailPage from './pages/admin/AdminAttemptDetailPage';
import DictionaryChatbox from './components/DictionaryChatbox';

// ... (import các trang khác nếu có)

function App() {
  const location = useLocation();
  
  // Danh sách các trang không hiển thị chatbox
  const hideChatboxPaths = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/profile',
    '/dashboard'
  ];
  
  const shouldShowChatbox = !location.pathname.startsWith('/admin') && 
                            !hideChatboxPaths.includes(location.pathname);
  
  return (
    <>
      {/* Không gắn key vào Routes để tránh unmount toàn bộ layout mỗi lần chuyển trang */}
      <Routes location={location}>
      {/* Routes Công khai/Chung (dùng cùng layout) */}
      <Route element={<StudentLayout />}>
        <Route path="/" element={<HomePage />} />
        {/* --- ROUTES BẢO VỆ CHO STUDENT/ADMIN --- */}
        <Route element={<ProtectedRoute allowedRoles={['student', 'admin']} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/learning/categories/:id" element={<CategoryDetailPage />} />
          <Route path="/learning/lessons/:id" element={<LessonDetailPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/practice/quiz/:id/start" element={<QuizStartPage />} />
          <Route path="/practice/quiz/:id/do" element={<QuizDoingPage />} />
          <Route path="/practice/attempt/:attemptId/results" element={<QuizResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/vocabulary/translate" element={<VocabularyTranslationPage />} />
          <Route path="/vocabulary/sets/:id" element={<VocabularySetDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      {/* --- ROUTES XÁC THỰC (Không layout) --- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      
      {/* --- ROUTES BẢO VỆ CHO ADMIN --- */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}> 
          <Route index element={<Navigate to="dashboard" replace />} /> 
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUserListPage />} />
            <Route path="users/new" element={<AdminUserFormPage />} /> 
            <Route path="users/:id/edit" element={<AdminUserFormPage />} /> 
            <Route path="categories" element={<AdminCategoryListPage />} />
            <Route path="categories/new" element={<AdminCategoryFormPage />} />
            <Route path="categories/:id/edit" element={<AdminCategoryFormPage />} />
            <Route path="lessons" element={<AdminLessonListPage />} />
            <Route path="lessons/new" element={<AdminLessonFormPage />} />
            <Route path="lessons/:id/edit" element={<AdminLessonFormPage />} />
            <Route path="questions" element={<AdminQuestionListPage />} />
            <Route path="questions/new" element={<AdminQuestionFormPage />} />
            <Route path="questions/import" element={<AdminQuestionImportPage />} />
            <Route path="questions/:id/edit" element={<AdminQuestionFormPage />} />
            <Route path="quizzes" element={<AdminQuizListPage />} />
            <Route path="quizzes/new" element={<AdminQuizFormPage />} />
            <Route path="quizzes/:id/edit" element={<AdminQuizFormPage />} />
            <Route path="vocabulary-sets" element={<AdminVocabularyListPage />} />
            <Route path="vocabulary-sets/new" element={<AdminVocabularyFormPage />} />
            <Route path="vocabulary-sets/:id/edit" element={<AdminVocabularyFormPage />} />
            <Route path="attempts" element={<AdminAttemptListPage />} />
            <Route path="attempts/:id/details" element={<AdminAttemptDetailPage />} />
          </Route>
      </Route>

      {/* Route 404 (Không có layout) */}
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      
      {/* Dictionary Chatbox - Ẩn trên các trang cụ thể */}
      {shouldShowChatbox && <DictionaryChatbox />}
    </>
  );
}

export default App;