const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // if patient has login
  patientId: { type: String, unique: true }, // auto-generated
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email: String,
  phone: { type: String, required: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'], default: 'unknown' },
  address: { street: String, city: String, state: String, zip: String },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  medicalHistory: {
    allergies: [String],
    currentMedications: [String],
    chronicConditions: [String],
    previousSurgeries: [String],
    familyHistory: String,
    smokingStatus: { type: String, enum: ['never', 'former', 'current'] },
    alcoholUse: { type: String, enum: ['never', 'occasional', 'regular'] },
    notes: String
  },
  dentalHistory: {
    lastDentalVisit: Date,
    previousDentist: String,
    chiefComplaint: String,
    oralHygieneHabits: String,
    notes: String
  },
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    coverageDetails: String
  },
  documents: [{
    type: { type: String, enum: ['xray', 'report', 'prescription', 'insurance', 'other'] },
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  tags: [String],
  notes: String,
  referredBy: String,
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

patientSchema.index({ tenant: 1, email: 1 });
patientSchema.index({ tenant: 1, phone: 1 });
patientSchema.index({ tenant: 1, patientId: 1 });

patientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

patientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

// Auto-generate patientId
patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    const count = await mongoose.model('Patient').countDocuments({ tenant: this.tenant });
    const tenantStr = this.tenant.toString().slice(-4).toUpperCase();
    this.patientId = `PT-${tenantStr}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
