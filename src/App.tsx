import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { attachLeadToUser } from "@/lib/attachLeadToUser";
import { attachSessionToUser } from "@/lib/attachSessionToUser";
import { captureUtmFromUrl } from "@/lib/leadSession";
import { identify, trackPageView, capture } from "@/lib/analytics";
import { installChunkReload } from "@/lib/chunk-reload";
import ErrorBoundary from "@/components/ErrorBoundary";
import WhatsAppButton from "./components/WhatsAppButton";
import CookieBanner from "./components/CookieBanner";
import InstallPrompt from "./components/InstallPrompt";
import LanguageUrlSync from "./components/LanguageUrlSync";

// Route guards — kept eager (tiny, needed immediately)
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AuthProtectedRoute from "./components/AuthProtectedRoute";

// Lazy-loaded pages — each becomes its own JS chunk
const Index = lazy(() => import("./pages/Index"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const ConversationPage = lazy(() => import("./pages/ConversationPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const TeachWithUsPage = lazy(() => import("./pages/TeachWithUsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminEntry = lazy(() => import("./pages/AdminEntry"));
const AdminToday = lazy(() => import("./pages/AdminToday"));
const AdminWeek = lazy(() => import("./pages/AdminWeek"));
const AdminEmail = lazy(() => import("./pages/AdminEmail"));
const AdminActivity = lazy(() => import("./pages/AdminActivity"));
const AdminTrials = lazy(() => import("./pages/AdminTrials"));
const AdminMessage = lazy(() => import("./pages/AdminMessage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const EnrollPage = lazy(() => import("./pages/EnrollPage"));
const EnrollNowPage = lazy(() => import("./pages/EnrollNowPage"));
// /dashboard is not one page: Klovers teaches Korean and English, and the
// Korean dashboard is the wrong product for an English student. The router
// reads profiles.track and mounts one of the two, so only one chunk loads.
const DashboardRouter = lazy(() => import("./pages/DashboardRouter"));
const MyLessonsPage = lazy(() => import("./pages/MyLessonsPage"));
const EgyptPaymentPage = lazy(() => import("./pages/EgyptPaymentPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const EraPage = lazy(() => import("./pages/EraPage"));
// The /journey hub (5 Oct 2026): the five era stations on one page; /journey used to 404.
const JourneyHubPage = lazy(() => import("./pages/JourneyHubPage"));
const MySchedulePage = lazy(() => import("./pages/MySchedulePage"));
const ResubmitSchedulePage = lazy(() => import("./pages/ResubmitSchedulePage"));
const AdminResetPage = lazy(() => import("./pages/AdminResetPage"));
const MarketingGeneratorPage = lazy(() => import("./pages/MarketingGeneratorPage")); const AdminGuide = lazy(() => import("./pages/AdminGuide"));
const KoreanOrchestratorPage = lazy(() => import("./pages/KoreanOrchestratorPage"));
const AiRoomLabPage = lazy(() => import("./pages/AiRoomLabPage"));
const AdminExchangeReportsPage = lazy(() => import("./pages/AdminExchangeReportsPage"));
const World2Page = lazy(() => import("./world2/World2Page"));
const HangulA0AudioPage = lazy(() => import("./pages/HangulA0AudioPage"));
const KoreanPlacementPage = lazy(() => import("./pages/KoreanPlacementPage"));
const GamesPage = lazy(() => import("./pages/GamesPage"));
const LanguageExchangePage = lazy(() => import("./pages/LanguageExchangePage"));
// PolyglotMatch (9 Nov 2026): a distinct "night mode" front door for the
// swipe-matching side of Language Exchange, shown as "PolyglotMatch · by
// Klovers". This now IS /exchange and /ar/exchange; the real app moved to
// /exchange/app (and /ar/exchange/app) underneath it.
const PolyglotMatchLandingPage = lazy(() => import("./pages/PolyglotMatchLandingPage"));
const TextbookHubPage = lazy(() => import("./pages/TextbookHubPage"));
const TextbookPage = lazy(() => import("./pages/TextbookPage"));
const LessonDetailPage = lazy(() => import("./pages/LessonDetailPage"));
const TextbookProgressPage = lazy(() => import("./pages/TextbookProgressPage"));
const VocabularyReviewPage = lazy(() =>
  import("./pages/VocabularyReviewPage").then(m => ({ default: m.VocabularyReviewPage }))
);
const DailyQuizPage = lazy(() => import("./pages/DailyQuizPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CompleteProfilePage = lazy(() => import("./pages/CompleteProfilePage"));
const FreeTrialPage = lazy(() => import("./pages/FreeTrialPage"));
const TrialBookingPage = lazy(() => import("./pages/TrialBookingPage"));
const ProgressReportPage = lazy(() => import("./pages/ProgressReportPage"));
const CertificatePage = lazy(() => import("./pages/CertificatePage"));
const AffiliatePage = lazy(() => import("./pages/AffiliatePage"));
const LearnKoreanArabicSpeakersPage = lazy(() => import("./pages/LearnKoreanArabicSpeakersPage"));
const TopikExamPage = lazy(() => import("./pages/TopikExamPage"));
const KDramaLearningPage = lazy(() => import("./pages/KDramaLearningPage"));
const LearnHungarianPage = lazy(() => import("./pages/LearnHungarianPage"));
const LearnArabicPage = lazy(() => import("./pages/LearnArabicPage"));
const LearnEnglishPage = lazy(() => import("./pages/LearnEnglishPage"));
// The scholarships page carries a real Arabic twin (/ar/scholarships), listed in
// scripts/lib/arabic-page-meta.mjs and scripts/lib/arabic-pages.mjs.
const ScholarshipsPage = lazy(() => import("./pages/ScholarshipsPage"));
const InterviewTrainingPage = lazy(() => import("./pages/InterviewTrainingPage"));
const KoreanInterviewPage = lazy(() => import("./pages/KoreanInterviewPage"));
const ReturningStudentsLandingPage = lazy(() => import("./pages/ReturningStudentsLandingPage"));
const TrialBookPage = lazy(() => import("./pages/TrialBookPage"));
const TrialConfirmPage = lazy(() => import("./pages/TrialConfirmPage"));
const EnrollmentStatusPage = lazy(() => import("./pages/EnrollmentStatusPage"));
const HangulStarterPage = lazy(() => import("./pages/HangulStarterPage"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const ShopProductPage = lazy(() => import("./pages/ShopProductPage"));
const RsvpConfirmationPage = lazy(() => import("./pages/RsvpConfirmationPage"));
const UnsubscribePage = lazy(() => import("./pages/UnsubscribePage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
// KLOVERS World (3D prototype). The route shell is tiny; three.js loads in a
// second chunk only after the page checks WebGL. See src/game/.
const WorldPage = lazy(() => import("./pages/WorldPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Tracks page views on every client-side navigation
const PageViewTracker = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);
  return null;
};

const AppInner = () => {
  useEffect(() => {
    captureUtmFromUrl();

    // A tab open across a deploy holds an index pointing at chunk filenames
    // that no longer exist. Recover by reloading once. See chunk-reload.ts.
    const removeChunkReload = installChunkReload();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        attachLeadToUser(session.user);
        attachSessionToUser();
        // Link future analytics events to the authenticated user
        identify(session.user.id, {
          email: session.user.email,
          created_at: session.user.created_at,
        });
      }
    });

    // Register service worker for offline support / PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // SW registration failure is non-fatal; app still works online
      });
    }

    return () => {
      subscription.unsubscribe();
      removeChunkReload();
    };
  }, []);

  return null;
};

// Minimal full-screen spinner shown while a lazy chunk loads
// Reads the page language from <html lang> so it works outside the language provider.
const PageLoader = () => {
  const isAr = typeof document !== "undefined" && document.documentElement.lang === "ar";
  return (
    <div role="status" aria-label={isAr ? "جارٍ تحميل الصفحة" : "Loading page"} className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-klovers-yellow border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      <span className="sr-only">{isAr ? "جارٍ التحميل…" : "Loading…"}</span>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="bottom-center" />
        <AppInner />
        <WhatsAppButton />
        <CookieBanner />
        <BrowserRouter>
          <PageViewTracker />
          <LanguageUrlSync />
          <InstallPrompt />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* The Arabic homepage (24 Sep 2026): the same page, its own
                    URL, so Arabic can be indexed and paired with hreflang.
                    LanguageContext opens it in Arabic. */}
                <Route path="/ar" element={<Index />} />
                {/* Arabic twins of six pages (GEO-03, 27 Sep 2026). Same pages,
                    their own Arabic URLs; see src/lib/arabicRoutes.ts. */}
                <Route path="/ar/courses" element={<CoursesPage />} />
                <Route path="/ar/pricing" element={<PricingPage />} />
                <Route path="/ar/about" element={<AboutPage />} />
                <Route path="/ar/faq" element={<FAQPage />} />
                <Route path="/ar/placement-test" element={<KoreanPlacementPage />} />
                <Route path="/ar/free-trial" element={<FreeTrialPage />} />
                {/* The Arabic blog index (28 Sep 2026): Arabic articles only. */}
                <Route path="/ar/blog" element={<BlogPage />} />
                {/* The scholarships page has an Arabic twin too. */}
                <Route path="/ar/scholarships" element={<ScholarshipsPage />} />
                {/* Arabic twins added 5 Oct 2026 (GEO re-score): contact and the three landing pages. */}
                <Route path="/ar/contact" element={<ContactPage />} />
                <Route path="/ar/learn-korean-arabic-speakers" element={<LearnKoreanArabicSpeakersPage />} />
                <Route path="/ar/topik-exam-preparation" element={<TopikExamPage />} />
                <Route path="/ar/learn-korean-kdramas" element={<KDramaLearningPage />} />
                <Route path="/ar/learn-hungarian" element={<LearnHungarianPage />} />
                <Route path="/ar/learn-arabic" element={<LearnArabicPage />} />
                <Route path="/ar/learn-english" element={<LearnEnglishPage />} />
                {/* Klovers Supply index (6 Oct 2026). Category pages stay English-URL only. */}
                <Route path="/ar/shop" element={<ShopPage />} />
                <Route path="/ar/hangul-starter" element={<HangulStarterPage />} />
                {/* Enrolment, games, affiliate, interview training, welcome back and the two legal pages (15 Oct 2026). */}
                <Route path="/ar/enroll-now" element={<EnrollNowPage />} />
                <Route path="/ar/games" element={<GamesPage />} />
                <Route path="/ar/exchange" element={<PolyglotMatchLandingPage />} />
                <Route path="/ar/exchange/app" element={<LanguageExchangePage />} />
                <Route path="/ar/polyglotmatch" element={<Navigate to="/ar/exchange" replace />} />
                <Route path="/ar/affiliate" element={<AffiliatePage />} />
                <Route path="/ar/interview-training" element={<KoreanInterviewPage />} />
                <Route path="/ar/welcome-back" element={<ReturningStudentsLandingPage />} />
                <Route path="/ar/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/ar/terms" element={<TermsPage />} />
                {/* The journey hub and its five stations (6 Oct 2026). */}
                <Route path="/ar/journey" element={<JourneyHubPage />} />
                <Route path="/ar/journey/:eraId" element={<EraPage />} />
                {/* Printed in the books as a QR — never change this path. */}
                <Route path="/c/:code" element={<ConversationPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/teach-with-us" element={<TeachWithUsPage />} />
                {/* Legal pages (24 Sep 2026). The footer and the cookie banner
                    linked to these while both rendered NotFound (audit, 23 Sep).
                    /privacy is a convenience alias for the short form people type. */}
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/enroll" element={<EnrollPage />} />
                <Route path="/enroll-now" element={<EnrollNowPage />} />
                <Route path="/dashboard" element={<AuthProtectedRoute><DashboardRouter /></AuthProtectedRoute>} />
                {/* The private-lesson view on its own URL, so it can be linked
                    to directly — a Korean private student reaches it from here
                    without her /dashboard changing. */}
                <Route path="/my-lessons" element={<AuthProtectedRoute><MyLessonsPage /></AuthProtectedRoute>} />
                <Route path="/pay/:enrollmentId" element={<AuthProtectedRoute><EgyptPaymentPage /></AuthProtectedRoute>} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/journey" element={<JourneyHubPage />} />
                <Route path="/journey/:eraId" element={<EraPage />} />
                <Route path="/dashboard/schedule" element={<AuthProtectedRoute><MySchedulePage /></AuthProtectedRoute>} />
                <Route path="/resubmit-schedule" element={<AuthProtectedRoute><ResubmitSchedulePage /></AuthProtectedRoute>} />
                {/* One placement test, answered as a TOPIK grade. Public on
                    purpose — the lead funnel lives on this route. */}
                <Route path="/placement-test" element={<KoreanPlacementPage />} />
                {/* Superseded by /placement-test. Kept as a redirect so links
                    already sent to students do not 404. */}
                <Route path="/unit-placement" element={<Navigate to="/placement-test" replace />} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/exchange" element={<PolyglotMatchLandingPage />} />
                <Route path="/exchange/app" element={<LanguageExchangePage />} />
                <Route path="/polyglotmatch" element={<Navigate to="/exchange" replace />} />
                <Route path="/world" element={<WorldPage />} />
                <Route path="/textbook" element={<AuthProtectedRoute><TextbookHubPage /></AuthProtectedRoute>} />
                <Route path="/textbook/progress" element={<AuthProtectedRoute><TextbookProgressPage /></AuthProtectedRoute>} />
                <Route path="/review" element={<AuthProtectedRoute><VocabularyReviewPage /></AuthProtectedRoute>} />
                <Route path="/daily-quiz" element={<AuthProtectedRoute><DailyQuizPage /></AuthProtectedRoute>} />
                <Route path="/textbook/:bookId" element={<AuthProtectedRoute><TextbookPage /></AuthProtectedRoute>} />
                <Route path="/textbook/:bookId/:lessonId" element={<AuthProtectedRoute><LessonDetailPage /></AuthProtectedRoute>} />
                <Route path="/profile" element={<AuthProtectedRoute><ProfilePage /></AuthProtectedRoute>} />
                <Route path="/complete-profile" element={<CompleteProfilePage />} />
                <Route path="/free-trial" element={<FreeTrialPage />} />
                <Route path="/rsvp" element={<RsvpConfirmationPage />} />
                <Route path="/trial-booking" element={<TrialBookingPage />} />
                <Route path="/progress-report" element={<AuthProtectedRoute><ProgressReportPage /></AuthProtectedRoute>} />
                <Route path="/certificate" element={<AuthProtectedRoute><CertificatePage /></AuthProtectedRoute>} />
                <Route path="/affiliate" element={<AffiliatePage />} />
                <Route path="/learn-korean-arabic-speakers" element={<LearnKoreanArabicSpeakersPage />} />
                <Route path="/topik-exam-preparation" element={<TopikExamPage />} />
                <Route path="/learn-korean-kdramas" element={<KDramaLearningPage />} />
                <Route path="/learn-hungarian" element={<LearnHungarianPage />} />
                <Route path="/learn-arabic" element={<LearnArabicPage />} />
                <Route path="/learn-english" element={<LearnEnglishPage />} />
                <Route path="/scholarships" element={<ScholarshipsPage />} />
                <Route path="/interview-training" element={<KoreanInterviewPage />} />
                <Route path="/welcome-back" element={<ReturningStudentsLandingPage />} />
                {/* The old web book (HangulBookPage) was removed on 27 Sep 2026 (Re: it is
                    old and not used). Students get the A0 PDF in My Books on
                    the dashboard, so old links land there. */}
                <Route path="/hangul-book" element={<Navigate to="/dashboard" replace />} />
                <Route path="/trial-book" element={<AuthProtectedRoute><TrialBookPage /></AuthProtectedRoute>} />
                <Route path="/trial-confirm" element={<TrialConfirmPage />} />
                <Route path="/enrollment-status" element={<AuthProtectedRoute><EnrollmentStatusPage /></AuthProtectedRoute>} />
                <Route path="/hangul-starter" element={<HangulStarterPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/shop/products/:slug" element={<ShopProductPage />} />
                {/* The colouring book is no longer free (Re, 1 Oct 2026): old gift links open its shop page. */}
                <Route path="/gift/cluby" element={<Navigate to="/shop/products/cluby-coloring-book-1" replace />} />
                <Route path="/shop/:category" element={<ShopPage />} />
                {/* Re's own training panel. Admin sign-in only (28 Sep 2026):
                    the old page hid it behind a password written in the shipped
                    JS bundle, i.e. readable by any visitor. */}
                <Route path="/practice-interview" element={<ProtectedRoute><InterviewTrainingPage /></ProtectedRoute>} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/reset" element={<ProtectedRoute><AdminResetPage /></ProtectedRoute>} />
                <Route path="/admin/marketing" element={<ProtectedRoute><MarketingGeneratorPage /></ProtectedRoute>} /><Route path="/admin/guide" element={<ProtectedRoute><AdminGuide /></ProtectedRoute>} />
                <Route path="/admin/korean-orchestra" element={<ProtectedRoute><KoreanOrchestratorPage /></ProtectedRoute>} />
                <Route path="/admin/ai-room-lab" element={<ProtectedRoute><AiRoomLabPage /></ProtectedRoute>} />
                <Route path="/admin/exchange-reports" element={<ProtectedRoute><AdminExchangeReportsPage /></ProtectedRoute>} />
                <Route path="/world2" element={<World2Page />} />
                {/* Hangul A0 book audio: the QR code on each book page opens /a0/<page>. */}
                <Route path="/a0" element={<HangulA0AudioPage />} />
                <Route path="/a0/:page" element={<HangulA0AudioPage />} />
                <Route path="/admin/today" element={<ProtectedRoute><AdminToday /></ProtectedRoute>} />
                {/* Must sit BEFORE /admin — /admin is exact-match in v6, so the
                    order is not load-bearing, but keeping the specific paths
                    above it matches how the rest of this block reads. */}
                <Route path="/admin/week" element={<ProtectedRoute><AdminWeek /></ProtectedRoute>} />
                <Route path="/admin/email" element={<ProtectedRoute><AdminEmail /></ProtectedRoute>} />
                {/* The seven-day read: what happened, and who is new. Its own
                    route for the same reason Today and The week are — it is not
                    a screen inside AdminDashboard.tsx. */}
                <Route path="/admin/activity" element={<ProtectedRoute><AdminActivity /></ProtectedRoute>} />
                {/* The trial sessions, answering only the three questions Re
                    asks of them: who is coming, accept the new ones, find one
                    person. Its own route for the same reason as the rest — and
                    so it keeps working when the 89 KB dashboard page does not. */}
                <Route path="/admin/trials" element={<ProtectedRoute><AdminTrials /></ProtectedRoute>} />
                {/* Free text to one student, from the Klovers address. A route
                    of its own for the same reason as the three above. */}
                <Route path="/admin/message" element={<ProtectedRoute><AdminMessage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminEntry /></ProtectedRoute>} />
                {/* Public and unguarded on purpose — requiring a login to opt
                    out is how a campaign gets reported as spam instead. */}
                <Route path="/unsubscribe" element={<UnsubscribePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
