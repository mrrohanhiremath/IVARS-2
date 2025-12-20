# Data Flow Diagram (DFD)

## Level 0: Context Diagram

```mermaid
graph TB
    subgraph External Entities
        C[Citizen]
        R[Emergency Responder]
        A[Administrator]
    end
    
    subgraph "IVARS System"
        SYS[Emergency Alert<br/>System]
    end
    
    subgraph External Systems
        E1[Email System]
        E2[Cloud Storage]
        E3[Maps Service]
    end
    
    C -->|Accident Report| SYS
    C -->|Login Credentials| SYS
    SYS -->|Report Confirmation| C
    SYS -->|Status Updates| C
    
    R -->|Login Credentials| SYS
    R -->|Availability Status| SYS
    R -->|Incident Actions| SYS
    SYS -->|Emergency Alerts| R
    SYS -->|Incident Details| R
    
    A -->|Login Credentials| SYS
    A -->|Admin Actions| SYS
    SYS -->|System Reports| A
    SYS -->|Analytics Data| A
    
    SYS -->|Alert Emails| E1
    SYS -->|Evidence Photos| E2
    E2 -->|Image URLs| SYS
    SYS -->|Location Query| E3
    E3 -->|Geocoding Data| SYS
    
    style SYS fill:#4A90E2
    style C fill:#50C878
    style R fill:#FFB347
    style A fill:#E74C3C
```

## Level 1: Major Processes

```mermaid
graph TB
    subgraph External Entities
        C[Citizen]
        R[Responder]
        A[Admin]
    end
    
    subgraph "IVARS Processes"
        P1[1.0<br/>User<br/>Authentication]
        P2[2.0<br/>Incident<br/>Management]
        P3[3.0<br/>Responder<br/>Notification]
        P4[4.0<br/>Status<br/>Tracking]
        P5[5.0<br/>Analytics &<br/>Reporting]
    end
    
    subgraph Data Stores
        D1[(D1: Users)]
        D2[(D2: Incidents)]
    end
    
    subgraph External Systems
        E1[SendGrid]
        E2[Cloudinary]
        E3[Google Maps]
    end
    
    C -->|Login/Register| P1
    R -->|Login/Register| P1
    A -->|Login| P1
    P1 -->|User Data| D1
    D1 -->|Credentials| P1
    P1 -->|Auth Token| C
    P1 -->|Auth Token| R
    P1 -->|Auth Token| A
    
    C -->|Accident Details + Photos| P2
    P2 -->|Image Upload| E2
    E2 -->|Image URLs| P2
    P2 -->|Incident Data| D2
    P2 -->|Location Query| E3
    E3 -->|Coordinates| P2
    
    P2 -->|Trigger| P3
    P3 -->|Get Responders| D1
    D1 -->|Responder List| P3
    P3 -->|Send Alerts| E1
    E1 -->|Email Delivered| R
    
    R -->|Activate/Resolve| P2
    P2 -->|Status Update| D2
    
    P2 -->|Trigger| P4
    P4 -->|Read Incidents| D2
    D2 -->|Incident Status| P4
    P4 -->|Status Info| C
    P4 -->|Status Info| R
    
    A -->|Request Reports| P5
    P5 -->|Query Data| D2
    D2 -->|Statistics| P5
    P5 -->|Analytics| A
    
    style P1 fill:#4A90E2
    style P2 fill:#50C878
    style P3 fill:#FFB347
    style P4 fill:#9B59B6
    style P5 fill:#E74C3C
```

## Level 2: Incident Management Process (Process 2.0)

```mermaid
graph TB
    subgraph "Input"
        I1[Citizen Report]
        I2[Responder Action]
    end
    
    subgraph "Incident Management Subprocess"
        P21[2.1<br/>Validate<br/>Report]
        P22[2.2<br/>Store<br/>Evidence]
        P23[2.3<br/>Calculate<br/>Location]
        P24[2.4<br/>Find Nearby<br/>Responders]
        P25[2.5<br/>Create<br/>Incident]
        P26[2.6<br/>Update<br/>Status]
        P27[2.7<br/>Access<br/>Control]
    end
    
    subgraph "Data Stores"
        D1[(D1: Users)]
        D2[(D2: Incidents)]
        D3[(D3: Temp Files)]
    end
    
    subgraph "Output"
        O1[Notification Trigger]
        O2[Status Update]
    end
    
    I1 -->|Form Data| P21
    P21 -->|Valid Data| P22
    P22 -->|Upload Images| D3
    D3 -->|Image URLs| P22
    P22 -->|Evidence URLs| P23
    
    P23 -->|GPS Coords| P24
    P24 -->|Location Query| D1
    D1 -->|Available Responders| P24
    P24 -->|Responder List| P25
    
    P25 -->|Save| D2
    P25 -->|Alert Data| O1
    
    I2 -->|Action Request| P27
    P27 -->|Verify Permission| D1
    D1 -->|User Role| P27
    P27 -->|Get Incident| D2
    D2 -->|Incident Data| P27
    
    P27 -->|Authorized| P26
    P26 -->|Update| D2
    P26 -->|Updated Status| O2
    
    style P21 fill:#4A90E2
    style P24 fill:#50C878
    style P25 fill:#FFB347
    style P26 fill:#9B59B6
    style P27 fill:#E74C3C
```

## Data Store Details

### D1: Users Collection

**Inputs:**
- Registration data (Process 1.0)
- Location updates (Process 1.0)
- Availability status (Process 2.0)

**Outputs:**
- User credentials (Process 1.0)
- Responder list (Process 2.0)
- User profiles (Process 4.0)

