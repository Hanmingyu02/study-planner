# Study Planner Backend (Spring Boot + MySQL Compatible DB)

## Stack
- Spring Boot 3.3
- Spring Security + JWT
- Spring Data JPA
- Spring Mail
- MySQL compatible DB (MySQL / TiDB)

## Run Local DB
```bash
cd ../db
docker compose up -d
```

## Run Backend
```bash
cd backend
./gradlew bootRun
```

## Env vars
Copy `backend/.env.example` values into your shell or deployment platform.

필수:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`

선택:
- `DB_PARAMS` (기본: `serverTimezone=UTC&characterEncoding=UTF-8`)
- `SERVER_PORT`
- `JWT_EXPIRATION_MS`

메일 인증 사용 시:
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `MAIL_SMTP_AUTH`
- `MAIL_SMTP_STARTTLS_ENABLE`
- `MAIL_VERIFICATION_EXP_MINUTES`

## TiDB Serverless 권장 DB_PARAMS
```text
sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3&serverTimezone=UTC&characterEncoding=UTF-8
```

## Health Check
- `GET /api/health`

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
