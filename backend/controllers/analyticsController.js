const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const tenantId = req.user.tenant;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

  const [
    todayAppointments,
    pendingAppointments,
    totalPatients,
    newPatientsThisMonth,
    monthlyRevenue,
    lastMonthRevenue,
    totalDentists,
    completedToday
  ] = await Promise.all([
    Appointment.countDocuments({ tenant: tenantId, date: { $gte: today, $lte: todayEnd } }),
    Appointment.countDocuments({ tenant: tenantId, status: 'pending' }),
    Patient.countDocuments({ tenant: tenantId, isActive: true }),
    Patient.countDocuments({ tenant: tenantId, createdAt: { $gte: monthStart } }),
    Invoice.aggregate([
      { $match: { tenant: tenantId, status: 'paid', createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Invoice.aggregate([
      { $match: { tenant: tenantId, status: 'paid', createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    User.countDocuments({ tenant: tenantId, role: 'dentist', isActive: true }),
    Appointment.countDocuments({ tenant: tenantId, date: { $gte: today, $lte: todayEnd }, status: 'completed' })
  ]);

  const currentRevenue = monthlyRevenue[0]?.total || 0;
  const prevRevenue = lastMonthRevenue[0]?.total || 0;
  const revenueGrowth = prevRevenue ? (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : 0;

  res.status(200).json({
    success: true,
    data: {
      todayAppointments,
      pendingAppointments,
      totalPatients,
      newPatientsThisMonth,
      monthlyRevenue: currentRevenue,
      revenueGrowth,
      totalDentists,
      completedToday
    }
  });
});

exports.getRevenueChart = asyncHandler(async (req, res, next) => {
  const tenantId = req.user.tenant;
  const { months = 12 } = req.query;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months) + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const data = await Invoice.aggregate([
    { $match: { tenant: tenantId, status: 'paid', createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$total' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formatted = data.map(d => ({
    month: `${monthNames[d._id.month - 1]} ${d._id.year}`,
    revenue: d.revenue,
    invoices: d.count
  }));

  res.status(200).json({ success: true, data: formatted });
});

exports.getAppointmentStats = asyncHandler(async (req, res, next) => {
  const tenantId = req.user.tenant;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const [byStatus, byType, byDentist, dailyTrend] = await Promise.all([
    Appointment.aggregate([
      { $match: { tenant: tenantId, createdAt: { $gte: monthStart } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Appointment.aggregate([
      { $match: { tenant: tenantId, createdAt: { $gte: monthStart } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    Appointment.aggregate([
      { $match: { tenant: tenantId, createdAt: { $gte: monthStart } } },
      { $group: { _id: '$dentist', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'dentist' } },
      { $unwind: '$dentist' },
      { $project: { name: { $concat: ['$dentist.firstName', ' ', '$dentist.lastName'] }, count: 1 } }
    ]),
    Appointment.aggregate([
      { $match: { tenant: tenantId, createdAt: { $gte: monthStart } } },
      { $group: { _id: { $dayOfMonth: '$date' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);

  res.status(200).json({ success: true, data: { byStatus, byType, byDentist, dailyTrend } });
});
