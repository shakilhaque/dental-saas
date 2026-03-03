const AuditLog = require('../models/AuditLog');

const audit = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Log audit after response
      if (res.statusCode < 400) {
        AuditLog.create({
          tenant: req.user?.tenant,
          user: req.user?._id,
          action,
          resource,
          resourceId: req.params.id,
          description: `${action} ${resource}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          status: 'success'
        }).catch(console.error);
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = audit;
