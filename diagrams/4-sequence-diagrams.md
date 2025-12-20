# Sequence Diagrams

## 1. Incident Reporting Flow

```mermaid
sequenceDiagram
    participant C as Citizen
    participant UI as React Frontend
    participant API as Express Server
    participant DB as MongoDB
    participant Cloud as Cloudinary
    participant Email as SendGrid
    participant R as Responders

    C->>UI: Navigate to Report Page
    UI->>C: Request GPS Permission
    C->>UI: Grant Permission
    UI->>UI: Get GPS Coordinates
    
    C->>UI: Fill Accident Details
    C->>UI: Upload Evidence Photos
    UI->>Cloud: Upload Images
    Cloud-->>UI: Return Image URLs
    
    C->>UI: Submit Report
    UI->>API: POST /api/incidents
    API->>API: Validate Data
    
    API->>DB: Save Incident
    DB-->>API: Incident Saved (ID)
    
    API->>DB: Query Nearby Responders<br/>(50km radius)
    DB-->>API: Return Available Responders
    
    API->>API: Calculate Distances<br/>(Haversine Formula)
    API->>API: Sort by Proximity
    
    loop For Each Nearby Responder
        API->>Email: Send Alert Email
        Email->>R: Email Notification
    end
    
    API-->>UI: Success Response
    UI-->>C: Show Success + Report ID
    
    Note over C,R: Responders receive email alerts<br/>with incident details and location
```

## 2. Responder Activation Flow

```mermaid
sequenceDiagram
    participant R as Responder
    participant UI as React Dashboard
    participant Auth as JWT Middleware
    participant API as Incident Controller
    participant DB as MongoDB
    participant Email as SendGrid
    participant C as Citizen

    R->>UI: Login to Dashboard
    UI->>Auth: Verify JWT Token
    Auth-->>UI: Token Valid
    
    UI->>API: GET /api/incidents
    API->>DB: Fetch Pending Incidents
    DB-->>API: Return Incidents
    API-->>UI: Incident List
    UI-->>R: Display Incidents
    
    R->>UI: Click "Activate" Button
    UI->>API: PATCH /api/incidents/:id<br/>{status: 'active', assignedTo: responderId}
    
    API->>Auth: Verify User Role
    Auth-->>API: Role: Responder
    
    API->>DB: Check Incident Status
    DB-->>API: Status: Pending
    
    API->>DB: Update Incident<br/>(assignedTo, status)
    DB-->>API: Update Success
    
    API->>Email: Send Activation Email<br/>to Reporter
    Email->>C: "Responder Assigned" Email
    
    API-->>UI: Success Response
    UI-->>R: Show "Activated" Status
    
    Note over R,C: Incident now locked to<br/>assigned responder only
```

## 3. Resolution Flow with Access Control

```mermaid
sequenceDiagram
    participant R1 as Assigned Responder
    participant R2 as Other Responder
    participant UI as React Dashboard
    participant API as Express Server
    participant DB as MongoDB
    participant Email as SendGrid
    participant C as Citizen

    R1->>UI: View Active Incident
    UI-->>R1: Show "Resolve" Button (Unlocked)
    
    R2->>UI: View Same Incident
    UI-->>R2: Show "Resolve" Button (Locked 🔒)
    
    Note over R2: Access denied - not assigned
    
    R1->>UI: Click "Resolve"
    UI->>API: PATCH /api/incidents/:id<br/>{status: 'resolved'}
    
    API->>API: Verify JWT Token
    API->>DB: Get Incident Details
    DB-->>API: Return Incident
    
    API->>API: Check Access Control<br/>assignedTo === currentUser?
    
    alt Access Granted
        API->>DB: Update Status to Resolved
        DB-->>API: Update Success
        
        API->>Email: Send Resolution Email
        Email->>C: "Incident Resolved" Email
        
        API-->>UI: Success Response
        UI-->>R1: Show "Resolved" Status
    else Access Denied
        API-->>UI: 403 Forbidden Error
        UI-->>R2: "Not authorized" Message
    end
```

## 4. User Registration & Location Setup

```mermaid
sequenceDiagram
    participant U as User
    participant UI as LoginModal
    participant API as Auth Controller
    participant DB as MongoDB
    participant Geo as Geolocation API
    participant UserAPI as User Service

    U->>UI: Fill Registration Form
    U->>UI: Select Role (Responder)
    U->>UI: Select Responder Type
    U->>UI: Submit Form
    
    UI->>UI: Validate Password<br/>(8+ chars, A-z, 0-9, special)
    
    alt Password Invalid
        UI-->>U: Show Error Message
    else Password Valid
        UI->>API: POST /api/auth/register
        
        API->>API: Validate Email Format
        API->>DB: Check Email Exists
        DB-->>API: Email Unique
        
        API->>API: Hash Password (bcrypt)
        API->>DB: Create User Document
        DB-->>API: User Created
        
        API->>API: Generate JWT Token
        API-->>UI: Success + Token
        
        UI->>UI: Store Token + User Data
        
        alt Role is Responder
            UI->>U: Request Location Permission
            U->>UI: Grant Permission
            UI->>Geo: Get Current Position
            Geo-->>UI: Return Coordinates
            
            UI->>UserAPI: PATCH /api/users/location
            UserAPI->>DB: Update coordinates {lat, lng}
            DB-->>UserAPI: Location Updated
            UserAPI-->>UI: Success
        end
        
        UI-->>U: Registration Complete
        UI->>UI: Reload Page
    end
```

## 5. Nearby Responder Detection Algorithm

```mermaid
sequenceDiagram
    participant API as Incident Controller
    participant DB as MongoDB
    participant Calc as Distance Calculator

    API->>API: Extract GPS from Incident<br/>(lat, lng)
    
    API->>DB: Query Users Collection<br/>role: 'responder'<br/>responderStatus: 'available'
    DB-->>API: Return All Responders
    
    API->>API: Filter responders<br/>with valid coordinates
    
    loop For Each Responder
        API->>Calc: Calculate Distance<br/>(Haversine Formula)
        Calc->>Calc: Convert to radians
        Calc->>Calc: Apply formula<br/>a = sin²(Δlat/2) + cos(lat1)×cos(lat2)×sin²(Δlng/2)
        Calc->>Calc: c = 2×atan2(√a, √(1−a))
        Calc->>Calc: d = R × c (R = 6371 km)
        Calc-->>API: Return Distance (km)
        
        alt Distance <= 50 km
            API->>API: Add to nearby list<br/>with distance
        else Distance > 50 km
            API->>API: Skip responder
        end
    end
    
    API->>API: Sort by Distance (ASC)
    API->>API: Log responder details
    
    Note over API: Console: "Found 2 responders"<br/>"- ban: 0.00 km"<br/>"- dgfhg: 0.04 km"
    
    API-->>API: Return Nearby Responders
```

## Flow Descriptions

### Key Sequences:

1. **Incident Reporting**: GPS capture → Form validation → Image upload → Database save → Responder search → Email notifications

2. **Responder Activation**: Authentication → Status check → Assignment → Database update → Email confirmation → Access control lock

3. **Resolution**: Access control verification → Status update → Email notification → Dashboard refresh

4. **Registration**: Form validation → Password strength check → Database creation → JWT generation → Location capture (responders only)

5. **Nearby Detection**: GPS extraction → Database query → Distance calculation → Filtering → Sorting → Notification
