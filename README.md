# Seller Management Backend

A comprehensive backend system for Amazon sellers with inventory, shipment, finance, and defect tracking capabilities.

## Directory Structure

```
seller_management_backend/
├── config/          # Configuration files (DB, env, logger)
├── controllers/     # Business logic layer
├── models/          # Database schemas (Mongoose)
├── routes/          # API endpoints
├── middleware/      # Auth, role, error middleware
├── utils/           # Helper functions (JWT, response handler)
├── services/        # Business/service layer
├── scripts/         # Utility scripts (create admin, etc.)
├── logs/            # Application logs
├── exports/         # Auto-generated export files
├── public/          # Static files (PDFs, labels)
└── tests/           # Test files
```

## Quick Links

- 🚀 [Quick Start Guide](./QUICKSTART.md) - Get up and running in minutes
- 🎉 [Updates Summary](./UPDATES_SUMMARY.md) - Latest features and changes
- ✅ [Build Verification Report](./BUILD_VERIFICATION_REPORT.md) - Build status and troubleshooting
  - 🧪 [API Testing Setup](./API_TESTING_SETUP.md) - Complete testing guide
  - 📮 [Postman Collection Guide](./POSTMAN_GUIDE.md) - How to use Postman collection
  - 📦 [Postman Collection](./Seller_Management_API.postman_collection.json) - Import into Postman
  - 📦 [Pack Group Guide](./PACK_GROUP_GUIDE.md) - Amazon FBA pack group workflow
  - 🔧 [Schema Updates](./SCHEMA_UPDATES.md) - Database schema changes
  - ✅ [Testing Checklist](./TESTING_CHECKLIST.md) - Systematic testing checklist

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update the following in `.env`:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secure random string for JWT signing
- `CLOUDINARY_*` - Your Cloudinary credentials (for file uploads)

### 3. Create First Admin User

Since there's no public signup, you need to create the first admin user. Use the provided script:

```bash
npm run create-admin
```

The script will prompt you for:
- Admin name
- Admin email
- Admin password (min 6 characters)

**Alternative: Manual creation in MongoDB**

If you prefer to create the admin manually:

```javascript
// Connect to your MongoDB and run this in MongoDB shell or Compass
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "$2a$10$YourHashedPasswordHere", // Use bcrypt to hash your password
  role: "admin",
  permissions: ["inventory", "shipments", "finance", "defects"],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

To hash your password:

```javascript
const bcrypt = require('bcryptjs');
const password = 'your-password';
bcrypt.hash(password, 10).then(hash => console.log(hash));
```

### 4. Run the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT)

## Features

- ✅ JWT Authentication & Authorization
- ✅ Role-Based Access Control (Admin, Staff, Viewer)
- ✅ User Management (Admin only)
- ✅ Inventory Management (CRUD, stock tracking, low stock alerts)
- ✅ Shipment Tracking (Create, box management, finalize)
- ✅ Box-level Tracking (Items, weights, dimensions)
- ✅ Automatic Inventory Deduction on shipment finalization
- 🚧 Finance Management (Coming soon)
- 🚧 Defect Tracking (Coming soon)
- 🚧 PDF Generation (Invoices, Packing Lists, Labels)
- 🚧 Excel/CSV Export

## API Documentation

### Authentication Endpoints

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your-password"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "permissions": ["inventory", "shipments", "finance", "defects"]
    }
  }
}
```

#### Get Profile
```
GET /api/auth/profile
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "permissions": ["inventory", "shipments", "finance", "defects"]
    }
  }
}
```

### User Management Endpoints (Admin Only)

#### Create User
```
POST /api/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "staff",
  "permissions": ["inventory", "shipments"]
}

Response:
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "staff",
      "permissions": ["inventory", "shipments"]
    }
  }
}
```

#### Get All Users
```
GET /api/users
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "count": 2,
    "users": [...]
  }
}
```

#### Update User
```
PATCH /api/users/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "John Updated",
  "role": "admin",
  "permissions": ["inventory", "shipments", "finance", "defects"]
}
```

#### Delete User (Soft Delete)
```
DELETE /api/users/:id
Authorization: Bearer <admin_token>
```

## User Roles & Permissions

### Roles
- **admin**: Full access to all modules and user management
- **staff**: Access based on assigned permissions
- **viewer**: Read-only access based on assigned permissions

