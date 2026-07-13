# READi ERP

> Ready Robust Machine 통합 ERP 프로젝트

현재 상태: MVP 개발 중 (`v0.1.0`)

---

# 프로젝트 소개

READi ERP는 Readi Robust Machine의 업무를 하나의 웹 시스템으로 통합하기 위한 ERP 프로젝트입니다.

현재는 Airtable을 Database(DB)로 사용하지만,
향후 PostgreSQL(MySQL 등 SQL DB)로 쉽게 전환할 수 있도록 설계합니다.

목표는 단순한 업무 프로그램이 아니라

- 구매
- 재고
- BOM
- 프로젝트
- 차량
- 장비 상태

까지 하나의 시스템에서 운영하는 것입니다.

---

# 개발 철학

"작게 시작하고, 쉽게 확장한다."

- 처음부터 모든 기능을 만들지 않는다.
- 핵심 기능이 안정적으로 동작하는 것을 최우선으로 한다.
- 확장은 기존 구조를 유지하면서 모듈만 추가한다.
- "나중에 만들 기능" 때문에 지금의 개발 속도를 늦추지 않는다.

---

# 프로젝트 목표

## v0.1.0 개발 범위

- Dashboard
- 구매관리
- 재고관리
- BOM 관리
- 차량관리

---

## 향후 확장

- 인사관리
- 자산관리
- 프로젝트 관리
- 예산관리
- KPI
- 전자결재
- 알림
- 모바일

---

# 시스템 구조

```
사용자

↓

READi ERP

↓

Service

↓

Repository

↓

Database(Airtable)

↓

향후 PostgreSQL
```

## 쉽게 설명

사용자는 Airtable을 직접 사용하지 않습니다.

항상

웹페이지

↓

프로그램

↓

DB

순서로 데이터를 가져옵니다.

이렇게 만들어야 나중에 SQL로 바꾸더라도 화면은 그대로 사용할 수 있습니다.

---

# 기술 스택

| 기술 | 설명 |
|-------|------|
| Next.js | 웹사이트를 만드는 프로그램 |
| React | 화면을 만드는 기술 |
| TypeScript | 오류를 줄여주는 JavaScript |
| Tailwind CSS | 디자인를 쉽게 만드는 도구 |
| Airtable | 현재 Database |
| PostgreSQL | 앞으로 사용할 Database |

---

# 프로젝트 구조

```
app
│
├ dashboard
├ purchase
├ inventory
├ bom
├ project
├ vehicle
└ admin

components

features

server

lib

types

docs
```

---

# 각 폴더 설명

## app

실제 화면이 들어있는 폴더

예)

```
구매관리 화면

재고관리 화면

Dashboard
```

---

## components

공통으로 사용하는 UI

예)

```
버튼

검색창

테이블

팝업
```

한 번 만들어두면 모든 화면에서 사용합니다.

---

## features

기능별 코드

예)

```
구매

재고

프로젝트
```

각 기능을 독립적으로 관리합니다.

---

## server

업무 로직

예)

```
발주 생성

재고 차감

입고 처리
```

---

## lib

공통 기능

예)

```
Airtable 연결

날짜 계산

공통 함수
```

---

## types

데이터 형식

예)

```
품목

거래처

프로젝트
```

---

## docs

설계 문서

---

# 개발 원칙

## 1. DB 직접 접근 금지

화면에서는 Database를 직접 호출하지 않습니다.

항상

```
화면

↓

Service

↓

Repository

↓

Database
```

를 사용합니다.

---

## 2. 기능별 개발

모든 기능은 Module 단위로 개발합니다.

예)

```
구매

재고

프로젝트
```

---

## 3. 재사용

같은 버튼을 여러 번 만들지 않습니다.

한 번 만든 버튼은

모든 화면에서 사용합니다.

---

## 4. SQL 전환 가능

현재는 Airtable을 사용하지만

앞으로 SQL로 바꿔도

UI는 수정하지 않도록 설계합니다.

---

# Database 정책

현재

```
Airtable
```

↓

향후

```
PostgreSQL

또는

MySQL
```

Database가 바뀌더라도

ERP는 그대로 사용할 수 있도록 개발합니다.

---

# 성능 목표

- 첫 화면 2초 이내
- 빠른 검색
- API 최소 호출
- Cache 사용
- Lazy Loading 적용
- Pagination 적용

---

# 개발 순서

## STEP 1

Dashboard

↓

## STEP 2

구매관리

↓

## STEP 3

재고관리

↓

## STEP 4

BOM

↓

## STEP 5

프로젝트

↓

## STEP 6

차량관리

↓

## STEP 7

관리자

---

# 실행 방법

프로젝트 실행

```bash
npm run dev
```

브라우저 접속

```
http://localhost:3000
```

---

# 문서

프로젝트 설계 문서는 docs 폴더에서 관리합니다.

```
docs

01_PRD.md

02_ARCHITECTURE.md

03_DATABASE.md

04_UI.md

05_DEVELOP_RULE.md

06_CHANGELOG.md
```

---

# Version

현재 버전

```
v1.0.0
```

개발 진행에 따라 Version을 관리합니다.
