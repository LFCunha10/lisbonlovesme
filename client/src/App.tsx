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

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/tours" component={ToursPage} />
      <Route path="/tours/:tourId" component={TourDetailPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/login" component={() => import("@/pages/admin/login").then(mod => <mod.default />)} />
      <Route path="/admin/dashboard" component={() => import("@/pages/admin/dashboard").then(mod => <mod.default />)} />
      <Route path="/admin/tours" component={() => import("@/pages/admin/tours").then(mod => <mod.default />)} />
      <Route path="/admin/bookings" component={() => import("@/pages/admin/bookings").then(mod => <mod.default />)} />
      <Route path="/admin/testimonials" component={() => import("@/pages/admin/testimonials").then(mod => <mod.default />)} />
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
