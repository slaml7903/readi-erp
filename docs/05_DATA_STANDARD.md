# READi ERP
# Data Standard

Version : 1.0

---

# 1. 목적

이 문서는 READi ERP에서 사용하는 데이터 표준을 정의한다.

목적은 다음과 같다.

- 프로젝트 전체 용어 통일
- Airtable → SQL 전환 대비
- 개발자 및 AI가 동일한 기준 사용
- 장기 유지보수성 확보

---

# 2. 기본 원칙

## 2.1 하나의 개념은 하나의 이름만 사용한다.

예)

사용

- Vendor

사용 금지

- Supplier
- 거래처
- 공급사
- 업체

---

## 2.2 화면은 한국어, 내부 이름은 영어를 사용한다.

예)

| 화면 | 내부 이름 |
|------|-----------|
| 거래처 | Vendor |
| 구매요청 | PurchaseRequest |
| 발주 | PurchaseOrder |

---

## 2.3 현재 Airtable 구조를 표준으로 한다.

현재 운영 중인 Airtable 구조를 기준으로 개발한다.

향후 SQL로 전환 시에는
표준 이름으로 Mapping 한다.

---

# 3. 주요 데이터 용어

| 내부 이름 | 화면 표시 | 설명 |
|------|------|------|
| Project | 프로젝트 | 고객사 또는 프로젝트 단위 |
| PurchaseRequest | 구매요청 | 구매 요청 |
| PurchaseOrder | 발주 | 실제 발주 |
| OrderItem | 발주품목 | 발주에 포함된 품목 |
| Receiving | 입고 | 입고 확인 |
| Item | 품목 | 구매 및 재고관리 대상 모든 품목 |
| StockMovement | 재고입출고 | 재고 증가 및 감소 이력 |
| Bom | BOM | 상위품목과 하위품목 관계 |
| Vendor | 거래처 | 공급업체 |
| Vehicle | 차량 | 법인 차량 |
| Equipment | 장비 | 굴착기 및 IoT 장비 |
| User | 사용자 | ERP 사용자 |
| Department | 부서 | 조직 |
| Document | 문서 | 첨부파일 및 증빙 |

---

# 4. 테이블 표준

| 현재 Airtable | 표준 이름 |
|---------------|-----------|
| Project | Project |
| 01.P-RQST | PurchaseRequest |
| 02.Order | PurchaseOrder |
| 02-1.RCV | Receiving |
| 03.O-Items | OrderItem |
| Item Master | Item |
| BOM | Bom |
| 재고 입출고 | StockMovement |
| Vendor | Vendor |
| Vehicle | Vehicle |

---

# 5. 공통 컬럼

| 내부 이름 | 화면 표시 | 설명 |
|-----------|----------|------|
| id | ID | 고유번호 |
| code | 코드 | 관리번호 |
| name | 이름 | 명칭 |
| status | 상태 | 진행상태 |
| type | 유형 | 데이터 종류 |
| category | 분류 | 그룹 |
| description | 설명 | 상세 설명 |
| note | 비고 | 메모 |
| createdAt | 생성일 | 생성일시 |
| updatedAt | 수정일 | 수정일시 |

---

# 6. 구매 컬럼

| 내부 이름 | 화면 표시 |
|-----------|----------|
| requestNo | 구매요청번호 |
| orderNo | 발주번호 |
| requestDate | 요청일 |
| orderDate | 발주일 |
| expectedReceiveDate | 예정입고일 |
| receivedDate | 입고일 |
| requester | 요청자 |
| department | 부서 |
| vendorId | 거래처 |
| projectId | 프로젝트 |
| quantity | 수량 |
| unitPrice | 단가 |
| totalAmount | 금액 |
| vatIncluded | VAT 포함 |

---

# 7. 품목(Item) 컬럼

| 내부 이름 | 화면 표시 |
|-----------|----------|
| itemCode | 품목코드 |
| itemName | 품명 |
| specification | 규격 |
| unit | 단위 |
| category | 품목분류 |
| isInventory | 재고관리 여부 |
| stockQty | 현재고 |
| safetyStockQty | 안전재고 |
| vendorId | 기본 거래처 |

---

# 8. 재고 입출고 컬럼

| 내부 이름 | 화면 표시 |
|-----------|----------|
| movementDate | 입출고일 |
| movementType | 입출고 유형 |
| itemId | 품목 |
| quantity | 수량 |
| projectId | 프로젝트 |
| reason | 사유 |
| userId | 담당자 |

---

# 9. BOM 컬럼

| 내부 이름 | 화면 표시 |
|-----------|----------|
| parentItemId | 상위품목 |
| childItemId | 하위품목 |
| requiredQty | 필요수량 |
| level | LEVEL |
| processOrder | 공정순서 |
| isActive | 사용여부 |

---

# 10. 상태값

## 구매요청

| 값 | 의미 |
|----|------|
| Draft | 작성중 |
| Requested | 요청완료 |
| Approved | 승인완료 |
| Ordered | 발주완료 |
| Received | 입고완료 |
| Closed | 종료 |
| Canceled | 취소 |

---

## 발주

| 값 | 의미 |
|----|------|
| Pending | 발주대기 |
| Ordered | 발주완료 |
| PartiallyReceived | 부분입고 |
| Received | 입고완료 |
| Closed | 종료 |
| Canceled | 취소 |

---

## 재고 입출고

| 값 | 의미 |
|----|------|
| In | 입고 |
| Out | 출고 |
| Adjust | 조정 |
| Return | 반품 |
| Dispose | 폐기 |

---

## 품목 유형

| 값 | 의미 |
|----|------|
| FinishedGoods | 완제품 |
| SemiFinishedGoods | 반제품 |
| Part | 부품 |
| Material | 자재 |
| Consumable | 소모품 |
| Service | 용역 |
| Expense | 비용 |

---

# 11. 코드 규칙

| 종류 | 형식 | 예시 |
|------|------|------|
| 구매요청 | PR-YYMMDD-000 | PR-260706-001 |
| 발주 | PO-YYMMDD-000 | PO-260706-001 |
| 입출고 | ST-YYMMDD-000 | ST-260706-001 |
| BOM | BOM-000001 | BOM-000001 |

---

# 12. SQL 전환 기준

현재는 Airtable을 사용한다.

코드에서는 항상 표준 이름을 사용한다.

예)

```
01.P-RQST
↓

PurchaseRequest

↓

purchase_requests
```

```
Item Master
↓

Item

↓

items
```

```
재고 입출고
↓

StockMovement

↓

stock_movements
```

이 규칙을 유지하면 Database를 SQL로 변경하더라도
UI와 Business Logic은 수정하지 않는다.

---

# 13. 금지사항

아래 용어는 사용하지 않는다.

| 금지 | 사용 |
|------|------|
| Supplier | Vendor |
| 공급사 | Vendor |
| 거래처명 | Vendor |
| Product | Item |
| InventoryItem | Item |
| StockLog | StockMovement |
| InventoryLog | StockMovement |

---

# 14. 운영 원칙

이 문서는 자주 변경하지 않는다.

새로운 용어는 아래 조건에서만 추가한다.

- 기존 용어로 표현 불가능
- 프로젝트 구조가 크게 변경됨
- SQL 전환에 반드시 필요