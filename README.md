# Property Management System

A comprehensive property management application built with React, Node.js, and Material-UI. This system allows real estate professionals to manage properties, clients, tasks, and communications efficiently.

## 🚀 Features

### Property Management
- Add, edit, and view property listings
- Upload and manage property photos/videos with Google Drive integration
- Property categorization by type, zoning, and status
- Pricing calculations and area management
- Detailed property information tracking

### Client Management
- Manage client information and contact details
- Track client interactions and communications
- Client reference system

### Task Management
- Create and assign tasks
- Track task status and progress
- Task categorization and prioritization

### Communication System
- Built-in chat functionality
- Thread-based messaging system
- File sharing capabilities

### File Management
- Google Drive integration for file storage
- Image compression and optimization
- Secure file upload and sharing

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Material-UI (MUI)** - Component library for beautiful UI
- **React Router** - Client-side routing
- **Vite** - Fast build tool and development server

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Sequelize** - ORM for database management
- **SQLite/PostgreSQL** - Database

### External Services
- **Google Drive API** - File storage and management
- **Google OAuth** - Authentication

## 📁 Project Structure

```
Personal Projects/
├── backend/                 # Backend server
│   ├── config/             # Database and app configuration
│   ├── models/             # Sequelize models
│   ├── migrations/         # Database migrations
│   ├── routes/             # API routes
│   ├── seeders/            # Database seeders
│   └── server.js           # Main server file
├── web/                    # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API and external services
│   │   ├── utils/          # Utility functions
│   │   └── routes/         # Routing configuration
│   └── public/             # Static assets
└── docs/                   # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Cloud Platform account (for Google Drive API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/themidnightcodeguild/property-management-system.git
   cd property-management-system
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../web
   npm install
   ```

4. **Set up environment variables**
   
   Create `.env` files in both `backend/` and `web/` directories:
   
   **Backend (.env)**
   ```env
   PORT=5000
   DATABASE_URL=sqlite:./database.sqlite
   JWT_SECRET=your_jwt_secret_here
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
   ```
   
   **Frontend (.env)**
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

5. **Set up Google Drive API**
   
   Follow the instructions in `GOOGLE_OAUTH_SETUP.md` to configure Google OAuth and Drive API access.

6. **Run database migrations**
   ```bash
   cd backend
   npx sequelize-cli db:migrate
   ```

7. **Start the development servers**

   **Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Frontend:**
   ```bash
   cd web
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📖 Usage

### Property Management
1. Navigate to "Properties" in the sidebar
2. Click "Add Property" to create a new listing
3. Fill in property details including photos
4. Save and manage your property listings

### Client Management
1. Go to "Clients" section
2. Add new clients or view existing ones
3. Manage client information and communications

### Task Management
1. Access "Tasks" from the sidebar
2. Create new tasks and assign them
3. Track progress and update status

## 🔧 Configuration

### Google Drive Setup
1. Create a Google Cloud Project
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Configure redirect URIs
5. Add credentials to environment variables

### Database Configuration
The application supports both SQLite (development) and PostgreSQL (production). Update the `DATABASE_URL` in your environment variables accordingly.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

## 🔮 Roadmap

- [ ] Mobile app development
- [ ] Advanced reporting and analytics
- [ ] Integration with real estate platforms
- [ ] Automated email notifications
- [ ] Advanced search and filtering
- [ ] Multi-language support

---

**Built with ❤️ by The Midnight Code Guild** 