const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, unique: true, lowercase: true },
  subdomain: { type: String, unique: true, lowercase: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true },
  phone: String,
  address: {
    street: String, city: String, state: String, zip: String,
    country: { type: String, default: 'BD' }
  },
  logo: String,
  website: String,
  timezone: { type: String, default: 'Asia/Dhaka' },
  currency: { type: String, default: 'BDT' },
  workingHours: {
    monday:    { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isOpen: { type: Boolean, default: true } },
    tuesday:   { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isOpen: { type: Boolean, default: true } },
    wednesday: { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isOpen: { type: Boolean, default: true } },
    thursday:  { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isOpen: { type: Boolean, default: true } },
    friday:    { open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isOpen: { type: Boolean, default: true } },
    saturday:  { open: { type: String, default: '10:00' }, close: { type: String, default: '16:00' }, isOpen: { type: Boolean, default: true } },
    sunday:    { open: { type: String, default: '10:00' }, close: { type: String, default: '14:00' }, isOpen: { type: Boolean, default: false } }
  },
  appointmentDuration: { type: Number, default: 30 },
  subscription: {
    plan: { type: String, enum: ['trial', 'basic', 'professional', 'enterprise'], default: 'trial' },
    status: { type: String, enum: ['active', 'inactive', 'cancelled', 'past_due'], default: 'active' },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    trialEndsAt: { type: Date, default: () => new Date(+new Date() + 14 * 24 * 60 * 60 * 1000) }
  },
  settings: {
    emailNotifications:  { type: Boolean, default: true },
    smsNotifications:    { type: Boolean, default: false },
    autoConfirmBookings: { type: Boolean, default: false },
    requirePaymentUpfront: { type: Boolean, default: false },
    language: { type: String, default: 'en' }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

tenantSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!this.subdomain) this.subdomain = this.slug;
  }
  next();
});

tenantSchema.methods.getPlanLimits = function() {
  const plans = {
    trial:        { maxDentists: 2,   maxPatients: 50,    maxAppointments: 200,  analytics: false },
    basic:        { maxDentists: 3,   maxPatients: 200,   maxAppointments: 1000, analytics: false },
    professional: { maxDentists: 10,  maxPatients: 1000,  maxAppointments: 5000, analytics: true  },
    enterprise:   { maxDentists: 999, maxPatients: 99999, maxAppointments: 99999,analytics: true  }
  };
  return plans[this.subscription.plan] || plans.trial;
};

module.exports = mongoose.model('Tenant', tenantSchema);
