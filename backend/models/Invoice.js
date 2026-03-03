const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  invoiceNumber: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  dentist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    description: { type: String, required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: Number
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  balance: Number,
  currency: { type: String, default: 'BDT' },
  status: { type: String, enum: ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'], default: 'draft' },
  paymentMethod: String,
  paymentDate: Date,
  dueDate: Date,
  notes: String,
  stripePaymentIntentId: String,
  issuedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

invoiceSchema.index({ tenant: 1, patient: 1 });
invoiceSchema.index({ tenant: 1, status: 1 });

invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments({ tenant: this.tenant });
    const tenantStr = this.tenant.toString().slice(-4).toUpperCase();
    const year = new Date().getFullYear();
    this.invoiceNumber = `INV-${tenantStr}-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => {
    item.total = (item.quantity * item.unitPrice) - (item.discount || 0);
    return sum + item.total;
  }, 0);
  this.total = this.subtotal - (this.discount || 0) + (this.tax || 0);
  this.balance = this.total - (this.amountPaid || 0);
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
