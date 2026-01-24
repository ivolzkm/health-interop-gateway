# Health Interoperability Gateway - Implementation Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Security Configuration](#security-configuration)
5. [Client Onboarding](#client-onboarding)
6. [Integration Examples](#integration-examples)
7. [Deployment](#deployment)
8. [Monitoring & Maintenance](#monitoring--maintenance)

## Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- MySQL 8.0+ or compatible database
- Docker (optional, for containerized deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/health-interop-gateway.git
cd health-interop-gateway
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure database:
```bash
pnpm db:push
```

5. Start development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Environment Setup

### Required Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=mysql://user:password@localhost:3306/health_gateway

# Encryption
DATA_ENCRYPTION_KEY=your-32-character-minimum-encryption-key

# OAuth2
OAUTH_SERVER_URL=https://oauth.example.com
VITE_OAUTH_PORTAL_URL=https://oauth.example.com/login
VITE_APP_ID=your-app-id

# JWT
JWT_SECRET=your-jwt-secret-key

# Owner Information
OWNER_NAME=Your Organization Name
OWNER_OPEN_ID=your-owner-id

# Manus APIs (if using Manus platform)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key

# Application
VITE_APP_TITLE=Health Interoperability Gateway
VITE_APP_LOGO=/logo.png
```

### Security Best Practices

1. **Encryption Key:** Generate a strong encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **JWT Secret:** Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. **API Keys:** Generate API keys for each client:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Configuration

### Schema Overview

The gateway uses the following main tables:

| Table | Purpose |
|-------|---------|
| `users` | User accounts and authentication |
| `clients` | Healthcare organizations |
| `dataMappings` | Field transformation rules |
| `integrationMessages` | Processed healthcare messages |
| `auditLogs` | LGPD-compliant audit trail |
| `alerts` | Validation and processing errors |
| `integrationStats` | Daily aggregated statistics |

### Initial Setup

1. Create database:
```bash
mysql -u root -p -e "CREATE DATABASE health_gateway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

2. Run migrations:
```bash
pnpm db:push
```

3. Create initial admin user (via database):
```sql
INSERT INTO users (openId, name, email, role, loginMethod) 
VALUES ('admin-001', 'Admin User', 'admin@example.com', 'admin', 'oauth');
```

### Backup Strategy

Implement regular database backups:

```bash
# Daily backup
0 2 * * * mysqldump -u user -p password health_gateway > /backups/health_gateway_$(date +\%Y\%m\%d).sql

# Weekly compressed backup
0 3 * * 0 mysqldump -u user -p password health_gateway | gzip > /backups/health_gateway_$(date +\%Y\%m\%d).sql.gz
```

## Security Configuration

### SSL/TLS Setup

1. Obtain SSL certificate (Let's Encrypt recommended):
```bash
certbot certonly --standalone -d your-domain.com
```

2. Configure in your web server (Nginx example):
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

### CORS Configuration

Configure CORS for your healthcare system integrations:

```javascript
// In server/_core/index.ts
app.use(cors({
  origin: ['https://clinic-system.example.com', 'https://lab-system.example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/trpc/integration', apiLimiter);
```

## Client Onboarding

### Step 1: Create Client Organization

```sql
INSERT INTO clients (name, description, apiKey, isActive) 
VALUES ('Clinic XYZ', 'Healthcare clinic in São Paulo', 'api_key_here', true);
```

### Step 2: Create Data Mappings

Define how the client's data format maps to FHIR:

```sql
INSERT INTO dataMappings (
  clientId, 
  name, 
  sourceFormat, 
  targetFormat, 
  mappingRules, 
  createdBy
) VALUES (
  1,
  'Patient Mapping v1',
  'proprietary_clinic_v1',
  'fhir_r4_patient',
  '[{"source":"id","target":"id","type":"string","required":true}...]',
  1
);
```

### Step 3: Test Integration

```bash
curl -X POST http://localhost:3000/api/trpc/integration.receiveMessage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "api_key_here",
    "mappingId": 1,
    "sourceData": {
      "id": "patient-123",
      "firstName": "João",
      "lastName": "Silva"
    }
  }'
```

### Step 4: Monitor & Adjust

Use the dashboard to monitor:
- Message processing success rate
- Average processing time
- Validation errors
- System alerts

## Integration Examples

### Example 1: Lab System Integration

A laboratory system needs to send lab results to multiple clinics:

```python
import requests
from datetime import datetime

class LabSystemIntegration:
    def __init__(self, api_key, gateway_url):
        self.api_key = api_key
        self.gateway_url = gateway_url
    
    def send_lab_result(self, lab_result):
        payload = {
            "apiKey": self.api_key,
            "mappingId": 2,  # Lab result mapping
            "sourceData": {
                "id": lab_result['result_id'],
                "patientId": lab_result['patient_id'],
                "testName": lab_result['test_name'],
                "result": lab_result['value'],
                "unit": lab_result['unit'],
                "resultDate": datetime.now().isoformat(),
                "status": "final"
            }
        }
        
        response = requests.post(
            f"{self.gateway_url}/api/trpc/integration.receiveMessage",
            json=payload
        )
        
        return response.json()
    
    def check_status(self, message_id):
        response = requests.get(
            f"{self.gateway_url}/api/trpc/integration.getMessageStatus",
            params={
                "apiKey": self.api_key,
                "messageId": message_id
            }
        )
        return response.json()

# Usage
lab = LabSystemIntegration(
    api_key="your-lab-api-key",
    gateway_url="https://gateway.example.com"
)

result = lab.send_lab_result({
    "result_id": "LAB-2026-001",
    "patient_id": "patient-123",
    "test_name": "Hemoglobin",
    "value": 14.5,
    "unit": "g/dL"
})

print(f"Message ID: {result['messageId']}")
```

### Example 2: Clinic System Integration

A clinic system needs to send patient demographics:

```javascript
class ClinicSystemIntegration {
  constructor(apiKey, gatewayUrl) {
    this.apiKey = apiKey;
    this.gatewayUrl = gatewayUrl;
  }

  async sendPatientData(patient) {
    const payload = {
      apiKey: this.apiKey,
      mappingId: 1,  // Patient mapping
      sourceData: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        dateOfBirth: patient.dob,
        gender: patient.gender,
        email: patient.email,
        phone: patient.phone,
        cpf: patient.cpf
      }
    };

    try {
      const response = await fetch(
        `${this.gatewayUrl}/api/trpc/integration.receiveMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();
      
      if (result.status === 'success') {
        console.log(`Patient data sent successfully: ${result.messageId}`);
      } else {
        console.error('Validation errors:', result.errors);
      }
      
      return result;
    } catch (error) {
      console.error('Integration error:', error);
      throw error;
    }
  }
}

// Usage
const clinic = new ClinicSystemIntegration(
  'your-clinic-api-key',
  'https://gateway.example.com'
);

clinic.sendPatientData({
  id: 'patient-123',
  first_name: 'João',
  last_name: 'Silva',
  dob: '1990-05-15',
  gender: 'M',
  email: 'joao@example.com',
  phone: '11999999999',
  cpf: '12345678901'
});
```

## Deployment

### Docker Deployment

1. Build Docker image:
```bash
docker build -t health-gateway:latest .
```

2. Run container:
```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://user:password@db:3306/health_gateway" \
  -e DATA_ENCRYPTION_KEY="your-encryption-key" \
  --name health-gateway \
  health-gateway:latest
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: health-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: health-gateway
  template:
    metadata:
      labels:
        app: health-gateway
    spec:
      containers:
      - name: health-gateway
        image: health-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: gateway-secrets
              key: database-url
        - name: DATA_ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: gateway-secrets
              key: encryption-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Production Checklist

- [ ] SSL/TLS certificates configured
- [ ] Database backups scheduled
- [ ] Monitoring and alerting set up
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Encryption keys securely stored
- [ ] Audit logging enabled
- [ ] Load balancer configured
- [ ] Health check endpoints working
- [ ] Documentation updated

## Monitoring & Maintenance

### Health Checks

Implement health check endpoint:

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Logging

Configure structured logging:

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Metrics to Monitor

- Message processing success rate
- Average processing time
- Database query performance
- API response times
- Error rates by type
- Active connections
- Memory and CPU usage

### Regular Maintenance Tasks

**Daily:**
- Check error logs
- Monitor alert queue
- Verify database backups

**Weekly:**
- Review performance metrics
- Check for security updates
- Validate audit logs

**Monthly:**
- Performance optimization review
- Security audit
- Capacity planning analysis

---

For additional support, refer to the API Documentation or contact the support team.
