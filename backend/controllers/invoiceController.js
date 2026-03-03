const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const Tenant = require('../models/Tenant');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

exports.getInvoices = asyncHandler(async (req, res) => {
  const { status, patient, page = 1, limit = 20 } = req.query;
  const filter = { tenant: req.user.tenant };
  if (status) filter.status = status;
  if (patient) filter.patient = patient;

  const total = await Invoice.countDocuments(filter);
  const invoices = await Invoice.find(filter)
    .populate('patient', 'firstName lastName patientId')
    .populate('dentist', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({ success: true, total, data: invoices });
});

exports.createInvoice = asyncHandler(async (req, res, next) => {
  req.body.tenant = req.user.tenant;
  req.body.createdBy = req.user._id;

  const invoice = await Invoice.create(req.body);
  res.status(201).json({ success: true, data: invoice });
});

exports.updateInvoice = asyncHandler(async (req, res, next) => {
  let invoice = await Invoice.findOne({ _id: req.params.id, tenant: req.user.tenant });
  if (!invoice) return next(new ErrorResponse('Invoice not found', 404));

  invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: invoice });
});

exports.downloadInvoicePDF = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, tenant: req.user.tenant })
    .populate('patient', 'firstName lastName phone email address')
    .populate('dentist', 'firstName lastName')
    .populate('appointment');

  if (!invoice) return next(new ErrorResponse('Invoice not found', 404));

  const tenant = await Tenant.findById(req.user.tenant);
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fillColor('#1E40AF').fontSize(24).font('Helvetica-Bold').text(tenant.name, 50, 50);
  doc.fillColor('#64748B').fontSize(10).font('Helvetica').text(tenant.address?.street || '', 50, 80);
  doc.text(`${tenant.address?.city || ''} | ${tenant.phone || ''} | ${tenant.email}`, 50, 95);

  doc.fillColor('#1E40AF').fontSize(20).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
  doc.fillColor('#374151').fontSize(10).font('Helvetica').text(`#${invoice.invoiceNumber}`, 400, 78, { align: 'right' });
  doc.text(`Date: ${new Date(invoice.issuedAt).toLocaleDateString()}`, 400, 93, { align: 'right' });
  doc.text(`Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon receipt'}`, 400, 108, { align: 'right' });

  // Divider
  doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#E5E7EB').stroke();

  // Bill To
  doc.fillColor('#6B7280').fontSize(9).font('Helvetica-Bold').text('BILL TO:', 50, 145);
  doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(invoice.patient.fullName || `${invoice.patient.firstName} ${invoice.patient.lastName}`, 50, 160);
  doc.fillColor('#6B7280').fontSize(9).font('Helvetica').text(invoice.patient.phone, 50, 175);
  if (invoice.patient.email) doc.text(invoice.patient.email, 50, 188);

  // Items table
  let y = 230;
  doc.fillColor('#1E40AF').rect(50, y, 495, 20).fill();
  doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
  doc.text('DESCRIPTION', 60, y + 6);
  doc.text('QTY', 330, y + 6);
  doc.text('UNIT PRICE', 370, y + 6);
  doc.text('TOTAL', 470, y + 6, { align: 'right' });

  y += 25;
  doc.fillColor('#374151').font('Helvetica').fontSize(9);
  invoice.items.forEach((item, i) => {
    if (i % 2 === 0) doc.fillColor('#F9FAFB').rect(50, y - 3, 495, 18).fill();
    doc.fillColor('#374151');
    doc.text(item.description, 60, y);
    doc.text(item.quantity.toString(), 335, y);
    doc.text(`${invoice.currency} ${item.unitPrice.toLocaleString()}`, 370, y);
    doc.text(`${invoice.currency} ${item.total.toLocaleString()}`, 470, y, { align: 'right' });
    y += 20;
  });

  // Totals
  y += 10;
  doc.moveTo(350, y).lineTo(545, y).strokeColor('#E5E7EB').stroke();
  y += 10;
  doc.fillColor('#6B7280').text('Subtotal:', 350, y);
  doc.fillColor('#374151').text(`${invoice.currency} ${invoice.subtotal.toLocaleString()}`, 470, y, { align: 'right' });
  if (invoice.discount) {
    y += 15;
    doc.fillColor('#6B7280').text('Discount:', 350, y);
    doc.fillColor('#EF4444').text(`- ${invoice.currency} ${invoice.discount.toLocaleString()}`, 470, y, { align: 'right' });
  }
  if (invoice.tax) {
    y += 15;
    doc.fillColor('#6B7280').text('Tax:', 350, y);
    doc.fillColor('#374151').text(`${invoice.currency} ${invoice.tax.toLocaleString()}`, 470, y, { align: 'right' });
  }
  y += 15;
  doc.moveTo(350, y).lineTo(545, y).strokeColor('#1E40AF').lineWidth(1).stroke();
  y += 8;
  doc.fillColor('#1E40AF').fontSize(11).font('Helvetica-Bold').text('TOTAL:', 350, y);
  doc.text(`${invoice.currency} ${invoice.total.toLocaleString()}`, 470, y, { align: 'right' });

  y += 25;
  const statusColor = invoice.status === 'paid' ? '#16A34A' : invoice.status === 'overdue' ? '#DC2626' : '#D97706';
  doc.fillColor(statusColor).fontSize(14).font('Helvetica-Bold').text(`STATUS: ${invoice.status.toUpperCase()}`, 50, y);

  // Footer
  doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica').text('Thank you for choosing ' + tenant.name, 50, 720, { align: 'center', width: 495 });

  doc.end();
});
