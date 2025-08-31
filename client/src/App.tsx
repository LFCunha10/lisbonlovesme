import React, { useEffect } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import TourDetailPage from "@/pages/tours/tour-details";
import AdminPage from "@/pages/admin";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import AdminProtectedRoute from "@/components/admin/protected-route";

// Define admin routes
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/tours">
        {() => {
          const ToursPage = React.lazy(() => import("@/pages/tours"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <ToursPage />
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/gallery">
        {() => {
          const GalleryPage = React.lazy(() => import("@/pages/gallery"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <GalleryPage />
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/review/:bookingReference">
        {() => {
          const ReviewPage = React.lazy(() => import("@/pages/review"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <ReviewPage />
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/tours/:tourId" component={TourDetailPage} />
      <Route path="/tour/:id">
        {() => {
          const TourDetailsPage = React.lazy(() => import("@/pages/tours/tour-details"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <TourDetailsPage />
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/book/:id">
        {() => {
          const BookingPage = React.lazy(() => import("@/pages/tours/booking"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <BookingPage />
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin">
        {() => (
          <AdminProtectedRoute>
            <AdminPage />
          </AdminProtectedRoute>
        )}
      </Route>
      <Route path="/admin/tours/edit/:id">
        {() => {
          const EditTourPage = React.lazy(() => import("@/pages/admin/EditTour"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <EditTourPage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/tours/create">
        {() => {
          const EditTourPage = React.lazy(() => import("@/pages/admin/EditTour"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <EditTourPage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/login">
        {() => {
          // No protection for login page
          const AdminLoginPage = React.lazy(() => import("@/pages/admin/login"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminLoginPage />
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/dashboard">
        {() => {
          const AdminDashboardPage = React.lazy(() => import("@/pages/admin/index"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/requests">
        {() => {
          const BookingRequestsPage = React.lazy(() => import("@/pages/admin/BookingRequests"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <BookingRequestsPage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/tours">
        {() => {
          const AdminToursPage = React.lazy(() => import("@/pages/admin/tours"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <AdminToursPage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/tours/create">
        {() => {
          const TourEditorPage = React.lazy(() => import("@/pages/admin/tours/tour-editor"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <TourEditorPage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/tours/edit/:id">
        {() => {
          const TourEditorPage = React.lazy(() => import("@/pages/admin/tours/tour-editor"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <TourEditorPage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/bookings">
        {() => {
          const AdminBookingsPage = React.lazy(() => import("@/pages/admin/bookings"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <AdminBookingsPage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/payments">
        {() => {
          const AdminPaymentsPage = React.lazy(() => import("@/pages/admin/payments"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <AdminPaymentsPage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/gallery">
        {() => {
          const AdminGalleryPage = React.lazy(() => import("@/pages/admin/gallery"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <AdminGalleryPage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/articles">
        {() => {
          const ManageArticles = React.lazy(() => import("@/pages/admin/ManageArticles"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <ManageArticles />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/reviews">
        {() => {
          const AdminReviewsPage = React.lazy(() => import("@/pages/admin/reviews"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <AdminReviewsPage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/password">
        {() => {
          const PasswordChangePage = React.lazy(() => import("@/pages/admin/password"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <PasswordChangePage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/database-export">
        {() => {
          const DatabaseExportPage = React.lazy(() => import("@/pages/admin/database-export"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <DatabaseExportPage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/articles/:slug">
        {() => {
          const ArticlePage = React.lazy(() => import("@/pages/admin/Article"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <ArticlePage />
            </React.Suspense>
          );
        }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function LanguageAwareApp() {
  const { i18n } = useTranslation();
  
  // Update HTML lang attribute when language changes
  useEffect(() => {
    const currentLang = i18n.language?.split('-')[0] || 'en';
    document.documentElement.lang = currentLang;
  }, [i18n.language]);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-grow pt-16">
          <Router />
        </main>
        <Footer />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default function App() {
  return <LanguageAwareApp />;
}
