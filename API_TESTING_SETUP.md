# API Testing Setup - Complete Guide

## 📦 What's Included

### 1. Postman Collection
**File:** `Seller_Management_API.postman_collection.json`

Complete collection with:
- ✅ 20+ pre-configured API requests
- ✅ Auto-saving authentication tokens
- ✅ Collection variables for easy configuration
- ✅ Organized folder structure
- ✅ Error scenario testing

### 2. Documentation
- **POSTMAN_GUIDE.md** - Complete Postman usage guide
- **TESTING_CHECKLIST.md** - Systematic testing checklist
- **QUICKSTART.md** - Quick setup guide
- **README.md** - Full API documentation

## 🚀 Quick Start (5 Steps)

### Step 1: Start Backend
```bash
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run create-admin
npm run dev
```

### Step 2: Import to Postman
1. Open Postman
2. Click **Import**
3. Select `Seller_Management_API.postman_collection.json`
4. Click **Import**

### Step 3: Test Health Check
Run: **Health Check** request
Expected: `200 OK` with server status

### Step 4: Login
1. Update credentials in **Login** request
2. Run the request
3. Token is auto-saved ✨

### Step 5: Test Everything
Browse through folders and test:
- ✅ Authentication endpoints
- ✅ User management (admin only)
- ✅ Error scenarios

## 📋 Collection Structure

```
Seller Management API
│
├── Health Check
│
├── 📁 Authentication
│   ├── Login (auto-saves token)
│   └── Get Profile
│
├── 📁 User Management (Admin Only)
│   ├── Create User
│   ├── Create Admin User
│   ├── Create Staff User
│   ├── Create Viewer User
│   ├── Get All Users
│   ├── Update User Role
│   ├── Update User Name
│   ├── Deactivate User
│   └── Delete User
│
└── 📁 Error Scenarios
    ├── Login - Invalid Credentials
    ├── Login - Missing Fields
    ├── Get Profile - No Token
    ├── Get Profile - Invalid Token
    ├── Create User - Duplicate Email
    ├── Create User - Short Password
    ├── Create User - Non-Admin
    ├── Update User - Invalid ID
    └── Route Not Found
```

## 🔧 Collection Variables

| Variable | Default | Auto-Updated | Purpose |
|----------|---------|--------------|---------|
| `base_url` | `http://localhost:5000` | ❌ | API base URL |
| `token` | empty | ✅ | Current user token |
| `admin_token` | empty | ✅ | Admin user token |

**To Change Base URL:**
1. Right-click collection → Edit
2. Variables tab
3. Update `base_url` Current Value
4. Save

## 🧪 Testing Workflows

### Workflow 1: Basic Authentication Test
1. Health Check
2. Login (saves token)
3. Get Profile
4. **Expected:** All pass ✅

### Workflow 2: User Management Test
1. Login as admin
2. Create Staff User
3. Get All Users
4. Update User Role
5. Delete User
6. **Expected:** All pass ✅

### Workflow 3: Security Test
1. Try Get Profile without token → 401
2. Try Create User without token → 401
3. Login as staff
4. Try Create User → 403
5. **Expected:** All fail as expected ✅

### Workflow 4: Validation Test
1. Login with missing password → 400
2. Create User with short password → 400
3. Create User with duplicate email → 400
4. **Expected:** All return validation errors ✅

## 📊 Test Coverage

| Module | Endpoints | Tests | Coverage |
|--------|-----------|-------|----------|
| Health | 1 | 1 | 100% |
| Authentication | 2 | 6 | 100% |
| User Management | 5 | 10+ | 100% |
| Error Handling | - | 9 | 100% |
| **Total** | **8** | **26+** | **100%** |

## 🎯 What to Test

### ✅ Functional Tests
- [ ] All endpoints return expected responses
- [ ] Token authentication works
- [ ] Role-based access works
- [ ] CRUD operations work correctly
- [ ] Soft delete works

### ✅ Security Tests
- [ ] Passwords are hashed
- [ ] Tokens are validated
- [ ] Unauthorized access blocked
- [ ] Admin-only routes protected
- [ ] No sensitive data exposed

