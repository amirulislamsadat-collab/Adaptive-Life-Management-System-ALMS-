// ============================================================
// Controller: Search — GET /search?q=... backs the command palette's live
// search across the user's actual created content.
// ============================================================
const Module = require('../models/Module');
const SearchService = require('../models/SearchService');

exports.search = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ results: [] });
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ results: [] });

  try {
    const enabled = await Module.findEnabledForUser(req.session.user.id);
    const enabledSlugs = enabled.map(m => m.slug);
    const results = await SearchService.searchAll(req.session.user.id, q, enabledSlugs, 4);
    res.json({ results });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ results: [] });
  }
};
