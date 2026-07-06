# READi ERP
# System Architecture

Version : 1.0

---

# 목적

READi ERP는

Airtable을 시작으로

향후 SQL Database로 전환 가능한 구조를 목표로 한다.

Database가 변경되어도

UI는 수정하지 않는다.

---

# 전체 구조

```
사용자

↓

Web Browser

↓

READi ERP

↓

Service Layer

↓

Repository Layer

↓

Database

(Airtable)

↓

향후 PostgreSQL
```

---

# 구조 설명

## User

직원

관리자

창고담당

구매담당

---

## Web

사용자가 사용하는 ERP 화면

Database를 직접 접근하지 않는다.

---

## Service

업무 처리

예)

발주 생성

입고 처리

재고 계산

---

## Repository

Database 담당

현재

Airtable

향후

PostgreSQL

---

## Database

현재

Airtable

향후

PostgreSQL

또는

MySQL

---

# 데이터 흐름

```
사용자

↓

Dashboard

↓

Service

↓

Repository

↓

Airtable
```

반대로 저장은

```
사용자

↓

입고등록

↓

Service

↓

Repository

↓

Airtable
```

---

# 계층별 역할

## app

화면

---

## Service

업무

---

## Repository

Database

---

## Database

데이터 저장

---

# 개발 원칙

UI는

Service만 호출한다.

Service는

Repository만 호출한다.

Repository는

Database만 호출한다.

---

# 장점

Database 교체 가능

Business Logic 재사용

테스트 용이

유지보수 쉬움

확장 쉬움

---

# 향후 구조

현재

```
Airtable
```

↓

향후

```
PostgreSQL
```

Repository만 변경

Service

UI

기능

모두 그대로 사용한다.

---

# Version 1

현재는

Airtable만 구현한다.

SQL은 구조만 고려한다.