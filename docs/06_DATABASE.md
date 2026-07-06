# READi ERP
# Database Design

Version : 1.0

---

# 1. 목적

본 문서는 READi ERP의 구매 및 재고관리 Database 구조를 정의한다.

현재 READi DB Base는 Airtable을 Database로 사용한다.

이 Base는 구매관리와 재고관리 전용 Base로 운영한다.

장비관리, 차량관리 등은 향후 별도 Base로 분리하여 관리한다.

---

# 2. Base 운영 기준

## 2.1 현재 Base

| Base | 역할 |
|---|---|
| READi DB | 구매관리, 재고관리, BOM |

---

## 2.2 향후 분리 예정 Base

| Base | 역할 |
|---|---|
| Equipment DB | 장비, 굴착기, IoT 상태관리 |
| Vehicle DB | 법인차량, 운행일지, 예약관리 |
| Project DB | 프로젝트 관리 |

---

# 3. 설계 원칙

## 3.1 구매와 재고 중심

READi DB는 다음 업무만 관리한다.

- 구매요청
- 발주
- 입고확인
- 발주상세품목
- 거래처
- 문서
- Item Master
- 재고 입출고
- BOM

---

## 3.2 화면과 Database는 분리한다.

READi ERP Web은 Airtable을 직접 호출하지 않는다.

항상 아래 구조를 따른다.

```text
UI
↓
Service
↓
Repository
↓
Database
```

---

## 3.3 SQL 전환 가능 구조

현재는 Airtable을 사용하지만,
향후 SQL Database로 전환할 수 있도록 표준 이름을 유지한다.

Airtable 테이블명은 기존 업무 기준을 유지하고,
코드에서는 표준 이름을 사용한다.

예)

```text
01.P-RQST
↓
PurchaseRequest
↓
purchase_requests
```

---

# 4. 현재 Airtable 테이블

## 4.1 구매관리 테이블

| Airtable 테이블 | 표준 이름 | 역할 |
|---|---|---|
| 00.Project | Project | 구매 건을 프로젝트별로 묶는 기준 |
| 01.P-RQST | PurchaseRequest | 구매요청 Header |
| 02.Order | PurchaseOrder | 발주 Header |
| 02-1.RCV | Receiving | 입고확인 및 검수 |
| 03.O-Items | OrderItem | 발주상세품목 |
| 04.Item | LegacyItem | 기존 구매 품목 |
| 05.Vendor | Vendor | 거래처 |
| 06.Documents | Document | 거래처 관련 서류 |
| 99.업무 가이드(배포용) | WorkGuide | 구매 업무 가이드 |
| 99.REPORT | Report | 구매 관련 보고/공지 |

---

## 4.2 재고관리 테이블

| Airtable 테이블 | 표준 이름 | 역할 |
|---|---|---|
| Item master | Item | 재고관리 기준 품목 |
| 재고 입출고 | StockMovement | 재고 증가/감소 이력 |
| BOM | Bom | 상위품목과 하위품목 관계 |

---

# 5. 기존 구매 DB 구조

현재 구매 DB는 아래 흐름으로 구성된다.

```text
00.Project
↓
01.P-RQST
↓
02.Order
↓
03.O-Items
↓
04.Item
↓
05.Vendor
```

입고확인은 발주에서 별도 연결된다.

```text
02.Order
↓
02-1.RCV
```

문서는 거래처 기준으로 연결된다.

```text
05.Vendor
↓
06.Documents
```

---

# 6. 구매관리 테이블 역할

## 6.1 00.Project

구매 건을 프로젝트별로 묶기 위한 기준 테이블이다.

주요 역할:

- 프로젝트명 관리
- 프로젝트별 구매내역 연결
- 프로젝트별 지출현황 집계

---

## 6.2 01.P-RQST

구매요청 Header 테이블이다.

주요 역할:

- PR No. 관리
- 구매 요청 제목 관리
- 요청자, 요청일, 팀명 관리
- PR 승인자료, 구매요청서, 견적서 첨부
- 연결된 발주, 벤더, 지출액 Rollup

---

## 6.3 02.Order

발주 Header 테이블이다.

주요 역할:

- 발주번호 관리
- PR No. 연결
- 발주일, 예상 입고일 관리
- 발주서 첨부
- 발주 상태 관리
- 입고확인 연결
- 지출 필요/완료 여부 관리

---

## 6.4 02-1.RCV

구매담당자용 입고확인 테이블이다.

주요 역할:

- PO No. 연결
- 입고확인자 관리
- 입고확인일 관리
- 거래명세서 첨부
- 입고증빙 첨부
- 검토완료 체크

---

## 6.5 03.O-Items

발주상세품목 테이블이다.

주요 역할:

- 발주 품목명 관리
- PO No. 연결
- 품목 연결
- 벤더 연결
- 수량, 단가, 총액 관리

재고관리 확장 시 중요한 연결점이다.

---

## 6.6 04.Item

기존 구매 DB에서 사용하던 품목 테이블이다.

주요 역할:

- 기존 구매 품목 관리
- 발주상세 연결
- 품목별 지출 집계
- 표준가격, 리드타임 관리

향후 Item master와 역할이 중복될 수 있으므로,
Web ERP에서는 `LegacyItem`으로 구분하여 취급한다.

---

## 6.7 05.Vendor

거래처 기준정보 테이블이다.

