const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  dentist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  chiefComplaint: String,
  diagnosis: { type: String, required: true },
  treatment: { type: String, required: true },
  procedures: [{
    code: String,
    description: String,
    toothNumber: String,
    surface: String,
    status: { type: String, enum: ['planned', 'in_progress', 'completed'], default: 'completed' }
  }],
  prescriptions: [{
    medicine: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  followUpDate: Date,
  followUpInstructions: String,
  clinicalNotes: String,
  attachments: [{
    type: { type: String, enum: ['xray', 'photo', 'report', 'other'] },
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  vitals: {
    bloodPressure: String,
    pulse: Number,
    temperature: Number,
    notes: String
  }
}, { timestamps: true });

treatmentSchema.index({ tenant: 1, patient: 1 });
treatmentSchema.index({ tenant: 1, dentist: 1, date: 1 });

module.exports = mongoose.model('Treatment', treatmentSchema);
