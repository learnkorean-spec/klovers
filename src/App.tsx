import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { attachLeadToUser } from "@/lib/attachLeadToUser";
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
import TextbookPage from "./pages/TextbookPage";
import LessonDetailPage from "./pages/LessonDetailPage";
import TextbookProgressPage from "./pages/TextbookProgressPage";
const queryClient = new QueryClient();

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
        <BrowserRouter>
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
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/pay/:enrollmentId" element={<EgyptPaymentPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/dashboard/schedule" element={<MySchedulePage />} />
            <Route path="/resubmit-schedule" element={<ResubmitSchedulePage />} />
            <Route path="/placement-test" element={<PlacementTestPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/textbook" element={<TextbookPage />} />
            <Route path="/textbook/progress" element={<TextbookProgressPage />} />
            <Route path="/textbook/:lessonId" element={<LessonDetailPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/reset" element={<ProtectedRoute><AdminResetPage /></ProtectedRoute>} />
            <Route path="/admin/marketing" element={<ProtectedRoute><MarketingGeneratorPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
