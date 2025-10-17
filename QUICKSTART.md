# Quick Start Guide

This guide will help you get the Seller Management Backend up and running in minutes.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and update these required variables:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/seller_management
JWT_SECRET=your-super-secret-jwt-key-change-this

# Optional (but recommended)
PORT=5000
NODE_ENV=development
```

## Step 3: Create Admin User

```bash
npm run create-admin
```

Enter your details when prompted:
- Name: Your Name
- Email: your@email.com
- Password: (minimum 6 characters)

## Step 4: Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
MongoDB Connected: localhost
Server running in development mode on port 5000
```

## Step 5: Test the API

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "your-password"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "name": "Your Name",
      "email": "your@email.com",
      "role": "admin",
      "permissions": ["inventory", "shipments", "finance", "defects"]
    }
  }
}
```

### Get Profile
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create a New User (Admin only)
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Staff User",
    "email": "staff@example.com",
    "password": "password123",
    "role": "staff",
    "permissions": ["inventory", "shipments"]
  }'
```

## Next Steps

Now that your backend is running, you can:

1. **Test all endpoints** - Use Postman or curl to test the API
2. **Integrate with Flutter** - Connect your Flutter app to the backend
3. **Implement next module** - Add Inventory, Shipment, or Finance modules

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check your `MONGODB_URI` in `.env`
- For Atlas, ensure IP is whitelisted

### Port Already in Use
- Change `PORT` in `.env` to a different port
- Or stop the process using port 5000

### Authentication Errors
- Ensure JWT_SECRET is set in `.env`
- Token format: `Bearer <token>`
- Check token expiration (default: 7 days)

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Create admin user
npm run create-admin

# Run tests (when implemented)
npm test
```

## API Base URL

Local: `http://localhost:5000`

All API endpoints are prefixed with `/api`:
- Authentication: `/api/auth/*`
- Users: `/api/users/*`
- Health Check: `/health`

For detailed API documentation, see [README.md](./README.md)

