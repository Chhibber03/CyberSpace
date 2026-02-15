# CyberSpace Backend

A comprehensive backend API for the CyberSpace URL Security Scanner that provides advanced phishing detection, threat intelligence, and security analysis.

## 🚀 Features

### URL Security Scanner
- **Heuristic Detection**: Raw IP addresses, Punycode domains, excessive hyphens, suspicious TLDs
- **Brand Impersonation**: Detects lookalike domains and brand name misuse
- **Phishing Patterns**: Identifies common phishing domain generation patterns
- **DNS Analysis**: Custom DNS servers, MX records, TXT records
- **Content Analysis**: Web scraping, suspicious keywords, SSL verification
- **Threat Intelligence**: Google Safe Browsing, VirusTotal, PhishTank, OpenPhish

### Email Breach Checker
- **Data Breach Detection**: Check if emails have been compromised in known breaches
- **Multiple API Sources**: HaveIBeenPwned, BreachDirectory, Email Reputation
- **Risk Scoring**: Intelligent risk assessment based on breach severity and recency
- **Batch Processing**: Check multiple emails simultaneously
- **Disposable Email Detection**: Identifies temporary email services
- **Pattern Analysis**: Detects suspicious email patterns and keywords

### Security Features
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Input Validation**: Joi-based request validation
- **Security Headers**: Helmet.js for security headers
- **CORS Protection**: Configurable cross-origin resource sharing
- **Structured Logging**: Winston-based logging with multiple transports

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Redis (optional, for caching)

### Setup
```bash
# Clone and navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env with your API keys
nano .env

# Create logs directory
mkdir logs

# Start development server
npm run dev
```

## 🔑 Required API Keys

### Essential Services
1. **Google Safe Browsing API**
   - Get free API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enables real-time malicious URL detection

2. **VirusTotal API**
   - Sign up at [VirusTotal](https://www.virustotal.com/gui/join-us)
   - Free tier: 4 requests/minute
   - Provides multi-vendor threat detection

3. **URLVoid API**
   - Sign up at [URLVoid](https://www.urlvoid.com/api/)
   - Domain reputation and risk scoring

4. **PhishTank API**
   - Free community-driven phishing database
   - No API key required for basic usage

### Optional Services
- **OpenAI API**: Advanced content analysis and classification
- **Google Cloud Vision**: Enhanced screenshot analysis

## 📡 API Endpoints

### URL Security Scanner
- `POST /api/v1/scan/url` - Comprehensive URL scan
- `POST /api/v1/scan/url/quick` - Quick URL scan
- `POST /api/v1/scan/url/batch` - Batch URL scanning
- `GET /api/v1/scan/check` - Chrome extension integration endpoint

### Email Breach Checker
- `POST /api/v1/breach/email` - Check single email for breaches
- `POST /api/v1/breach/email/batch` - Check multiple emails for breaches
- `GET /api/v1/breach/stats` - Get breach check statistics
- `GET /api/v1/breach/health` - Service health check

### Threat Intelligence
- `GET /api/v1/threat-intel/url/:url` - Get threat intelligence for URL
- `GET /api/v1/threat-intel/domain/:domain/reputation` - Get domain reputation
- `GET /api/v1/threat-intel/feed/recent` - Get recent threat feed
- `GET /api/v1/threat-intel/stats` - Get threat intelligence statistics

### System
- `GET /health` - Overall system health
- `GET /api/v1/scan/check` - Chrome extension check endpoint

## 🔍 Response Format

### URL Scan Response
```json
{
  "success": true,
  "data": {
    "scanId": "scan_1234567890_abc123",
    "url": "https://example.com",
    "riskScore": 85,
    "riskLevel": "high",
    "threats": [...],
    "warnings": [...],
    "safe": false
  }
}
```

### Email Breach Check Response
```json
{
  "success": true,
  "data": {
    "checkId": "breach_1234567890_abc123",
    "email": "user@example.com",
    "riskScore": 60,
    "riskLevel": "high",
    "totalBreaches": 3,
    "breaches": [
      {
        "source": "HaveIBeenPwned",
        "name": "Adobe",
        "domain": "adobe.com",
        "breachDate": "2013-10-04",
        "dataClasses": ["email", "password", "username"]
      }
    ],
    "warnings": [...],
    "safe": false
  }
}
```

## 📝 Usage Examples

### Check Single Email for Breaches
```bash
curl -X POST http://localhost:3000/api/v1/breach/email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Check Multiple Emails for Breaches
```bash
curl -X POST http://localhost:3000/api/v1/breach/email/batch \
  -H "Content-Type: application/json" \
  -d '{"emails": ["user1@example.com", "user2@example.com"]}'
```

### Check URL Security
```bash
curl -X POST http://localhost:3000/api/v1/scan/url/quick \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │  External APIs  │
│   (React/Vue)   │◄──►│   (Express)      │◄──►│  (Google, VT,  │
│                 │    │                  │    │   URLVoid, etc) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Services       │
                       │  • URL Scanner   │
                       │  • Threat Intel  │
                       │  • DNS Analysis  │
                       │  • Content Scan  │
                       └──────────────────┘
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Allowed CORS origin
- `RATE_LIMIT_POINTS`: Rate limiting requests per duration
- `RATE_LIMIT_DURATION`: Rate limiting time window (seconds)

### Scan Options
- `ENABLE_SCREENSHOTS`: Enable Puppeteer screenshot analysis
- `ENABLE_CONTENT_ANALYSIS`: Enable webpage content scanning
- `MAX_SCAN_DURATION`: Maximum scan timeout (ms)
- `MAX_CONTENT_SIZE`: Maximum content size to analyze (bytes)

## 🚀 Deployment

### Production
```bash
# Build and start
npm run build
npm start

# Using PM2
pm2 start ecosystem.config.js

# Using Docker
docker build -t cyberspace-backend .
docker run -p 3000:3000 cyberspace-backend
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Monitoring & Logging

- **Winston**: Structured logging with file and console output
- **Rate Limiting**: Built-in request throttling
- **Health Checks**: `/health` endpoint for monitoring
- **Request Logging**: All API requests logged with metadata

## 🔒 Security Features

- **Helmet**: Security headers and CSP
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: DDoS protection
- **Input Validation**: Joi schema validation
- **XSS Protection**: HTML escaping and sanitization

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="URL Scanner"
```

## 📈 Performance

- **Parallel Processing**: Multiple API checks run simultaneously
- **Caching**: Redis-based result caching (optional)
- **Timeout Management**: Configurable timeouts for external APIs
- **Batch Processing**: Efficient multiple URL scanning

## 🔮 Future Enhancements

- [ ] Machine learning-based threat detection
- [ ] Real-time threat feed integration
- [ ] Advanced image analysis for screenshots
- [ ] User authentication and scan history
- [ ] Webhook notifications for threat alerts
- [ ] Custom threat rule configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review the logs for debugging information
