import React, { useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useBrowserLocation } from "wouter/use-browser-location";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import AdminPage from "@/pages/admin";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import LanguagePreferenceModal from "@/components/language-preference-modal";
import AdminProtectedRoute from "@/components/admin/protected-route";
import {
  getLanguageFromPath,
  getPreferredLanguage,
  isLanguageExcludedPath,
  normalizeLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
  stripLanguageFromPath,
  withLanguagePrefix,
} from "@/lib/language-routing";
import { getSessionLanguageCookie, setSessionLanguageCookie } from "@/lib/language-session";

const ToursPage = React.lazy(() => import("@/pages/tours"));
const GalleryPage = React.lazy(() => import("@/pages/gallery"));
const GuidePage = React.lazy(() => import("@/pages/guide"));
const AlfamaLoungeSuitesPage = React.lazy(() => import("@/pages/alfama-lounge-suites"));
const ReviewPage = React.lazy(() => import("@/pages/review"));
const TourDetailsPage = React.lazy(() => import("@/pages/tours/tour-details"));
const BookingPage = React.lazy(() => import("@/pages/tours/booking"));
const AdminLoginPage = React.lazy(() => import("@/pages/admin/login"));
const AdminDashboardPage = React.lazy(() => import("@/pages/admin/index"));
const BookingRequestsPage = React.lazy(() => import("@/pages/admin/BookingRequests"));
const AdminToursPage = React.lazy(() => import("@/pages/admin/tours"));
const EditTourPage = React.lazy(() => import("@/pages/admin/EditTour"));
const AdminBookingsPage = React.lazy(() => import("@/pages/admin/bookings"));
const AdminPaymentsPage = React.lazy(() => import("@/pages/admin/payments"));
const AdminDiscountsPage = React.lazy(() => import("@/pages/admin/discounts"));
const AdminGalleryPage = React.lazy(() => import("@/pages/admin/gallery"));
const AdminHeroBannerPage = React.lazy(() => import("@/pages/admin/hero-banner"));
const AdminDocumentsPage = React.lazy(() => import("@/pages/admin/documents"));
const AdminStoragePage = React.lazy(() => import("@/pages/admin/storage"));
const ManageArticlesPage = React.lazy(() => import("@/pages/admin/ManageArticles"));
const AdminReviewsPage = React.lazy(() => import("@/pages/admin/reviews"));
const PasswordChangePage = React.lazy(() => import("@/pages/admin/password"));
const DatabaseExportPage = React.lazy(() => import("@/pages/admin/database-export"));
const ArticlePage = React.lazy(() => import("@/pages/admin/Article"));

function RouteFallback() {
  return <div>Loading...</div>;
}

function SuspendedRoute({ children }: { children: React.ReactNode }) {
  return <React.Suspense fallback={<RouteFallback />}>{children}</React.Suspense>;
}

function ProtectedAdminPage({ children }: { children: React.ReactNode }) {
  return (
    <SuspendedRoute>
      <AdminProtectedRoute>{children}</AdminProtectedRoute>
    </SuspendedRoute>
  );
}

function useLocalizedBrowserLocation(): [string, (path: string, options?: { replace?: boolean; state?: unknown }) => void] {
  const [pathname, navigate] = useBrowserLocation();
  const preferredLanguage = getPreferredLanguage(pathname);
  const normalizedPath = stripLanguageFromPath(pathname);

  const localizedNavigate = (to: string, options?: { replace?: boolean; state?: unknown }) => {
    navigate(withLanguagePrefix(to, preferredLanguage), options);
  };

  return [normalizedPath, localizedNavigate];
}

const formatLocalizedHref = (href: string) => {
  if (typeof window === "undefined") {
    return href;
  }

  const preferredLanguage = getPreferredLanguage(window.location.pathname);
  return withLanguagePrefix(href, preferredLanguage);
};

