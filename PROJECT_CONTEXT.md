# Blood Donation Finder - Project Context

## Project Overview
Blood Donation Finder is a web application designed to connect blood donors with patients in need of emergency blood transfusions. The platform leverages geolocation technology to find nearby donors with matching blood groups.

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Architecture**: MVC (Model-View-Controller)

### Frontend
- **Framework**: React.js
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Geolocation**: Browser Geolocation API (navigator.geolocation)

## Key Features Implemented

### Phase 1: Authentication & Basic Structure
- User registration and login
- JWT-based authentication
- Protected routes
- User profile management
- Password hashing with bcrypt

### Phase 2: Donor Profile Management
- Extended user model with donor information
- Phone number, blood group, city, availability status
- Profile completion tracking
- Profile validation

### Phase 3: Geolocation Support
- User location storage using GeoJSON Point format
- MongoDB 2dsphere indexing for geospatial queries
- Browser geolocation API integration
- Manual location input option
- Coordinate validation

### Phase 4: Nearby Donor Search
- Geospatial search using MongoDB $nearSphere
- Blood group filtering
- Availability filtering
- Radius-based search (5km, 10km, 20km)
- Distance calculation using Haversine formula
- Sorted results by proximity

### Phase 5: Emergency Blood Requests
- Emergency request creation
- Request status management (active, fulfilled, cancelled)
- Requester location tracking
- Integration with donor search
- Request dashboard with filtering

## Database Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['user', 'admin'], default: 'user'),
  phone: String (default: ''),
  bloodGroup: String (enum: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  city: String (default: ''),
  available: Boolean (default: false),
  profileCompleted: Boolean (default: false),
  location: {
    type: String (enum: ['Point']),
    coordinates: Array[Number] (format: [longitude, latitude])
  },
  createdAt: Date
}
```

### EmergencyRequest Model
```javascript
{
  _id: ObjectId,
  patientName: String (required),
  bloodGroup: String (required, enum: blood groups),
  hospital: String (required),
  contactNumber: String (required),
  notes: String (default: ''),
  requesterLocation: {
    type: String (enum: ['Point']),
    coordinates: Array[Number]
  },
  requester: ObjectId (ref: 'User'),
  status: String (enum: ['active', 'fulfilled', 'cancelled']),
  createdAt: Date
}
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user

### Profile
- GET `/api/profile` - Get user profile
- PUT `/api/profile` - Update user profile

### Location
- PUT `/api/users/location` - Update user location

### Search
- GET `/api/donors/nearby` - Search nearby donors

### Emergency Requests
- POST `/api/emergency` - Create emergency request
- GET `/api/emergency` - Get all active requests
- GET `/api/emergency/:id` - Get specific request
- PUT `/api/emergency/:id` - Update request status

## Project Structure

```
bloody/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CompleteProfile.jsx
│   │   │   ├── Location.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── CreateEmergency.jsx
│   │   │   └── EmergencyRequests.jsx
│   │   └── App.jsx
│   └── package.json
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── locationController.js
│   │   ├── searchController.js
│   │   └── emergencyController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── EmergencyRequest.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── location.js
│   │   ├── search.js
│   │   └── emergency.js
│   ├── .env
│   └── server.js
├── API_DOCUMENTATION.md
├── PROJECT_CONTEXT.md
├── PROJECT_PROGRESS.md
├── README.md
└── req.txt
```

## Environment Variables

### Server (.env)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
PORT=5000
```

## Important Design Decisions

1. **No Google Maps API**: Using browser's native geolocation API only
2. **GeoJSON Format**: Location stored as [longitude, latitude] for MongoDB compatibility
3. **2dsphere Index**: Enables efficient geospatial queries
4. **JWT Authentication**: Stateless authentication with token-based auth
5. **Protected Routes**: All sensitive routes require JWT token
6. **Profile Completion**: Users must complete profile before certain features
7. **Location Requirement**: Location must be set before searching for donors

## Future Enhancements

- Real-time notifications (WebSocket/Firebase)
- Admin dashboard
- Blood donation history tracking
- Donor badges and achievements
- Rating system
- Multi-language support
- Mobile app (React Native)
- Integration with blood banks
- Appointment scheduling
