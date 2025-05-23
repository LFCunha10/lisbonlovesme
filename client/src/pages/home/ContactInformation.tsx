import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from "lucide-react";
import { FaTripadvisor } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function ContactInformation() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "General Inquiry",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setForm(prev => ({ ...prev, subject: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!form.firstName || !form.lastName || !form.email || !form.message) {
      toast({
        variant: "destructive",
        title: "Please fill in all required fields",
        description: "All fields are required to submit the form"
      });
      return;
    }
    
    // Mock form submission
    console.log("Form submitted:", form);
    
    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us. We'll get back to you soon."
    });
    
    // Reset form
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      subject: "General Inquiry",
      message: ""
    });
  };

  return (
    <section id="contact" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-display font-bold mb-4">{t('contact.title')}</h2>
            <p className="text-neutral-dark/80 mb-6">
              {t('contact.subtitle')}
            </p>
            
            <div className="mb-8">
              <ContactInfo 
                icon={<MapPin />}
                title={t('contact.address')}
                content={<span>Rua Augusta 42, 1100-053<br />Lisbon, Portugal</span>}
              />
              
              <ContactInfo 
                icon={<Phone />}
                title={t('contact.phone')}
                content={<span>+351 21 123 4567</span>}
              />
              
              <ContactInfo 
                icon={<Mail />}
                title={t('contact.email')}
                content={<span>info@lisboatours.com</span>}
              />
              
              <ContactInfo 
                icon={<Clock />}
                title={t('contact.hours')}
                content={
                  <span>
                    {t('contact.weekdays')}<br />
                    {t('contact.saturday')}<br />
                    {t('contact.sunday')}
                  </span>
                }
              />
            </div>
            
            <div className="flex space-x-4">
              <SocialButton icon={<Facebook size={18} />} />
              <SocialButton icon={<Instagram size={18} />} />
              <SocialButton icon={<Twitter size={18} />} />
              <SocialButton icon={<FaTripadvisor size={18} />} />
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-display font-bold mb-4">{t('contact.sendMessage')}</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-dark/80 mb-1">{t('contact.formName')}</label>
                  <Input 
                    type="text" 
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label className="block text-neutral-dark/80 mb-1">{t('booking.lastName')}</label>
                  <Input 
                    type="text" 
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-neutral-dark/80 mb-1">{t('contact.formEmail')}</label>
                <Input 
                  type="email" 
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-neutral-dark/80 mb-1">{t('contact.formSubject')}</label>
                <Select value={form.subject} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General Inquiry">{t('common.generalInquiry')}</SelectItem>
                    <SelectItem value="Booking Information">{t('common.bookingInfo')}</SelectItem>
                    <SelectItem value="Custom Tour Request">{t('common.customTourRequest')}</SelectItem>
                    <SelectItem value="Feedback">{t('common.feedback')}</SelectItem>
                    <SelectItem value="Other">{t('common.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-neutral-dark/80 mb-1">{t('contact.formMessage')}</label>
                <Textarea 
                  className="h-32" 
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                />
              </div>
              
              <Button type="submit" className="w-full md:w-auto">{t('contact.formSubmit')}</Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ContactInfoProps {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

function ContactInfo({ icon, title, content }: ContactInfoProps) {
  return (
    <div className="flex items-start mb-4">
      <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mr-4 mt-1">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-neutral-dark/80">{content}</p>
      </div>
    </div>
  );
}

function SocialButton({ icon }: { icon: React.ReactNode }) {
  return (
    <a 
      href="#" 
      className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all"
    >
      {icon}
    </a>
  );
}
