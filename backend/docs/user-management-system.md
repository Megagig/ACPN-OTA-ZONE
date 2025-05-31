# User Management System Documentation

## Overview

The User Management System for ACPN Ota Zone is a comprehensive solution for managing users, roles, and permissions within the application. It provides role-based access control with both predefined and custom roles, a granular permission system, user profile management, user status management, bulk user operations, and audit trail tracking.

## Components

### Models

1. **Permission Model (`permission.model.ts`)**
   - Defines resource types (USER, PHARMACY, FINANCIAL_RECORD, etc.)
   - Defines action types (CREATE, READ, UPDATE, DELETE, APPROVE, etc.)
   - Stores permission name, description, resource, and action

2. **Role Model (`role.model.ts`)**
   - Supports both predefined and custom roles
   - Links to permissions using a many-to-many relationship
   - Stores role name, description, and default status

3. **Audit Trail Model (`auditTrail.model.ts`)**
   - Tracks all user actions in the system
   - Stores user ID, action type, resource type, timestamp, and details

### Controllers

1. **Permission Controller (`permission.controller.ts`)**
   - CRUD operations for permissions
   - Initialize default permissions for all resource-action combinations

2. **Role Controller (`role.controller.ts`)**
   - CRUD operations for roles
   - Initialize default roles (SUPERADMIN, ADMIN, etc.)
   - Manage permissions within roles
   - Get users with a specific role

3. **User Management Controller (`userManagement.controller.ts`)**
   - User profile management
   - Profile picture upload
   - User status management (active, inactive, suspended, pending, rejected)
   - Bulk user operations
   - User permission and role management
   - User audit trail

### Routes

1. **Permission Routes (`permission.routes.ts`)**
   - GET /api/permissions - Get all permissions
   - GET /api/permissions/:id - Get permission by ID
   - POST /api/permissions - Create permission
   - PUT /api/permissions/:id - Update permission
   - DELETE /api/permissions/:id - Delete permission
   - POST /api/permissions/initialize/default - Initialize default permissions

2. **Role Routes (`role.routes.ts`)**
   - GET /api/roles - Get all roles
   - GET /api/roles/:id - Get role by ID
   - POST /api/roles - Create role
   - PUT /api/roles/:id - Update role
   - DELETE /api/roles/:id - Delete role
   - POST /api/roles/initialize/default - Initialize default roles
   - POST /api/roles/:id/permissions/:permissionId - Add permission to role
   - DELETE /api/roles/:id/permissions/:permissionId - Remove permission from role
   - GET /api/roles/:id/users - Get users with role

3. **User Management Routes (`userManagement.routes.ts`)**
   - GET /api/user-management/profile - Get user profile
   - PUT /api/user-management/profile - Update user profile
   - PUT /api/user-management/profile/picture - Upload profile picture
   - GET /api/user-management/permissions - Get user permissions
   - GET /api/user-management/status/:status - Get users by status
   - PUT /api/user-management/:id/status - Update user status
   - PUT /api/user-management/bulk/status - Bulk update user status
   - PUT /api/user-management/:id/role - Assign user role
   - PUT /api/user-management/bulk/role - Bulk assign user role
   - GET /api/user-management/:id/audit-trail - Get user audit trail
   - GET /api/user-management/check-permission/:resource/:action - Check permission
   - POST /api/user-management/filter - Get filtered users

### Middleware

1. **Permission Middleware (`permission.middleware.ts`)**
   - `checkPermission` - Check if user has permission to perform action on resource
   - `checkAnyPermission` - Check if user has any of the specified permissions
   - `checkAllPermissions` - Check if user has all of the specified permissions

## Predefined Roles

1. **SuperAdmin**
   - Has full access to all system features
   - Cannot be deleted or modified

2. **Admin**
   - Has access to most system features
   - Cannot modify SuperAdmin accounts

3. **Secretary**
   - Can view user information
   - Can generate reports
   - Limited administrative capabilities

4. **Treasurer**
   - Can manage financial records
   - Can process payments and dues

5. **Member**
   - Basic access to user features
   - Can update own profile
   - Can view public content

## Permission Structure

Permissions are structured as combinations of resources and actions:

### Resources
- USER
- PHARMACY
- FINANCIAL_RECORD
- EVENT
- DOCUMENT
- COMMUNICATION
- ELECTION
- POLL
- DONATION
- DUE
- ROLE
- PERMISSION
- AUDIT_TRAIL

### Actions
- CREATE
- READ
- UPDATE
- DELETE
- APPROVE
- REJECT
- ASSIGN
- MANAGE
- EXPORT
- IMPORT

## User Status Types

- ACTIVE - Full access to account features
- INACTIVE - Account exists but cannot be used
- SUSPENDED - Temporary restriction of account access
- PENDING - Awaiting approval
- REJECTED - Registration has been denied

## Audit Trail

The system keeps a comprehensive audit trail of all user actions, including:
- User creation and updates
- Status changes
- Role assignments
- Permission changes
- Login/logout events
- Bulk operations

## Usage Examples

### Initializing the System

1. Create default permissions:
   ```
   POST /api/permissions/initialize/default
   ```

2. Create default roles:
   ```
   POST /api/roles/initialize/default
   ```

### Managing Users

1. Get all active users:
   ```
   GET /api/user-management/status/active
   ```

2. Update user status:
   ```
   PUT /api/user-management/:id/status
   {
     "status": "ACTIVE"
   }
   ```

3. Bulk update user status:
   ```
   PUT /api/user-management/bulk/status
   {
     "userIds": ["id1", "id2", "id3"],
     "status": "ACTIVE"
   }
   ```

### Managing Roles and Permissions

1. Create a custom role:
   ```
   POST /api/roles
   {
     "name": "Content Manager",
     "description": "Manages website content",
     "permissions": ["permissionId1", "permissionId2"]
   }
   ```

2. Add permission to role:
   ```
   POST /api/roles/:roleId/permissions/:permissionId
   ```

## Implementation Guide

1. **Backend Setup**
   - Models, controllers, and routes are implemented
   - Middleware for permission checking is in place

2. **Frontend Implementation (Pending)**
   - User list page with filtering and search
   - User profile page
   - Role management page
   - Permission management page
   - Bulk user operations interface

## Next Steps

1. Implement frontend components for the user management interface
2. Integrate the user management with existing application parts
3. Add thorough testing for all user management features
4. Create user documentation for administrators
