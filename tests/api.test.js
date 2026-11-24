import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Fantasy Football API', () => {
  it('POST /matches returns 201 with Location header', async () => {
    const { app } = createApp({ LOG_LEVEL: 'ERROR' });
    const futureKickoff = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/matches')
      .send({
        competition: 'Premier League',
        homeTeam: 'Manchester City',
        awayTeam: 'Arsenal',
        kickoffAt: futureKickoff,
        odds: { HOME: 1.85, DRAW: 3.6, AWAY: 4.2 },
      });

    assert.equal(res.status, 201);
    assert.equal(res.headers.location, '/matches/1');
    assert.ok(res.headers['x-request-id']);
  });

  it('GET /matches/:id returns 404 in RFC 9457 format for unknown match', async () => {
    const { app } = createApp({ LOG_LEVEL: 'ERROR' });
    const res = await request(app).get('/matches/999');

    assert.equal(res.status, 404);
    assert.match(res.headers['content-type'], /application\/problem\+json/);
    assert.equal(res.body.type, '/problems/not-found');
    assert.ok(res.body.requestId);
  });

  it('POST /bets returns 422 with field-level errors on invalid input', async () => {
    const { app } = createApp({ LOG_LEVEL: 'ERROR' });
    const res = await request(app).post('/bets').send({
      userId: 'user-1',
      matchId: 1,
      outcome: 'INVALID_MARKET',
      stake: -50,
    });

    assert.equal(res.status, 422);
    assert.match(res.headers['content-type'], /application\/problem\+json/);
    assert.ok(res.body.errors.outcome);
    assert.ok(res.body.errors.stake);
  });

  it('POST /bets returns 409 when match is past the lock cutoff', async () => {
    const { app } = createApp({ LOG_LEVEL: 'ERROR', LOCK_CUTOFF_MINUTES: 15 });
    const soonKickoff = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 mins from now (locked)

    const matchRes = await request(app)
      .post('/matches')
      .send({
        competition: 'La Liga',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        kickoffAt: soonKickoff,
        odds: { HOME: 2.2, DRAW: 3.3, AWAY: 3.1 },
      });

    const betRes = await request(app).post('/bets').send({
      userId: 'user-1',
      matchId: matchRes.body.id,
      outcome: 'HOME',
      stake: 100,
    });

    assert.equal(betRes.status, 409);
    assert.match(betRes.headers['content-type'], /application\/problem\+json/);
    assert.equal(betRes.body.type, '/problems/conflict');
  });

  it('POST /bets returns 201 and GET /bets lists placed bets', async () => {
    const { app } = createApp({ LOG_LEVEL: 'ERROR' });
    const futureKickoff = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const matchRes = await request(app)
      .post('/matches')
      .send({
        competition: 'Premier League',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        kickoffAt: futureKickoff,
        odds: { HOME: 1.9, DRAW: 3.5, AWAY: 4.0 },
      });

    const betRes = await request(app).post('/bets').send({
      userId: 'user-1',
      matchId: matchRes.body.id,
      outcome: 'HOME',
      stake: 100,
    });

    assert.equal(betRes.status, 201);
    assert.equal(betRes.headers.location, '/bets/1');

    const listRes = await request(app).get('/bets');
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.length, 1);
  });
});
