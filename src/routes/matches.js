import { Router } from 'express';
import { z } from 'zod';
import { ValidationError } from '../errors.js';

const createMatchSchema = z.object({
  competition: z.string().min(1, 'Competition is required'),
  homeTeam: z.string().min(1, 'Home team is required'),
  awayTeam: z.string().min(1, 'Away team is required'),
  kickoffAt: z.string().datetime({ message: 'kickoffAt must be a valid ISO-8601 datetime' }),
  odds: z.object({
    HOME: z.number().gt(1.0, 'HOME odds must be greater than 1.0'),
    DRAW: z.number().gt(1.0, 'DRAW odds must be greater than 1.0'),
    AWAY: z.number().gt(1.0, 'AWAY odds must be greater than 1.0'),
  }),
});

export function createMatchRouter(matchService) {
  const router = Router();

  router.post('/', (req, res, next) => {
    try {
      const parsed = createMatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.flatten().fieldErrors));
      }

      const match = matchService.createMatch(parsed.data);
      res.status(201).location(`/matches/${match.id}`).json(match);
    } catch (err) {
      next(err);
    }
  });

  router.get('/', (req, res, next) => {
    try {
      res.json(matchService.listMatches());
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', (req, res, next) => {
    try {
      const match = matchService.getMatch(Number(req.params.id));
      res.json(match);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
