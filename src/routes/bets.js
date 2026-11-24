import { Router } from 'express';
import { z } from 'zod';
import { ValidationError } from '../errors.js';

const createBetSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  matchId: z.number().int().positive('matchId must be a positive integer'),
  outcome: z.enum(['HOME', 'DRAW', 'AWAY'], {
    message: 'outcome must be HOME, DRAW, or AWAY',
    errorMap: () => ({ message: 'outcome must be HOME, DRAW, or AWAY' }),
  }),
  stake: z.number().int().positive('stake must be a positive integer'),
});

export function createBetRouter(betService) {
  const router = Router();

  router.post('/', (req, res, next) => {
    try {
      const parsed = createBetSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.flatten().fieldErrors));
      }

      const bet = betService.placeBet(parsed.data);
      res.status(201).location(`/bets/${bet.id}`).json(bet);
    } catch (err) {
      next(err);
    }
  });

  router.get('/', (req, res, next) => {
    try {
      res.json(betService.listBets());
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', (req, res, next) => {
    try {
      const bet = betService.getBet(Number(req.params.id));
      res.json(bet);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
