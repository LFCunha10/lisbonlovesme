import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Send, Facebook, Instagram, Twitter } from "lucide-react";
import { FaTripadvisor } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-neutral-dark text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-2xl font-display font-bold mb-4 flex items-center">
              <MapPin className="mr-2" />
              <span>Lisbonlovesme</span>
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
            <h4 className="text-lg font-semibold mb-4">{t('common.quickLinks')}</h4>
            <ul className="space-y-2">
              <FooterLink href="/">{t('nav.home')}</FooterLink>
              <FooterLink href="/#tours">{t('nav.tours')}</FooterLink>
              <FooterLink href="/#about">{t('nav.about')}</FooterLink>
              <FooterLink href="/#testimonials">{t('testimonials.title')}</FooterLink>
              <FooterLink href="/#contact">{t('nav.contact')}</FooterLink>
              <FooterLink href="/#book-now">{t('nav.booking')}</FooterLink>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t('common.ourTours')}</h4>
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
            <h4 className="text-lg font-semibold mb-4">{t('common.newsletter')}</h4>
            <p className="text-white/70 mb-4">
              {t('common.subscribeText')}
            </p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <Input 
                type="email" 
                placeholder={t('common.emailPlaceholder')} 
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
            &copy; {new Date().getFullYear()} Lisbonlovesme. {t('footer.rights')}
          </div>
          <div className="flex space-x-4">
            <Link href="#" className="hover:text-white">{t('footer.termsOfService')}</Link>
            <Link href="#" className="hover:text-white">{t('footer.privacyPolicy')}</Link>
            <Link href="#" className="hover:text-white">{t('footer.cookiePolicy')}</Link>
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
