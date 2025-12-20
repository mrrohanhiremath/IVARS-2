# System Architecture Diagram

## IVARS - Intelligent Vehicle Accident Response System

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser<br/>React + TypeScript]
        A1[Mobile Browser<br/>Responsive UI]
    end

    subgraph "API Gateway"
        B[Express.js Server<br/>Port 5000]
    end

    subgraph "Authentication Layer"
        C[JWT Auth Middleware]
        C1[Role-Based Access Control<br/>Admin/Responder/Citizen]
    end

    subgraph "Application Layer"
        D[Auth Controller]
        E[Incident Controller]
        F[User Controller]
        G[Places Controller]
        H[Distance Controller]
    end

    subgraph "Service Layer"
        I[Email Service<br/>SendGrid]
        J[Location Service<br/>Haversine Distance]
        K[File Upload Service<br/>Cloudinary]
    end

    subgraph "Database Layer"
        L[(MongoDB Atlas<br/>Users Collection)]
        M[(MongoDB Atlas<br/>Incidents Collection)]
    end

    subgraph "External Services"
        N[Google Maps API<br/>Geocoding]
        O[SendGrid API<br/>Email Notifications]
        P[Cloudinary<br/>Image Storage]
        Q[Browser Geolocation API]
    end

    A -->|HTTPS Requests| B
    A1 -->|HTTPS Requests| B
    B --> C
    C --> D
    C --> E
    C --> F
    C --> G
    C --> H
    
    D --> L
    E --> M
    E --> J
    E --> I
    F --> L
    
    I --> O
    K --> P
    G --> N
    A --> Q
    
    style A fill:#4A90E2
    style A1 fill:#4A90E2
    style B fill:#50C878
    style C fill:#FFB347
    style L fill:#E74C3C
    style M fill:#E74C3C
    style I fill:#9B59B6
    style K fill:#9B59B6
```

## Architecture Description

### Client Layer
- **React + TypeScript Frontend**: Single Page Application with responsive design
- **Mobile Browser Support**: Fully responsive UI for mobile access
- **Real-time Updates**: Live incident tracking and status updates

### API Gateway
- **Express.js Server**: RESTful API endpoints
- **CORS Configuration**: Cross-origin resource sharing enabled
- **Compression**: Response compression for faster data transfer

### Authentication Layer
- **JWT-based Authentication**: Secure token-based auth
- **Role-Based Access Control**: 3 user roles (Citizen, Responder, Admin)
- **Protected Routes**: Middleware for route protection

### Application Layer
- **Auth Controller**: User registration, login, authentication
- **Incident Controller**: CRUD operations, nearby responder detection
- **User Controller**: Profile management, location updates
- **Places Controller**: Google Maps integration
- **Distance Controller**: Distance calculations

### Service Layer
- **Email Service**: SendGrid integration for emergency notifications
- **Location Service**: Haversine formula for distance calculations (50km radius)
- **File Upload Service**: Cloudinary integration for incident evidence

### Database Layer
- **MongoDB Atlas**: Cloud-hosted NoSQL database
- **Users Collection**: User profiles, roles, coordinates
- **Incidents Collection**: Accident reports, status tracking

### External Services
- **Google Maps API**: Geocoding and location services
- **SendGrid**: Transactional email delivery
- **Cloudinary**: CDN-based image storage
- **Geolocation API**: Browser-based GPS coordinates