### ✅ Validation Tests
- [ ] Required fields enforced
- [ ] Email format validated
- [ ] Password length validated
- [ ] Duplicate emails rejected
- [ ] Invalid IDs rejected

### ✅ Error Handling Tests
- [ ] 400 for validation errors
- [ ] 401 for auth errors
- [ ] 403 for permission errors
- [ ] 404 for not found
- [ ] 500 handled gracefully

## 💡 Pro Tips

### 1. Use Collection Runner
Run all tests automatically:
- Right-click collection → Run
- Select all requests
- Set delay (100ms)
- Run

### 2. Save Examples
After successful requests:
- Click **Save Response**
- Add as **Example**
- Use for reference

### 3. Create Environments
For different setups:
- **Local**: `http://localhost:5000`
- **Staging**: Your staging URL
- **Production**: Your prod URL

### 4. Test Scripts
Login already has auto-save script:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.collectionVariables.set('token', jsonData.data.token);
}
```

Add similar scripts to other requests as needed.

## 🐛 Troubleshooting

### Token Not Saving
**Problem:** Login successful but token not saved
**Solution:** 
- Check Tests tab in Login request
- Script should be present
- Try manually: Collection → Variables → Paste token

### 401 Unauthorized
**Problem:** All protected routes return 401
**Solution:**
- Check if token is saved in Variables
- Try logging in again
- Check token format: `Bearer <token>`

### 403 Forbidden
**Problem:** Cannot access admin routes
**Solution:**
- Make sure you're logged in as admin
- Check user role in response
- Use `admin_token` variable

### Connection Refused
**Problem:** Cannot connect to server
**Solution:**
- Check if server is running
- Check `base_url` in variables
- Check port in `.env`

### Validation Errors
**Problem:** Unexpected validation errors
**Solution:**
- Check request body format
- Verify all required fields
- Check field types (string, array, etc.)

## 📈 Expected Response Times

| Endpoint | Expected Time | Status |
|----------|--------------|--------|
| Health Check | < 50ms | ⚡ Fast |
| Login | < 200ms | ✅ Good |
| Get Profile | < 100ms | ✅ Good |
| Create User | < 150ms | ✅ Good |
| Get All Users | < 200ms | ✅ Good |
| Update User | < 150ms | ✅ Good |
| Delete User | < 150ms | ✅ Good |

## 🎓 Learning Resources

### Understanding Responses

**Success Response Structure:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Actual data here
  }
}
```

**Error Response Structure:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [  // Optional
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### HTTP Status Codes

- **2xx Success**
  - 200 OK - Request successful
  - 201 Created - Resource created

- **4xx Client Errors**
  - 400 Bad Request - Validation failed
  - 401 Unauthorized - Auth required
  - 403 Forbidden - No permission
  - 404 Not Found - Resource not found

- **5xx Server Errors**
  - 500 Internal Server Error - Server issue

## 📝 Next Steps

After testing authentication:

1. ✅ Verify all tests pass
2. ✅ Document any issues found
3. ✅ Share collection with team
4. 🚧 Wait for next module (Inventory)
5. 🚧 Update collection with new endpoints

## 🤝 Sharing with Team

### Export Collection
1. Right-click collection
2. Export
3. Collection v2.1 (recommended)
4. Share JSON file

### Export Environment
1. Click Environments (left sidebar)
2. Click ⋯ next to environment
3. Export
4. Share JSON file

### Git Repository
Collection is already in repo:
```bash
git add Seller_Management_API.postman_collection.json
git commit -m "Add Postman collection"
git push
```

Team members can:
```bash
git pull
# Import collection from file
```

## 📞 Support

Having issues?

1. Check [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)
2. Check [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
3. Check [README.md](./README.md) API docs
4. Check server logs
5. Verify MongoDB connection
6. Check `.env` configuration

## ✨ Summary

You now have:
- ✅ Complete Postman collection (26+ requests)
- ✅ Auto-saving authentication
- ✅ Organized test scenarios
- ✅ Error handling tests
- ✅ Comprehensive documentation
- ✅ Testing checklist
- ✅ Quick start guide

**Ready to test!** 🚀

Start with the [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md) for detailed instructions.

