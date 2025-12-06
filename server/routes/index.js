/**
 * Routes Index
 * Export all route modules
 */

const callRoutes = require('./callRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const dashboardRoutes = require('./dashboardRoutes');

module.exports = {
  callRoutes,
  subscriptionRoutes,
  dashboardRoutes
};
