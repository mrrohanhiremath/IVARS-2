## Backend Setup Instructions

### 1. Install Server Dependencies
```powershell
cd server
npm install
```

### 2. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Click "Connect" → "Connect your application"
4. Copy your connection string
5. Create a `.env` file in the `server` folder:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/emergency-alert?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

### 3. Set Up Cloudinary (Image Storage)

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Get your credentials from Dashboard
4. Add to `.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Set Up SendGrid (Email Notifications)

1. Go to [SendGrid](https://sendgrid.com/)
2. Create a free account (100 emails/day free)
3. Create an API key
4. Add to `.env`:

```env
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Emergency Alert System
```

### 5. Set Up Google Maps API (For Nearby Resources)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
4. Create an API key
5. Add API key restrictions (optional but recommended):
   - HTTP referrers: `http://localhost:*` and your production domain
   - API restrictions: Only the APIs you enabled

**📖 Detailed Guide**: See [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) for complete instructions

### 6. Frontend Environment

Create `.env` file in the **root** folder:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Emergency Alert System
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 7. Run the Application

**Option 1: Run both together (Recommended)**
```powershell
npm install
npm run dev:full
```

**Option 2: Run separately**

Terminal 1 (Server):
```powershell
cd server
npm run dev
```

Terminal 2 (Client):
```powershell
npm run dev
```

### 8. Test the Setup

1. Server should run on: `http://localhost:5000`
2. Client should run on: `http://localhost:5173`
3. Test health endpoint: `http://localhost:5000/api/health`

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

#### Incidents
- `POST /api/incidents` - Create incident report (with file upload)
- `GET /api/incidents` - Get all incidents (Protected)
- `GET /api/incidents/:id` - Get single incident (Protected)
- `PUT /api/incidents/:id` - Update incident (Protected - Responder/Admin)
- `DELETE /api/incidents/:id` - Delete incident (Protected - Admin)
- `GET /api/incidents/stats/overview` - Get statistics (Protected)

#### Users
- `GET /api/users/responders` - Get all responders (Protected)
- `PUT /api/users/profile` - Update user profile (Protected)

### Features Implemented

✅ **Backend:**
- Express.js REST API
- MongoDB with Mongoose
- JWT Authentication
- Cloudinary Image Upload
- SendGrid Email Notifications
- Role-based Access Control (Citizen, Responder, Admin)
- File Upload with Multer
- Error Handling Middleware

✅ **Frontend:**
- Axios API Integration
- Authentication Service
- Incident Reporting Service
- Leaflet Maps (OpenStreetMap)
- GPS Location Detection
- Image Upload UI
- Protected Routes
- **Real-Time Nearby Emergency Resources** (Google Places API)
- Interactive Resource Cards with Navigation

### Next Steps

1. **Install dependencies**: Run `npm install` in both root and server folders
2. **Configure environment**: Set up all `.env` files
3. **Test backend**: Make sure MongoDB, Cloudinary, and SendGrid are working
4. **Test frontend**: Try registering, logging in, and submitting reports
5. **Deploy**: Consider deploying backend to Railway/Render and frontend to Vercel/Netlify
