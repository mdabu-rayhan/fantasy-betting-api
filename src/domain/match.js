import { ConflictError } from '../errors.js';

export class Match {
  constructor({ id = null, competition, homeTeam, awayTeam, kickoffAt, odds }) {
    this.id = id;
    this.competition = competition;
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.kickoffAt = new Date(kickoffAt);
    this.odds = {
      HOME: Number(odds.HOME),
      DRAW: Number(odds.DRAW),
      AWAY: Number(odds.AWAY),
    };
  }

  ensureAcceptingBets(now = new Date(), lockCutoffMinutes = 15) {
    const cutoffTime = new Date(this.kickoffAt.getTime() - lockCutoffMinutes * 60 * 1000);
    if (now >= cutoffTime) {
      throw new ConflictError(
        `Betting is locked for match ${this.id} (cutoff was ${cutoffTime.toISOString()})`
      );
    }
  }

  getOddsFor(outcome) {
    return this.odds[outcome];
  }
}
