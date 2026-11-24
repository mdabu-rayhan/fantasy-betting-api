# Fantasy Football Prediction Platform — Backend Slice (CSE 3102L Lab 04)

## Framework Choice
**Node.js + Express** was chosen because it matches the backend stack of our main course project (Fantasy Football Prediction Platform) and allows explicit control over layered architecture and middleware ordering.

## How to Run
```bash
git clone <your-repo-url>
cd fantasy-betting-api
cp .env.example .env
npm install
npm start
```

## How to Test
```bash
npm test
```

## Architecture Note
| Layer | Files | Responsibility |
| :--- | :--- | :--- |
| **Domain** | `src/domain/match.js`, `src/domain/bet.js` | Pure entities and business rules (lock cutoff, odds snapshot, payout calculation). No Express or DB imports. |
| **Repository** | `src/repositories/matchRepository.js`, `src/repositories/betRepository.js` | In-memory storage for matches and bets. Swappable for Prisma/PostgreSQL without touching other layers. |
| **Service** | `src/services/matchService.js`, `src/services/betService.js` | Use-case orchestration (one-bet-per-match check, service logging). Receives repositories via dependency injection. |
| **Routes (Handlers)** | `src/routes/matches.js`, `src/routes/bets.js` | Thin HTTP handlers: validates input with Zod (`422`), calls services, returns status codes and `Location` headers. |
| **App & Operations** | `src/app.js`, `src/config.js`, `src/errors.js`, `src/logger.js` | Dependency wiring, environment config, Request ID middleware, structured logs, and centralized RFC 9457 error handling. |

## Operational & RFC 9457 Error Details
All errors return `application/problem+json` formatted responses following **RFC 9457**:
- `type`: URI identifying the problem type (e.g. `/problems/conflict`, `/problems/validation-failed`).
- `title`: Short human-readable summary.
- `status`: HTTP status code (`404`, `409`, `422`, `500`).
- `detail`: Detailed occurrence explanation.
- `requestId`: Unique correlation identifier matching the `X-Request-ID` header.
- `errors` *(optional)*: Field-level validation map for `422` responses.
- Stack traces for `500 Internal Server Error` are logged on the server and never leaked to the client.

## API Reference

### Matches
- `POST /matches` — Create a new match fixture (`201 Created` + `Location: /matches/:id`).
- `GET /matches` — List all matches (`200 OK`).
- `GET /matches/:id` — Get match by ID (`200 OK` or `404 Not Found`).

### Bets
- `POST /bets` — Place a bet (`201 Created` + `Location: /bets/:id`). Rejects with `409 Conflict` if the match kickoff lock cutoff has passed or if the user already bet on that match. Returns `422 Unprocessable Content` if input is invalid.
- `GET /bets` — List all bets (`200 OK`).
- `GET /bets/:id` — Get bet by ID (`200 OK` or `404 Not Found`).

## AI-Use Disclosure
* **What helped:** Used Gemini to map the course project's Match & Bet Placement feature to the lab's layered architecture and scaffold the Express boilerplate, RFC 9457 error formatter, and test suite.
* **What I verified:** Ran all automated tests (`npm test`), manually tested endpoints with `curl`/Postman, verified `404`/`409`/`422` RFC 9457 responses, and reviewed every file to ensure clean layer separation.
