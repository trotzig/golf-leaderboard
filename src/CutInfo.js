import React from 'react';
import { getProjectedCutScore } from './cutUtils.mjs';

function getCutConfig(data) {
  const classes = data.CompetitionData && data.CompetitionData.Classes;
  if (!classes || !classes.length) {
    return null;
  }
  return classes[0].Cut;
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
