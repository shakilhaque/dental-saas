// MongoDB initialization script
// Runs once when the container is first created

db = db.getSiblingDB('dental_saas');

// Create app user with limited permissions
db.createUser({
  user: 'dental_app',
  pwd: process.env.MONGO_APP_PASSWORD || 'apppassword123',
  roles: [{ role: 'readWrite', db: 'dental_saas' }]
});

// Create indexes for performance
db.tenants.createIndex({ subdomain: 1 }, { unique: true });
db.tenants.createIndex({ slug: 1 }, { unique: true });
db.tenants.createIndex({ 'subscription.status': 1 });

db.users.createIndex({ email: 1, tenant: 1 }, { unique: true });
db.users.createIndex({ tenant: 1, role: 1 });

db.patients.createIndex({ tenant: 1, patientId: 1 }, { unique: true });
db.patients.createIndex({ tenant: 1, email: 1 });
db.patients.createIndex({ tenant: 1, phone: 1 });
db.patients.createIndex({ tenant: 1, isActive: 1 });

db.appointments.createIndex({ tenant: 1, date: 1, dentist: 1 });
db.appointments.createIndex({ tenant: 1, patient: 1 });
db.appointments.createIndex({ tenant: 1, status: 1 });
db.appointments.createIndex({ reminderSent: 1, status: 1 });

db.invoices.createIndex({ tenant: 1, invoiceNumber: 1 }, { unique: true });
db.invoices.createIndex({ tenant: 1, status: 1 });
db.invoices.createIndex({ tenant: 1, patient: 1 });

db.chatlogs.createIndex({ tenant: 1, sessionId: 1 });
db.chatlogs.createIndex({ tenant: 1, createdAt: -1 });

db.auditlogs.createIndex({ tenant: 1, createdAt: -1 });
db.auditlogs.createIndex({ tenant: 1, user: 1 });

print('✅ MongoDB initialized with indexes and app user');
