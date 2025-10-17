# Postman Collection Guide

This guide will help you import and use the Postman collection to test the Seller Management API.

## Import the Collection

### Method 1: Direct Import

1. Open Postman
2. Click **Import** button (top-left)
3. Click **Upload Files**
4. Select `Seller_Management_API.postman_collection.json`
5. Click **Import**

### Method 2: Drag & Drop

1. Open Postman
2. Drag the `Seller_Management_API.postman_collection.json` file into the Postman window
3. Collection will be automatically imported

## Collection Variables

The collection uses variables that you can customize:

| Variable | Default Value | Description |
|----------|--------------|-------------|
| `base_url` | `http://localhost:5000` | Your API base URL |
| `token` | _(empty)_ | Auto-populated on login |
| `admin_token` | _(empty)_ | Auto-populated on admin login |

### How to Update Variables

1. Right-click on the collection name
2. Select **Edit**
3. Go to **Variables** tab
4. Update the `base_url` if your server runs on a different port
5. Click **Save**

## Testing Workflow

### Step 1: Start the Server

```bash
npm run dev
```

Make sure the server is running on `http://localhost:5000`

### Step 2: Health Check

Run the **Health Check** request to verify the server is up.

Expected Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-17T10:30:00.000Z"
}
```

### Step 3: Login

1. First, create an admin user using:
   ```bash
   npm run create-admin
   ```

2. Update the email and password in the **Login** request body

3. Run the **Login** request

4. The token will be **automatically saved** to collection variables

Expected Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "permissions": ["inventory", "shipments", "finance", "defects"]
    }
  }
}
```

### Step 4: Test Protected Routes

Now you can test any protected route. The token is automatically used in:
- **Get Profile**
- All **User Management** endpoints

### Step 5: Create Test Users

Use the **User Management** folder to create different types of users:
- **Create Admin User** - Full access
- **Create Staff User** - Limited permissions
- **Create Viewer User** - Read-only access

### Step 6: Test User Management

- **Get All Users** - List all active users
- **Update User** - Change role, permissions, or name
- **Delete User** - Soft delete (deactivate) a user

### Step 7: Test Error Scenarios

The **Error Scenarios** folder contains requests to test:
- Invalid credentials
- Missing required fields
- Invalid/missing tokens
- Duplicate emails
- Password validation
- Authorization errors
- Invalid ID formats
- 404 errors

## Request Examples

### Login Request

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### Get Profile Request

```http
GET http://localhost:5000/api/auth/profile
Authorization: Bearer YOUR_TOKEN_HERE
```

### Create User Request

```http
POST http://localhost:5000/api/users
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "staff",
  "permissions": ["inventory", "shipments"]
}
```

## Tips

### Auto-Save Token

The Login request has a **Test script** that automatically saves the token:

```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.collectionVariables.set('token', jsonData.data.token);
    pm.collectionVariables.set('admin_token', jsonData.data.token);
}
```

### Use Collection Runner

To test all requests at once:

1. Right-click on the collection
2. Select **Run collection**
3. Configure the order and delays
4. Click **Run**

### Environment Setup

For different environments (dev, staging, production):

1. Create a new Environment in Postman
2. Add variable `base_url` with appropriate value
3. Select the environment before running requests

Example environments:
- **Local**: `http://localhost:5000`
- **Staging**: `https://staging-api.yourapp.com`
- **Production**: `https://api.yourapp.com`

## Common Issues

### 401 Unauthorized

- Make sure you're logged in
- Check if token is saved in collection variables
- Token might be expired (default: 7 days)
- Try logging in again

### 403 Forbidden

- You don't have permission for this action
- Use admin token for admin-only routes
- Check user role and permissions

### 404 Not Found

- Check if server is running
- Verify the `base_url` in collection variables
- Check if the route exists

### Connection Refused

- Make sure the server is running
- Check if it's running on the correct port
- Update `base_url` if needed

## Response Format

All responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Optional validation errors
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

## Next Steps

After testing the authentication module, you can:

1. Save successful requests to **Examples** for reference
2. Export the collection to share with team members
3. Use **Collection Runner** for automated testing
4. Add more requests as new modules are implemented

## Support

If you encounter any issues:

1. Check server logs for detailed error messages
2. Verify all environment variables are set in `.env`
3. Ensure MongoDB is connected
4. Check the README.md for setup instructions

Happy Testing! 🚀

