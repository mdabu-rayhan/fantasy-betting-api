import { Match } from '../domain/match.js';
import { NotFoundError } from '../errors.js';

export class MatchService {
  constructor(matchRepo, logger) {
    this.matchRepo = matchRepo;
    this.logger = logger;
  }

  createMatch(data) {
    const match = new Match(data);
    const saved = this.matchRepo.add(match);
    this.logger.info('app.services.match_service', `match created id=${saved.id}`);
    return saved;
  }

  getMatch(id) {
    const match = this.matchRepo.getById(id);
    if (!match) {
      throw new NotFoundError(`Match ${id} not found`);
    }
    return match;
  }

  listMatches() {
    return this.matchRepo.list();
  }
}
