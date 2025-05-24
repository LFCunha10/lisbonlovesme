import React from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import ToursPage from "@/pages/tours";
import TourDetailPage from "@/pages/tours/[tourId]";
import AdminPage from "@/pages/admin";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import AdminProtectedRoute from "@/components/admin/protected-route";

// Define admin routes
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/tours" component={ToursPage} />
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
          const AdminDashboardPage = React.lazy(() => import("@/pages/admin/dashboard"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <AdminDashboardPage />
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
          const CreateTourPage = React.lazy(() => import("@/pages/admin/tours/create"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <CreateTourPage />
              </AdminProtectedRoute>
            </React.Suspense>
          );
        }}
      </Route>
      <Route path="/admin/bookings">
        {() => {
          const AdminBookingsPage = React.lazy(() => import("@/pages/admin/bookings-new"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminProtectedRoute>
                <AdminBookingsPage />
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
      <Route path="/dev/layout-tester">
        {() => {
          const LayoutTesterPage = React.lazy(() => import("@/pages/dev/layout-tester"));
          return (
            <React.Suspense fallback={<div>Loading...</div>}>
              <LayoutTesterPage />
            </React.Suspense>
          );
        }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-grow">
          <Router />
        </main>
        <Footer />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
