import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBookingModal } from "@/hooks/use-bookings";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { openBookingModal } = useBookingModal();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-2xl font-display font-bold text-primary">
              <Link href="/" className="flex items-center">
                <MapPin className="mr-2" />
                <span>Lisboa Tours</span>
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="/#tours" isActive={location === "/"}>Tours</NavLink>
            <NavLink href="/#about" isActive={location === "/"}>About Us</NavLink>
            <NavLink href="/#testimonials" isActive={location === "/"}>Testimonials</NavLink>
            <NavLink href="/#contact" isActive={location === "/"}>Contact</NavLink>
            <Button onClick={() => openBookingModal()}>Book Now</Button>
          </div>

          <div className="md:hidden">
            <button 
              onClick={toggleMenu} 
              className="text-neutral-dark"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden mt-4 pb-4">
            <MobileNavLink href="/#tours" onClick={() => setIsOpen(false)}>Tours</MobileNavLink>
            <MobileNavLink href="/#about" onClick={() => setIsOpen(false)}>About Us</MobileNavLink>
            <MobileNavLink href="/#testimonials" onClick={() => setIsOpen(false)}>Testimonials</MobileNavLink>
            <MobileNavLink href="/#contact" onClick={() => setIsOpen(false)}>Contact</MobileNavLink>
            <div className="mt-2">
              <Button 
                className="w-full" 
                onClick={() => {
                  openBookingModal();
                  setIsOpen(false);
                }}
              >
                Book Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
}

function NavLink({ href, children, isActive }: NavLinkProps) {
  return (
    <a 
      href={href} 
      className={cn(
        "text-neutral-dark hover:text-primary transition-all font-medium",
        isActive && "text-primary"
      )}
    >
      {children}
    </a>
  );
}

interface MobileNavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}

function MobileNavLink({ href, children, onClick }: MobileNavLinkProps) {
  return (
    <a 
      href={href} 
      className="block py-2 text-neutral-dark hover:text-primary"
      onClick={onClick}
    >
      {children}
    </a>
  );
}
