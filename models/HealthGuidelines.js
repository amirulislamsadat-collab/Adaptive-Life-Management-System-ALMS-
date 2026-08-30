// ============================================================
// HealthGuidelines — turns what a user tells us once at setup (age,
// gender, weight, activity level) into personalized targets, instead of
// the same flat numbers for everyone. General population guidelines (CDC /
// Sleep Foundation / NASEM water intake / WHO physical activity), not
// personalized medical advice — good enough for a sensible default,
// always adjustable by the user afterward.
// ============================================================

// Returns { min, max } in minutes.
function sleepRangeForAge(age) {
  if (!age) return { min: 7 * 60, max: 9 * 60 };
  if (age <= 12) return { min: 9 * 60, max: 12 * 60 };
  if (age <= 17) return { min: 8 * 60, max: 10 * 60 };
  if (age <= 64) return { min: 7 * 60, max: 9 * 60 };
  return { min: 7 * 60, max: 8 * 60 };
}

// Daily water intake goal in ml. Weight-based (~35ml/kg, a standard rule
// of thumb) when we know their weight; a flat gender-based estimate
// otherwise — both beat one fixed number for every single user.
function waterGoal({ gender, weightKg } = {}) {
  if (weightKg && weightKg > 0) return Math.round(weightKg * 35);
  if (gender === 'male') return 3000;
  if (gender === 'female') return 2200;
  return 2500;
}

// Weekly moderate-exercise minutes target. WHO's 150min/week is the
// baseline for everyone; more active people get a higher bar so the
// tracker doesn't feel trivially "done" for someone already well past it.
function exerciseWeeklyTarget(activityLevel) {
  if (activityLevel === 'active') return 200;
  if (activityLevel === 'very_active') return 300;
  return 150;
}

module.exports = { sleepRangeForAge, waterGoal, exerciseWeeklyTarget };
