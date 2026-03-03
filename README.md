# 🦷 DentalSaaS – Multi-Tenant Dental Clinic Management Platform

A production-ready **multi-tenant SaaS platform** that allows multiple dental clinics to register, manage operations, and serve their patients — all with complete data isolation, AI-powered chatbot, and subscription billing.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DENTALSAAS PLATFORM                          │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Clinic A    │  │ Clinic B    │  │ Clinic C    │  ...        │
│  │ abc.dental  │  │ xyz.dental  │  │ pro.dental  │            │
│  │ saas.com    │  │ saas.com    │  │ saas.com    │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         └────────────────┼────────────────┘                    │
│                          ▼                                      │
│              ┌───────────────────────┐                         │
│              │   Node.js + Express   │                         │
│              │   REST API (v1)       │                         │
│              │   JWT Auth            │                         │
│              │   Rate Limiting       │                         │
│              └───────────┬───────────┘                         │
│                          ▼                                      │
│              ┌───────────────────────┐                         │
│              │   MongoDB             │                         │
│              │   Tenant-Scoped Docs  │                         │
│              │   (tenant field idx)  │                         │
│              └───────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Multi-Tenant Isolation Strategy

### How Tenant Isolation Works

1. **Database Level**: Every document has a `tenant` field (ObjectId ref to Tenant collection). All queries are automatically scoped with `{ tenant: req.user.tenant }`.

2. **Authentication Level**: JWT tokens contain `{ id, tenant, role }`. The `tenantIsolation` middleware injects `req.tenantFilter` so controllers never accidentally cross tenants.

3. **Subdomain Level**: Each clinic gets a unique subdomain (e.g. `smilecare.dentalsaas.com`). Login pages and public chatbot use the subdomain to identify the correct tenant.

4. **Compound Indexes**: Database uses compound indexes like `{ email: 1, tenant: 1 }` ensuring email uniqueness per clinic, not globally.

5. **Plan Enforcement**: The `requirePlan()` middleware checks subscription tier before allowing access to premium features like analytics charts.

---

## 📁 Project Structure

```
dental-saas/
├── backend/
│   ├── config/
│   │   └── database.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Register clinic, login, JWT
│   │   ├── appointmentController.js # Booking, slots, conflict check
│   │   ├── chatController.js        # OpenAI GPT chatbot
│   │   ├── analyticsController.js   # Dashboard stats, charts
│   │   └── invoiceController.js     # Billing + PDF generation
│   ├── middleware/
│   │   ├── auth.js                  # protect, authorize, tenantIsolation, requirePlan
│   │   ├── asyncHandler.js          # Async error wrapper
│   │   ├── audit.js                 # Audit log middleware
│   │   └── errorHandler.js          # Global error handler
│   ├── models/
│   │   ├── Tenant.js               # Clinic/tenant with subscription
│   │   ├── User.js                  # Multi-role users (compound email+tenant index)
│   │   ├── Patient.js               # Patient records + medical history
│   │   ├── Appointment.js           # Bookings with conflict prevention
│   │   ├── Invoice.js               # Billing + auto-numbering
│   │   ├── Treatment.js             # Treatment records + prescriptions
│   │   ├── Service.js               # Clinic service catalog
│   │   ├── ChatLog.js               # AI chatbot conversation logs
│   │   └── AuditLog.js             # Security & action audit trail
│   ├── routes/
│   │   ├── auth.js                  # /api/v1/auth/*
│   │   ├── tenants.js               # /api/v1/tenants/*
│   │   ├── patients.js              # /api/v1/patients/*
│   │   ├── appointments.js          # /api/v1/appointments/*
│   │   ├── invoices.js              # /api/v1/invoices/*
│   │   ├── analytics.js             # /api/v1/analytics/*
│   │   ├── services.js              # /api/v1/services/*
│   │   ├── chat.js                  # /api/v1/chat/*
│   │   └── ...
│   ├── services/
│   │   ├── emailService.js          # Nodemailer + HTML templates
│   │   └── reminderService.js       # Cron job for appointment reminders
│   ├── utils/
│   │   └── ErrorResponse.js
│   ├── server.js                    # Express app + cron jobs
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── api/index.js             # Axios client + all API methods
    │   ├── context/AuthContext.js   # Global auth state
    │   ├── hooks/useQuery.js        # Data fetching hook
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Sidebar.js       # Role-based navigation
    │   │   │   └── AppLayout.js     # Shell with header/sidebar
    │   │   └── chatbot/
    │   │       └── ChatBot.js       # Floating AI chat widget
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── Login.js         # Subdomain-aware login
    │   │   │   └── RegisterClinic.js # 2-step clinic registration
    │   │   └── admin/
    │   │       ├── AdminDashboard.js # Stats + charts
    │   │       └── AppointmentsPage.js # Full appointment management
    │   └── App.js                   # Routes + role-based guards
    └── package.json
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js >= 18
- MongoDB >= 6 (local or Atlas)
- OpenAI API key
- Stripe account (for subscriptions)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000/api/v1
npm start
```

---

