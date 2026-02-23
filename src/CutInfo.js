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
  let holesPlayedByField = entries.reduce((sum, e) => {
    return sum + Math.max((e.ScoringToPar && e.ScoringToPar.HoleValue) || 0, 0);
  }, 0);
  if (!holesPlayedByField || !totalFieldHoles) {
    return null;
  }
  // Only show projected cut once at least one round is 75% done.
  // holesPlayedByField at this point is holes played in the current round only.
  if (activeRound === 1 && holesPlayedByField < entries.length * 18 * 0.75) {
    return null;
  }
  holesPlayedByField += (activeRound - 1) * 18 * entries.length;
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
