# Lisbonlovesme Tour Booking Application

## Overview

Lisbonlovesme is a full-stack tour booking application for Lisbon tourism, built with modern web technologies. The application allows users to browse available tours, make bookings, process payments, and leave reviews. It includes an admin panel for managing tours, bookings, and content.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Shadcn/UI component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Internationalization**: React-i18next for multi-language support
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and express-session
- **File Uploads**: Multer for image handling
- **Email**: Nodemailer for transactional emails (confirmation, reviews)
- **Calendar Integration**: ICS file generation for booking confirmations

### Database Architecture
- **Database**: PostgreSQL hosted on Neon
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Comprehensive schema with tours, bookings, users, availabilities, testimonials, and admin settings
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Tour Management System
- **Tours**: Complete tour information with descriptions, flexible pricing (per person/per group), and media
- **Availabilities**: Time slots and capacity management
- **Booking Flow**: Multi-step booking process with validation and dynamic pricing calculation
- **Gallery**: Image management for tours and general gallery

### Payment Processing
- **Payment Gateway**: Stripe integration for secure payments
- **Payment Modes**: Test and production mode support
- **Refund Management**: Admin tools for processing refunds

### User Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Progressive Loading**: Lazy loading for optimal performance
- **SEO Optimization**: Meta tags and structured data

### Admin Panel
- **Tour Management**: CRUD operations for tours and availabilities
- **Booking Management**: View and manage all bookings
- **Content Management**: Gallery and testimonial management
- **Payment Dashboard**: Payment tracking and refund processing

## Data Flow

1. **User Journey**: Browse tours → Select date/time → Fill details → Review booking → Receive confirmation
2. **Admin Workflow**: Manage tours → Monitor bookings → Process payments → Handle customer service
3. **Email Automation**: Booking confirmations → Review requests → Admin notifications
4. **Data Persistence**: All operations use Drizzle ORM with PostgreSQL for reliable data storage

## External Dependencies

### Payment Processing
- **Stripe**: Credit card processing and secure payment handling
- **Webhook Support**: Real-time payment status updates

### Email Services
- **SMTP Provider**: Gmail SMTP for transactional emails
- **Email Templates**: HTML email templates for confirmations and reviews

### Database Hosting
- **Neon**: Serverless PostgreSQL with connection pooling
- **Environment**: Separate test and production databases

### Media Storage
- **Local Storage**: File uploads stored in `/public/uploads`
- **Image Processing**: Automatic file naming and validation

## Deployment Strategy

### Development Environment
- **Replit**: Configured for development with hot reloading
- **Local Development**: Vite dev server with Express backend
- **Environment Variables**: Comprehensive env configuration

### Production Deployment
- **Build Process**: Vite production build + ESBuild for server
- **Static Assets**: Served via Express static middleware
- **Port Configuration**: Configured for port 80 (external) and 5001 (internal)

### Database Management
- **Connection Pooling**: Neon serverless with automatic scaling
- **Backup Strategy**: SQL export functionality for data backup
- **Migration System**: Drizzle migrations for schema updates

## Changelog

```
Changelog:
- June 19, 2025. Initial setup
- June 19, 2025. Added pricing type feature: tours can now be priced "per person" or "per group"
- June 19, 2025. Implemented Google Fonts (Fraunces 120 Light, Montserrat) with language-aware typography system
- June 19, 2025. Fixed navbar overlap issue on tour detail pages by adjusting top padding
- June 19, 2025. Implemented comprehensive email translation system for English, Portuguese, and Russian with automatic language detection
- June 19, 2025. Migrated email translations from server/emailService.ts to client/src/i18n/locales for centralized translation management
- June 19, 2025. Completed email translation system - all hardcoded English text in sendBookingRequestNotification and sendRequestConfirmationEmail functions now uses i18n translations
- June 19, 2025. Added direct review button to admin notification emails that links to /admin/requests page for quick access
- June 19, 2025. Added WhatsApp and email contact buttons to admin notification emails for direct customer communication
- June 19, 2025. Integrated contact form on main page with email service - admin receives notifications for all form submissions
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```