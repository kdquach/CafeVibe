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

### POST /search

Search for cafes based on criteria.

**Request Body:**
```json
{
  "query": "string (required, min 1 char)",
  "districts": ["string"],
  "priceRange": [number, number],
  "amenities": ["string"],
  "openNow": "boolean",
  "minRating": "number (0-5)"
}
```

**Request Example:**
```json
{
  "query": "quiet coffee",
  "districts": ["District 1", "District 3"],
  "priceRange": [1, 3],
  "amenities": ["wifi", "parking"],
  "openNow": true,
  "minRating": 4.0
}
```

**Response (Success):**
```json
{
  "data": [
    {
      "id": "cafe-001",
      "name": "Highlands Coffee District 1",
      "district": "District 1",
      "address": "45 Nguyễn Hữu Cảnh, District 1",
      "priceLevel": 2,
      "strength": 85
    }
  ]
}
```

**Response Fields:**
- `id`: Unique cafe identifier
- `name`: Cafe name
- `district`: District name
- `address`: Physical address
- `priceLevel`: Price level 1-4 (1=budget, 4=luxury)
- `strength`: Match strength 0-100 (higher=better match)

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
