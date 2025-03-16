# Hoskins Theatre Inventory Management System

A comprehensive inventory management system for The Armidale School's Hoskins Theatre, built with React, Supabase, and Tailwind CSS. - Hamish Leahy

![TAS Logo](https://as.edu.au/wp-content/webp-express/webp-images/uploads/2025/01/TAS_Logo_Horiz_Straw_PMS-713x375.png.webp)

## Features

- **User Authentication**
  - Secure email/password authentication
  - Role-based access control (Admin/User)
  - Protected routes and authorized actions

- **Inventory Management**
  - Add, edit, and delete inventory items
  - Categorize items with hierarchical categories
  - Track item details (location, condition, purchase info)
  - QR code generation and scanning
  - Check-in/check-out system

- **Show Archive**
  - Create and manage theatre shows
  - Assign equipment to shows
  - Upload and manage show-related files
  - Track show dates and status

- **Maintenance Tracking**
  - Schedule and track equipment maintenance
  - Maintenance history and upcoming tasks
  - Equipment condition monitoring

- **Reports & Analytics**
  - Equipment usage statistics
  - Maintenance reports
  - Financial summaries
  - Check-out logs

## Tech Stack

- **Frontend**
  - React 18
  - TypeScript
  - Tailwind CSS
  - Lucide React Icons
  - React Router DOM
  - React Hook Form

- **Backend**
  - Supabase (PostgreSQL)
  - Row Level Security
  - Real-time subscriptions
  - Storage for files

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd hoskins-theatre-inventory
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts (auth, etc.)
├── lib/           # Utilities and configurations
├── pages/         # Page components
└── types/         # TypeScript type definitions
```

## Security Features

- Row Level Security (RLS) policies
- Role-based access control
- Secure file uploads
- Protected API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
6. I will review your pull request as soon as possible and let you know the deicision i have made

## License

This project is proprietary and confidential. All rights reserved.

## Acknowledgments

- The Armidale School
- Hoskins Theatre Staff
- All contributors and maintainers
