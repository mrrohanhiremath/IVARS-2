# IVARS-2: Emergency Alert System 🚨

A comprehensive web-based emergency alert and incident reporting system that enables citizens to report emergencies, responders to manage incidents, and administrators to oversee operations. The system features real-time mapping, nearby resource discovery, and automated notifications.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Functionality
- **Incident Reporting**: Citizens can report emergencies with location, images, and descriptions
- **Real-Time Mapping**: Interactive maps showing incident locations using Leaflet and Google Maps
- **Role-Based Access Control**: Three user roles (Citizen, Responder, Admin) with appropriate permissions
- **Nearby Resources**: Discover nearby hospitals, fire stations, and police stations using Google Places API
- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- **Image Upload**: Cloudinary integration for incident image storage
- **Email Notifications**: SendGrid integration for automated email alerts
- **Analytics Dashboard**: Statistics and incident overview for administrators
- **Multi-Language Support**: i18next internationalization (i18n)
- **Mobile Responsive**: Fully responsive design for all device sizes
- **Performance Optimized**: Image lazy loading, API rate limiting, and server warmup

### User Roles
- **👤 Citizen**: Report incidents, view incident status, manage personal reports
- **👨‍🚒 Responder**: View all incidents, update incident status, access responder tools
- **👨‍💼 Admin**: Full system access, user management, analytics, incident oversight

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS
- **Maps**: Leaflet, React-Leaflet, Google Maps API
- **Internationalization**: i18next, react-i18next
- **HTTP Client**: Axios
- **PDF Generation**: jsPDF, jsPDF-AutoTable
- **Excel Export**: XLSX

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **File Upload**: Multer
- **Cloud Storage**: Cloudinary
- **Email Service**: SendGrid
- **Validation**: Express Validator
- **Security**: CORS, Compression

## 📦 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB Atlas** account (free tier available)
- **Cloudinary** account (free tier available)
- **SendGrid** account (free tier: 100 emails/day)
- **Google Cloud Platform** account with Maps JavaScript API & Places API enabled

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd IVARS-2
```

### 2. Install Dependencies

**Install root dependencies:**
```bash
npm install
```

**Install server dependencies:**
```bash
cd server
npm install
cd ..
```

## ⚙️ Environment Configuration

### Frontend Environment Variables

Create a `.env` file in the **root directory**:

```env
# Copy from .env.example and fill in your values
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Emergency Alert System
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

See [.env.example](.env.example) for the complete template.

### Backend Environment Variables

Create a `.env` file in the **server directory**:

```env
# Copy from server/.env.example and fill in your values
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/emergency-alert?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SendGrid (Email Service)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Emergency Alert System
```

See [server/.env.example](server/.env.example) for the complete template.

### 📖 Detailed Setup Guides

For step-by-step instructions on setting up third-party services:
- **Complete Setup**: [SETUP.md](SETUP.md)
- **Google Maps Configuration**: [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md)
- **Performance Optimization**: [PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md)

## 🏃 Running the Application

### Option 1: Run Both Frontend and Backend Together (Recommended)

```bash
npm run dev:full
```

This will start:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

### Option 2: Run Separately

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

### Testing the Setup

1. **Health Check**: Visit http://localhost:5000/api/health
2. **Frontend**: Visit http://localhost:5173
3. **Register**: Create a new account
4. **Login**: Sign in with your credentials
5. **Report Incident**: Test the incident reporting feature

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

### Incident Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/incidents` | Create incident report | ✅ |
| GET | `/api/incidents` | Get all incidents | ✅ |
| GET | `/api/incidents/:id` | Get single incident | ✅ |
| PUT | `/api/incidents/:id` | Update incident status | ✅ (Responder/Admin) |
| DELETE | `/api/incidents/:id` | Delete incident | ✅ (Admin only) |
| GET | `/api/incidents/stats/overview` | Get statistics | ✅ |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/responders` | Get all responders | ✅ |
| PUT | `/api/users/profile` | Update user profile | ✅ |

### Distance & Places Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/distance/nearby` | Get nearby resources | ✅ |
| GET | `/api/places/nearby` | Google Places search | ✅ |

## 📁 Project Structure

```
IVARS-2/
├── src/                      # Frontend source code
│   ├── components/           # React components
│   │   ├── base/            # Base/reusable components
│   │   └── feature/         # Feature-specific components
│   ├── pages/               # Page components
│   ├── router/              # Routing configuration
│   ├── services/            # API service layers
│   ├── utils/               # Utility functions
│   └── i18n/                # Internationalization
├── server/                   # Backend source code
│   ├── config/              # Configuration files
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Express middleware
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   ├── services/            # Business logic services
│   └── utils/               # Utility functions
├── diagrams/                 # System architecture diagrams
├── .env.example             # Frontend environment template
├── server/.env.example      # Backend environment template
├── package.json             # Frontend dependencies
├── server/package.json      # Backend dependencies
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## 🌐 Deployment

### Backend Deployment (Render/Railway)

1. Create a new web service
2. Connect your GitHub repository
3. Set build command: `cd server && npm install`
4. Set start command: `cd server && npm start`
5. Add all environment variables from `server/.env.example`
6. Deploy

**Deployment Guides:**
- [Render Configuration](server/render.yaml)

### Frontend Deployment (Vercel/Netlify)

1. Create a new site
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables from `.env.example`
6. Deploy

**Deployment Configurations:**
- [Vercel Configuration](vercel.json)
- [Netlify Configuration](netlify.toml)

### Important Deployment Notes

- Update `VITE_API_URL` to your production backend URL
- Enable CORS for your frontend domain in backend
- Set `NODE_ENV=production` in backend
- Use production MongoDB cluster
- Configure proper API key restrictions for Google Maps

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For issues, questions, or contributions, please create an issue in the GitHub repository.

---

**Built with ❤️ for safer communities**
