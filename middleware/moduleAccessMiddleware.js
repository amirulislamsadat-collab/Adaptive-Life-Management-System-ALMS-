// ============================================================
// Middleware: Module Access — blocks a module's pages once the user has
// disabled it (Feature 4), while the data itself stays untouched in the
// database so it's exactly as it was if the module gets re-enabled
// (Feature 5). Attach with requireModule('<slug>') at the top of a route
// file to guard every route defined after it.
// ============================================================
const Module = require('../models/Module');

function requireModule(slug) {
  return async (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    try {
      const enabledModules = await Module.findEnabledForUser(req.session.user.id);
      const isEnabled = enabledModules.some(m => m.slug === slug);
      if (!isEnabled) {
        req.session.error = 'That module is currently disabled. Enable it in Module Settings to use this feature.';
        return res.redirect('/modules/settings');
      }
      next();
    } catch (err) {
      console.error('Module access check error:', err);
      next();
    }
  };
}

module.exports = requireModule;
