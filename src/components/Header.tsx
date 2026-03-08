import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, UserCircle, ChevronDown, LogOut } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import kloversLogo from "@/assets/klovers-logo.jpg";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const isAr = language === "ar";

  useEffect(() => {
    const loadProfile = async (userId: string) => {
      const { data } = await supabase.from("profiles").select("name, avatar_url").eq("user_id", userId).maybeSingle();
      if (data) setProfile(data);
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

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
  ];

  const moreLinks = [
    { href: "/games", label: isAr ? "ألعاب" : "Games" },
    { href: "/blog", label: isAr ? "المدونة" : "Blog" },
    { href: "/about", label: t("header", "about") },
    { href: "/faq", label: t("header", "faq") },
    { href: "/contact", label: t("header", "contact") },
  ];

  const allLinks = [...primaryLinks, ...moreLinks];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/98 backdrop-blur-md shadow-sm" : "bg-background/95 backdrop-blur-sm"} border-b border-border`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={kloversLogo} alt="K-Lovers" className="h-9 w-9 rounded-full object-cover" loading="eager" />
            <span className="font-bold text-lg text-foreground">K-Lovers</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors inline-flex items-center gap-1">
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

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-1.5 text-xs">
              <Globe className="h-3.5 w-3.5" />
              {t("header", "langToggle")}
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                      <UserCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                    {profile?.name || user.email?.split("@")[0]}
                  </span>
                </Link>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                      <LogOut className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{isAr ? "تسجيل الخروج" : "Logout"}</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Button size="sm" asChild>
                <Link to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}>
                  {isAr ? "تسجيل الدخول" : "Sign In"}
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              {allLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href) ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-border my-2" />

              <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2 justify-start">
                <Globe className="h-4 w-4" />
                {t("header", "langToggle")}
              </Button>

              {user ? (
                <>
                  <Button variant="outline" asChild className="w-full" onClick={() => setIsMenuOpen(false)}>
                    <Link to="/dashboard">{isAr ? "لوحة التحكم" : "My Dashboard"}</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                    {isAr ? "تسجيل الخروج" : "Logout"}
                  </Button>
                </>
              ) : (
                <Button asChild className="w-full" onClick={() => setIsMenuOpen(false)}>
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
  );
};

export default Header;
