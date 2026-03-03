const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  appointmentId: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  dentist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, default: 30 }, // minutes
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['consultation', 'checkup', 'cleaning', 'filling', 'extraction', 'root_canal', 'crown', 'whitening', 'orthodontics', 'other'],
    default: 'consultation'
  },
  reason: String,
  notes: String,
  // Treatment notes added by dentist
  treatmentNotes: String,
  diagnosis: String,
  nextAppointmentRecommended: Boolean,
  // Payment
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'insurance', 'online'] },
  estimatedCost: Number,
  actualCost: Number,
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  // Booking
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookedVia: { type: String, enum: ['online', 'phone', 'walk_in', 'chatbot'], default: 'online' },
  // Reminders
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: Date,
  // Cancellation
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: String,
  cancelledAt: Date,
  // Rescheduling
  rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  isRescheduled: { type: Boolean, default: false }
}, { timestamps: true });

appointmentSchema.index({ tenant: 1, date: 1 });
appointmentSchema.index({ tenant: 1, dentist: 1, date: 1 });
appointmentSchema.index({ tenant: 1, patient: 1 });

appointmentSchema.pre('save', async function(next) {
  if (!this.appointmentId) {
    const count = await mongoose.model('Appointment').countDocuments({ tenant: this.tenant });
    const tenantStr = this.tenant.toString().slice(-4).toUpperCase();
    this.appointmentId = `APT-${tenantStr}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