**Data Structure:**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: Enum,
  coordinates: {lat, lng},
  responderType: String,
  responderStatus: Enum
}
```

### D2: Incidents Collection

**Inputs:**
- New incident reports (Process 2.0)
- Status updates (Process 2.0)
- Assignment updates (Process 2.0)

**Outputs:**
- Incident details (Process 3.0)
- Status information (Process 4.0)
- Analytics data (Process 5.0)

**Data Structure:**
```javascript
{
  _id: ObjectId,
  name: String,
  contact: String,
  location: String,
  gpsLocation: {lat, lng},
  description: String,
  images: [String],
  status: Enum,
  reportedBy: ObjectId,
  assignedTo: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## Detailed Process Descriptions

### Process 1.0: User Authentication

**Inputs:**
- User credentials (email, password)
- Registration data (name, email, password, role)

**Processing:**
1. Validate input format
2. Check user existence in D1
3. Hash password using bcrypt
4. Generate JWT token
5. Store/retrieve user data

**Outputs:**
- Authentication token
- User profile data
- Error messages (if validation fails)

**Data Flows:**
- User → [Login Credentials] → Process 1.0
- Process 1.0 → [User Data] → D1: Users
- D1: Users → [Stored Credentials] → Process 1.0
- Process 1.0 → [Auth Token] → User

---

### Process 2.0: Incident Management

**Inputs:**
- Accident report (name, contact, location, description, photos)
- Status update requests (activate, resolve)

**Processing:**
1. Validate report data
2. Upload evidence photos to Cloudinary
3. Parse GPS coordinates
4. Calculate distances to responders
5. Save incident to database
6. Apply access control rules

**Outputs:**
- Incident ID and confirmation
- Notification trigger to Process 3.0
- Status update confirmation

**Data Flows:**
- Citizen → [Report Data] → Process 2.0
- Process 2.0 → [Incident Record] → D2: Incidents
- Process 2.0 → [Query Location] → D1: Users
- D1: Users → [Responder List] → Process 2.0

---

### Process 3.0: Responder Notification

**Inputs:**
- Incident creation trigger
- Incident details (location, description, evidence)
- Responder email list

**Processing:**
1. Receive incident data from Process 2.0
2. Query nearby responders from D1
3. Generate email template with incident details
4. Send emails via SendGrid API
5. Log notification status

**Outputs:**
- Email notifications to responders
- Delivery status logs

**Data Flows:**
- Process 2.0 → [Incident Data] → Process 3.0
- Process 3.0 → [Get Responders] → D1: Users
- D1: Users → [Responder Emails] → Process 3.0
- Process 3.0 → [Email Request] → SendGrid
- SendGrid → [Delivered] → Responders

---

### Process 4.0: Status Tracking

**Inputs:**
- User ID
- Incident filters (status, assigned responder)

**Processing:**
1. Authenticate user
2. Query incidents from D2
3. Filter by user role and permissions
4. Format incident data for display
5. Return status information

**Outputs:**
- List of incidents with current status
- Assigned responder details
- Timeline updates

**Data Flows:**
- Citizen/Responder → [Status Request] → Process 4.0
- Process 4.0 → [Query] → D2: Incidents
- D2: Incidents → [Incident List] → Process 4.0
- Process 4.0 → [Status Info] → User

---

### Process 5.0: Analytics & Reporting

**Inputs:**
- Date range
- Filter criteria
- Report type

**Processing:**
1. Verify admin role
2. Aggregate incident data
3. Calculate statistics (total, resolved, pending)
4. Calculate response times
5. Generate visualizations

**Outputs:**
- System statistics
- Performance metrics
- Exportable reports

**Data Flows:**
- Admin → [Report Request] → Process 5.0
- Process 5.0 → [Aggregate Query] → D2: Incidents
- D2: Incidents → [Statistics] → Process 5.0
- Process 5.0 → [Analytics] → Admin

## Data Flow Summary Table

| From | Data | To | Purpose |
|------|------|-----|---------|
| Citizen | Login Credentials | Process 1.0 | Authentication |
| Process 1.0 | User Data | D1: Users | Store credentials |
| D1: Users | Stored User | Process 1.0 | Verify login |
| Process 1.0 | Auth Token | Citizen | Grant access |
| Citizen | Report + Photos | Process 2.0 | Create incident |
| Process 2.0 | Image Files | Cloudinary | Store evidence |
| Cloudinary | Image URLs | Process 2.0 | Reference photos |
| Process 2.0 | Incident Record | D2: Incidents | Persist data |
| Process 2.0 | Location Query | D1: Users | Find responders |
| D1: Users | Responder List | Process 2.0 | Notify nearby |
| Process 2.0 | Incident Data | Process 3.0 | Send alerts |
| Process 3.0 | Email Request | SendGrid | Deliver emails |
| SendGrid | Alert Email | Responders | Emergency notification |
| Responder | Action Request | Process 2.0 | Update status |
| Process 2.0 | Status Update | D2: Incidents | Record change |
| Process 2.0 | Notification | Citizen | Confirm action |
| User | Status Request | Process 4.0 | Track incidents |
| Process 4.0 | Query | D2: Incidents | Fetch data |
| D2: Incidents | Incident List | Process 4.0 | Return results |
| Process 4.0 | Status Info | User | Display updates |
| Admin | Report Request | Process 5.0 | View analytics |
| Process 5.0 | Aggregate Query | D2: Incidents | Calculate stats |
| D2: Incidents | Raw Data | Process 5.0 | Process metrics |
| Process 5.0 | Analytics | Admin | Display insights |
