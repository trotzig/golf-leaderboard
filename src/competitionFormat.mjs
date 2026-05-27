// Stableford ToParText values end with "p" (e.g., "+4p", "-1p").
// "E"/"Par" can appear in both formats, so we can't infer from those alone.
const STABLEFORD_TEXT = /^[+-]?\d+p$/i;

export function isStablefordText(text) {
  return typeof text === 'string' && STABLEFORD_TEXT.test(text);
}

export function detectFormat({ competitionData, entries, scoreTexts } = {}) {
  const cs =
    competitionData &&
    competitionData.CompetitionData &&
    competitionData.CompetitionData.LivescoringSettings &&
    competitionData.CompetitionData.LivescoringSettings.ClassSettings &&
    competitionData.CompetitionData.LivescoringSettings.ClassSettings[0];
  if (cs && cs.StatusText && /stableford/i.test(cs.StatusText)) {
    return 'stableford';
  }
  if (entries) {
    for (const e of entries) {
      if (isStablefordText(e && e.ResultSum && e.ResultSum.ToParText)) {
        return 'stableford';
      }
    }
  }
  if (scoreTexts) {
    for (const t of scoreTexts) {
      if (isStablefordText(t)) return 'stableford';
    }
  }
  return 'strokeplay';
}

export function isGoodScore(format, value) {
  if (typeof value !== 'number') return false;
  if (format === 'stableford') return value > 0;
  return value < 0;
}

export function formatLabel(format) {
  if (format === 'stableford') return 'Stableford';
  return null;
}
