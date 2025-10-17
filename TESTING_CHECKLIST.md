# API Testing Checklist

Use this checklist to systematically test all API endpoints.

## Pre-Testing Setup

- [ ] Server is running (`npm run dev`)
- [ ] MongoDB is connected
- [ ] Admin user is created (`npm run create-admin`)
- [ ] Postman collection is imported
- [ ] Environment variables are configured

## Health Check

- [ ] GET `/health` returns 200 OK

## Authentication Tests

### Login Endpoint

- [ ] ✅ Valid credentials return token
- [ ] ✅ Invalid email returns 401
- [ ] ✅ Invalid password returns 401
- [ ] ✅ Missing email returns 400
- [ ] ✅ Missing password returns 400
- [ ] ✅ Deactivated user returns 403
- [ ] ✅ Token is automatically saved

### Get Profile Endpoint

- [ ] ✅ Valid token returns user profile
- [ ] ✅ No token returns 401
- [ ] ✅ Invalid token returns 401
- [ ] ✅ Expired token returns 401

## User Management Tests (Admin Only)

### Create User

- [ ] ✅ Admin can create user
- [ ] ✅ Created user has correct role
- [ ] ✅ Created user has correct permissions
- [ ] ✅ Duplicate email returns 400
- [ ] ✅ Short password returns 400
- [ ] ✅ Missing name returns 400
- [ ] ✅ Missing email returns 400
- [ ] ✅ Missing password returns 400
- [ ] ✅ Non-admin cannot create user (403)

### Get All Users

- [ ] ✅ Admin can list all users
- [ ] ✅ Returns only active users
- [ ] ✅ Returns correct user count
- [ ] ✅ Non-admin cannot access (403)
- [ ] ✅ No token returns 401

### Update User

- [ ] ✅ Admin can update user name
- [ ] ✅ Admin can update user role
- [ ] ✅ Admin can update user permissions
- [ ] ✅ Admin can deactivate user
- [ ] ✅ Invalid user ID returns 400
- [ ] ✅ Non-existent user returns 404
- [ ] ✅ Non-admin cannot update (403)

### Delete User

- [ ] ✅ Admin can soft delete user
- [ ] ✅ User becomes inactive after deletion
- [ ] ✅ Cannot delete own account (400)
- [ ] ✅ Invalid user ID returns 400
- [ ] ✅ Non-existent user returns 404
- [ ] ✅ Non-admin cannot delete (403)

## Role-Based Access Tests

### Admin Role

- [ ] ✅ Can access all endpoints
- [ ] ✅ Can create users
- [ ] ✅ Can update users
- [ ] ✅ Can delete users
- [ ] ✅ Has all permissions by default

### Staff Role

- [ ] ✅ Can login
- [ ] ✅ Can get own profile
- [ ] ✅ Cannot access user management (403)
- [ ] ✅ Access based on assigned permissions

### Viewer Role

- [ ] ✅ Can login
- [ ] ✅ Can get own profile
- [ ] ✅ Cannot access user management (403)
- [ ] ✅ Read-only access based on permissions

## Error Handling Tests

### Validation Errors

- [ ] ✅ Returns 400 for missing required fields
- [ ] ✅ Returns 400 for invalid email format
- [ ] ✅ Returns 400 for short password
- [ ] ✅ Returns validation error details

### Authentication Errors

- [ ] ✅ Returns 401 for missing token
- [ ] ✅ Returns 401 for invalid token
- [ ] ✅ Returns 401 for expired token
- [ ] ✅ Returns error message

### Authorization Errors

- [ ] ✅ Returns 403 for insufficient permissions
- [ ] ✅ Returns 403 for wrong role
- [ ] ✅ Returns 403 for deactivated account
- [ ] ✅ Returns error message

### Not Found Errors

- [ ] ✅ Returns 404 for non-existent routes
- [ ] ✅ Returns 404 for non-existent users
- [ ] ✅ Returns error message

### Server Errors

- [ ] ✅ Returns 500 for server errors
- [ ] ✅ Errors are logged
- [ ] ✅ Returns error message (not stack trace)

## Security Tests

### Password Security

- [ ] ✅ Passwords are hashed in database
- [ ] ✅ Passwords not returned in responses
- [ ] ✅ Password minimum length enforced

### Token Security

- [ ] ✅ Token contains user ID and role
- [ ] ✅ Token has expiration
- [ ] ✅ Token signature is verified
- [ ] ✅ Invalid tokens are rejected

### Data Protection

- [ ] ✅ Sensitive data not exposed
- [ ] ✅ User data properly sanitized
- [ ] ✅ Proper CORS configuration

## Performance Tests

- [ ] Response time < 200ms for most endpoints
- [ ] No memory leaks
- [ ] Database connections properly managed
- [ ] Proper error handling doesn't crash server

## Integration Tests

- [ ] Create user → Login → Get profile flow
- [ ] Login → Create multiple users flow
- [ ] Create user → Update user → Delete user flow
- [ ] Login → Logout (token expiry) flow

## Database Tests

- [ ] Users are saved correctly
- [ ] Passwords are hashed
- [ ] Timestamps are recorded
- [ ] Indexes are working (unique email)
- [ ] Soft delete works (isActive flag)

## Logging Tests

- [ ] Requests are logged
- [ ] Errors are logged with stack traces
- [ ] Logs are written to files
- [ ] Log rotation works

## Documentation Tests

- [ ] All endpoints documented
- [ ] Request examples are correct
- [ ] Response examples are correct
- [ ] Error responses documented

## Test Results Summary

**Total Tests:** ___ / 100+
**Passed:** ___
**Failed:** ___
**Date:** ___________

## Notes

Add any observations or issues found during testing:

---

## Next Module Testing

Once Inventory module is implemented:
- [ ] Add inventory CRUD tests
- [ ] Add stock validation tests
- [ ] Add permission-based access tests
- [ ] Add integration tests with user management

---

**Legend:**
- ✅ = Test case
- 🟢 = Passed
- 🔴 = Failed
- 🟡 = Needs attention

