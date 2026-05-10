import { useEffect } from "react";
import HeroSection from "@/pages/home/HeroSection";
import FeaturedTours from "@/pages/home/FeaturedTours";
import AboutUs from "@/pages/home/AboutUs";
import WhyChooseUs from "@/pages/home/WhyChooseUs";
import Reviews from "@/pages/home/Reviews";
import PhotoGallery from "@/pages/home/PhotoGallery";
import CallToAction from "@/pages/home/CallToAction";
import ContactInformation from "@/pages/home/ContactInformation";
import Marquee from "./Marquee";
import "./theme.css";

/**
 * "What's Next" — staging area for the site.
 * New features and visual changes land here first, then graduate to production.
 */
export default function WhatsNextPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="wn-theme">
      <div className="wn-staging-banner">
        What&apos;s Next · Staging Preview
      </div>
      <Marquee />
      <HeroSection />
      <FeaturedTours />
      <AboutUs />
      <WhyChooseUs />
      <Reviews />
      <PhotoGallery />
      <CallToAction />
      <ContactInformation />
    </div>
  );
}
