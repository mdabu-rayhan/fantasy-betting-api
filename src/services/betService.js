import { Bet } from '../domain/bet.js';
import { ConflictError, NotFoundError } from '../errors.js';

export class BetService {
  constructor(betRepo, matchRepo, logger, lockCutoffMinutes = 15) {
    this.betRepo = betRepo;
    this.matchRepo = matchRepo;
    this.logger = logger;
    this.lockCutoffMinutes = lockCutoffMinutes;
  }

  placeBet({ userId, matchId, outcome, stake }, now = new Date()) {
    const match = this.matchRepo.getById(matchId);
    if (!match) {
      throw new NotFoundError(`Match ${matchId} not found`);
    }

    // Rule 1: Strict lock cutoff before kickoff
    match.ensureAcceptingBets(now, this.lockCutoffMinutes);

    // Rule 2: One bet per user per match
    const existing = this.betRepo.findByUserAndMatch(userId, matchId);
    if (existing) {
      throw new ConflictError(`User ${userId} already placed a bet on match ${matchId}`);
    }

    const lockedOdds = match.getOddsFor(outcome);
    const bet = new Bet({ userId, matchId, outcome, stake, lockedOdds });
    const saved = this.betRepo.add(bet);

    this.logger.info(
      'app.services.bet_service',
      `bet placed id=${saved.id} userId=${userId} matchId=${matchId} stake=${stake} odds=${lockedOdds}`
    );

    return saved;
  }

  getBet(id) {
    const bet = this.betRepo.getById(id);
    if (!bet) {
      throw new NotFoundError(`Bet ${id} not found`);
    }
    return bet;
  }

  listBets() {
    return this.betRepo.list();
  }
}
