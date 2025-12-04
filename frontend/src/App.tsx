import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AnimatedPage from './components/AnimatedPage';
// --- Import các Layout và Pages ---
// Layouts
import StudentLayout from './components/StudentLayout';
import AdminLayout from './components/AdminLayout';
import PublicLayout from './components/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';
// Public Pages
import HomePage from './pages/public/HomePage';
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
  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
      {/* Routes Công khai (Không có layout) */}
      <Route element={<PublicLayout />}>
          <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
      </Route>
      {/* --- ROUTES XÁC THỰC (Không có layout) --- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Routes Bảo vệ cho Student/Admin (Sử dụng StudentLayout) */}
      <Route element={<ProtectedRoute allowedRoles={['student', 'admin']} />}>
        <Route element={<StudentLayout />}>
          <Route path="/dashboard" element={<AnimatedPage><DashboardPage /></AnimatedPage>} />
            <Route path="/learning" element={<AnimatedPage><LearningPage /></AnimatedPage>} />
            <Route path="/learning/categories/:id" element={<AnimatedPage><CategoryDetailPage /></AnimatedPage>} />
            <Route path="/learning/lessons/:id" element={<AnimatedPage><LessonDetailPage /></AnimatedPage>} />
            <Route path="/practice" element={<AnimatedPage><PracticePage /></AnimatedPage>} />
            <Route path="/practice/quiz/:id/start" element={<AnimatedPage><QuizStartPage /></AnimatedPage>} />
            <Route path="/practice/quiz/:id/do" element={<AnimatedPage><QuizDoingPage /></AnimatedPage>} />
            <Route path="/practice/attempt/:attemptId/results" element={<AnimatedPage><QuizResultsPage /></AnimatedPage>} />
            <Route path="/vocabulary" element={<AnimatedPage><VocabularyPage /></AnimatedPage>} />
            <Route path="/vocabulary/translate" element={<AnimatedPage><VocabularyTranslationPage /></AnimatedPage>} />
            <Route path="/vocabulary/sets/:id" element={<AnimatedPage><VocabularySetDetailPage /></AnimatedPage>} />
            <Route path="/profile" element={<AnimatedPage><ProfilePage /></AnimatedPage>} />
        </Route>
      </Route>
      
      {/* --- ROUTES BẢO VỆ CHO ADMIN --- */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}> 
          <Route index element={<Navigate to="dashboard" replace />} /> 
            <Route path="dashboard" element={<AnimatedPage><AdminDashboardPage /></AnimatedPage>} />
            <Route path="users" element={<AnimatedPage><AdminUserListPage /></AnimatedPage>} />
            <Route path="users/new" element={<AnimatedPage><AdminUserFormPage /></AnimatedPage>} /> 
            <Route path="users/:id/edit" element={<AnimatedPage><AdminUserFormPage /></AnimatedPage>} /> 
            <Route path="categories" element={<AnimatedPage><AdminCategoryListPage /></AnimatedPage>} />
            <Route path="categories/new" element={<AnimatedPage><AdminCategoryFormPage /></AnimatedPage>} />
            <Route path="categories/:id/edit" element={<AnimatedPage><AdminCategoryFormPage /></AnimatedPage>} />
            <Route path="lessons" element={<AnimatedPage><AdminLessonListPage /></AnimatedPage>} />
            <Route path="lessons/new" element={<AnimatedPage><AdminLessonFormPage /></AnimatedPage>} />
            <Route path="lessons/:id/edit" element={<AnimatedPage><AdminLessonFormPage /></AnimatedPage>} />
            <Route path="questions" element={<AnimatedPage><AdminQuestionListPage /></AnimatedPage>} />
            <Route path="questions/new" element={<AnimatedPage><AdminQuestionFormPage /></AnimatedPage>} />
            <Route path="questions/import" element={<AnimatedPage><AdminQuestionImportPage /></AnimatedPage>} />
            <Route path="questions/:id/edit" element={<AnimatedPage><AdminQuestionFormPage /></AnimatedPage>} />
            <Route path="quizzes" element={<AnimatedPage><AdminQuizListPage /></AnimatedPage>} />
            <Route path="quizzes/new" element={<AnimatedPage><AdminQuizFormPage /></AnimatedPage>} />
            <Route path="quizzes/:id/edit" element={<AnimatedPage><AdminQuizFormPage /></AnimatedPage>} />
            <Route path="vocabulary-sets" element={<AnimatedPage><AdminVocabularyListPage /></AnimatedPage>} />
            <Route path="vocabulary-sets/new" element={<AnimatedPage><AdminVocabularyFormPage /></AnimatedPage>} />
            <Route path="vocabulary-sets/:id/edit" element={<AnimatedPage><AdminVocabularyFormPage /></AnimatedPage>} />
            <Route path="attempts" element={<AnimatedPage><AdminAttemptListPage /></AnimatedPage>} />
            <Route path="attempts/:id/details" element={<AnimatedPage><AdminAttemptDetailPage /></AnimatedPage>} />
          </Route>
      </Route>

      {/* Route 404 (Không có layout) */}
        <Route path="*" element={<AnimatedPage><NotFoundPage /></AnimatedPage>} />
        </Routes>
      </AnimatePresence>
      
      {/* Dictionary Chatbox - Hiển thị ở mọi trang */}
      <DictionaryChatbox />
    </>
  );
}

export default App;