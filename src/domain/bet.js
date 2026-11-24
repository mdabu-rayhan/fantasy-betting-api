export class Bet {
  constructor({ id = null, userId, matchId, outcome, stake, lockedOdds, createdAt = new Date() }) {
    this.id = id;
    this.userId = userId;
    this.matchId = matchId;
    this.outcome = outcome; // 'HOME' | 'DRAW' | 'AWAY'
    this.stake = Number(stake);
    this.lockedOdds = Number(lockedOdds);
    this.potentialReturn = Number((this.stake * this.lockedOdds).toFixed(2));
    this.status = 'PENDING';
    this.createdAt = createdAt;
  }
}
