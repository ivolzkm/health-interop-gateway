# Health Interoperability Gateway - API Documentation

## Overview

The Health Interoperability Gateway is a secure, FHIR R4-compliant healthcare data integration platform. It transforms proprietary healthcare data formats into the HL7 FHIR R4 standard while ensuring data security, LGPD compliance, and comprehensive audit trails.

## Base URL

```
https://your-domain.com/api/trpc
```

## Authentication

The gateway uses two authentication methods:

**API Key Authentication** (for message submission)
- Include your API key in the request headers or as a query parameter
- API keys are issued per healthcare organization (client)

**OAuth2 Authentication** (for dashboard access)
- Required for administrative dashboard access
- Tokens have a short expiration time for security
- Refresh tokens are provided for long-lived sessions

## Core Endpoints

### 1. Submit Healthcare Data Message

**Endpoint:** `POST /integration.receiveMessage`

**Description:** Submit healthcare data for transformation to FHIR R4 format and validation.

**Authentication:** API Key required

**Request Body:**
```json
{
  "apiKey": "your-api-key",
  "mappingId": 1,
  "sourceData": {
    "id": "patient-123",
    "firstName": "João",
    "lastName": "Silva",
    "dateOfBirth": "1990-05-15",
    "gender": "M",
    "email": "joao@example.com",
    "phone": "11999999999",
    "cpf": "12345678901"
  }
}
```

**Response (Success):**
```json
{
  "messageId": "msg_abc123def456",
  "status": "success",
  "errors": [],
  "processingTime": 145
}
```

**Response (Validation Errors):**
```json
{
  "messageId": "msg_abc123def456",
  "status": "validation_failed",
  "errors": [
    "Required field missing: firstName",
    "Invalid gender code: X"
  ],
  "processingTime": 89
}
```

**Status Codes:**
- `200` - Message received and processed successfully
- `400` - Invalid request format
- `401` - Invalid or missing API key
- `500` - Server error

### 2. Get Message Status

**Endpoint:** `GET /integration.getMessageStatus`

**Description:** Retrieve the processing status and results of a submitted message.

**Authentication:** API Key required

**Query Parameters:**
```
apiKey=your-api-key
messageId=msg_abc123def456
```

**Response:**
```json
{
  "messageId": "msg_abc123def456",
  "status": "transformed",
  "createdAt": "2026-01-24T13:45:30.000Z",
  "processedAt": "2026-01-24T13:45:30.145Z",
  "errors": []
}
```

**Status Values:**
- `received` - Message received, waiting for processing
- `processing` - Currently being transformed
- `validated` - Transformation complete, validation in progress
- `transformed` - Successfully transformed to FHIR R4
- `failed` - Transformation or validation failed

## Dashboard Endpoints

All dashboard endpoints require OAuth2 authentication with admin role.

### 3. Get Integration Statistics

**Endpoint:** `GET /dashboard.getStats`

**Description:** Retrieve aggregated statistics for a specific client over a time period.

**Query Parameters:**
```
clientId=1
days=30
```

**Response:**
```json
[
  {
    "id": 1,
    "clientId": 1,
    "date": "2026-01-24",
    "messagesReceived": 150,
    "messagesProcessed": 148,
    "messagesFailed": 2,
    "averageProcessingTime": 125,
    "createdAt": "2026-01-24T00:00:00.000Z",
    "updatedAt": "2026-01-24T23:59:59.000Z"
  }
]
```

### 4. Get Recent Messages

**Endpoint:** `GET /dashboard.getRecentMessages`

**Description:** Retrieve recent integration messages for a specific client.

**Query Parameters:**
```
clientId=1
limit=50
offset=0
```

**Response:**
```json
[
  {
    "id": 1,
    "clientId": 1,
    "mappingId": 1,
    "messageId": "msg_abc123def456",
    "status": "transformed",
    "validationErrors": null,
    "processedAt": "2026-01-24T13:45:30.145Z",
    "createdAt": "2026-01-24T13:45:30.000Z",
    "updatedAt": "2026-01-24T13:45:30.145Z"
  }
]
```

### 5. Get Active Alerts

**Endpoint:** `GET /dashboard.getAlerts`

**Description:** Retrieve unresolved alerts for a specific client.

**Query Parameters:**
```
clientId=1
```

**Response:**
```json
[
  {
    "id": 1,
    "clientId": 1,
    "messageId": "msg_abc123def456",
    "alertType": "validation_error",
    "severity": "high",
    "title": "Data validation error",
    "description": "Message had 2 validation issues",
    "details": "[\"firstName: Required field missing\", \"gender: Invalid code\"]",
    "isResolved": false,
    "createdAt": "2026-01-24T13:45:30.000Z",
    "updatedAt": "2026-01-24T13:45:30.000Z"
  }
]
```

### 6. Get Audit Logs

**Endpoint:** `GET /dashboard.getAuditLogs`

**Description:** Retrieve audit logs for a specific client (LGPD compliance).

