import { useEffect } from "react";
import HeroSection from "./HeroSection";
import FeaturedTours from "./FeaturedTours";
import AboutUs from "./AboutUs";
import WhyChooseUs from "./WhyChooseUs";
import Reviews from "./Reviews";
import PhotoGallery from "./PhotoGallery";
import CallToAction from "./CallToAction";
import ContactInformation from "./ContactInformation";
import { BookingModal } from "@/components/booking/BookingModal";

export default function HomePage() {
  // Scroll to section if URL has a hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <>
      <HeroSection />
      <FeaturedTours />
      <AboutUs />
      <WhyChooseUs />
      <Reviews />
      <PhotoGallery />
      <CallToAction />
      <ContactInformation />
      <BookingModal />
    </>
  );
}
