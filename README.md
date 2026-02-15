# Study Planner

프로젝트 구조:

- `front`: React + Vite 프론트엔드
- `backend`: Spring Boot 백엔드 (JWT + MySQL)
- `db`: MySQL Docker 구성

## 실행 순서

1. DB 실행
```bash
cd db
docker compose up -d
```

2. 백엔드 실행
```bash
cd backend
DB_HOST=127.0.0.1 DB_PORT=3307 DB_NAME=study_planner DB_USERNAME=root DB_PASSWORD=root ./gradlew bootRun
```

3. 프론트 실행
```bash
cd front
npm run dev
```
