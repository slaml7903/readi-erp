# READi ERP
# AI Development Guide

Version : 1.0

---

# 프로젝트 소개

READi ERP는 ReadI Robust Machine의 사내 ERP 프로젝트이다.

AI는 새로운 기능을 추가하기보다
현재 구조를 유지하는 것을 우선한다.

항상

단순함

유지보수

확장성

을 고려하여 개발한다.

---

# 프로젝트 철학

작게 시작한다.

쉽게 확장한다.

복잡하게 만들지 않는다.

현재 필요한 기능만 개발한다.

---

# AI 개발 원칙

## 1.

기존 구조를 함부로 변경하지 않는다.

새로운 기능이 필요하면

기존 구조 안에서 해결한다.

---

## 2.

중복 코드를 만들지 않는다.

공통 기능은

components

또는

lib

로 이동한다.

---

## 3.

Database를 직접 접근하지 않는다.

항상

Page

↓

Service

↓

Repository

↓

Database

순서를 따른다.

---

## 4.

Business Logic은

Page에 작성하지 않는다.

---

## 5.

Airtable은 현재 Database이다.

하지만

SQL Database로 전환 가능하도록 개발한다.

Airtable에 종속되는 코드는 최소화한다.

---

# 프로젝트 구조

app

→ 화면

components

→ 공통 UI

features

→ 기능별 코드

server

→ Business Logic

Repository

Service

lib

→ 공통 기능

types

→ TypeScript Type

docs

→ 프로젝트 문서

---

# UI 원칙

공통 Button

공통 Modal

공통 Table

공통 Search

재사용을 우선한다.

---

# 개발 우선순위

1 Dashboard

2 구매관리

3 재고관리

4 BOM

5 차량관리

---

# 금지사항

Page에서 Airtable 호출

Business Logic 작성

중복 UI 작성

사용하지 않는 기능 개발

과도한 최적화

---

# 개발 목표

읽기 쉬운 코드

유지보수 쉬운 구조

SQL 전환 가능

확장 가능한 ERP