주요 역할:

- 공급업체명 관리
- 담당자, 이메일, 전화번호 관리
- 발주상세 연결
- 총구매액 집계
- 관련서류 연결

---

## 6.8 06.Documents

거래처 관련 서류 관리 테이블이다.

주요 역할:

- 벤더별 문서 관리
- 사업자등록증, 통장사본, 계약서 등 첨부
- 문서 종류 관리

---

# 7. 재고관리 테이블 역할

## 7.1 Item master

재고관리 기준 품목 테이블이다.

주요 역할:

- 품목코드 관리
- 품명 관리
- 규격/모델/사양 관리
- 단위 관리
- 품목유형 관리
- 관리부서 관리
- 그룹/카테고리 관리
- 메인거래처 연결
- 입고/출고 Rollup
- 현재고 계산
- 안전재고 관리
- 생산가능 수량 계산
- 사진 첨부
- 상태 표시
- BOM 연결
- 재고 입출고 연결

---

## 7.2 재고 입출고

재고 변동 이력 테이블이다.

주요 역할:

- 관리번호 생성
- 품목 연결
- 날짜 입력
- 수량 입력
- 담당자 입력
- 유형 입력
- 사유 기록
- 입고/출고/조정 수량 계산

모든 재고 증감은 이 테이블을 기준으로 기록한다.

현재고는 직접 입력하지 않고,
입출고 이력을 기준으로 계산한다.

---

## 7.3 BOM

상위품목과 하위품목의 관계를 관리하는 테이블이다.

주요 역할:

- BOM ID 관리
- 상위품목 연결
- 하위품목 연결
- LEVEL 관리
- 필요수량 관리
- 단위 Lookup
- 비고 관리

BOM은 재고 수량을 직접 관리하지 않는다.

재고 수량은 Item master와 재고 입출고에서 관리한다.

---

# 8. 재고관리 구조

재고관리의 기본 구조는 아래와 같다.

```text
Item master
↓
재고 입출고
↓
현재고 계산
```

BOM은 품목 간 관계를 담당한다.

```text
Item master
↑
BOM
↓
Item master
```

즉, BOM의 상위품목과 하위품목은 모두 Item master를 참조한다.

---

# 9. BOM 구조

BOM은 제품별 테이블을 따로 만들지 않는다.

하나의 BOM 테이블에서 모든 제품의 상위-하위 관계를 관리한다.

예)

```text
READi KIT
↓
ECU
↓
PCB
```

BOM 테이블 예시:

| 상위품목 | 하위품목 | LEVEL | 필요수량 |
|---|---|---|---|
| READi KIT | ECU Module | 1 | 1 |
| ECU Module | PCB | 2 | 1 |
| PCB | Connector | 3 | 2 |

---

# 10. 구매와 재고 연결 기준

구매에서 재고로 연결되는 기준점은 `03.O-Items`와 `Item master`이다.

```text
02.Order
↓
03.O-Items
↓
Item master
↓
재고 입출고
```

입고 처리 흐름:

```text
발주
↓
입고확인
↓
재고관리 대상 여부 확인
↓
재고 입출고 생성
↓
Item master 현재고 증가
```

---

# 11. Web ERP 기준 표준 이름

Web ERP에서는 Airtable 테이블명을 직접 사용하지 않는다.

아래 표준 이름을 사용한다.

| Airtable | Web ERP 표준 이름 |
|---|---|
| 01.P-RQST | PurchaseRequest |
| 02.Order | PurchaseOrder |
| 02-1.RCV | Receiving |
| 03.O-Items | OrderItem |
| 04.Item | LegacyItem |
| 05.Vendor | Vendor |
| 06.Documents | Document |
| Item master | Item |
| 재고 입출고 | StockMovement |
| BOM | Bom |

---

# 12. SQL 전환 기준

향후 SQL 전환 시 아래와 같이 Mapping 한다.

| Web ERP 표준 이름 | SQL Table |
|---|---|
| PurchaseRequest | purchase_requests |
| PurchaseOrder | purchase_orders |
| Receiving | receivings |
| OrderItem | order_items |
| LegacyItem | legacy_items |
| Vendor | vendors |
| Document | documents |
| Item | items |
| StockMovement | stock_movements |
| Bom | boms |

---

# 13. Base 분리 원칙

READi DB는 구매와 재고 전용 Base로 유지한다.

장비, 차량, 프로젝트 관리가 본격화될 경우 별도 Base를 생성한다.

예)

```text
READi DB
= 구매 + 재고

Equipment DB
= 장비 + IoT 상태

Vehicle DB
= 차량 + 운행일지

Project DB
= 프로젝트 관리
```

Base 간 연결이 필요한 경우,
초기에는 Web ERP에서 통합 조회하고,
Airtable 간 직접 연결은 최소화한다.

---

# 14. 운영 원칙

- READi DB는 구매 + 재고 전용으로 관리한다.
- 차량과 장비 데이터는 이 Base에 추가하지 않는다.
- 모든 재고 변동은 재고 입출고에 기록한다.
- 현재고는 직접 입력하지 않는다.
- BOM은 품목 관계만 관리한다.
- 구매와 재고 연결은 OrderItem과 Item을 기준으로 한다.
- Web ERP에서는 Airtable 테이블명을 직접 사용하지 않는다.
- 향후 SQL 전환을 고려하여 표준 이름을 유지한다.