## 🔑 API Reference

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/auth/register-clinic` | Register new clinic + admin | Public |
| POST | `/api/v1/auth/login` | Login (with optional subdomain) | Public |
| GET  | `/api/v1/auth/me` | Get current user | Private |
| PUT  | `/api/v1/auth/profile` | Update profile | Private |
| POST | `/api/v1/auth/register-staff` | Add dentist/receptionist | Clinic Admin |
| POST | `/api/v1/auth/forgot-password` | Password reset email | Public |

### Tenant Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/tenants/check-subdomain/:sub` | Check availability | Public |
| GET | `/api/v1/tenants/by-subdomain/:sub` | Get clinic info | Public |
| GET | `/api/v1/tenants/me` | My clinic settings | Admin |
| PUT | `/api/v1/tenants/me` | Update clinic | Admin |
| GET | `/api/v1/tenants` | All tenants | Super Admin |

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/appointments` | List with filters (date, dentist, status) |
| GET | `/api/v1/appointments/available-slots?dentistId&date` | Available time slots |
| POST | `/api/v1/appointments` | Book appointment (conflict check) |
| PUT | `/api/v1/appointments/:id/status` | Update status |
| POST | `/api/v1/appointments/:id/reschedule` | Reschedule |

### AI Chatbot

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat/message` | Send message, get AI response |
| GET | `/api/v1/chat/session/:sessionId` | Get chat history |
| GET | `/api/v1/chat/logs` | All chat logs (admin) |

---

## 💎 Subscription Plans

| Feature | Trial (14d) | Basic | Professional | Enterprise |
|---------|-------------|-------|--------------|------------|
| Max Dentists | 2 | 3 | 10 | Unlimited |
| Max Patients | 50 | 200 | 1,000 | Unlimited |
| AI Chatbot | ✅ | ✅ | ✅ | ✅ |
| Analytics Charts | ❌ | ❌ | ✅ | ✅ |
| Export Reports | ❌ | ❌ | ✅ | ✅ |

---

## 🗄️ Database Schema Summary

### Tenant (Clinic)
```
name, slug, subdomain*, owner, email, phone, address,
workingHours{}, appointmentDuration, subscription{plan, status, stripeIds},
settings{emailNotifications, autoConfirm...}, isActive
```

### User
```
tenant*, email+tenant (compound unique), firstName, lastName,
role[super_admin|clinic_admin|dentist|receptionist|patient],
specialization, availability[], password(bcrypt), JWT methods
```

### Patient
```
tenant*, patientId(auto), personal info, medicalHistory{allergies,medications,...},
dentalHistory{}, insurance{}, documents[], tags
```

### Appointment
```
tenant*, appointmentId(auto), patient*, dentist*, date, startTime, endTime,
status[pending|confirmed|in_progress|completed|cancelled|no_show],
paymentStatus, bookedVia[online|chatbot|phone|walk_in],
reminderSent, isRescheduled, rescheduledFrom
```

### Invoice
```
tenant*, invoiceNumber(auto), patient*, items[{description,qty,price,total}],
subtotal, discount, tax, total, status[draft|sent|paid|overdue]
```

---

## 🤖 AI Chatbot Features

The chatbot is powered by **OpenAI GPT-4o-mini** and is clinic-aware:

- **Clinic context injection**: Includes the clinic's name, working hours, and contact in the system prompt
- **Booking intent detection**: Detects when patients want to book and shows a booking CTA
- **Session memory**: Maintains conversation history (last 10 messages)
- **Medical disclaimer**: Always displays for health-related queries
- **Multilingual**: Responds in English or Bangla based on user's language
- **Rate limited**: 30 messages/minute per IP
- **Audit logged**: All conversations stored in ChatLog collection

---

## 🔐 Security Features

- **JWT Authentication** with role + tenant embedded in token
- **bcryptjs** password hashing (12 salt rounds)
- **Express Helmet** for HTTP security headers
- **express-mongo-sanitize** against NoSQL injection
- **express-rate-limit** (global + auth + chat limiters)
- **Role-based route guards** (`authorize()` middleware)
- **Tenant isolation** on every query (`tenantIsolation` middleware)
- **Audit logging** of all create/update/delete/export actions
- **HTTPS ready** (configure via reverse proxy / Nginx)

---

## 🌐 Deployment Guide (Production)

### Environment Variables (Backend)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dental_saas
JWT_SECRET=<256-bit random string>
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
CLOUDINARY_CLOUD_NAME=...
```

### Docker Compose (recommended)
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
    ports:
      - "5000:5000"
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
  mongo:
    image: mongo:7
    volumes:
      - mongodb_data:/data/db
volumes:
  mongodb_data:
```

### Subdomain Routing (Nginx)
```nginx
server {
    server_name *.dentalsaas.com;
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Tenant-Subdomain $subdomain;
    }
    location /api {
        proxy_pass http://backend:5000;
    }
}
```

---

## 📈 Extending the Platform

| Feature | Implementation Path |
|---------|-------------------|
| SMS Reminders | Add Twilio to `reminderService.js` |
| Video Consultations | Integrate Agora/Twilio Video |
| Dark Mode | Add ThemeContext, CSS variables |
| Mobile App | React Native consuming same REST API |
| WhatsApp Bot | Add WhatsApp Business API to chatController |
| ML Treatment Suggestions | Extend chatbot with fine-tuned dental model |
| HIPAA Compliance | Add field-level encryption on medical data |
