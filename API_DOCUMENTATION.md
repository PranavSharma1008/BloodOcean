# Blood Donation Finder - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication Routes

#### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "User already exists"
}
```

---

#### Login User
**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials"
}
```

---

#### Get Current User
**GET** `/auth/me`

Get the currently authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Not authorized to access this route"
}
```

---

### Profile Routes

#### Get User Profile
**GET** `/profile`

Get the authenticated user's profile information including donor details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "bloodGroup": "A+",
    "city": "New York",
    "available": true,
    "profileCompleted": true,
    "role": "user"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Not authorized to access this route"
}
```

---

#### Update User Profile
**PUT** `/profile`

Update the authenticated user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "bloodGroup": "A+",
  "city": "New York",
  "available": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "bloodGroup": "A+",
    "city": "New York",
    "available": true,
    "profileCompleted": true,
    "role": "user"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Name is required"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Invalid blood group"
}
```

---

### Location Routes

#### Update User Location
**PUT** `/users/location`

Update the authenticated user's location coordinates.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Latitude and longitude are required"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Latitude must be between -90 and 90"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Longitude must be between -180 and 180"
}
```

---

### Search Routes

#### Search Nearby Donors
**GET** `/donors/nearby`

Search for nearby blood donors based on location, blood group, and availability.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `bloodGroup` (required): Blood group to search for (A+, A-, B+, B-, AB+, AB-, O+, O-)
- `radius` (optional): Search radius in kilometers (default: 10, options: 5, 10, 20)

**Example Request:**
```
GET /api/donors/nearby?bloodGroup=A+&radius=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 3,
  "donors": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "bloodGroup": "A+",
      "phone": "+1234567890",
      "city": "New York",
      "available": true,
      "distance": "2.45"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "bloodGroup": "A+",
      "phone": "+0987654321",
      "city": "Brooklyn",
      "available": true,
      "distance": "5.67"
    }
  ],
  "searchRadius": 10,
  "bloodGroup": "A+"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Blood group is required"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Invalid blood group"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Invalid radius. Must be 5, 10, or 20 km"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Please set your location first"
}
```

---

### Emergency Request Routes

#### Create Emergency Request
**POST** `/emergency`

Create a new emergency blood donation request.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "patientName": "John Doe",
  "bloodGroup": "A+",
  "hospital": "City Hospital",
  "contactNumber": "+1234567890",
  "notes": "Urgent need for surgery"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Emergency request created successfully",
  "emergencyRequest": {
    "_id": "507f1f77bcf86cd799439011",
    "patientName": "John Doe",
    "bloodGroup": "A+",
    "hospital": "City Hospital",
    "contactNumber": "+1234567890",
    "notes": "Urgent need for surgery",
    "requesterLocation": {
      "type": "Point",
      "coordinates": [-74.0060, 40.7128]
    },
    "requester": "507f1f77bcf86cd799439012",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Please provide all required fields"
}
```

---

#### Get All Emergency Requests
**GET** `/emergency`

Get all active emergency blood donation requests.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "emergencyRequests": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "patientName": "John Doe",
      "bloodGroup": "A+",
      "hospital": "City Hospital",
      "contactNumber": "+1234567890",
      "notes": "Urgent need for surgery",
      "requesterLocation": {
        "type": "Point",
        "coordinates": [-74.0060, 40.7128]
      },
      "requester": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+0987654321"
      },
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

#### Get Emergency Request by ID
**GET** `/emergency/:id`

Get a specific emergency request by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "emergencyRequest": {
    "_id": "507f1f77bcf86cd799439011",
    "patientName": "John Doe",
    "bloodGroup": "A+",
    "hospital": "City Hospital",
    "contactNumber": "+1234567890",
    "notes": "Urgent need for surgery",
    "requesterLocation": {
      "type": "Point",
      "coordinates": [-74.0060, 40.7128]
    },
    "requester": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+0987654321"
    },
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Emergency request not found"
}
```

---

#### Update Emergency Request Status
**PUT** `/emergency/:id`

Update the status of an emergency request (only by the requester).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "fulfilled"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Emergency request updated successfully",
  "emergencyRequest": {
    "_id": "507f1f77bcf86cd799439011",
    "patientName": "John Doe",
    "bloodGroup": "A+",
    "hospital": "City Hospital",
    "contactNumber": "+1234567890",
    "notes": "Urgent need for surgery",
    "requesterLocation": {
      "type": "Point",
      "coordinates": [-74.0060, 40.7128]
    },
    "requester": "507f1f77bcf86cd799439012",
    "status": "fulfilled",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "message": "Not authorized to update this request"
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Emergency request not found"
}
```

---

### Notification Routes

#### Get User Notifications
**GET** `/notifications`

Get all notifications for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 5,
  "unreadCount": 2,
  "notifications": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "donorId": "507f1f77bcf86cd799439012",
      "requestId": {
        "_id": "507f1f77bcf86cd799439011",
        "patientName": "John Doe",
        "bloodGroup": "A+",
        "hospital": "City Hospital",
        "status": "active"
      },
      "message": "Emergency blood request for A+ at City Hospital. Patient: John Doe",
      "status": "unread",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

#### Mark Notification as Read
**PUT** `/notifications/:id`

Mark a specific notification as read.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "notification": {
    "_id": "507f1f77bcf86cd799439020",
    "donorId": "507f1f77bcf86cd799439012",
    "requestId": "507f1f77bcf86cd799439011",
    "message": "Emergency blood request for A+ at City Hospital. Patient: John Doe",
    "status": "read",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "message": "Not authorized to update this notification"
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Notification not found"
}
```

