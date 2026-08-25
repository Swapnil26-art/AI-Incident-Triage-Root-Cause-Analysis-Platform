# AI Incident Triage & Root Cause Analysis Platform

A full-stack proof-of-concept (PoC) for AI-powered incident triage and root-cause analysis (RCA). Built for IT/network engineers to streamline incident management with automated analysis, real-time updates, and a clean dashboard.

## Architecture

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────┐
│   React SPA      │────▶│  Spring Boot REST    │────▶│   H2 /   │
│  (Vite + Tailwind)│     │  API + WebSocket     │     │  TiDB    │
│  Port 3000       │     │  Port 8080           │     │          │
└─────────────────┘     └─────────────────────┘     └──────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │ Simulated AI │
                        │   Analysis   │
                        └─────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, Chart.js 4, Axios |
| **Backend** | Spring Boot 3.2, Spring Security, Spring Data JPA, WebSocket |
| **Database** | H2 (development), TiDB (production) |
| **Auth** | JWT (jjwt 0.12), BCrypt password encoding |
| **AI** | Simulated LLM-style root cause analysis |
| **Infrastructure** | Docker, Docker Compose, Nginx |

## Features

- **Incident Management** — Full CRUD for incidents with severity (P1-P4), priority, category, and status tracking
- **AI Root Cause Analysis** — Simulated AI analysis that generates root causes, suggested actions, and confidence scores
- **Dashboard** — Real-time metrics: incidents by severity, status, and category with visual charts
- **JWT Authentication** — Secure login/register with role-based access (Admin, Engineer, Viewer)
- **Activity Logs** — Per-incident log entries with timestamps and authors
- **WebSocket** — Real-time incident update broadcasts
- **Responsive UI** — Clean SPA with sidebar navigation, dark header, and card-based layout

## Quick Start

### Prerequisites

- Java 17+
- Node.js 18+
- Maven 3.8+

### Backend

```bash
# From project root
mvn clean spring-boot:run
```

Backend starts at `http://localhost:8080`

### Frontend

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend starts at `http://localhost:5173` with API proxy to backend.

### Docker Compose

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`

## Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | ADMIN |
| `engineer` | `engineer123` | ENGINEER |
| `viewer` | `viewer123` | VIEWER |

20 synthetic incidents are seeded on first startup.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login, returns JWT token |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user (requires JWT) |

### Incidents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incidents` | List all (supports `?category=`, `?severity=`, `?status=` filters) |
| POST | `/api/incidents` | Create incident |
| GET | `/api/incidents/{id}` | Get incident by ID |
| PUT | `/api/incidents/{id}` | Update incident |
| DELETE | `/api/incidents/{id}` | Delete incident |
| POST | `/api/incidents/{id}/logs` | Add log entry |
| GET | `/api/incidents/{id}/logs` | Get incident logs |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Aggregated metrics (total, open, P1, P2, resolved) |
| GET | `/api/dashboard/incidents-by-category` | Group by category |
| GET | `/api/dashboard/incidents-by-severity` | Group by severity |
| GET | `/api/dashboard/incidents-by-status` | Group by status |

### AI Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/analyze/{id}` | Run simulated AI analysis on an incident |
| GET | `/api/ai/analyze/{id}` | Get existing analysis for an incident |

### WebSocket

| Protocol | Endpoint | Description |
|----------|----------|-------------|
| STOMP | `/ws` | WebSocket endpoint |
| Subscribe | `/topic/incidents` | Real-time incident updates |
| Subscribe | `/topic/dashboard` | Dashboard refresh events |

## Project Structure

```
├── src/
│   ├── index.html                          # Frontend HTML shell
│   ├── main/java/com/swapnil/incident/
│   │   ├── IncidentTriageApplication.java  # Spring Boot entry point
│   │   ├── Incident.java                   # JPA Entity
│   │   ├── IncidentRepository.java         # JPA Repository
│   │   ├── IncidentController.java         # REST Controller
│   │   ├── Log.java                        # Log Entity
│   │   ├── DataSeeder.java                 # Demo data seeder
│   │   ├── auth/
│   │   │   ├── SecurityConfig.java         # Spring Security config
│   │   │   ├── JwtUtil.java                # JWT utility
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   ├── UserDetailsServiceImpl.java
│   │   │   ├── AuthController.java         # Login/Register
│   │   │   ├── User.java                   # User Entity
│   │   │   ├── UserRepository.java
│   │   │   └── PasswordEncoderConfig.java
│   │   ├── ai/
│   │   │   └── AiController.java           # Simulated AI analysis
│   │   ├── dashboard/
│   │   │   └── DashboardController.java    # Dashboard metrics
│   │   └── websocket/
│   │       ├── WebSocketConfig.java
│   │       └── IncidentEventHandler.java
│   └── main/resources/
│       └── application.properties          # App configuration
├── src/services/                           # React API services
│   ├── api.js                              # Axios instance
│   ├── auth.js
│   ├── incidents.js
│   └── dashboard.js
├── src/components/
│   └── Layout.jsx                          # Sidebar + nav shell
├── src/pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── IncidentListPage.jsx
│   └── IncidentDetailPage.jsx
├── pom.xml                                 # Maven config
├── package.json                            # Node.js config
├── vite.config.js                          # Vite config
├── tailwind.config.js                      # Tailwind config
├── docker-compose.yml
├── Dockerfile                              # Backend Docker image
├── Dockerfile.frontend                     # Frontend Docker image
└── nginx.conf                              # Nginx config for SPA
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT signing | fallback dev key |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile (`dev`/`prod`) | `dev` |

### Production (TiDB)

Set these in `application.properties` or as environment variables:

```
SPRING_DATASOURCE_URL=jdbc:mysql://your-tidb-cluster:4000/incidentdb?useSSL=true
SPRING_DATASOURCE_USERNAME=your-username
SPRING_DATASOURCE_PASSWORD=your-password
SPRING_PROFILES_ACTIVE=prod
```

## Production Deployment

### Frontend (Vercel / Netlify)

```bash
npm run build
# Deploy dist/ folder
```

### Backend (Render / Railway)

1. Push code to repository
2. Set environment variables: `JWT_SECRET`, database URL
3. Deploy with Docker or buildpack

### Docker Compose (Self-Hosted)

```bash
docker-compose -f docker-compose.yml up --build -d
```

## License

MIT
