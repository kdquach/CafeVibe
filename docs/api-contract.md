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

Search for cafes based on criteria.

**Request Body:**
```json
{
  "query": "string (required, min 1 char)"
}
```

The `query` field is parsed server-side to extract search intent. The SimpleIntentBuilder supports:
- District keywords: "d1", "district 1", "q1", etc.
- Price: "cheap", "budget", "mid", "expensive", "premium", "luxury"
- Amenities: "wifi", "parking", "work", "office"
- Open now: "open now", "currently open"
- Rating: "highly rated", "top rated", "well rated", "good rating"

**Request Example:**
```json
{
  "query": "wifi d1 budget open now"
}
```

**Response (Success):**
```json
{
  "data": [
    {
      "id": "cafe-001",
      "name": "[MOCK] Modern Cafe D1",
      "district": "District 1",
      "address": "[MOCK] 45 Street D1",
      "priceLevel": 2,
      "constraints": [
        { "name": "location", "status": "met" },
        { "name": "budget", "status": "met" },
        { "name": "amenities", "status": "met" },
        { "name": "openNow", "status": "unknown" }
      ],
      "hasUnmetRequired": false
    }
  ]
}
```

**Response Fields:**
- `id`: Unique cafe identifier
- `name`: Cafe name
- `district`: District name
- `address`: Physical address
- `priceLevel`: Price level 1-4 (1=budget, 4=luxury), or null if unknown
- `constraints`: Array of evaluated search constraints, each with:
  - `name`: Constraint identifier (location, budget, amenities, openNow, rating)
  - `status`: Evaluation result—`met` (satisfied), `not_met` (failed), or `unknown` (insufficient data)
- `hasUnmetRequired`: Boolean flag—true if any required constraint has status `not_met` or `unknown`

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

## Search Algorithm

Results are ranked by "strength"—a score 0-100 combining:

- **Base score:** 50
- **District match:** +15
- **Price proximity:** +10 (adjusted by distance from mid-range)
- **Amenities:** +5 per matched amenity
- **Rating match:** +10 (adjusted by proximity to minRating)
- **Open now:** +20 (if openNow=true and cafe is currently open)

Maximum strength is capped at 100. Results with equal strength are sorted alphabetically by name.

**Timezone:** UTC+7 is used for all opening hours calculations.

## Time Zones

All timestamps in responses are in ISO 8601 format (UTC). Opening hour calculations use UTC+7 (Vietnam timezone).

## Environment Variables

- `FRONTEND_ORIGIN`: Required URL of the frontend origin for CORS
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment mode (default: development)
- `PLACE_PROVIDER`: Data provider strategy (default: mock)
