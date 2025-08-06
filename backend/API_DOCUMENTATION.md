# Client Management System API Documentation

## Overview

The new client management system supports multiple roles for clients, referral tracking, and commission management. A single client can take on multiple roles (buyer, seller, referrer) and can be involved in referral chains.

## Models

### 1. Client Model
Core client information with enhanced categorization.

**Fields:**
- `name` (String, required): Client's full name
- `email` (String, required, unique): Email address
- `phone` (String, required): Phone number
- `address` (String): Physical address
- `type` (String, enum): 'individual', 'broker', 'agency'
- `status` (String, enum): 'active', 'inactive', 'banned'
- `location` (String): City/location (e.g., Indore, Ujjain)
- `leadSource` (String, enum): 'website', 'walk-in', 'instagram', 'facebook', 'referral', 'google', 'other'
- `tags` (Array): Categorization tags
- `notes` (String): Additional notes
- `preferences` (Object): Property search preferences
- `assignedTo` (ObjectId): Assigned user/agent
- `createdAt`, `updatedAt` (Date): Timestamps

### 2. ClientRole Model
Links clients to properties with specific roles and commission details.

**Fields:**
- `clientId` (ObjectId, required): Reference to Client
- `role` (String, enum, required): 'buyer', 'seller', 'referrer'
- `propertyId` (ObjectId, optional): Reference to Property
- `status` (String, enum): 'active', 'inactive', 'completed', 'cancelled'
- `commission` (Object): Commission details
  - `type`: 'fixed' or 'percentage'
  - `value`: Commission amount/percentage
  - `currency`: Currency (default: 'INR')
- `relationshipNote` (String): Notes about the relationship
- `notes` (String): Additional notes
- `assignedTo` (ObjectId): Assigned user/agent
- `createdAt`, `updatedAt` (Date): Timestamps

### 3. Referral Model
Tracks referrals and commission payments with support for referral chains.

**Fields:**
- `referredByClientId` (ObjectId, required): The referrer
- `referredType` (String, enum, required): 'client' or 'property'
- `referredClientId` (ObjectId, optional): Referred client
- `referredPropertyId` (ObjectId, optional): Referred property
- `dealId` (ObjectId, optional): Deal when referral converts
- `commission` (Object, required): Commission details
  - `type`: 'fixed' or 'percentage'
  - `value`: Commission amount/percentage
  - `currency`: Currency (default: 'INR')
  - `promised`: Promised commission amount
  - `paid`: Paid commission amount
- `commissionStatus` (String, enum): 'pending', 'partial', 'paid', 'cancelled'
- `status` (String, enum): 'active', 'converted', 'expired', 'cancelled'
- `parentReferralId` (ObjectId, optional): Parent referral for chains
- `chainLevel` (Number): Level in referral chain (1 = direct)
- `notes` (String): Additional notes
- `assignedTo` (ObjectId): Assigned user/agent
- `convertedAt`, `paidAt` (Date): Timestamps for status changes

## API Endpoints

### Clients

#### GET /api/clients
Get all clients with filtering and pagination.

**Query Parameters:**
- `page` (Number): Page number (default: 1)
- `limit` (Number): Items per page (default: 10)
- `type` (String): Filter by client type
- `status` (String): Filter by status
- `search` (String): Search in name, email, phone
- `assignedTo` (String): Filter by assigned user
- `sortBy` (String): Sort field (default: 'createdAt')
- `sortOrder` (String): 'asc' or 'desc' (default: 'desc')

**Response:**
```json
{
  "clients": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalClients": 50,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### POST /api/clients
Create a new client.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "type": "individual",
  "status": "active",
  "location": "Indore",
  "leadSource": "website",
  "tags": ["premium", "investor"],
  "notes": "Interested in residential properties",
  "preferences": {
    "propertyTypes": ["Apartment", "House"],
    "cities": ["Indore", "Ujjain"],
    "budget": { "min": 500000, "max": 2000000 }
  }
}
```

#### GET /api/clients/:id
Get a specific client by ID.

#### PUT /api/clients/:id
Update a client.

#### DELETE /api/clients/:id
Delete a client.

#### GET /api/clients/stats/overview
Get client statistics.

### Client Roles

#### GET /api/client-roles
Get all client roles with filtering and pagination.

