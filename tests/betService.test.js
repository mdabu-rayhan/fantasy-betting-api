import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MatchRepository } from '../src/repositories/matchRepository.js';
import { BetRepository } from '../src/repositories/betRepository.js';
import { MatchService } from '../src/services/matchService.js';
import { BetService } from '../src/services/betService.js';
import { ConflictError } from '../src/errors.js';

const silentLogger = { debug() {}, info() {}, warn() {}, error() {} };

describe('BetService (no HTTP server)', () => {
  it('places a bet and locks the match odds snapshot', () => {
    const matchRepo = new MatchRepository();
    const betRepo = new BetRepository();
    const matchService = new MatchService(matchRepo, silentLogger);
    const betService = new BetService(betRepo, matchRepo, silentLogger, 15);

    const futureKickoff = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const match = matchService.createMatch({
      competition: 'Premier League',
      homeTeam: 'Manchester City',
      awayTeam: 'Arsenal',
      kickoffAt: futureKickoff,
      odds: { HOME: 1.85, DRAW: 3.6, AWAY: 4.2 },
    });

    const bet = betService.placeBet({
      userId: 'user-1',
      matchId: match.id,
      outcome: 'HOME',
      stake: 100,
    });

    assert.equal(bet.lockedOdds, 1.85);
    assert.equal(bet.potentialReturn, 185);
  });

  it('rejects a duplicate bet on the same match with ConflictError', () => {
    const matchRepo = new MatchRepository();
    const betRepo = new BetRepository();
    const matchService = new MatchService(matchRepo, silentLogger);
    const betService = new BetService(betRepo, matchRepo, silentLogger, 15);

    const futureKickoff = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const match = matchService.createMatch({
      competition: 'Premier League',
      homeTeam: 'Liverpool',
      awayTeam: 'Chelsea',
      kickoffAt: futureKickoff,
      odds: { HOME: 2.1, DRAW: 3.4, AWAY: 3.5 },
    });

    betService.placeBet({ userId: 'user-1', matchId: match.id, outcome: 'HOME', stake: 50 });

    assert.throws(
      () => betService.placeBet({ userId: 'user-1', matchId: match.id, outcome: 'DRAW', stake: 50 }),
      ConflictError
    );
  });
});
