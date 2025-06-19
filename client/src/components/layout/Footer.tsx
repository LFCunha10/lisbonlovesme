import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Send, Facebook, Instagram, Twitter, Mail } from "lucide-react";
import { FaInstagram, FaMailBulk, FaMailchimp, FaTiktok, FaTripadvisor, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getLocalizedText } from "@/lib/tour-utils";

export default function Footer() {
  const { data: tours, isLoading: isLoadingTours } = useQuery({
    queryKey: ['/api/tours'],
    select: (data) => data as any[],
  });

  const { t, i18n } = useTranslation();
  return (
    <footer className="bg-gray-800 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-2xl font-display font-bold mb-4 flex items-center">
              <MapPin className="mr-2" />
              <span>Lisbonlovesme</span>
            </div>
            <p className="text-white/70 mb-4">
              {t('footer.message')}
            </p>
            <div className="flex space-x-3">
              <SocialLink key="instagram" href="https://www.instagram.com/lisbonlovesme/" icon={<FaInstagram size={18} />} />
              <SocialLink key="tiktok" href="https://www.tiktok.com/@lisbonlovesme" icon={<FaTiktok size={18} />} />
              <SocialLink key="whatsapp" href="https://wa.me/+351938607585" icon={<FaWhatsapp size={18} />} />
              <SocialLink key="youtube" href="https://www.youtube.com/@Lisbonlovesme" icon={<FaYoutube size={18} />} />
              <SocialLink key="email" href="https://mailto:lisbonlovesme@gmail.com" icon={<Mail size={18} />} />
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t('common.quickLinks')}</h4>
            <ul className="space-y-2">
              <FooterLink key="home" href="/">{t('nav.home')}</FooterLink>
              <FooterLink key="tours" href="/#tours">{t('nav.tours')}</FooterLink>
              <FooterLink key="about" href="/#about">{t('nav.about')}</FooterLink>
              <FooterLink key="reviews" href="/#reviews">{t('reviews.title')}</FooterLink>
              <FooterLink key="contact" href="/#contact">{t('nav.contact')}</FooterLink>
              <FooterLink key="booking" href="/tours">{t('nav.booking')}</FooterLink>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t('common.ourTours')}</h4>
            <ul className="space-y-2">
              {tours?.map((tour: any) => (
                <FooterLink key={tour.id} href={`/tours/${tour.id}`}>{getLocalizedText(tour.name, i18n.language)}</FooterLink>
              ))} 
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t('common.newsletter')}</h4>
            <p className="text-white/70 mb-4">
              {t('common.subscribeText')}
            </p>
            <form className="flex w-full" onSubmit={(e) => e.preventDefault()}>
              <Input 
                type="email" 
                placeholder={t('common.emailPlaceholder')} 
                className="bg-white/10 text-white placeholder:text-white/50 rounded-r-none focus:ring-primary/50 border-white/10 flex-1 min-w-0"
              />
              <Button 
                type="submit" 
                variant="default" 
                className="rounded-l-none shrink-0" 
                size="icon"
              >
                <Send size={18} />
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center text-white/70 text-sm">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            &copy; {new Date().getFullYear()} Lisbonlovesme. {t('footer.rights')}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link key="terms" href="#" className="hover:text-white whitespace-nowrap">{t('footer.termsOfService')}</Link>
            <Link key="privacy" href="#" className="hover:text-white whitespace-nowrap">{t('footer.privacyPolicy')}</Link>
            <Link key="cookies" href="#" className="hover:text-white whitespace-nowrap">{t('footer.cookiePolicy')}</Link>
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
