# Study Planner

스터디 일정 관리, 집중 타이머, 캘린더, JWT 인증을 포함한 풀스택 프로젝트입니다.

## 프로젝트 구조
- `front`: React + Vite 프론트엔드
- `backend`: Spring Boot 백엔드 API
- `db`: 로컬 MySQL(Docker Compose)

## 기술 스택과 선택 이유

### Frontend
- React 18
이유: 상태 기반 UI와 컴포넌트 재사용에 유리하고 생태계가 안정적입니다.
- TypeScript
이유: DTO/응답 타입을 명확히 관리해 API 연동 시 런타임 오류를 줄입니다.
- Vite 5
이유: 개발 서버와 빌드 속도가 빠르고 설정이 단순합니다.
- Custom CSS
이유: 디자인 자유도가 높고 프로젝트 톤에 맞게 세밀한 UI 조정이 가능합니다.

### Backend
- Java 17 + Spring Boot 3.3
이유: 검증/보안/JPA/메일 등 실서비스에 필요한 구성이 표준화되어 있습니다.
- Spring Security + JWT
이유: 세션 없이 토큰 기반 인증을 안정적으로 처리할 수 있습니다.
- Spring Data JPA
이유: 반복적인 SQL 보일러플레이트를 줄이고 도메인 중심으로 개발 가능합니다.
- Spring Mail
이유: 이메일 인증코드 발송 기능을 빠르게 구성할 수 있습니다.

### Database
- MySQL 8
이유: 관계형 모델에 익숙하고 Spring/JPA와 궁합이 좋습니다.

## 주요 기능
- JWT 로그인/인증
- 이메일 인증코드 기반 회원가입
- 일정 CRUD
- 반복 일정(매일/매주)
- 우선순위/정렬/드래그 이동
- 집중 타이머 + 알림 설정

## 로컬 실행

### 1) DB
```bash
cd db
docker compose up -d
```

기본 값:
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

메일 인증을 쓰려면 SMTP 환경변수 설정 필요:
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM`

참고: `backend/.env.example`

### 3) Frontend
```bash
cd front
npm ci
npm run dev
```

기본 API 주소:
- `http://localhost:8080`
- 프론트 변경 값: `VITE_API_BASE_URL`

## 무료 배포 가이드

### 권장 구성(무료)
- Frontend: Render Static Site (free)
- Backend: Render Web Service (free)
- Database: TiDB Cloud Serverless (MySQL 호환, free tier)

### 배포 준비 파일
- `render.yaml`: Render 블루프린트
- `backend/Dockerfile`: 백엔드 컨테이너 빌드
- `backend/src/main/java/com/studyplanner/backend/common/HealthController.java`: 헬스체크(`/api/health`)

### 배포 순서
1. TiDB Cloud에서 Serverless 클러스터 생성
2. 연결 정보(host, db, user, password) 확보
3. Render에서 이 GitHub 레포 연결 후 Blueprint 배포(`render.yaml` 사용)
4. Render 환경변수 설정
- `DB_HOST`, `DB_PORT(기본 4000)`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`
- 프론트의 `VITE_API_BASE_URL`을 백엔드 URL로 설정

## CI
- GitHub Actions: `.github/workflows/ci.yml`
- Frontend: `npm run build`
- Backend: `./gradlew compileJava`
