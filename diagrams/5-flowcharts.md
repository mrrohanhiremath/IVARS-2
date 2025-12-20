# Flowcharts

## 1. Incident Reporting Process

```mermaid
flowchart TD
    Start([User Navigates to Report Page]) --> A{User Logged In?}
    A -->|No| Login[Redirect to Login]
    Login --> Start
    A -->|Yes| B[Display Report Form]
    
    B --> C[Request GPS Permission]
    C --> D{Permission Granted?}
    D -->|No| E[Manual Location Entry]
    D -->|Yes| F[Auto-fill GPS Coordinates]
    
    E --> G[User Fills Form]
    F --> G
    
    G --> H{Upload Photos?}
    H -->|Yes| I[Select Images]
    H -->|No| J{Form Valid?}
    
    I --> K[Upload to Cloudinary]
    K --> L{Upload Success?}
    L -->|No| M[Show Error]
    M --> I
    L -->|Yes| N[Store Image URLs]
    N --> J
    
    J -->|No| O[Display Validation Errors]
    O --> G
    J -->|Yes| P[Submit to API]
    
    P --> Q[Validate Data Server-side]
    Q --> R{Data Valid?}
    R -->|No| S[Return 400 Error]
    S --> O
    
    R -->|Yes| T[Save to Database]
    T --> U[Find Nearby Responders<br/>50km Radius]
    
    U --> V{Responders Found?}
    V -->|No| W[Log: No responders available]
    V -->|Yes| X[Calculate Distances]
    
    X --> Y[Sort by Proximity]
    Y --> Z[Send Email Alerts]
    Z --> AA[Log Email Status]
    
    W --> AB[Return Success Response]
    AA --> AB
    AB --> AC[Display Success Message]
    AC --> AD[Show Report ID]
    AD --> End([End])
    
    style Start fill:#4A90E2
    style End fill:#50C878
    style S fill:#E74C3C
    style M fill:#E74C3C
```

## 2. Responder Notification & Activation

```mermaid
flowchart TD
    Start([Incident Created]) --> A[System Finds Nearby Responders]
    
    A --> B{Responders Available?}
    B -->|No| C[Log: No responders in range]
    C --> End1([Wait for New Responders])
    
    B -->|Yes| D[Generate Email Template]
    D --> E[Include Incident Details:<br/>- Location<br/>- Contact<br/>- Evidence Photos]
    
    E --> F[Send via SendGrid API]
    F --> G{Email Sent?}
    G -->|No| H[Log Error]
    G -->|Yes| I[Log Success]
    
    H --> End2([Retry Later])
    I --> J[Responder Receives Email]
    
    J --> K[Responder Opens Dashboard]
    K --> L[View Incident List]
    L --> M{Filter by Status}
    
    M -->|Pending| N[Show Activate Button]
    M -->|Active| O[Show Details]
    M -->|Resolved| P[Show History]
    
    N --> Q{Click Activate?}
    Q -->|No| End3([Continue Monitoring])
    Q -->|Yes| R[Send PATCH Request]
    
    R --> S[Verify Authentication]
    S --> T{Token Valid?}
    T -->|No| U[Return 401 Error]
    U --> V[Redirect to Login]
    V --> End4([Login Required])
    
    T -->|Yes| W[Check Incident Status]
    W --> X{Already Active?}
    X -->|Yes| Y[Return 400 Error:<br/>Already Assigned]
    Y --> Z[Show Error Message]
    Z --> End5([End])
    
    X -->|No| AA[Update Database:<br/>- assignedTo = responderId<br/>- status = 'active']
    AA --> AB[Send Confirmation Email<br/>to Reporter]
    AB --> AC[Return Success]
    AC --> AD[Update UI]
    AD --> AE[Lock Incident to Responder]
    AE --> End6([Incident Activated])
    
    style Start fill:#4A90E2
    style End1 fill:#9B59B6
    style End2 fill:#E74C3C
    style End3 fill:#FFB347
    style End4 fill:#E74C3C
    style End5 fill:#E74C3C
    style End6 fill:#50C878
```

## 3. Resolution Process with Access Control

```mermaid
flowchart TD
    Start([Responder Views Active Incident]) --> A[Fetch Current User Data]
    A --> B[Get Incident Details]
    
    B --> C{User is Assigned<br/>Responder?}
    C -->|No| D[Show Lock Icon 🔒]
    D --> E[Disable Resolve Button]
    E --> F[Display: Not Authorized]
    F --> End1([End])
    
    C -->|Yes| G[Show Unlock Icon]
    G --> H[Enable Resolve Button]
    H --> I{Click Resolve?}
    
    I -->|No| End2([Continue Monitoring])
    I -->|Yes| J[Show Confirmation Dialog]
    
    J --> K{Confirm Resolution?}
    K -->|No| End2
    K -->|Yes| L[Send PATCH Request<br/>status: 'resolved']
    
    L --> M[Backend Validation]
    M --> N{JWT Valid?}
    N -->|No| O[Return 401]
    O --> P[Redirect to Login]
    P --> End3([Login Required])
    
    N -->|Yes| Q[Fetch Incident from DB]
    Q --> R{assignedTo === currentUser?}
    
    R -->|No| S[Return 403 Forbidden]
    S --> T[Show Error:<br/>Only assigned responder can resolve]
    T --> End4([Access Denied])
    
    R -->|Yes| U{Current Status<br/>is 'active'?}
    U -->|No| V[Return 400 Error:<br/>Invalid status transition]
    V --> End5([Error])
    
    U -->|Yes| W[Update Status to 'resolved']
    W --> X[Update Timestamp]
    X --> Y[Save to Database]
    
    Y --> Z{Save Success?}
    Z -->|No| AA[Return 500 Error]
    AA --> AB[Show Error Message]
    AB --> End6([Database Error])
    
    Z -->|Yes| AC[Send Email to Reporter]
    AC --> AD{Email Sent?}
    AD -->|No| AE[Log Email Error]
    AD -->|Yes| AF[Log Email Success]
    
    AE --> AG[Return Success Response<br/>with Warning]
    AF --> AH[Return Success Response]
    AG --> AI[Update Dashboard UI]
    AH --> AI
    
    AI --> AJ[Change Status to Resolved]
    AJ --> AK[Show Success Message]
    AK --> AL[Disable Resolve Button]
    AL --> End7([Incident Resolved])
    
    style Start fill:#4A90E2
    style End1 fill:#E74C3C
    style End2 fill:#FFB347
    style End3 fill:#E74C3C
    style End4 fill:#E74C3C
    style End5 fill:#E74C3C
    style End6 fill:#E74C3C
    style End7 fill:#50C878
```

