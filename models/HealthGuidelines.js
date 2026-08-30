// ============================================================
// HealthGuidelines — turns a user's age/gender (collected once at setup)
// into personalized targets, instead of the same flat numbers for
// everyone. General population guidelines (CDC / Sleep Foundation / NASEM
// water intake ranges), not personalized medical advice — good enough for
// a sensible default, always adjustable by the user afterward.
// ============================================================

// Returns { min, max } in minutes.
function sleepRangeForAge(age) {
  if (!age) return { min: 7 * 60, max: 9 * 60 };
  if (age <= 12) return { min: 9 * 60, max: 12 * 60 };
  if (age <= 17) return { min: 8 * 60, max: 10 * 60 };
  if (age <= 64) return { min: 7 * 60, max: 9 * 60 };
  return { min: 7 * 60, max: 8 * 60 };
}

// Rough general daily water intake guideline in ml.
function waterGoalForGender(gender) {
  if (gender === 'male') return 3000;
  if (gender === 'female') return 2200;
  return 2500;
}

module.exports = { sleepRangeForAge, waterGoalForGender };
