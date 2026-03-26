import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { attachLeadToUser } from "@/lib/attachLeadToUser";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import CoursesPage from "./pages/CoursesPage";
import PricingPage from "./pages/PricingPage";
import AboutPage from "./pages/AboutPage";
import FAQPage from "./pages/FAQPage";
import ContactPage from "./pages/ContactPage";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AuthProtectedRoute from "./components/AuthProtectedRoute";
import EnrollmentProtectedRoute from "./components/EnrollmentProtectedRoute";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EnrollPage from "./pages/EnrollPage";
import EnrollNowPage from "./pages/EnrollNowPage";
import StudentDashboard from "./pages/StudentDashboard";
import EgyptPaymentPage from "./pages/EgyptPaymentPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import MySchedulePage from "./pages/MySchedulePage";
import ResubmitSchedulePage from "./pages/ResubmitSchedulePage";
import AdminResetPage from "./pages/AdminResetPage";
import MarketingGeneratorPage from "./pages/MarketingGeneratorPage";
import PlacementTestPage from "./pages/PlacementTestPage";
import GamesPage from "./pages/GamesPage";
import TextbookHubPage from "./pages/TextbookHubPage";
import TextbookPage from "./pages/TextbookPage";
import LessonDetailPage from "./pages/LessonDetailPage";
import TextbookProgressPage from "./pages/TextbookProgressPage";
import { VocabularyReviewPage } from "./pages/VocabularyReviewPage";
import DailyQuizPage from "./pages/DailyQuizPage";
import ProfilePage from "./pages/ProfilePage";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import FreeTrialPage from "./pages/FreeTrialPage";
import ProgressReportPage from "./pages/ProgressReportPage";
import CertificatePage from "./pages/CertificatePage";
import AffiliatePage from "./pages/AffiliatePage";
import WhatsAppButton from "./components/WhatsAppButton";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // data stays fresh for 1 minute
      retry: 1,                    // only retry once on failure
      refetchOnWindowFocus: false, // don't refetch every time user switches tabs
    },
    mutations: {
      retry: 0,                    // never retry mutations automatically
    },
  },
});

const AppInner = () => {
  // Auto-link leads to authenticated users on login
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        attachLeadToUser(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppInner />
        <WhatsAppButton />
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/enroll" element={<EnrollPage />} />
              <Route path="/enroll-now" element={<EnrollNowPage />} />
              <Route path="/dashboard" element={<AuthProtectedRoute><StudentDashboard /></AuthProtectedRoute>} />
              <Route path="/pay/:enrollmentId" element={<AuthProtectedRoute><EgyptPaymentPage /></AuthProtectedRoute>} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/dashboard/schedule" element={<AuthProtectedRoute><MySchedulePage /></AuthProtectedRoute>} />
              <Route path="/resubmit-schedule" element={<AuthProtectedRoute><ResubmitSchedulePage /></AuthProtectedRoute>} />
              <Route path="/placement-test" element={<PlacementTestPage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/textbook" element={<AuthProtectedRoute><TextbookHubPage /></AuthProtectedRoute>} />
              <Route path="/textbook/progress" element={<AuthProtectedRoute><TextbookProgressPage /></AuthProtectedRoute>} />
              <Route path="/review" element={<AuthProtectedRoute><VocabularyReviewPage /></AuthProtectedRoute>} />
              <Route path="/daily-quiz" element={<AuthProtectedRoute><DailyQuizPage /></AuthProtectedRoute>} />
              <Route path="/textbook/:bookId" element={<AuthProtectedRoute><TextbookPage /></AuthProtectedRoute>} />
              <Route path="/textbook/:bookId/:lessonId" element={<AuthProtectedRoute><LessonDetailPage /></AuthProtectedRoute>} />
              <Route path="/profile" element={<AuthProtectedRoute><ProfilePage /></AuthProtectedRoute>} />
              <Route path="/complete-profile" element={<CompleteProfilePage />} />
              <Route path="/free-trial" element={<FreeTrialPage />} />
              <Route path="/progress-report" element={<AuthProtectedRoute><ProgressReportPage /></AuthProtectedRoute>} />
              <Route path="/certificate" element={<AuthProtectedRoute><CertificatePage /></AuthProtectedRoute>} />
              <Route path="/affiliate" element={<AffiliatePage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/reset" element={<ProtectedRoute><AdminResetPage /></ProtectedRoute>} />
              <Route path="/admin/marketing" element={<ProtectedRoute><MarketingGeneratorPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
