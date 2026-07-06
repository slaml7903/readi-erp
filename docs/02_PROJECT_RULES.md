# READi ERP
# Project Rules

Version : 1.0

---

# 목적

이 문서는 READi ERP 프로젝트의 개발 규칙을 정의한다.

프로젝트가 커져도 구조가 흔들리지 않도록
모든 개발은 본 규칙을 따른다.

---

# 개발 원칙

## 1. 단순함 우선

현재 필요한 기능만 개발한다.

나중에 사용할 기능 때문에
현재 구조를 복잡하게 만들지 않는다.

---

## 2. 확장성 확보

기능은 추가 가능하도록 설계한다.

하지만
사용하지 않는 기능은 미리 만들지 않는다.

---

## 3. Database

현재

Airtable

향후

PostgreSQL

Database가 변경되어도

UI는 수정하지 않는다.

---

# 폴더 규칙

## app

화면만 작성한다.

Business Logic 작성 금지

---

## server

Business Logic 작성

---

## components

재사용 가능한 UI만 작성

---

## features

기능별 코드 작성

---

## docs

모든 설계 문서 관리

---

# 파일 이름 규칙

폴더

소문자

예)

purchase

inventory

vehicle

---

React Component

PascalCase

예)

SearchBox.tsx

InventoryTable.tsx

---

일반 파일

camelCase

예)

purchaseService.ts

inventoryRepository.ts

---

# 코드 규칙

- TypeScript 사용
- any 사용 최소화
- 중복 코드 금지
- Component 재사용
- Business Logic 분리

---

# Database 규칙

Page

↓

Service

↓

Repository

↓

Database

직접 Database 접근 금지

---

# UI 규칙

공통 UI는

components

기능별 UI는

features

---

# Git 규칙

기능 단위 Commit

예)

feat: Purchase List

fix: Inventory Search

refactor: Repository

---

# 문서 규칙

README

프로젝트 소개

PRD

무엇을 만들 것인가

Architecture

어떻게 만들 것인가

Database

DB 구조

UI

화면 구조

ChangeLog

변경 이력

---

# 프로젝트 철학

작게 시작한다.

쉽게 확장한다.

복잡하게 만들지 않는다.

실제 회사에서 사용할 수 있는 수준을 목표로 한다.