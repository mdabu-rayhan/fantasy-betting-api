import crypto from 'node:crypto';
import express from 'express';
import { loadConfig } from './config.js';
import { createLogger } from './logger.js';
import { AppError, NotFoundError, formatProblem } from './errors.js';
import { MatchRepository } from './repositories/matchRepository.js';
import { BetRepository } from './repositories/betRepository.js';
import { MatchService } from './services/matchService.js';
import { BetService } from './services/betService.js';
import { createMatchRouter } from './routes/matches.js';
import { createBetRouter } from './routes/bets.js';

export function createApp(configOverrides = {}) {
  const config = loadConfig(configOverrides);
  const logger = configOverrides.logger ?? createLogger(config.logLevel);

  // Wire dependencies in one place
  const matchRepo = configOverrides.matchRepo ?? new MatchRepository();
  const betRepo = configOverrides.betRepo ?? new BetRepository();
  const matchService = configOverrides.matchService ?? new MatchService(matchRepo, logger);
  const betService =
    configOverrides.betService ??
    new BetService(betRepo, matchRepo, logger, config.lockCutoffMinutes);

  const app = express();
  app.use(express.json());

  // Request ID + HTTP access logging middleware
  app.use((req, res, next) => {
    const requestId = req.header('X-Request-ID') || crypto.randomUUID().slice(0, 12);
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    res.on('finish', () => {
      logger.info('app.http', `${req.method} ${req.originalUrl} -> ${res.statusCode} [${requestId}]`);
    });
    next();
  });

  // Routes
  app.use('/matches', createMatchRouter(matchService));
  app.use('/bets', createBetRouter(betService));

  // Unknown routes -> 404
  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Centralized RFC 9457 error handler (4 arguments)
  app.use((err, req, res, next) => {
    if (err instanceof AppError) {
      return res
        .status(err.status)
        .type('application/problem+json')
        .json(formatProblem(err, req.requestId));
    }

    // Unexpected error: log full stack trace, hide details from client
    logger.error('app.error', `[${req.requestId}] ${err.stack || err.message}`);
    return res
      .status(500)
      .type('application/problem+json')
      .json(
        formatProblem(
          {
            status: 500,
            title: 'Internal Server Error',
            detail: 'Something went wrong',
            type: '/problems/internal-error',
          },
          req.requestId
        )
      );
  });

  return { app, config, services: { matchService, betService } };
}
