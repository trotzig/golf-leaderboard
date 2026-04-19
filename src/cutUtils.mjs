export function formatProjectedScore(value) {
  const rounded = Math.round(value);
  if (rounded === 0) return 'E';
  if (rounded > 0) return `+${rounded}`;
  return `${rounded}`;
}

// Count total holes played by a single entry up to and including afterRound,
// using Rounds data when available.
// HoleValue from ScoringToPar can be a negative tee-time timestamp between rounds,
// so we prefer counting from the per-round IsCompleted flag and HoleScores.
export function countHolesPlayedForEntry(entry, activeRound, afterRound) {
  if (entry.Rounds) {
    let total = 0;
    for (const [key, round] of Object.entries(entry.Rounds)) {
      const roundNum = parseInt(key.replace('R', ''), 10);
      if (roundNum > afterRound) continue;
      if (round.IsCompleted) {
        total += 18;
      } else if (round.HoleScores) {
        // Count individual hole scores, excluding summary keys (H-OUT, H-IN, H-TOTAL)
        total += Object.keys(round.HoleScores).filter(k => !k.startsWith('H-')).length;
      }
    }
    return total;
  }
  // Fallback when Rounds data isn't available: clamp HoleValue to 0 in case it
  // is a negative tee-time timestamp, then add holes from completed rounds.
  const currentRoundHoles = Math.max(
    (entry.ScoringToPar && entry.ScoringToPar.HoleValue) || 0,
    0,
  );
  // Only count completed rounds up to afterRound (rounds beyond the cut don't count).
  const completedRoundsBeforeCut = Math.min(activeRound - 1, afterRound);
  return currentRoundHoles + completedRoundsBeforeCut * 18;
}

export function getProjectedCutScore(cutConfig, cut, entries, activeRound) {
  if (!cutConfig || !cutConfig.Enabled || !cutConfig.Limit || !entries) {
    return null;
  }
  const afterRound = cut.AfterRound || cutConfig.AfterRound;
  if (!afterRound) {
    return null;
  }
  const cutEntry = entries.find(
    e => e.Position && e.Position.Actual === cutConfig.Limit,
  );
  if (!cutEntry || !cutEntry.ScoringToPar) {
    return null;
  }
  const currentScore = cutEntry.ScoringToPar.ToParValue / 10000;
  // Compute field completion percentage: total holes played by all entries
  // divided by total holes the full field is expected to play before the cut.
  const totalFieldHoles = entries.length * afterRound * 18;
  const holesPlayedByField = entries.reduce((sum, e) => {
    return sum + countHolesPlayedForEntry(e, activeRound, afterRound);
  }, 0);
  if (!holesPlayedByField || !totalFieldHoles) {
    return null;
  }

  // During round 1, don't show projected cut until 75% of round 1 holes are played
  if (activeRound === 1 && holesPlayedByField / (entries.length * 18) < 0.75) {
    return null;
  }

  const fieldCompletionRatio = holesPlayedByField / totalFieldHoles;
  const projected = currentScore + currentScore * fieldCompletionRatio;

  const cleanedProjected =
    projected > 0 ? Math.floor(projected) : Math.ceil(projected);

  return formatProjectedScore(cleanedProjected);
}