**Query Parameters:**
```
clientId=1
limit=100
offset=0
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "clientId": 1,
    "action": "message_processed",
    "resourceType": "integration_message",
    "resourceId": "msg_abc123def456",
    "description": "Message processing: success",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "changes": null,
    "createdAt": "2026-01-24T13:45:30.000Z"
  }
]
```

## Data Mapping Configuration

### Supported Source Formats

The gateway supports transformation from various proprietary healthcare data formats. Each format requires a mapping configuration that defines how fields should be transformed to FHIR R4.

**Example: Patient Data Mapping**

```json
{
  "sourceFormat": "proprietary_patient",
  "targetFormat": "fhir_r4_patient",
  "rules": [
    {
      "source": "id",
      "target": "id",
      "type": "string",
      "required": true
    },
    {
      "source": "firstName",
      "target": "name.0.given.0",
      "type": "string"
    },
    {
      "source": "lastName",
      "target": "name.0.family",
      "type": "string"
    },
    {
      "source": "dateOfBirth",
      "target": "birthDate",
      "type": "date"
    },
    {
      "source": "gender",
      "target": "gender",
      "type": "code",
      "transform": "gender_code_mapping"
    }
  ]
}
```

### Supported FHIR Resources

- **Patient** - Demographics and patient information
- **Observation** - Lab results, vital signs, and clinical observations
- **Medication** - Medication information
- **Condition** - Diagnoses and clinical conditions

## Error Handling

### Common Error Responses

**Invalid API Key:**
```json
{
  "error": "Invalid API key",
  "code": "INVALID_API_KEY"
}
```

**Missing Required Fields:**
```json
{
  "error": "Validation failed",
  "errors": [
    "Required field missing: id",
    "Required field missing: firstName"
  ]
}
```

**FHIR Validation Error:**
```json
{
  "error": "FHIR validation failed",
  "errors": [
    "gender: Gender must be one of: male, female, other, unknown",
    "birthDate: Birth date must be in YYYY-MM-DD format"
  ]
}
```

## Security Features

### Encryption

- **At Rest:** AES-256-GCM encryption for stored data
- **In Transit:** TLS 1.2+ for all communications
- **Key Management:** Secure key derivation using PBKDF2

### Authentication & Authorization

- **API Keys:** Long-lived keys for system-to-system integration
- **OAuth2:** Short-lived tokens for user authentication
- **Role-Based Access Control:** Admin and user roles

### Audit & Compliance

- **Comprehensive Audit Logs:** All access and modifications are logged
- **LGPD Compliance:** Data protection and access tracking
- **IP Tracking:** Request source IP is recorded for security analysis
- **User Agent Logging:** Client information is captured for debugging

## Rate Limiting

The gateway implements rate limiting to ensure fair usage:

- **API Key Requests:** 1000 requests per hour
- **Dashboard Requests:** 100 requests per minute
- **Message Submission:** 10,000 messages per day per client

## Webhook Events

The gateway can send webhook notifications for important events:

- `message.received` - New message received
- `message.processed` - Message successfully processed
- `message.failed` - Message processing failed
- `alert.created` - New alert generated
- `alert.resolved` - Alert resolved

## Client Libraries

### Python Example

```python
import requests
import json

API_KEY = "your-api-key"
BASE_URL = "https://your-domain.com/api/trpc"

def submit_patient_data(patient_data):
    payload = {
        "apiKey": API_KEY,
        "mappingId": 1,
        "sourceData": patient_data
    }
    
    response = requests.post(
        f"{BASE_URL}/integration.receiveMessage",
        json=payload
    )
    
    return response.json()

def get_message_status(message_id):
    params = {
        "apiKey": API_KEY,
        "messageId": message_id
    }
    
    response = requests.get(
        f"{BASE_URL}/integration.getMessageStatus",
        params=params
    )
    
    return response.json()

# Usage
patient = {
    "id": "patient-123",
    "firstName": "João",
    "lastName": "Silva",
    "dateOfBirth": "1990-05-15",
    "gender": "M"
}

result = submit_patient_data(patient)
print(f"Message ID: {result['messageId']}")
print(f"Status: {result['status']}")
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const API_KEY = 'your-api-key';
const BASE_URL = 'https://your-domain.com/api/trpc';

async function submitPatientData(patientData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/integration.receiveMessage`,
      {
        apiKey: API_KEY,
        mappingId: 1,
        sourceData: patientData
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}

async function getMessageStatus(messageId) {
  try {
    const response = await axios.get(
      `${BASE_URL}/integration.getMessageStatus`,
      {
        params: {
          apiKey: API_KEY,
          messageId: messageId
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}

// Usage
const patient = {
  id: 'patient-123',
  firstName: 'João',
  lastName: 'Silva',
  dateOfBirth: '1990-05-15',
  gender: 'M'
};

submitPatientData(patient)
  .then(result => {
    console.log(`Message ID: ${result.messageId}`);
    console.log(`Status: ${result.status}`);
  });
```

## Support & Contact

For technical support, issues, or questions about the API:

- **Email:** support@example.com
- **Documentation:** https://docs.example.com
- **Status Page:** https://status.example.com