---

#### Mark All Notifications as Read
**PUT** `/notifications/mark-all-read`

Mark all unread notifications for the authenticated user as read.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### Admin Routes

#### Get Statistics
**GET** `/admin/statistics`

Get platform statistics including donor counts, blood group distribution, and emergency request statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "statistics": {
    "donors": {
      "total": 150,
      "available": 85,
      "bloodGroupDistribution": [
        { "_id": "A+", "count": 25 },
        { "_id": "A-", "count": 15 },
        { "_id": "B+", "count": 30 },
        { "_id": "B-", "count": 10 },
        { "_id": "AB+", "count": 20 },
        { "_id": "AB-", "count": 5 },
        { "_id": "O+", "count": 35 },
        { "_id": "O-", "count": 10 }
      ]
    },
    "emergencyRequests": {
      "total": 45,
      "active": 12,
      "fulfilled": 28,
      "cancelled": 5
    }
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "message": "Access denied. Admin only."
}
```

---

#### Get All Users
**GET** `/admin/users`

Get all users in the system (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 150,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "bloodGroup": "A+",
      "available": true,
      "profileCompleted": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Response (403 Forbidden):**
```json
{
  "message": "Access denied. Admin only."
}
```

---

#### Delete User
**DELETE** `/admin/users/:id`

Delete a user from the system (admin only). Cannot delete your own account.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Cannot delete your own account"
}
```

**Error Response (403 Forbidden):**
```json
{
  "message": "Access denied. Admin only."
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "User not found"
}
```

---

#### Get All Emergency Requests
**GET** `/admin/emergency-requests`

Get all emergency requests in the system (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 45,
  "requests": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "patientName": "Jane Smith",
      "bloodGroup": "A+",
      "hospital": "City Hospital",
      "contactNumber": "+1234567890",
      "status": "active",
      "requester": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+0987654321"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Response (403 Forbidden):**
```json
{
  "message": "Access denied. Admin only."
}
```

---

#### Delete Emergency Request
**DELETE** `/admin/emergency-requests/:id`

Delete an emergency request from the system (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Emergency request deleted successfully"
}
```

**Error Response (403 Forbidden):**
```json
{
  "message": "Access denied. Admin only."
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Emergency request not found"
}
```

---

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['user', 'admin'], default: 'user'),
  phone: String (default: ''),
  bloodGroup: String (enum: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], default: ''),
  city: String (default: ''),
  available: Boolean (default: false),
  profileCompleted: Boolean (default: false),
  location: {
    type: String (enum: ['Point'], default: 'Point'),
    coordinates: Array[Number] (default: [0, 0], format: [longitude, latitude])
  },
  createdAt: Date (default: Date.now)
}
```

**Note:** The location field uses GeoJSON Point format with coordinates stored as [longitude, latitude] for MongoDB 2dsphere indexing.

### EmergencyRequest Model
```javascript
{
  _id: ObjectId,
  patientName: String (required),
  bloodGroup: String (required, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  hospital: String (required),
  contactNumber: String (required),
  notes: String (default: ''),
  requesterLocation: {
    type: String (enum: ['Point'], default: 'Point'),
    coordinates: Array[Number] (default: [0, 0], format: [longitude, latitude])
  },
  requester: ObjectId (ref: 'User', required),
  status: String (enum: ['active', 'fulfilled', 'cancelled'], default: 'active'),
  createdAt: Date (default: Date.now)
}
```

**Note:** The requesterLocation field uses GeoJSON Point format with 2dsphere indexing for potential future geospatial queries.

### Notification Model
```javascript
{
  _id: ObjectId,
  donorId: ObjectId (ref: 'User', required),
  requestId: ObjectId (ref: 'EmergencyRequest', required),
  message: String (required),
  status: String (enum: ['unread', 'read'], default: 'unread'),
  createdAt: Date (default: Date.now)
}
```

**Note:** Notifications are automatically created for matching donors when an emergency request is created. The matching logic considers blood group, availability, and location proximity (within 20km).

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 500 | Internal Server Error |

---

## Future Endpoints (Phase 2+)

The following endpoints will be added in future phases:

- **Donor Profiles**: CRUD operations for donor profiles
- **Geolocation**: Search nearby donors by location
- **Emergency Requests**: Post and respond to emergency blood requests
- **Admin Dashboard**: User management, donation tracking, system settings
