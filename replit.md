# MediCore EMR - Electronic Medical Records System

## Overview

MediCore EMR is a comprehensive healthcare management system built for medical providers to manage patient care efficiently. The application features a full-stack architecture with React frontend and Express backend, providing integrated patient management, appointment scheduling, medical records, lab results tracking, radiology management, medication tracking, preventive care monitoring, and collaborative diet planning capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client uses React with TypeScript and implements a component-based architecture using shadcn/ui components. The frontend leverages:
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Framework**: Radix UI primitives with Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
The server implements a RESTful API using Express.js with:
- **Database Layer**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit's OpenID Connect integration with session-based auth
- **API Structure**: Route-based organization with comprehensive CRUD operations for all medical entities
- **Middleware**: Express middleware for logging, error handling, and authentication

### Database Design
Uses PostgreSQL with a comprehensive schema covering:
- **Core Entities**: Users, Patients, Appointments, Medical Records
- **Clinical Data**: Lab Results, Radiology Results, Medications, Allergies
- **Care Management**: Preventive Care tracking, Diet Plans, Meal Entries
- **Session Management**: Postgres-backed session storage for authentication

### Authentication & Authorization
- **Provider**: Replit OpenID Connect for secure authentication
- **Session Management**: PostgreSQL-backed sessions with configurable TTL
- **Security**: HTTP-only cookies, CSRF protection, and secure session handling
- **Role-based Access**: Provider-centric design with user role management

### Data Management Strategy
- **ORM**: Drizzle with schema validation using Zod
- **Migrations**: Database schema management through drizzle-kit
- **Type Safety**: Full TypeScript integration from database to frontend
- **Caching**: React Query handles client-side caching and synchronization

### Development Architecture
- **Monorepo Structure**: Shared types and schemas between client and server
- **Development Tools**: TSX for TypeScript execution, ESBuild for production builds
- **Code Organization**: Feature-based organization with shared utilities and components
- **Build Process**: Separate client and server builds with optimized production deployment

## External Dependencies

### Database & ORM
- **PostgreSQL**: Primary database with Neon serverless hosting
- **Drizzle ORM**: Type-safe database operations and migrations
- **connect-pg-simple**: PostgreSQL session store integration

### Authentication Services
- **Replit Auth**: OpenID Connect provider for secure authentication
- **Passport.js**: Authentication middleware with OpenID strategy

### Frontend Libraries
- **React Ecosystem**: React 18 with TypeScript support
- **UI Components**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with custom design system
- **Charts**: Recharts for medical data visualization
- **Forms**: React Hook Form with Hookform Resolvers for validation

### Development Tools
- **Vite**: Frontend build tool with HMR and optimization
- **TypeScript**: Full type safety across the entire stack
- **Zod**: Runtime type validation and schema definition
- **ESBuild**: Fast JavaScript bundling for production builds

### Utilities & Libraries
- **Date Handling**: date-fns for consistent date operations
- **Styling Utilities**: clsx and tailwind-merge for conditional styling
- **HTTP Client**: Native fetch with React Query integration
- **WebSocket**: Native WebSocket support for real-time features (Neon configuration)