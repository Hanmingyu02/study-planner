# Study Planner

스터디 일정 관리, 집중 타이머, 캘린더, JWT 인증, 이메일 인증 회원가입을 포함한 풀스택 프로젝트입니다.

## 프로젝트 구조
- `front`: React + Vite 프론트엔드
- `backend`: Spring Boot 백엔드 API
- `db`: 로컬 MySQL(Docker Compose, 개발용)

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
이유: 반복 SQL 보일러플레이트를 줄이고 도메인 중심으로 개발 가능합니다.
- Spring Mail
이유: 이메일 인증코드 발송 기능을 빠르게 구성할 수 있습니다.

### Database
- MySQL 호환 DB (로컬 MySQL 8 / 운영 TiDB Serverless)
이유: 관계형 모델에 익숙하고 Spring/JPA와 궁합이 좋으며, TiDB는 무료 서버리스 티어를 제공합니다.

## 주요 기능
- JWT 로그인/인증
- 이메일 인증코드 기반 회원가입
- 일정 CRUD
- 반복 일정(매일/매주)
- 우선순위/정렬/드래그 이동
- 집중 타이머 + 브라우저 알림

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
- 프론트 환경변수: `VITE_API_BASE_URL`

## 무료 배포 가이드 (요청 스택)

### 1) Frontend: GitHub Pages (무료)
이 레포에는 GitHub Actions 배포 워크플로우가 포함되어 있습니다.
- 파일: `.github/workflows/deploy-frontend-pages.yml`
- 트리거: `main` 브랜치 push

설정:
1. GitHub 저장소 `Settings > Pages`에서 `Build and deployment`를 `GitHub Actions`로 설정
2. `Settings > Secrets and variables > Actions > Variables`에 아래 추가
- `VITE_API_BASE_URL`: 백엔드 실제 URL (예: `https://your-api.koyeb.app`)

참고:
- Pages 배포 경로를 위해 `VITE_BASE_PATH=/study-planner/`를 워크플로우에서 주입합니다.
- 사용자 페이지가 아니라 프로젝트 페이지 기준(`https://<user>.github.io/study-planner/`)입니다.

### 2) Backend: Koyeb Free 또는 Fly.io Free
이 레포의 `backend/Dockerfile`로 컨테이너 배포 가능합니다.

#### Koyeb Free
1. Koyeb에서 `Create App > GitHub`로 이 레포 연결
2. Service root directory를 `backend`로 지정
3. Build 방식은 Dockerfile 사용
4. 환경변수 설정(아래 `운영 환경변수` 참고)
5. 헬스체크 경로: `/api/health`

#### Fly.io Free(크레딧/정책 변동 가능)
1. Fly CLI 설치 후 `backend` 디렉터리에서 `fly launch`
2. Dockerfile 기반 배포 선택
3. `fly secrets set`으로 환경변수 주입
4. `fly deploy`

### 3) DB: TiDB Cloud Serverless (MySQL 호환, 무료 티어)
1. TiDB Cloud에서 Serverless 클러스터 생성
2. Database / User 생성
3. 네트워크 접근 허용(배포 플랫폼 egress IP 또는 공개 접근 정책 확인)
4. 백엔드 환경변수에 TiDB 접속 정보 설정

운영 권장 환경변수 예시:
- `DB_HOST=<tidb-host>`
- `DB_PORT=4000`
- `DB_NAME=study_planner`
- `DB_USERNAME=<tidb-user>`
- `DB_PASSWORD=<tidb-password>`
- `DB_PARAMS=sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3&serverTimezone=UTC&characterEncoding=UTF-8`
- `JWT_SECRET=<충분히 긴 랜덤 문자열>`
- `SERVER_PORT=8080`
- 메일 관련: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`

## 비용 관련 메모
- GitHub Pages: 무료(정적 사이트)
- Koyeb/Fly.io: 무료 플랜은 사용량/슬립/리전/아웃바운드 제한이 있습니다.
- TiDB Serverless: 무료 티어 한도 내 무료, 초과 시 과금될 수 있습니다.

요약: "절대 0원 보장"은 아니고, 무료 한도 내 운영은 가능합니다. 운영 전 각 서비스의 2026년 현재 요금/제한 정책을 확인하세요.

## CI
- GitHub Actions: `.github/workflows/ci.yml`
- Frontend: `npm run build`
- Backend: `./gradlew compileJava`
