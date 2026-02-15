# Study Planner Backend (Spring Boot + MySQL)

## Stack
- Spring Boot 3.3
- Spring Security + JWT
- Spring Data JPA
- MySQL 8

## Run MySQL
```bash
cd ../db
docker compose up -d
```

## Run Backend
This project uses Gradle.

```bash
cd backend
./gradlew bootRun
```

If `gradlew` is not available, install Gradle locally and run:
```bash
gradle bootRun
```

## Env vars
Copy `.env.example` values into your shell or `.env` loader.

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`
- `SERVER_PORT`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS`

## Main APIs
Base URL: `http://localhost:8080`

### Auth
- `POST /api/auth/register/request-code`
- `POST /api/auth/register/verify-code`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Tasks
- `POST /api/tasks`
- `GET /api/tasks?date=2026-02-15&priority=HIGH&sort=priority`
- `GET /api/tasks/calendar?month=2026-02`
- `PATCH /api/tasks/{taskId}`
- `PATCH /api/tasks/{taskId}/toggle`
- `PATCH /api/tasks/{taskId}/move`
- `DELETE /api/tasks/{taskId}`

### User Data
- `GET /api/user/settings`
- `PATCH /api/user/settings`
- `GET /api/user/focus?date=2026-02-15`
- `POST /api/user/focus`

## Auth header
For protected APIs:
```http
Authorization: Bearer <JWT_TOKEN>
```
