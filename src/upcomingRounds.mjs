// A player's rounds can include several that haven't started yet (GolfBox
// sometimes publishes tee times for more than the next round). Only the next
// tee time is useful on the leaderboard, so later unstarted rounds are dropped.
export function withoutLaterUpcomingRounds(rounds, isNotStarted) {
  let seenUpcoming = false;
  return rounds.filter(round => {
    if (!isNotStarted(round)) {
      return true;
    }
    if (seenUpcoming) {
      return false;
    }
    seenUpcoming = true;
    return true;
  });
}
