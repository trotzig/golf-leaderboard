import React from 'react';


function formatProjectedScore(value) {
  const rounded = Math.round(value);
  if (rounded === 0) return 'E';
  if (rounded > 0) return `+${rounded}`;
  return `${rounded}`;
}

function getCutConfig(data) {
  const classes = data.CompetitionData && data.CompetitionData.Classes;
  if (!classes || !classes.length) {
    return null;
  }
  return classes[0].Cut;
}

// Count total holes played by a single entry, using Rounds data when available.
// HoleValue from ScoringToPar can be a negative tee-time timestamp between rounds,
// so we prefer counting from the per-round IsCompleted flag and HoleScores.
function countHolesPlayedForEntry(entry, activeRound) {
  if (entry.Rounds) {
    let total = 0;
    for (const round of Object.values(entry.Rounds)) {
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
  return currentRoundHoles + (activeRound - 1) * 18;
}

function getProjectedCutScore(cutConfig, cut, entries, activeRound) {
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
    return sum + countHolesPlayedForEntry(e, activeRound);
  }, 0);
  if (!holesPlayedByField || !totalFieldHoles) {
    return null;
  }
  const fieldCompletionRatio = holesPlayedByField / totalFieldHoles;
  const projected = currentScore + currentScore * fieldCompletionRatio;

  const cleanedProjected =
    projected > 0 ? Math.floor(projected) : Math.ceil(projected);

  return formatProjectedScore(cleanedProjected);
}


export default function CutInfo({ data, entries }) {
  if (!data) {
    return null;
  }
  const clazz = Object.values(data.Classes || {})[0];
  if (!clazz) {
    return null;
  }
  const cut = clazz.Cut;
  if (!cut || !cut.AfterRound) {
    return null;
  }

  const cutConfig = getCutConfig(data);
  if (!cutConfig || !cutConfig.Enabled) {
    return null;
  }

  const activeRound = clazz.Leaderboard && clazz.Leaderboard.ActiveRoundNumber;

  // Don't show before competition has started
  if (!activeRound) {
    return null;
  }

  // In round 1, golfbox sets ActiveRoundNumber=1 before any scoring begins.
  // Only show once at least one player has actually played a hole.
  if (activeRound === 1 && entries) {
    const anyHolesPlayed = entries.some(
      e => e.ScoringToPar && e.ScoringToPar.HoleValue > 0,
    );
    if (!anyHolesPlayed) return null;
  }

  const cutDone = cut.IsPerformed || activeRound > cut.AfterRound;

  const playersInsideCut = cutDone
    ? cut.Position
    : entries
    ? entries.filter(e => e.Position && e.Position.Actual <= cutConfig.Limit)
        .length
    : null;

  const cutScore = cutDone
    ? null
    : getProjectedCutScore(cutConfig, cut, entries, activeRound);

  return (
    <div className="cut-info">
      <h3 className="cut-info-heading">Cut info</h3>
      <p className="cut-info-body">
        {cutDone ? (
          <>
            {playersInsideCut != null && (
              <>
                <strong>
                  <a href="#cut">{playersInsideCut} players</a>
                </strong>{' '}
                made the cut after round {cut.AfterRound}.
              </>
            )}
          </>
        ) : (
          <>
            {playersInsideCut != null && (
              <>
                <strong>
                  <a href="#cut">{playersInsideCut} players</a>
                </strong>{' '}
                are currently inside the cut line
                {cutScore != null ? (
                  <> which is projected to be at {cutScore}</>
                ) : null}
                .{' '}
              </>
            )}
            Top {cutConfig.Limit} players and ties make the cut after round{' '}
            {cut.AfterRound}.
          </>
        )}
      </p>
    </div>
  );
}