function LanguagePathSync() {
  const { i18n } = useTranslation();
  const [location] = useLocation();

  useEffect(() => {
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const pathLanguage = getLanguageFromPath(window.location.pathname);
    const currentLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

    if (isLanguageExcludedPath(window.location.pathname)) {
      if (pathLanguage) {
        const canonicalPath = `${stripLanguageFromPath(window.location.pathname)}${window.location.search}${window.location.hash}`;
        if (canonicalPath !== currentPath) {
          window.history.replaceState(window.history.state, "", canonicalPath);
          window.dispatchEvent(new Event("replaceState"));
        }
      }
      return;
    }

    if (pathLanguage) {
      if (pathLanguage !== currentLanguage) {
        i18n.changeLanguage(pathLanguage);
      }
      return;
    }

    const localizedPath = withLanguagePrefix(currentPath, currentLanguage);
    if (localizedPath !== currentPath) {
      window.history.replaceState(window.history.state, "", localizedPath);
      window.dispatchEvent(new Event("replaceState"));
    }
  }, [i18n, i18n.language, i18n.resolvedLanguage, location]);

  return null;
}

// Define admin routes
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/tours">{() => <SuspendedRoute><ToursPage /></SuspendedRoute>}</Route>
      <Route path="/gallery">{() => <SuspendedRoute><GalleryPage /></SuspendedRoute>}</Route>
      <Route path="/3-day-guide-book">{() => <SuspendedRoute><GuidePage /></SuspendedRoute>}</Route>
      <Route path="/alfama-lounge-suites">{() => <SuspendedRoute><AlfamaLoungeSuitesPage /></SuspendedRoute>}</Route>
      <Route path="/review/:bookingReference">{() => <SuspendedRoute><ReviewPage /></SuspendedRoute>}</Route>
      <Route path="/tour/:id">{() => <SuspendedRoute><TourDetailsPage /></SuspendedRoute>}</Route>
      <Route path="/book/:id">{() => <SuspendedRoute><BookingPage /></SuspendedRoute>}</Route>
      <Route path="/admin">
        {() => (
          <AdminProtectedRoute>
            <AdminPage />
          </AdminProtectedRoute>
        )}
      </Route>
      
      <Route path="/admin/login">{() => <SuspendedRoute><AdminLoginPage /></SuspendedRoute>}</Route>
      <Route path="/admin/dashboard">{() => <ProtectedAdminPage><AdminDashboardPage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/requests">{() => <ProtectedAdminPage><BookingRequestsPage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/tours">{() => <ProtectedAdminPage><AdminToursPage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/tours/create">{() => <ProtectedAdminPage><EditTourPage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/tours/edit/:id">{() => <ProtectedAdminPage><EditTourPage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/bookings">{() => <ProtectedAdminPage><AdminBookingsPage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/payments">{() => <ProtectedAdminPage><AdminPaymentsPage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/discounts">{() => <ProtectedAdminPage><AdminDiscountsPage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/gallery">{() => <ProtectedAdminPage><AdminGalleryPage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/hero-banner">{() => <ProtectedAdminPage><AdminHeroBannerPage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/documents">{() => <ProtectedAdminPage><AdminDocumentsPage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/storage">{() => <ProtectedAdminPage><AdminStoragePage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/articles">{() => <ProtectedAdminPage><ManageArticlesPage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/reviews">{() => <ProtectedAdminPage><AdminReviewsPage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/password">{() => <ProtectedAdminPage><PasswordChangePage /></ProtectedAdminPage>}</Route>
      <Route path="/admin/database-export">{() => <ProtectedAdminPage><DatabaseExportPage /></ProtectedAdminPage>}</Route>
      <Route path="/articles/:slug">{() => <SuspendedRoute><ArticlePage /></SuspendedRoute>}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function LanguageAwareApp() {
  const { i18n } = useTranslation();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const initialPathnameRef = useRef(
    typeof window !== "undefined" ? window.location.pathname : "/",
  );
  
  // Update HTML lang attribute when language changes
  useEffect(() => {
    const currentLang = i18n.language?.split('-')[0] || 'en';
    document.documentElement.lang = currentLang;
  }, [i18n.language]);

  // Fire a lightweight visit tracking event on first load
  // Try to include browser geolocation with daily prompt throttle
  useEffect(() => {
    const controller = new AbortController();
    const basePayload: any = {
      path: window.location.pathname + window.location.search + window.location.hash,
      referrer: document.referrer || null,
    };

    let sent = false;
    const send = (data: any) => {
      if (sent) return; sent = true;
      fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      }).catch(() => {});
    };

    // Fallback if geolocation is slow or unavailable
    const fallbackTimer = setTimeout(() => send(basePayload), 1500);

    const GEO_PROMPT_KEY = 'llm_geo_prompt_at';
    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const getLastPrompt = (): number => {
      try { return Number(localStorage.getItem(GEO_PROMPT_KEY) || 0); } catch { return 0; }
    };
    const setPromptNow = () => {
      try { localStorage.setItem(GEO_PROMPT_KEY, String(now)); } catch {}
    };

    const tryGeolocate = () => {
      if (!navigator.geolocation) return; // rely on fallback
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(fallbackTimer);
          const { latitude, longitude, accuracy } = pos.coords;
          send({ ...basePayload, coords: { lat: latitude, lon: longitude, accuracy } });
        },
        () => {
          clearTimeout(fallbackTimer);
          send(basePayload);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    };

    // Use Permissions API when available to avoid unnecessary prompts
    const maybeGeolocateWithDailyPrompt = () => {
      const last = getLastPrompt();
      if (!last || now - last > DAY_MS) {
        // Record that we attempted to prompt today regardless of outcome
        setPromptNow();
        tryGeolocate();
      }
      // else rely on fallback to send without coords
    };

    const anyNavigator: any = navigator as any;
    if (anyNavigator.permissions?.query) {
      try {
        anyNavigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status: any) => {
          const state = status?.state as PermissionState | undefined;
          if (state === 'granted') {
            // Safe to use geolocation without prompting each time
            tryGeolocate();
          } else if (state === 'denied') {
            // Don't attempt; rely on fallback
          } else {
            // state === 'prompt' or unknown
            maybeGeolocateWithDailyPrompt();
          }
        }).catch(() => {
          // If query fails, fall back to daily throttle
          maybeGeolocateWithDailyPrompt();
        });
      } catch {
        maybeGeolocateWithDailyPrompt();
      }
    } else {
      // No Permissions API — throttle our geolocation request to once per day
      maybeGeolocateWithDailyPrompt();
    }

    return () => {
      clearTimeout(fallbackTimer);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const currentPathname = window.location.pathname;
    const initialPathname = initialPathnameRef.current;
    if (isLanguageExcludedPath(currentPathname)) {
      return;
    }

    const pathLanguage = getLanguageFromPath(initialPathname);
    if (pathLanguage) {
      setSessionLanguageCookie(pathLanguage);
      setIsLanguageModalOpen(false);
      return;
    }

    const cookieLanguage = getSessionLanguageCookie();
    if (cookieLanguage) {
      if (normalizeLanguage(i18n.resolvedLanguage || i18n.language) !== cookieLanguage) {
        i18n.changeLanguage(cookieLanguage);
      }
      setIsLanguageModalOpen(false);
      return;
    }

    const hostname = window.location.hostname.toLowerCase();
    const isLisbonLovesMeDomain =
      hostname === "lisbonlovesme.com" || hostname === "www.lisbonlovesme.com";

    if (isLisbonLovesMeDomain && normalizeLanguage(i18n.resolvedLanguage || i18n.language) !== "en") {
      i18n.changeLanguage("en");
    }

    setIsLanguageModalOpen(true);
  }, [i18n, i18n.language, i18n.resolvedLanguage]);

  const handleLanguageSelection = (language: SupportedLanguage) => {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return;
    }

    const selectedLanguage = setSessionLanguageCookie(language);
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const localizedPath = withLanguagePrefix(currentPath, selectedLanguage);

    if (localizedPath !== currentPath) {
      window.history.replaceState(window.history.state, "", localizedPath);
      window.dispatchEvent(new Event("replaceState"));
    }

    i18n.changeLanguage(selectedLanguage);
    setIsLanguageModalOpen(false);
  };

  return (
    <WouterRouter hook={useLocalizedBrowserLocation} hrefs={formatLocalizedHref}>
      <LanguagePathSync />
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <main className="flex-grow" style={{ paddingTop: 'var(--navbar-height, 56px)' }}>
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
        <LanguagePreferenceModal
          isOpen={isLanguageModalOpen}
          onSelectLanguage={handleLanguageSelection}
        />
      </TooltipProvider>
    </WouterRouter>
  );
}

export default function App() {
  return <LanguageAwareApp />;
}
