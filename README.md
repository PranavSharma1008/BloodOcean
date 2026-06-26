<<<<<<< HEAD
# Blood Donation Finder - Phase 1

A web application to connect blood donors with those in need. This is Phase 1 of the project, which includes user authentication and basic application structure.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens), bcrypt
- **Architecture**: MVC (Model-View-Controller)

## Project Structure

```
bloody/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components (Navbar, ProtectedRoute)
│   │   ├── context/       # React Context (AuthContext)
│   │   ├── pages/         # Page components (Login, Register, Dashboard)
│   │   ├── App.jsx        # Main app component
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles with Tailwind
│   ├── index.html         # HTML template
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.js     # Vite configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── postcss.config.js  # PostCSS configuration
├── server/                # Express backend
│   ├── config/            # Configuration files (database)
│   ├── controllers/       # Route controllers (authController)
│   ├── middleware/        # Custom middleware (auth)
│   ├── models/            # Mongoose models (User)
│   ├── routes/            # API routes (auth)
│   ├── server.js          # Express server entry point
│   ├── package.json       # Backend dependencies
│   └── .env.example       # Environment variables template
├── API_DOCUMENTATION.md   # API endpoint documentation
└── README.md             # This file
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (for cloud database)
- Git (optional)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bloody
```

### 2. Backend Setup

#### 2.1 Navigate to server directory
```bash
cd server
```

#### 2.2 Install dependencies
```bash
npm install
```

#### 2.3 Configure environment variables
```bash
cp .env.example .env
```

Edit the `.env` file with your MongoDB Atlas connection string:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/blood-donation-finder?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

**Note**: Replace `<username>` and `<password>` with your MongoDB Atlas credentials. Generate a strong JWT_SECRET for production.

#### 2.4 Start the backend server
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

#### 3.1 Navigate to client directory (from project root)
```bash
cd client
```

#### 3.2 Install dependencies
```bash
npm install
```

#### 3.3 Start the frontend development server
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### 4. Running the Application

Start both servers in separate terminals:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Access the application at `http://localhost:3000`

## Features (Phase 1)

- **User Registration**: Create new user accounts with email and password
- **User Login**: Authenticate users with JWT tokens
- **Protected Routes**: Dashboard accessible only to authenticated users
- **Role-Based Access**: User and Admin roles (for future expansion)
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Password Security**: Password hashing with bcrypt

## API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API documentation.

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

## Future Phases

The application is designed to be easily extended with future features:

- **Phase 2**: Donor profiles, blood type management
- **Phase 3**: Geolocation-based donor search
- **Phase 4**: Emergency blood donation requests
- **Phase 5**: Admin dashboard with user management
- **Phase 6**: Donation history and notifications

## Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['user', 'admin'], default: 'user'),
  createdAt: Date (default: Date.now)
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Backend server port | 5000 |
| MONGODB_URI | MongoDB Atlas connection string | - |
| JWT_SECRET | Secret key for JWT token generation | - |
| JWT_EXPIRE | JWT token expiration time | 7d |
| NODE_ENV | Environment mode | development |

## Troubleshooting

### MongoDB Connection Issues
- Ensure your MongoDB Atlas IP whitelist includes your IP address (0.0.0.0/0 for development)
- Verify your connection string format
- Check that your database user has the correct permissions

### CORS Errors
- The backend is configured to allow CORS from the frontend
- Ensure both servers are running on the correct ports

### JWT Token Issues
- Make sure JWT_SECRET is set in your .env file
- Check that tokens are being sent in the Authorization header: `Bearer <token>`

## Development Notes

- The backend uses MVC architecture for better code organization
- The frontend uses React Context for state management
- Tailwind CSS is used for styling with a red theme (blood donation)
- The application is designed to be mobile-responsive
- All passwords are hashed using bcrypt before storage

## Security Considerations

- Never commit `.env` files to version control
- Use strong JWT_SECRET values in production
- Implement rate limiting for API endpoints (future enhancement)
- Add input validation and sanitization (future enhancement)
- Use HTTPS in production

## License

ISC

## Contact

For questions or support, please open an issue in the repository.
=======
# BloodOcean
>>>>>>> 22ab42806cf03e14c1da2dd7ba0f3005f1cf3da6
