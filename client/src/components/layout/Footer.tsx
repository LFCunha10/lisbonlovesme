import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Send, Facebook, Instagram, Twitter } from "lucide-react";
import { FaTripadvisor } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-neutral-dark text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-2xl font-display font-bold mb-4 flex items-center">
              <MapPin className="mr-2" />
              <span>Lisboa Tours</span>
            </div>
            <p className="text-white/70 mb-4">
              Authentic guided tours through the heart of Lisbon, showcasing the city's rich history, 
              vibrant culture, and hidden gems.
            </p>
            <div className="flex space-x-3">
              <SocialLink href="https://facebook.com" icon={<Facebook size={18} />} />
              <SocialLink href="https://instagram.com" icon={<Instagram size={18} />} />
              <SocialLink href="https://twitter.com" icon={<Twitter size={18} />} />
              <SocialLink href="https://tripadvisor.com" icon={<FaTripadvisor size={18} />} />
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/#tours">Tours</FooterLink>
              <FooterLink href="/#about">About Us</FooterLink>
              <FooterLink href="/#testimonials">Testimonials</FooterLink>
              <FooterLink href="/#contact">Contact</FooterLink>
              <FooterLink href="/#book-now">Book Now</FooterLink>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Our Tours</h4>
            <ul className="space-y-2">
              <FooterLink href="/tours/1">Historic Belém Tour</FooterLink>
              <FooterLink href="/tours/2">Alfama & Fado Experience</FooterLink>
              <FooterLink href="/tours/3">Panoramic Lisbon Tour</FooterLink>
              <FooterLink href="/tours">Food & Wine Tasting</FooterLink>
              <FooterLink href="/tours">Sintra Day Trip</FooterLink>
              <FooterLink href="/tours">Custom Private Tours</FooterLink>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Newsletter</h4>
            <p className="text-white/70 mb-4">
              Subscribe to our newsletter for the latest tour updates and exclusive offers.
            </p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <Input 
                type="email" 
                placeholder="Your email address" 
                className="bg-white/10 text-white placeholder:text-white/50 rounded-r-none focus:ring-primary/50 border-white/10"
              />
              <Button 
                type="submit" 
                variant="default" 
                className="rounded-l-none" 
                size="icon"
              >
                <Send size={18} />
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center text-white/70 text-sm">
          <div className="mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Lisboa Tours. All rights reserved.
          </div>
          <div className="flex space-x-4">
            <Link href="#" className="hover:text-white">Terms of Service</Link>
            <Link href="#" className="hover:text-white">Privacy Policy</Link>
            <Link href="#" className="hover:text-white">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

function FooterLink({ href, children }: FooterLinkProps) {
  return (
    <li>
      <Link href={href} className="text-white/70 hover:text-white">
        {children}
      </Link>
    </li>
  );
}

interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
}

function SocialLink({ href, icon }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-white/70 hover:text-white"
    >
      {icon}
    </a>
  );
}
