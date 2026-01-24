# Health Interoperability Gateway

A secure, FHIR R4-compliant healthcare data integration platform designed for transforming proprietary healthcare data formats into the HL7 FHIR R4 standard while ensuring data security, LGPD compliance, and comprehensive audit trails.

## Features

### Core Integration Capabilities

- **Smart Data Mapping:** Configurable transformation rules to map proprietary formats to FHIR R4
- **Real-time Processing:** Instant message processing with validation feedback
- **FHIR R4 Validation:** Automatic validation against FHIR R4 standards with detailed error reporting
- **Multi-format Support:** Support for Patient, Observation, Medication, and Condition resources

### Security & Compliance

- **AES-256 Encryption:** Data encrypted at rest and in transit
- **OAuth2 Authentication:** Short-lived tokens for user authentication
- **API Key Management:** Secure API keys for system-to-system integration
- **LGPD Compliance:** Comprehensive audit logging for data protection regulations
- **Access Tracking:** Complete audit trail of who accessed what and when

### Administrative Dashboard

- **Real-time Statistics:** Monitor message volume, processing times, and success rates
- **Alert Management:** View and manage validation errors and system alerts
- **Audit Logs:** Complete LGPD-compliant audit trail
- **Performance Monitoring:** Track integration performance over time

## Architecture

### Technology Stack

| Component | Technology |
|-----------|-----------|
| Backend API | Express.js + tRPC |
| Frontend | React 19 + Tailwind CSS 4 |
| Database | MySQL 8.0+ |
| Authentication | OAuth2 + JWT |
| Encryption | AES-256-GCM |
| Validation | Zod + Custom FHIR Validator |

### Data Flow

```
Healthcare System
       ↓
   API Request
       ↓
API Key Validation
       ↓
Data Mapping Engine
       ↓
FHIR Validation
       ↓
Encryption & Storage
       ↓
Audit Logging
       ↓
Response to Client
```

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- pnpm or npm

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/health-interop-gateway.git
cd health-interop-gateway

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env

# Configure database
pnpm db:push

# Start development server
pnpm dev
```

Access the application at `http://localhost:3000`

## API Usage

### Submit Healthcare Data

```bash
curl -X POST http://localhost:3000/api/trpc/integration.receiveMessage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "mappingId": 1,
    "sourceData": {
      "id": "patient-123",
      "firstName": "João",
      "lastName": "Silva",
      "dateOfBirth": "1990-05-15",
      "gender": "M"
    }
  }'
```

### Check Message Status

```bash
curl http://localhost:3000/api/trpc/integration.getMessageStatus \
  ?apiKey=your-api-key \
  &messageId=msg_abc123def456
```

## Project Structure

```
health-interop-gateway/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   └── lib/              # Client utilities
│   └── public/               # Static assets
├── server/                    # Express backend
│   ├── encryption.ts         # AES-256 encryption
│   ├── audit.ts              # LGPD audit logging
│   ├── mapping-engine.ts     # Data transformation
│   ├── fhir-validator.ts     # FHIR validation
│   ├── db.ts                 # Database queries
│   ├── routers.ts            # tRPC routes
│   └── _core/                # Framework code
├── drizzle/                   # Database schema
│   └── schema.ts             # Table definitions
├── API_DOCUMENTATION.md      # API reference
├── IMPLEMENTATION_GUIDE.md   # Setup & deployment
└── todo.md                   # Project tracking
```

## Key Modules

### Encryption Module (`server/encryption.ts`)

Provides AES-256-GCM encryption for data at rest:

```typescript
import { encryptData, decryptData } from './encryption';

const encrypted = encryptData(JSON.stringify(data), encryptionKey);
const decrypted = decryptData(encrypted, encryptionKey);
```

### Mapping Engine (`server/mapping-engine.ts`)

Transforms proprietary data to FHIR format:

```typescript
import { mapData, createPatientMappingConfig } from './mapping-engine';

const config = createPatientMappingConfig();
const { data, errors } = mapData(sourceData, config);
```

### FHIR Validator (`server/fhir-validator.ts`)

Validates FHIR R4 compliance:

```typescript
import { validatePatient } from './fhir-validator';

const result = validatePatient(fhirData);
if (!result.isValid) {
  console.log('Validation errors:', result.errors);
}
```

### Audit Logging (`server/audit.ts`)

LGPD-compliant audit trail:

```typescript
import { logAuditAction } from './audit';

await logAuditAction(
  req,
  userId,
  clientId,
  'message_processed',
  'integration_message',
  messageId
);
```

## Database Schema

### Main Tables

- **users:** User accounts and authentication
- **clients:** Healthcare organizations
- **dataMappings:** Field transformation rules
- **integrationMessages:** Processed healthcare messages
- **auditLogs:** LGPD-compliant audit trail
- **alerts:** Validation and processing errors
- **integrationStats:** Daily aggregated statistics

## Testing

Run the test suite:

```bash
pnpm test
```

Test coverage includes:
- Data mapping transformations
- FHIR R4 validation
- Encryption/decryption
- Authentication flows

## Deployment

### Docker

```bash
docker build -t health-gateway:latest .
docker run -p 3000:3000 health-gateway:latest
```

### Kubernetes

See `IMPLEMENTATION_GUIDE.md` for Kubernetes deployment configuration.

### Production Checklist

- [ ] SSL/TLS certificates configured
- [ ] Database backups scheduled
- [ ] Monitoring and alerting set up
- [ ] Rate limiting configured
- [ ] Encryption keys securely stored
- [ ] Audit logging enabled
- [ ] Load balancer configured

## Security Considerations

1. **API Keys:** Store securely in environment variables
2. **Encryption Keys:** Rotate regularly and store in secure vault
3. **Database:** Use strong passwords and enable SSL
4. **CORS:** Configure for specific trusted domains
5. **Rate Limiting:** Implement to prevent abuse
6. **Audit Logs:** Retain for compliance requirements

## Compliance

- **LGPD:** Comprehensive audit logging and data protection
- **FHIR R4:** Full compliance with HL7 FHIR R4 standard
- **HIPAA:** Encryption and access controls
- **Healthcare Standards:** Built for healthcare data integration

## Support & Documentation

- **API Documentation:** See `API_DOCUMENTATION.md`
- **Implementation Guide:** See `IMPLEMENTATION_GUIDE.md`
- **Code Examples:** See integration examples in `IMPLEMENTATION_GUIDE.md`

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## License

Proprietary - All rights reserved

## Contact

For questions or support, contact the development team.

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** Production Ready
