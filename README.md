# Study Planner

스터디 일정 관리, 집중 타이머, 캘린더, JWT 인증을 포함한 풀스택 프로젝트입니다.

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite 5
- CSS (custom)

### Backend
- Java 17
- Spring Boot 3.3
- Spring Security + JWT
- Spring Data JPA
- Spring Mail

### Database
- MySQL 8 (Docker Compose)

## Project Structure

- `front` : 사용자 UI, 일정/타이머/인증 화면
- `backend` : 인증/일정/설정/집중기록 API
- `db` : MySQL 컨테이너 및 초기화 스크립트

## Key Features

- JWT 기반 로그인/인증
- 이메일 인증코드 기반 회원가입
- 일정 CRUD
- 반복 일정(매일/매주)
- 우선순위/정렬/날짜 이동(드래그)
- 집중 타이머 + 알림 설정

## Quick Start

### 1) Database
```bash
cd db
docker compose up -d
```

기본 접속 정보:
- Host: `127.0.0.1`
- Port: `3307`
- DB: `study_planner`
- User: `root`
- Password: `root`

### 2) Backend
```bash
cd backend
DB_HOST=127.0.0.1 DB_PORT=3307 DB_NAME=study_planner DB_USERNAME=root DB_PASSWORD=root ./gradlew bootRun
```

메일 인증 사용 시 SMTP 환경변수도 설정해야 합니다.
참고: `backend/.env.example`

### 3) Frontend
```bash
cd front
npm ci
npm run dev
```

기본 API 주소:
- `http://localhost:8080`
- 프론트에서 변경하려면 `VITE_API_BASE_URL` 사용

## CI

GitHub Actions가 자동으로 아래를 검사합니다.
- Frontend: `npm run build`
- Backend: `./gradlew compileJava`

워크플로 파일:
- `.github/workflows/ci.yml`
