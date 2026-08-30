// ============================================================
// Middleware: Module Access — blocks a module's pages once the user has
// disabled it (Feature 4), while the data itself stays untouched in the
// database so it's exactly as it was if the module gets re-enabled
// (Feature 5).
//
// Every route file in this app is mounted at "/" in server.js, so a
// path-less router.use(fn) would run on every request that reaches that
// file's router — not just requests for that module's own pages. That was
// causing an unrelated disabled module to block access to a completely
// different, enabled one. requireModule() takes the exact path prefixes
// this module owns and only checks/gates requests that actually match one
// of them; everything else passes straight through untouched.
// ============================================================
const Module = require('../models/Module');

function ownsPath(reqPath, prefixes) {
  return prefixes.some(prefix => reqPath === prefix || reqPath.startsWith(prefix + '/'));
}

function requireModule(slug, prefixes) {
  return async (req, res, next) => {
    if (!ownsPath(req.path, prefixes)) return next();
    if (!req.session.user) return res.redirect('/login');
    try {
      const enabledModules = await Module.findEnabledForUser(req.session.user.id);
      const isEnabled = enabledModules.some(m => m.slug === slug);
      if (!isEnabled) {
        req.session.error = 'That module is currently disabled. Enable it in Settings to use this feature.';
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
