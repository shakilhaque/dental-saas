const express = require('express');
const router = express.Router();
const { protect, authorize, tenantIsolation } = require('../middleware/auth');
const { getInvoices, createInvoice, updateInvoice, downloadInvoicePDF } = require('../controllers/invoiceController');

router.use(protect, tenantIsolation);
router.get('/', getInvoices);
router.post('/', authorize('clinic_admin', 'receptionist'), createInvoice);
router.put('/:id', authorize('clinic_admin', 'receptionist'), updateInvoice);
router.get('/:id/pdf', downloadInvoicePDF);

module.exports = router;
