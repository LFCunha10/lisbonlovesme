import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getLocalizedText } from "@/lib/tour-utils";
import LanguageSwitcher from "@/components/language-switcher";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [articlesOpen, setArticlesOpen] = useState(false);
  const [location] = useLocation();
  const { t, i18n } = useTranslation();
  
  // Check if we're on an admin page
  const isAdminPage = location.startsWith('/admin');

  const toggleMenu = () => setIsOpen(!isOpen);

  // Fetch published articles for navigation
  const { data: articles } = useQuery({
    queryKey: ['/api/articles'],
    queryFn: () => fetch('/api/articles?published=true').then(res => res.json()),
    enabled: !isAdminPage,
  });

  const publishedArticles = Array.isArray(articles) ? articles.filter(a => a.isPublished) : [];

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-xl sm:text-2xl font-display font-bold text-primary">
              <Link href="/" className="flex items-center">
                <MapPin className="mr-1 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                <span className="truncate brand-logo">Lisbonlovesme</span>
              </Link>
            </div>
          </div>

          {!isAdminPage && (
            <div className="hidden md:flex items-center space-x-6">
              <NavLink href="/tours" isActive={location === "/"}>{t('nav.tours')}</NavLink>
              {publishedArticles.length > 0 && (
                <div className="relative">
                  <button
                    className="flex items-center text-neutral-dark hover:text-primary transition-all font-medium"
                    onMouseEnter={() => setArticlesOpen(true)}
                    onMouseLeave={() => setArticlesOpen(false)}
                  >
                    {"Articles"}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  {articlesOpen && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50"
                      onMouseEnter={() => setArticlesOpen(true)}
                      onMouseLeave={() => setArticlesOpen(false)}
                    >
                      {publishedArticles.slice(0, 8).map((article) => (
                        <Link
                          key={article.id}
                          href={`/articles/${article.slug}`}
                          className="block px-4 py-2 text-sm text-neutral-dark hover:bg-gray-50 hover:text-primary"
                        >
                          {getLocalizedText(article.title, i18n.language)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <NavLink href="/#about" isActive={location === "/"}>{t('nav.about')}</NavLink>
              <NavLink href="/#reviews" isActive={location === "/"}>{t('reviews.title')}</NavLink>
              <NavLink href="/#contact" isActive={location === "/"}>{t('nav.contact')}</NavLink>
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
            <MobileNavLink href="/#tours" onClick={() => setIsOpen(false)}>{t('nav.tours')}</MobileNavLink>
            {publishedArticles.length > 0 && (
              <div className="border-l-2 border-gray-200 pl-4 ml-2">
                <div className="text-sm font-medium text-gray-500 mb-2">Articles</div>
                {publishedArticles.slice(0, 5).map((article) => (
                  <MobileNavLink 
                    key={article.id}
                    href={`/articles/${article.slug}`} 
                    onClick={() => setIsOpen(false)}
                  >
                    {getLocalizedText(article.title, i18n.language)}
                  </MobileNavLink>
                ))}
              </div>
            )}
            <MobileNavLink href="/#about" onClick={() => setIsOpen(false)}>{t('nav.about')}</MobileNavLink>
            <MobileNavLink href="/#reviews" onClick={() => setIsOpen(false)}>{t('reviews.title')}</MobileNavLink>
            <MobileNavLink href="/#contact" onClick={() => setIsOpen(false)}>{t('nav.contact')}</MobileNavLink>
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
