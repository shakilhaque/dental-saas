const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['preventive', 'restorative', 'cosmetic', 'orthodontics', 'oral_surgery', 'endodontics', 'periodontics', 'other'],
    default: 'other'
  },
  description: String,
  duration: { type: Number, default: 30 }, // minutes
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  icon: String
}, { timestamps: true });

serviceSchema.index({ tenant: 1, name: 1 });

module.exports = mongoose.model('Service', serviceSchema);
