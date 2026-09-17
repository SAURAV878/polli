# Polli Backend (MongoDB)

Minimal Express API using MongoDB with Mongoose.

## Requirements
- Node.js 18+
- MongoDB (local or hosted)

## Environment
Create a `.env` file:

```
MONGODB_URI=mongodb://127.0.0.1:27017/polli
JWT_SECRET=replace-with-strong-secret
```

## Run
```
npm install
npm run dev
```

## API
Base URL: `http://localhost:1000/api`

### Authentication
- Login sets an `httpOnly` cookie named `token`.
- Protected routes require the cookie (handled by `isAuthenticated`).

### Data Types (User)
- `name`: string, required, max 20, trimmed
- `nationality`: string, required, max 40, trimmed
- `email`: string, required, unique, max 40, trimmed
- `password`: string, required, min 6 (stored hashed)
- `language`: array containing supported codes (`de`, `fr`, `en`, `es`, `it`, `pt`, `ja`, `ko`, `zh`, `ar`), default `["de"]`
- `level`: string, default `A1`, max 20

### Data Types (Progress)
- `userId`: ObjectId, required, ref `User`
- `language`: string, one of the supported language codes
- `totalTime`: number of seconds practiced during the week
- `dailyTime`: array of `{ day, seconds }` entries for the week
- `streakDate`: dates on which at least 180 seconds were practiced
- `streak`: number of streak-qualified days in the week, max 7
- `completedLesson`: lesson IDs such as `A1_1`
- `accuracy`: number, default 0, range 0-1
- `lastExercise`: exercise ID such as `A1_2`
- `weekStart`: UTC Monday starting the weekly record

### Endpoints
#### `POST /register`
Create a new user.

Request body:
```json
{
  "name": "string",
  "nationality": "string",
  "email": "string",
  "password": "string",
  "language": ["de"]
}
```

Status codes: `201` success, `400` validation, `409` user exists, `500` server error.

Success response:
```json
{
  "success": true,
  "message": "user created successfully",
  "token": "jwt-string",
  "user": { "id": "string", "email": "string", "name": "string", "language": ["de"] }
}
```

#### `POST /login`
Authenticate and set auth cookie.

Request body:
```json
{
  "email": "string",
  "password": "string"
}
```

Status codes: `200` success, `400` validation, `401` invalid credentials, `500` server error.

Success response:
```json
{
  "success": true,
  "message": "login successfully",
  "token": "jwt-string",
  "user": { "id": "string", "email": "string", "name": "string" }
}
```

#### `POST /logout`
Clear the authentication cookie and end the current session.

Success response:
```json
{ "success": true, "message": "logout successfully" }
```

#### `PUT /profile` (protected)
Update current user profile.

Request body (at least one field):
```json
{
  "name": "string",
  "password": "string"
}
```

Status codes: `200` success, `400` validation, `404` user not found, `500` server error.

Success response:
```json
{
  "success": true,
  "message": "profile updated successfully",
  "user": { "id": "string", "email": "string", "name": "string" }
}
```

#### `GET /fetch-profile` (protected)
Fetch current user profile.

Status codes: `200` success, `404` user not found, `500` server error.

Success response:
```json
{
  "success": true,
  "message": "profile fetched successfully",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "nationality": "string",
    "language": ["de"],
    "level": "string"
  }
}
```

#### `GET /progress` (protected)
Fetch current user progress.

Success response:
```json
{
  "message": "progress fetched successfully",
  "progress": {
    "id": "string",
    "userId": "string",
    "language": "de",
    "totalTime": 0,
    "dailyTime": [],
    "streakDate": [],
    "streak": 0,
    "completedLesson": [],
    "accuracy": 0.0,
    "lastExercise": null,
    "weekStart": "date"
  }
}
```

#### `PUT /progress` (protected)
Update current user progress (partial updates supported).

Request body (any of these fields; `language` may also be passed as a query parameter):
```json
{
  "language": "de",
  "totalTime": 900,
  "dailyTime": [{ "day": "mon", "seconds": 180 }],
  "streakDate": ["date"],
  "streak": 5,
  "completedLesson": ["A1_1"],
  "accuracy": 0.92,
  "lastExercise": "A1_2"
}
```

Success response:
```json
{
  "message": "progress updated successfully",
  "progress": {
    "id": "string",
    "userId": "string",
    "language": "de",
    "totalTime": 900,
    "dailyTime": [{ "day": "mon", "seconds": 180 }],
    "streakDate": ["date"],
    "streak": 5,
    "completedLesson": ["A1_1"],
    "accuracy": 0.92,
    "lastExercise": "A1_2",
    "weekStart": "date"
  }
}
```

### Common Error Messages
- `all fields are required`
- `invalid credentials`
- `user already exists`
- `user not found`
- `database error`
- `at least one field is required`
