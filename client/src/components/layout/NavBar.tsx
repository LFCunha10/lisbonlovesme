import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { MapPin, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/language-switcher";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { t } = useTranslation();
  const navRef = useRef<HTMLElement | null>(null);
  
  // Check if we're on an admin page
  const isAdminPage = location.startsWith('/admin');

  const toggleMenu = () => setIsOpen(!isOpen);

  // Keep a CSS variable updated with current navbar height
  useEffect(() => {
    const updateOffset = () => {
      const h = navRef.current?.offsetHeight ?? 0;
      // Fallback to 56px if height cannot be measured yet
      const px = `${h || 56}px`;
      document.documentElement.style.setProperty('--navbar-height', px);
    };
    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, []);

  // Recalculate when menu states change (mobile/hover dropdown may change height)
  useEffect(() => {
    const h = navRef.current?.offsetHeight ?? 0;
    const px = `${h || 56}px`;
    document.documentElement.style.setProperty('--navbar-height', px);
  }, [isOpen]);

  return (
    <nav ref={navRef} className="bg-white shadow-md fixed w-full z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-xl sm:text-2xl font-display font-bold text-black">
              <Link href="/" className="flex items-center text-black">
                <MapPin className="mr-1 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                <span className="truncate brand-logo">Lisbonlovesme</span>
              </Link>
            </div>
          </div>

          {!isAdminPage && (
            <div className="hidden md:flex items-center space-x-6">
              <NavLink href="/tours" isActive={location === "/"}>{t('navigation.main.tours')}</NavLink>
              <NavLink href="/#reviews" isActive={location === "/"}>{t('navigation.main.reviews')}</NavLink>
              <NavLink href="/#contact" isActive={location === "/"}>{t('navigation.main.contact')}</NavLink>
              <LanguageSwitcher />
            </div>
          )}

          {!isAdminPage && (
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
          )}
        </div>

        {isOpen && !isAdminPage && (
          <div className="md:hidden mt-4 pb-4 space-y-2">
            <MobileNavLink href="/#tours" onClick={() => setIsOpen(false)}>{t('navigation.main.tours')}</MobileNavLink>
            <MobileNavLink href="/#reviews" onClick={() => setIsOpen(false)}>{t('navigation.main.reviews')}</MobileNavLink>
            <MobileNavLink href="/#contact" onClick={() => setIsOpen(false)}>{t('navigation.main.contact')}</MobileNavLink>
            <div className="pt-2 border-t border-gray-200">
              <LanguageSwitcher className="w-full" />
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
    <Link
      href={href}
      className={cn(
        "text-black hover:text-black transition-all font-medium",
        isActive && "text-black"
      )}
    >
      {children}
    </Link>
  );
}

interface MobileNavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}

function MobileNavLink({ href, children, onClick }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      className="block py-2 text-black hover:text-black"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
