# Airbnb Clone - MERN Stack

A full-stack Airbnb clone built with MongoDB, Express.js, React, and Node.js.

## Features

- User authentication (register, login, logout)
- Property listing and search
- Property booking system
- **Razorpay payment integration** - Secure payment processing
- User dashboard for managing properties and bookings
- Responsive design with modern UI
- Image upload for properties
- Review and rating system

## Tech Stack

- **Frontend**: React, React Router, Axios, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Image Storage**: Local storage (can be extended to cloud storage)

## Project Structure

```
airbnb-clone/
├── backend/          # Express.js server
│   ├── models/       # MongoDB models
│   ├── routes/       # API routes
│   ├── middleware/   # Custom middleware
│   ├── controllers/  # Route controllers
│   └── uploads/      # File uploads
├── frontend/         # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   ├── utils/       # Utility functions
│   │   └── assets/      # Static assets
└── package.json      # Root package.json
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Add your MongoDB connection string and JWT secret
   - Add your Razorpay credentials:
     - `RAZORPAY_KEY_ID`: Your Razorpay Key ID (from Razorpay Dashboard)
     - `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret (from Razorpay Dashboard)
   
   **To get Razorpay credentials:**
   1. Sign up at [Razorpay](https://razorpay.com/)
   2. Go to Settings → API Keys
   3. Generate API keys (use Test keys for development)
   4. Copy Key ID and Key Secret to your `.env` file

4. Start the development servers:
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and frontend development server (port 3000).

## Usage

1. Register a new account or login
2. Browse available properties
3. Book a property by selecting dates
4. Manage your bookings and properties in the dashboard
5. Leave reviews for properties you've stayed at

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property (authenticated)
- `PUT /api/properties/:id` - Update property (authenticated)
- `DELETE /api/properties/:id` - Delete property (authenticated)

### Bookings
- `GET /api/bookings` - Get user bookings (authenticated)
- `POST /api/bookings` - Create new booking (authenticated)
- `PUT /api/bookings/:id` - Update booking (authenticated)
- `DELETE /api/bookings/:id` - Cancel booking (authenticated)

### Reviews
- `GET /api/reviews/:propertyId` - Get reviews for property
- `POST /api/reviews` - Create new review (authenticated)
- `PUT /api/reviews/:id` - Update review (authenticated)
- `DELETE /api/reviews/:id` - Delete review (authenticated)

### Orders & Payments
- `GET /api/orders` - Get user orders (authenticated)
- `GET /api/orders/:id` - Get order by ID (authenticated)
- `POST /api/orders/create` - Create order from cart (authenticated)
- `POST /api/orders/:id/create-razorpay-order` - Create Razorpay order (authenticated)
- `POST /api/orders/:id/verify-razorpay-payment` - Verify Razorpay payment (authenticated)
- `POST /api/orders/:id/payment` - Process payment (authenticated)
- `PUT /api/orders/:id/cancel` - Cancel order (authenticated)