### Permissions
- `inventory`: Access to inventory management
- `shipments`: Access to shipment tracking
- `finance`: Access to finance/P&L module
- `defects`: Access to defect tracking

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [] // Optional validation errors
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Health Check

```
GET /health

Response:
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-17T10:30:00.000Z"
}
```

## API Modules

### ✅ Completed Modules

1. **Authentication** - Login, JWT tokens, user profiles
2. **User Management** - Create, update, delete users (admin only)
3. **Inventory Management** - Product CRUD, stock tracking, low stock alerts, bulk import, Amazon FBA fields (ASIN, FNSKU)
4. **Shipment Management** - Create shipments, box management, automatic inventory deduction
   - Smart duplicate SKU handling: Updates quantity instead of creating duplicates
5. **Pack Groups (Amazon FBA)** - Amazon FBA pack group workflow
   - Create shipments from pack group data with SKU distribution across boxes
   - Export pack group data for Amazon FBA CSV format
   - Update box distribution for products
6. **Defect Management** - Track defective products, supplier claims, financial losses
   - Report defects with detailed information and images
   - Track resolution and supplier claims
   - Calculate financial impact and loss tracking
7. **Finance Management** - Track all financial transactions and profit calculations
   - Record Amazon payments, purchases, shipping costs
   - Calculate profit margins and financial summaries
   - Track costs and expenses by SKU and supplier

- [ ] Excel/CSV Export functionality
- [ ] PDF generation for invoices and packing lists
- [ ] Unit tests

## API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /login` - User login
- `GET /profile` - Get user profile

### User Management (`/api/users`) - Admin Only
- `POST /` - Create user
- `GET /` - Get all users
- `PATCH /:id` - Update user
- `DELETE /:id` - Delete user

### Inventory Management (`/api/inventory`)
- `POST /` - Create inventory item
- `GET /` - Get all inventory (with filters, search, pagination)
- `GET /:id` - Get item by ID
- `GET /sku/:sku` - Get item by SKU
- `PATCH /:id` - Update item
- `PATCH /:id/stock` - Update stock quantity
- `POST /:id/adjust` - Adjust stock (add/subtract)
- `DELETE /:id` - Delete item
- `GET /alerts/low-stock` - Get low stock items
- `GET /stats` - Get inventory statistics
- `POST /bulk-import` - Bulk import items

### Shipment Management (`/api/shipments`)
- `POST /` - Create shipment
- `GET /` - Get all shipments (with filters, search, pagination)
- `GET /:id` - Get shipment by ID
- `GET /shipment-id/:shipmentId` - Get by shipment ID
- `PATCH /:id` - Update shipment
- `POST /:id/boxes` - Add box to shipment
- `POST /:id/boxes/:boxIndex/items` - Add item to box
- `POST /:id/boxes/:boxIndex/duplicate` - Duplicate a box with all items (saves time!)
- `POST /:id/finalize` - Finalize shipment (deducts inventory)
- `POST /:id/ship` - Mark as shipped
- `POST /:id/cancel` - Cancel shipment (restores inventory)
- `GET /stats` - Get shipment statistics
- `DELETE /:id` - Delete shipment (draft only)

### Pack Groups - Amazon FBA (`/api/pack-groups`)
- `POST /` - Create shipment from pack group data
- `GET /:id` - Get pack group data (for CSV export)
- `PUT /:id/distribution` - Update SKU distribution across boxes

### Defect Management (`/api/defects`)
- `POST /` - Create defect report
- `GET /` - Get all defects (with filters, pagination)
- `GET /:id` - Get defect by ID
- `GET /shipment/:shipmentId` - Get defects by shipment
- `PATCH /:id` - Update defect
- `POST /:id/resolve` - Resolve defect
- `PATCH /:id/claim` - Update supplier claim
- `GET /stats` - Get defect statistics

### Finance Management (`/api/finance`)
- `POST /` - Create financial transaction
- `GET /` - Get all transactions (with filters, pagination)
- `GET /:id` - Get transaction by ID
- `GET /sku/:sku` - Get transactions by SKU
- `GET /summary` - Get financial summary and statistics
- `GET /profit/sku/:sku` - Get profit data by SKU
- `GET /profit/supplier` - Get profit data by supplier
- `PATCH /:id` - Update transaction
- `DELETE /:id` - Delete transaction

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Logging**: Winston + Morgan
- **File Storage**: Cloudinary (configured, not yet used)

## License

ISC