## 4. User Authentication Flow

```mermaid
flowchart TD
    Start([User Opens App]) --> A{Logged In?}
    A -->|Yes| B[Redirect to Dashboard]
    B --> End1([Dashboard])
    
    A -->|No| C[Show Login Modal]
    C --> D{Registration or Login?}
    
    D -->|Register| E[Show Registration Form]
    E --> F[Select Role:<br/>Citizen/Responder]
    
    F --> G{Role is Responder?}
    G -->|Yes| H[Show Responder Type:<br/>Police/Ambulance/Fire]
    G -->|No| I[Enter User Details]
    H --> I
    
    I --> J[Enter Password]
    J --> K[Validate Password]
    K --> L{Password Valid?<br/>8+ chars, A-z, 0-9, special}
    
    L -->|No| M[Show Error Message]
    M --> J
    
    L -->|Yes| N[Submit to API]
    N --> O[Hash Password - bcrypt]
    O --> P[Save to Database]
    
    P --> Q{Save Success?}
    Q -->|No| R[Return Error]
    R --> S[Show Error to User]
    S --> End2([Registration Failed])
    
    Q -->|Yes| T[Generate JWT Token]
    T --> U[Return Token + User Data]
    U --> V{Role is Responder?}
    
    V -->|Yes| W[Request Location]
    W --> X{Permission Granted?}
    X -->|Yes| Y[Get GPS Coordinates]
    Y --> Z[Update Location in DB]
    Z --> AA[Store Token in LocalStorage]
    
    X -->|No| AA
    V -->|No| AA
    
    AA --> AB[Reload Page]
    AB --> End3([Login Success])
    
    D -->|Login| AC[Enter Email & Password]
    AC --> AD[Submit to API]
    AD --> AE[Find User by Email]
    
    AE --> AF{User Exists?}
    AF -->|No| AG[Return 404 Error]
    AG --> AH[Show: User not found]
    AH --> End4([Login Failed])
    
    AF -->|Yes| AI[Compare Password - bcrypt]
    AI --> AJ{Password Match?}
    AJ -->|No| AK[Return 401 Error]
    AK --> AL[Show: Invalid password]
    AL --> End4
    
    AJ -->|Yes| AM[Generate JWT Token]
    AM --> AN[Return Token + User Data]
    AN --> AO{Role is Responder?}
    
    AO -->|Yes| AP[Get & Update Location]
    AP --> AQ[Store Token]
    AO -->|No| AQ
    
    AQ --> AR[Reload Page]
    AR --> End5([Login Success])
    
    style Start fill:#4A90E2
    style End1 fill:#50C878
    style End2 fill:#E74C3C
    style End3 fill:#50C878
    style End4 fill:#E74C3C
    style End5 fill:#50C878
```

## 5. Password Validation Logic

```mermaid
flowchart TD
    Start([User Types Password]) --> A[Get Password Value]
    A --> B{Length >= 8?}
    
    B -->|No| C[Error: Min 8 characters]
    C --> End1([Show Error])
    
    B -->|Yes| D{Contains Uppercase<br/>A-Z?}
    D -->|No| E[Error: Need uppercase letter]
    E --> End1
    
    D -->|Yes| F{Contains Lowercase<br/>a-z?}
    F -->|No| G[Error: Need lowercase letter]
    G --> End1
    
    F -->|Yes| H{Contains Number<br/>0-9?}
    H -->|No| I[Error: Need number]
    I --> End1
    
    H -->|Yes| J{Contains Special<br/>Character?}
    J -->|No| K[Error: Need special char<br/>!@#$%^&*]
    K --> End1
    
    J -->|Yes| L[All Validations Passed]
    L --> M[Show Green Checkmark ✅]
    M --> N[Enable Submit Button]
    N --> End2([Valid Password])
    
    style Start fill:#4A90E2
    style End1 fill:#E74C3C
    style End2 fill:#50C878
```

## Process Summaries

### Critical Paths:
1. **Report → Notify**: GPS → Form → Upload → Save → Find → Email (< 5 seconds)
2. **Activate**: Click → Verify → Assign → Email (< 2 seconds)
3. **Resolve**: Click → Validate → Update → Notify (< 2 seconds)

### Error Handling:
- Network failures: Retry with exponential backoff
- Validation errors: Display inline with specific messages
- Auth errors: Redirect to login with return URL
- Database errors: Log and show user-friendly message
