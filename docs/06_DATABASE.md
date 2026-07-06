# READi ERP
# 06_DATABASE

Version : 1.0

---

# 1. 목적

READi ERP의 Database 구조와 데이터 흐름을 정의한다.

READi ERP는 하나의 ERP에서 여러 종류의 Database를 사용할 수 있도록 설계한다.

현재는 Airtable과 Google Sheets를 사용하며,
향후 PostgreSQL(MySQL 등 SQL Database)로 전환 가능하도록 개발한다.

---

# 2. Database 구성

| 기능 | Database |
|------|-----------|
| 구매 | Airtable |
| 재고 | Airtable |
| BOM | Airtable |
| 법인차량 | Google Sheets |
| 장비관리 | 예정 |
| 프로젝트관리 | 예정 |
| 인사(HR) | 예정 |

---

# 3. Data Flow

READi ERP는 화면에서 Database를 직접 호출하지 않는다.

항상 아래 구조를 따른다.

```text
Page
↓
Service
↓
Repository
↓
Database
```

---

## 조회

```text
사용자

↓

Page

↓

Service

↓

Repository

↓

Database

↓

Repository

↓

Service

↓

Page
```

---

## 저장

```text
사용자 입력

↓

Page

↓

Service

↓

Repository

↓

Database
```

---

# 4. 계층별 역할

## Page

사용자가 보는 화면

역할

- 화면 표시
- 사용자 입력
- Service 호출

Page에서는 Database를 직접 호출하지 않는다.

---

## Service

업무 로직 처리

예)

- 구매 진행 건수
- 재고 부족 계산
- 입고 예정 계산

---

## Repository

Database 접근 전용

예)

- Airtable 조회
- Airtable 저장
- Google Sheets 조회
- SQL 조회

---

## Database

실제 데이터를 저장하는 공간

현재

- Airtable
- Google Sheets

향후

- PostgreSQL
- MySQL

---

# 5. 기능별 Repository

## 구매

```text
Purchase Page

↓

Purchase Service

↓

Purchase Repository

↓

Airtable
```

---

## 재고

```text
Inventory Page

↓

Inventory Service

↓

Inventory Repository

↓

Airtable
```

---

## BOM

```text
Bom Page

↓

Bom Service

↓

Bom Repository

↓

Airtable
```

---

## 법인차량

```text
Vehicle Page

↓

Vehicle Service

↓

Vehicle Repository

↓

Google Sheets
```

---

# 6. 현재 READi DB

현재 READi DB(Base)는 구매와 재고만 관리한다.

구성

```text
READi DB

├ Purchase
├ Inventory
├ BOM
```

포함

- 구매요청
- 발주
- 입고
- 거래처
- 품목
- 재고
- BOM

제외

- 법인차량
- 장비관리
- 프로젝트
- 인사(HR)

---

# 7. 향후 Database 구조

```text
READi ERP

├ Purchase
│
├ Inventory
│
├ BOM
│
└ Airtable

────────────────────

Vehicle

└ Google Sheets

────────────────────

Equipment

└ SQL

────────────────────

Project

└ SQL

────────────────────

HR

└ SQL
```

Database가 변경되더라도

Page와 Service는 수정하지 않는다.

Repository만 변경하여 대응한다.

---

# 8. 개발 원칙

1. Page는 Database를 직접 호출하지 않는다.

2. 모든 Database 접근은 Repository에서 수행한다.

3. 업무 로직은 Service에서 처리한다.

4. 기능별로 독립적으로 개발한다.

5. Database가 변경되어도 UI는 수정하지 않는다.

6. 새로운 기능은 기존 구조(Page → Service → Repository → Database)를 유지한다.