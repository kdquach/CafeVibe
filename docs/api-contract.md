# CafeVibe API Contract

## Overview

The CafeVibe backend provides a RESTful API for searching and discovering cafes based on location, price, amenities, and opening hours.

## Base URL

```
http://localhost:4000/api/v1
```

## Response Envelope

All responses follow a consistent envelope structure.

### Success Response (2xx)

```json
{
  "data": <T>
}
```

### Error Response (4xx, 5xx)

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Endpoints

### GET /health

Health check endpoint to verify the server is running.

**Response:**
```json
{
  "data": {
    "status": "ok",
    "timestamp": "2026-10-15T21:15:00.000Z"
  }
}
```

**Status:** 200 OK

---

### POST /search/intent

Extract search intent from a natural-language query (mock, rule-based in Phase 4a).

**Request Body:**
```json
{
  "query": "string (required, min 1 char, max 500 chars)"
}
```

**Response (Success):**
```json
{
  "data": {
    "query": "Quán yên tĩnh để làm việc ở Gò Vấp, dưới 70.000đ",
    "districts": [{ "name": "Gò Vấp", "strength": "required" }],
    "budget": { "maxVnd": 70000, "strength": "required" },
    "amenities": [
      { "name": "quiet", "strength": "preferred" },
      { "name": "work-friendly", "strength": "preferred" }
    ]
  }
}
```

Response matches `SearchIntentSchema` (fields not detected are omitted, never fabricated).

**Status Codes:**

| Code | Error Code | Meaning |
|------|-----------|---------|
| 200 | — | Success, intent extracted |
| 400 | INVALID_REQUEST | Request body validation failed |
| 400 | INVALID_JSON | Request body is not valid JSON |
| 413 | PAYLOAD_TOO_LARGE | Request body exceeds 100KB limit |
| 502 | INTENT_EXTRACTION_FAILED | Extractor error or invalid output |

---

### POST /search

Search for cafes using a confirmed intent object.

**Request Body:**
```json
{
  "intent": {
    "query": "string (required, min 1 char)",
    "districts": [{ "name": "District 1", "strength": "required" }],
    "budget": { "maxVnd": 70000, "strength": "required" }
  }
}
```

The `intent` object matches `SearchIntentSchema`. A legacy body with only `{ "query" }` returns 400 INVALID_REQUEST.

**Request Example:**
```json
{
  "intent": {
    "query": "quiet cafe in District 1 under 70000",
    "districts": [{ "name": "District 1", "strength": "required" }],
    "budget": { "maxVnd": 70000, "strength": "required" },
    "amenities": [{ "name": "quiet", "strength": "preferred" }]
  }
}
```

**Response (Success):**
```json
{
  "data": {
    "results": [
      {
        "id": "cafe-001",
        "name": "[MOCK] Modern Cafe D1",
        "district": "District 1",
        "address": "[MOCK] 45 Street D1",
        "priceLevel": 2,
        "source": "mock",
        "constraints": [
          { "name": "location", "status": "met" },
          { "name": "budget", "status": "met" },
          { "name": "amenities", "status": "met" },
          { "name": "openNow", "status": "unknown" }
        ],
        "hasUnmetRequired": false
      }
    ],
    "warnings": []
  }
}
```

**Response Fields:**
- `results`: Array of matched cafes in provider order (no ranking or sorting in this phase)
- `results[].source`: Data source — `mock` for fixture data, `provider` for a real provider
- `results[].constraints`: Array of evaluated search constraints, each with:
  - `name`: Constraint identifier (location, budget, amenities, openNow, rating)
  - `status`: Evaluation result—`met` (satisfied), `not_met` (failed), or `unknown` (insufficient data)
- `results[].hasUnmetRequired`: Boolean flag—true if any required constraint has status `not_met` or `unknown`
- `results`: A place is excluded when a required constraint evaluates to `not_met`; required + `unknown` keeps the place with the flag set. Preferred constraints never exclude.
- `warnings`: Array of `{ code, message }` objects. Unsupported districts return 200 with empty `results` and a `LOCATION_NOT_SUPPORTED` warning. Budget is compared in VND only (`minPriceVnd <= budget.maxVnd`); a place with only `priceLevel` evaluates to `unknown`, never mapped from price level. A missing amenity tag evaluates to `unknown`, never `not_met` (absence of a tag is not evidence of absence).

**Status Codes:**

| Code | Error Code | Meaning |
|------|-----------|---------|
| 200 | — | Success, results returned (may be empty) |
| 400 | INVALID_REQUEST | Request body validation failed |
| 400 | INVALID_JSON | Request body is not valid JSON |
| 413 | PAYLOAD_TOO_LARGE | Request body exceeds 100KB limit |
| 429 | RATE_LIMITED | Rate limit exceeded |
| 502 | SERVICE_UNAVAILABLE | Provider service error |
| 504 | SERVICE_UNAVAILABLE | Provider service timeout |
| 500 | INTERNAL_ERROR | Unexpected server error |

## Error Examples

### Invalid Request
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid search intent."
  }
}
```

### Malformed JSON
```json
{
  "error": {
    "code": "INVALID_JSON",
    "message": "Request body is not valid JSON."
  }
}
```

### Rate Limited
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later."
  }
}
```

## CORS

The API is configured to accept requests from the frontend origin specified in the `FRONTEND_ORIGIN` environment variable.

## Result Ordering

Results are returned in provider order. Ranking, scoring, filters, and sorting are Phase 5 scope.

**Timezone:** UTC+7 is used for all opening hours calculations.

## Time Zones

All timestamps in responses are in ISO 8601 format (UTC). Opening hour calculations use UTC+7 (Vietnam timezone).

## Environment Variables

- `FRONTEND_ORIGIN`: Required URL of the frontend origin for CORS
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment mode (default: development)
- `PLACE_PROVIDER`: Data provider strategy (default: mock)