**Query Parameters:**
- `role` (String): Filter by role type
- `status` (String): Filter by status
- `clientId` (String): Filter by client
- `propertyId` (String): Filter by property
- `assignedTo` (String): Filter by assigned user
- `search` (String): Search in client name, email, phone

#### POST /api/client-roles
Create a new client role.

**Request Body:**
```json
{
  "clientId": "client_id_here",
  "role": "buyer",
  "propertyId": "property_id_here",
  "status": "active",
  "commission": {
    "type": "fixed",
    "value": 20000,
    "currency": "INR"
  },
  "notes": "Interested in 3BHK apartment"
}
```

#### GET /api/client-roles/client/:clientId
Get all roles for a specific client.

#### GET /api/client-roles/property/:propertyId
Get all roles for a specific property.

### Referrals

#### GET /api/referrals
Get all referrals with filtering and pagination.

**Query Parameters:**
- `status` (String): Filter by referral status
- `commissionStatus` (String): Filter by commission status
- `referredByClientId` (String): Filter by referrer
- `referredType` (String): Filter by referred type
- `assignedTo` (String): Filter by assigned user
- `search` (String): Search in referrer details

#### POST /api/referrals
Create a new referral.

**Request Body:**
```json
{
  "referredByClientId": "referrer_client_id",
  "referredType": "client",
  "referredClientId": "referred_client_id",
  "commission": {
    "type": "percentage",
    "value": 1.5,
    "promised": 15000
  },
  "notes": "Referred through professional network"
}
```

#### PUT /api/referrals/:id
Update a referral (e.g., mark as converted, update commission status).

**Request Body:**
```json
{
  "status": "converted",
  "commissionStatus": "partial",
  "commission": {
    "paid": 7500
  }
}
```

#### GET /api/referrals/client/:clientId
Get all referrals by a specific client.

#### GET /api/referrals/stats/overview
Get referral statistics.

## Usage Examples

### 1. Creating a Client with Multiple Roles

```javascript
// 1. Create the client
const client = await fetch('/api/clients', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    name: "Rahul Sharma",
    email: "rahul@example.com",
    phone: "9876543210",
    type: "individual",
    location: "Indore",
    leadSource: "referral"
  })
});

// 2. Add buyer role
const buyerRole = await fetch('/api/client-roles', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    clientId: client.id,
    role: "buyer",
    propertyId: "property_id",
    status: "active"
  })
});

// 3. Add referrer role
const referrerRole = await fetch('/api/client-roles', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    clientId: client.id,
    role: "referrer",
    commission: {
      type: "fixed",
      value: 25000
    },
    relationshipNote: "Broker partner"
  })
});
```

### 2. Creating a Referral Chain

```javascript
// 1. Primary referral
const primaryReferral = await fetch('/api/referrals', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    referredByClientId: "broker1_id",
    referredType: "client",
    referredClientId: "buyer_id",
    commission: {
      type: "percentage",
      value: 2.0,
      promised: 20000
    }
  })
});

// 2. Secondary referral (chain)
const secondaryReferral = await fetch('/api/referrals', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    referredByClientId: "broker2_id",
    referredType: "client",
    referredClientId: "buyer_id",
    parentReferralId: primaryReferral.id,
    commission: {
      type: "percentage",
      value: 1.0,
      promised: 10000
    }
  })
});
```

### 3. Tracking Commission Payments

```javascript
// Update referral when commission is paid
await fetch(`/api/referrals/${referralId}`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    commissionStatus: "paid",
    commission: {
      paid: 20000
    }
  })
});
```

## Key Features

1. **Multiple Roles**: A single client can be a buyer, seller, and referrer simultaneously
2. **Property Association**: Roles can be linked to specific properties
3. **Commission Tracking**: Detailed commission management with payment status
4. **Referral Chains**: Support for multi-level referral tracking
5. **Flexible Categorization**: Tags, locations, and lead sources for better organization
6. **Comprehensive Statistics**: Detailed analytics for clients, roles, and referrals

## Database Indexes

The system includes optimized indexes for:
- Client email uniqueness
- Role-based queries
- Referral status tracking
- Commission status filtering
- Search functionality
- Geographic filtering

## Error Handling

All endpoints include comprehensive error handling for:
- Validation errors
- Duplicate entries
- Missing references
- Invalid data types
- Authorization failures 