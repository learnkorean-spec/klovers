import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, UserCircle, ChevronDown, LogOut, LayoutDashboard, CalendarDays, Zap, Brain, Sun, Moon, Settings, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import kloversLogo from "@/assets/klovers-logo.jpg";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logLeadEvent } from "@/lib/leadTracking";
import KloverIcon from "@/components/KloverIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** The "Free" chip beside Games. Brand Yellow with Charcoal type, not Tailwind
 *  green: the homepage owns three colours and this was the last stray. */
const FREE_BADGE = "text-[10px] bg-klovers-yellow text-charcoal border border-charcoal/10 px-1.5 py-0.5 rounded-full font-semibold leading-none";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [exchangeUnread, setExchangeUnread] = useState(0);
  const isAr = language === "ar";

  // Language Exchange match notifications (Re's request, 4 Nov 2026): a
  // small unread count on the nav link, so a match is noticed site-wide and
  // not only by reopening /exchange's own Matches tab. Polled rather than
  // realtime-subscribed, matching the existing admin notification bell's
  // own pattern (useUnreadAlerts.ts).
  useEffect(() => {
    if (!user) { setExchangeUnread(0); return; }
    let cancelled = false;
    const load = () => {
      supabase
        .from("exchange_notifications" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false)
        .then(({ count }) => { if (!cancelled) setExchangeUnread(count ?? 0); });
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.id]);

  // Load profile whenever the logged-in user changes.
  //
  // Keyed on user?.id, not on `user`. Supabase fires more than one auth event
  // while booting (INITIAL_SESSION, then SIGNED_IN) and hands back a new
  // object each time, so depending on the object ran this same select twice
  // on every page load — two identical GETs for
  // profiles?select=name,avatar_url, visible in the network log of the live
  // homepage. The id is the thing that actually changed, or didn't.
  useEffect(() => {
    if (!user) { setProfile(null); return; }
    let cancelled = false;
    supabase.from("profiles").select("name, avatar_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data && !cancelled) setProfile(data); });
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const primaryLinks = [
    { href: "/", label: t("header", "home") },
    { href: "/courses", label: t("header", "courses") },
    { href: "/pricing", label: t("header", "pricing") },
    { href: "/textbook", label: isAr ? "الكتاب" : "Textbook" },
    { href: "/games", label: isAr ? "ألعاب" : "Games", badge: !user ? (isAr ? "مجاني" : "Free") : undefined },
    {
      href: "/exchange",
      label: isAr ? "تبادل اللغة" : "Language Exchange",
      badge: user ? (exchangeUnread > 0 ? String(exchangeUnread) : undefined) : (isAr ? "جديد" : "New"),
    },
    { href: "/shop", label: isAr ? "المتجر" : "Shop" },
  ];

  const moreLinks = [
    { href: "/blog", label: isAr ? "المدونة" : "Blog" },
    { href: "/about", label: t("header", "about") },
    { href: "/faq", label: t("header", "faq") },
    { href: "/contact", label: t("header", "contact") },
    // Reham's other 1:1 language offerings — sibling-brand pages (maktub,
    // Voca), not Korean content, so they belong in the visitor-facing "More"
    // menu rather than the logged-in account dropdown (Re, 23 Oct 2026: asked
    // to cross-link them from the main site; account dropdown rejected as the
    // wrong spot since it only shows to signed-in Korean students).
    { href: "/learn-arabic", label: isAr ? "تعلّم العربية — مكتوب" : "Learn Arabic — maktub" },
    { href: "/learn-english", label: isAr ? "تعلّم الإنجليزية — Voca" : "Learn English — Voca" },
    { href: "/learn-hungarian", label: isAr ? "تعلّم المجرية — Buda" : "Learn Hungarian — Buda" },
  ];

  const allLinks = [...primaryLinks, ...moreLinks];

  const isActive = (href: string) =>
    location.pathname === href || (href === "/shop" && location.pathname.startsWith("/shop/"));

  /*
   * SOLID, NOT GLASS (23 Sep 2026). The scrolled state was
   * `bg-background/98`, and 98 is not a step in Tailwind's opacity scale, so
   * the class compiled to nothing: production computed the header background
   * as rgba(0,0,0,0). The links sat directly on whatever section was
   * scrolling underneath and disappeared over the dark and yellow ones. A
   * solid background is the reliable fix - the shadow marks the scrolled
   * state instead.
   *
   * FITS AT 1024px (24 Sep 2026). The desktop nav appears at lg (1024px),
   * the narrowest laptop width, so between lg and xl the links and actions
   * use slightly tighter padding/gaps and the "Free" chip beside Games waits
   * for xl. That keeps the row inside the viewport in Arabic and when signed
   * in (avatar + name). Colours and type are unchanged.
   *
   * LOGO ALT (9 Oct 2026). The logo image has alt="" because the link already
   * has an aria-label and the brand name is written beside it. With the same
   * word as alt, Lighthouse flagged image-redundant-alt (mobile Accessibility
   * 96) and a screen reader read the name twice.
   */
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium focus:shadow-lg">{isAr ? "الانتقال إلى المحتوى" : "Skip to main content"}</a>
    <header className={`fixed top-0 left-0 right-0 z-50 bg-background transition-shadow duration-300 ${scrolled ? "shadow-sm" : ""} border-b border-border`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-2 h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label={isAr ? "الصفحة الرئيسية لكلوفرز" : "Klovers homepage"}>
            <img src={kloversLogo} alt="" className="h-9 w-9 rounded-full object-cover" loading="eager" />
            <span className="font-bold text-lg text-foreground">{isAr ? "كلوفرز" : "Klovers"}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 min-w-0">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-2 xl:px-3 py-2 min-h-11 rounded-md text-sm font-medium whitespace-nowrap transition-colors inline-flex items-center gap-1.5 ${
                  isActive(link.href)
                    ? "text-foreground bg-accent"
                    : "text-foreground/75 hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className={`${FREE_BADGE} hidden xl:inline`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="px-2 xl:px-3 py-2 min-h-11 rounded-md text-sm font-medium whitespace-nowrap text-foreground/75 hover:text-foreground hover:bg-accent/50 transition-colors inline-flex items-center gap-1">
                {isAr ? "المزيد" : "More"}
                <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-40">
                {moreLinks.map((link) => (
                  <DropdownMenuItem key={link.href} onClick={() => navigate(link.href)} className={isActive(link.href) ? "bg-accent" : ""}>
                    {link.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Desktop Actions.

              Every control with a LABEL is min-h-11 (44px). The row is h-16
              and items-center, so they grow symmetrically about the centre
              line: the header height does not move, and neither does any
              width, because a text button's width comes from its label and
              padding and min-height does not touch either.

              The dark-mode toggle is the exception and stays h-8 w-8 (32px).
              It is the only control here with no label, so the only way to
              give it 44px is to widen it - and this row's width budget at
              1024px is tight enough that it is written down above. 32px
              clears WCAG 2.5.8 (24px), and an icon-only control on a
              pointer-driven desktop row is not what that criterion is for.
              Spending a measured layout margin to move it from 32 to 44 is
              the worse of the two trades. */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8" aria-label={isAr ? "تبديل الوضع الليلي" : "Toggle dark mode"}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="min-h-11 gap-1.5 text-xs px-2 xl:px-3">
              <Globe className="h-3.5 w-3.5" />
              {t("header", "langToggle")}
            </Button>

            {!user && (
              <Button size="sm" variant="outline" asChild className="min-h-11 gap-1.5 px-2.5 xl:px-3 border-foreground/30 text-foreground hover:bg-klovers-yellow hover:text-charcoal">
                <Link
                  to="/free-trial"
                  onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "header_free_trial" }); } catch {} }}
                >
                  <Gift className="h-3.5 w-3.5" />
                  {isAr ? "حصة مجانية" : "Free Trial"}
                </Link>
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex min-h-11 items-center gap-2 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klovers-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.name} className="h-8 w-8 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    {/* dir="auto": a Latin name inside the RTL page keeps LTR order, so
                        truncation drops the END of the name, not its first letters. */}
                    <span dir="auto" className="text-sm font-medium text-foreground max-w-[100px] truncate">
                      {profile?.name || user.email?.split("@")[0]}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div dir="ltr" className="px-2 py-1.5 text-xs text-muted-foreground truncate text-start">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="h-4 w-4 me-2" />
                    {isAr ? "لوحة التحكم" : "My Dashboard"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/world", { state: { from: location.pathname } })}>
                    <KloverIcon name="hanok-cherry-tree" className="h-4 w-4 me-2" />
                    {isAr ? "عالم كلوفرز" : "KLOVERS World"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/trial-booking")}>
                    <Gift className="h-4 w-4 me-2" />
                    {isAr ? "حجز حصة مجانية" : "Book Free Trial"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Settings className="h-4 w-4 me-2" />
                    {isAr ? "ملفي الشخصي" : "My Profile"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard/schedule")}>
                    <CalendarDays className="h-4 w-4 me-2" />
                    {isAr ? "جدولي" : "My Schedule"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/daily-quiz")}>
                    <Zap className="h-4 w-4 me-2" />
                    {isAr ? "اختبار يومي" : "Daily Quiz"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/review")}>
                    <Brain className="h-4 w-4 me-2" />
                    {isAr ? "مراجعة المفردات" : "Vocab Review"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 me-2" />
                    {isAr ? "تسجيل الخروج" : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild className="min-h-11 rounded-full">
                <Link to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}>
                  {isAr ? "تسجيل الدخول" : "Sign In"}
                </Link>
              </Button>
            )}
          </div>

          {/* KLOVERS World, one tap away on phones (desktop: in the menus). */}
          {location.pathname !== "/world" && (
            <Link
              to="/world"
              state={{ from: location.pathname }}
              className="lg:hidden inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-charcoal bg-klovers-yellow ps-1.5 pe-3 text-xs font-bold text-charcoal"
            >
              <KloverIcon name="hanok-cherry-tree" className="h-7 w-7" />
              {isAr ? "العالم" : "World"}
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="lg:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? (isAr ? "إغلاق قائمة التنقل" : "Close navigation menu") : (isAr ? "فتح قائمة التنقل" : "Open navigation menu")}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
          </button>
        </div>

        {/* Mobile Nav.

            Everything below is `lg:hidden`, so every control here is reached
            by a thumb and is min-h-11 (44px). The short row (Schedule / Quiz /
            Review) was the worst of them at 36px - three 36px targets in a
            grid, which is the arrangement a thumb misses most often. */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              <Link
                to="/world"
                state={{ from: location.pathname }}
                onClick={() => setIsMenuOpen(false)}
                className="mb-1 inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-charcoal bg-klovers-yellow px-3 text-sm font-bold text-charcoal"
              >
                <KloverIcon name="hanok-cherry-tree" className="h-8 w-8" />
                {isAr ? "دخول عالم كلوفرز" : "Enter KLOVERS World"}
              </Link>
              {allLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2.5 min-h-11 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                    isActive(link.href) ? "text-foreground bg-accent" : "text-foreground/75 hover:text-foreground hover:bg-accent/50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                  {"badge" in link && link.badge && (
                    <span className={FREE_BADGE}>
                      {link.badge as React.ReactNode}
                    </span>
                  )}
                </Link>
              ))}

              <div className="border-t border-border my-2" />

              <Button variant="ghost" size="sm" onClick={toggleTheme} className="min-h-11 gap-2 justify-start">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? (isAr ? "الوضع النهاري" : "Light Mode") : (isAr ? "الوضع الليلي" : "Dark Mode")}
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleLanguage} className="min-h-11 gap-2 justify-start">
                <Globe className="h-4 w-4" />
                {t("header", "langToggle")}
              </Button>

              {user ? (
                <>
                  <Button variant="outline" asChild className="min-h-11 w-full" onClick={() => setIsMenuOpen(false)}>
                    <Link to="/dashboard"><LayoutDashboard className="h-4 w-4 me-2" />{isAr ? "لوحة التحكم" : "My Dashboard"}</Link>
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="ghost" size="sm" asChild className="min-h-11 w-full" onClick={() => setIsMenuOpen(false)}>
                      <Link to="/dashboard/schedule"><CalendarDays className="h-4 w-4 me-1" />{isAr ? "جدول" : "Schedule"}</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="min-h-11 w-full" onClick={() => setIsMenuOpen(false)}>
                      <Link to="/daily-quiz"><Zap className="h-4 w-4 me-1" />{isAr ? "اختبار" : "Quiz"}</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="min-h-11 w-full" onClick={() => setIsMenuOpen(false)}>
                      <Link to="/review"><Brain className="h-4 w-4 me-1" />{isAr ? "مراجعة" : "Review"}</Link>
                    </Button>
                  </div>
                  <Button variant="ghost" className="min-h-11 w-full justify-start text-destructive" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                    <LogOut className="h-4 w-4 me-2" />{isAr ? "تسجيل الخروج" : "Logout"}
                  </Button>
                </>
              ) : (
                <Button asChild className="min-h-11 w-full rounded-full" onClick={() => setIsMenuOpen(false)}>
                  <Link to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}>
                    {isAr ? "تسجيل الدخول" : "Sign In"}
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
    </>
  );
};

export default Header;
