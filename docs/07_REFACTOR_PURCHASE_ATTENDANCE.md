# 구매·근태 안정성 리팩토링 기록

## 1. 작업 목적

- READi ERP의 구매·근태 모듈 안정성을 높이고 런타임 오류, 캐시 오염, 상태값 오용, 중복 등록 위험을 줄인다.
- 신규 기능 추가보다 기존 업무 흐름을 유지하면서 데이터 품질과 운영 점검 가능성을 강화한다.
- Airtable에 종속된 구현을 줄이고 향후 SQL 전환 시 기준이 될 서비스·리포지토리 경계를 정리한다.

## 2. 변경 범위

- Airtable 공통 클라이언트 옵션, 캐시, 오류 타입 정리
- 근태 월별 조회 캐시와 캘린더 컴포넌트 분리
- 구매 상태값, 검증, 수량·금액 계산, linked record, 중복 방지 보강
- 실제 Airtable 테이블/필드 생성, 운영 데이터 수정, 로그인/권한, 품목별 입고 UI 추가는 제외

## 3. Airtable 공통 클라이언트

- `AirtableQueryOptions`, `AirtableMutationOptions`를 추가해 `baseId`, 조회 옵션, 캐시 옵션, mutation revalidation tag를 통일했다.
- `fields[]`, `sort[n][field]`, `sort[n][direction]`, `filterByFormula`, `maxRecords`, `pageSize`, `view`를 `URLSearchParams`로 생성한다.
- `pageSize`는 Airtable 최대값 100을 넘지 않도록 제한한다.

## 4. 캐시 정책

- Airtable pagination의 `offset`은 임시 iterator token이므로 페이지 단위 fetch는 `no-store`로 고정했다.
- `airtableFetchAll`은 각 페이지를 no-store로 읽고, 합쳐진 전체 결과만 `unstable_cache`로 캐시한다.
- 캐시 태그는 페이지 응답이 아니라 최종 records 결과에 붙는다.
- mutation 이후 `revalidateTag`는 `lib/cache/revalidate.ts`에서 태그 단위로 수행한다.

## 5. 근태 월별 조회 및 캐시

- 근태 조회는 월별 Airtable formula 기반으로 줄였고, 서비스 레이어에서 불필요한 월 필터링을 제거했다.
- 캐시 태그는 `attendance-employees`, `attendance-events-YYYY-MM`, `attendance-today-YYYY-MM-DD`를 사용한다.
- 근태 등록 후 영향 월과 오늘 현황 태그를 revalidate한다.

## 6. 근태 컴포넌트 분리

- `AttendanceCalendarClient`의 UI 역할을 툴바, 요약 카드, 캘린더 그리드, 날짜 셀, 이벤트 항목, 상세 drawer, 요청 drawer로 분리했다.
- repository/service/API/cache 정책은 컴포넌트 분리 단계에서 변경하지 않았다.
- 일부 drawer 컴포넌트는 의미 없는 과분리를 피하기 위해 300라인을 약간 넘는다.

## 7. 구매 상태값 및 전환 규칙

- 구매요청 상태: `요청전`, `요청됨`, `승인완료`, `보류`, `반려`, `취소`
- 발주 상태: `발주전`, `선구매`, `발주완료`, `배송중`, `보류`, `입고완료`, `취소`
- 입고검토 상태: Airtable 상태 필드가 아니라 `검토완료` boolean 기준의 `검토대기`, `검토완료`
- 상태 상수와 타입은 `features/purchase/constants/purchase-status.ts`에 중앙화했다.
- 상태 정규화는 공백 제거, 빈 값 `undefined`, 알 수 없는 상태값 경고 기록을 기준으로 한다.
- 실제 적용된 전환은 입고검토 `검토대기 → 검토완료`, 발주 `발주완료/배송중 → 입고완료`이다.
- `발주전`, `선구매`, `보류` 발주는 현재 입고완료 전환을 허용하지 않는다.

## 8. 구매 검증 규칙

- 구매요청: 제목, 팀명, 요청자, 요청일, 발주 1개 이상 필수
- 발주: 공급처, 발주일, 발주상세항목 1개 이상, 모델명, 수량, 단가 검증
- 신규 거래처: 사업자등록증, 통장사본 첨부 필수
- 입고: 발주 ID, 입고확인자, 입고확인일, 거래명세서, 입고증빙 필수
- `PurchaseValidationError`는 사용자 입력 오류이며 API에서 HTTP 400으로 응답한다.

## 9. 수량·금액 계산 기준

- `normalizePurchaseNumber`는 number와 숫자 문자열, 쉼표 포함 문자열을 처리한다.
- 빈 값, `NaN`, `Infinity`, 기본 음수는 validation error로 차단한다.
- 수량은 0 초과, 단가는 0 이상으로 검증한다.
- 금액 계산은 `수량 × 단가` 기준이다.
- VAT 포함이면 총액에서 10%를 역산해 공급가액과 부가세를 계산한다.
- 반올림은 원 단위 `Math.round` 기준이다.
- 현재 Airtable의 `총액`, `공급가액 총액`, `부가세`는 계산 필드일 가능성이 있어 코드에서 임의 저장하지 않는다.

## 10. 중복 등록 방지

- 현재 필드만으로 적용한 최소 기준:
  - 동일 발주 + 동일 입고확인일 + 동일 입고확인자 입고 차단
  - 검토완료 입고가 있는 발주 추가 입고 차단
  - 검토완료 입고 재검토 차단
  - 제출 중 버튼 disabled와 submit handler 재진입 방지
- 강한 idempotency는 아래 신규 필드가 있어야 안전하다.
  - 구매요청 `requestKey`: `PR-{요청자ID}-{YYYYMMDDHHmmss}-{랜덤값}`
  - 발주 `orderKey`: `PO-{구매요청ID}-{공급처ID}-{YYYYMMDD}`
  - 입고 `receivingKey`: `RCV-{발주ID}-{YYYYMMDD}-{확인자ID}`
- key는 최초 화면 진입 시 생성해 재시도 요청에서도 유지해야 한다.
- 서버는 동일 key가 있으면 신규 생성하지 않고 기존 결과를 반환하는 방식이 바람직하다.

## 11. linked record 검증

- Airtable record ID 형식은 `rec`로 시작하는 ID인지 서버에서 검증한다.
- 공급처 ID는 `getVendorById`로 실제 존재 여부를 확인한다.
- 입고 생성 전 발주 ID는 `getPurchaseOrderReceivingSafetyContext`로 실제 존재, 상태, 품목을 확인한다.
- 입고검토 전 입고확인 ID는 `getReceivingReviewApprovalContext`로 실제 존재와 연결 발주를 확인한다.
- linked record 저장은 기존처럼 Airtable record ID 배열만 사용한다.
- 중복 조회는 Airtable formula 한계상 발주번호 표시값으로 1차 조회한 뒤, 반환된 `PO NO.` record ID 배열이 실제 발주 ID를 포함하는지 2차 검증한다.
- 구매요청 기존 record ID를 받아 발주만 별도 생성하는 API는 현재 없으므로 구매요청 존재 검증은 적용 대상이 없다.

## 12. Airtable 오류 처리

- `AirtableRepositoryError`를 추가해 Airtable 오류와 사용자 validation 오류를 분리했다.
- 오류 객체에는 `status`, `code`, `operation`, `tableName`, `recordId`만 담는다.
- Airtable 원본 response body, token, request body, 첨부파일 base64, 전체 fields는 API 응답이나 로그에 남기지 않는다.
- 구매 API 기준:
  - `PurchaseValidationError` → HTTP 400
  - `AirtableRepositoryError` → HTTP 502와 일반 사용자 메시지
  - 기타 오류 → HTTP 500과 기능별 일반 메시지
- 서버 로그 기준은 `scope`, `operation`, `tableName`, `recordId`, `code`, `status`, `message`이다.

## 13. 트랜잭션 부재 위험

- Airtable은 다중 테이블 변경을 SQL 트랜잭션처럼 원자 처리하지 못한다.
- 구매요청 생성 성공 후 발주 또는 발주상세품목 생성 실패 시 데이터가 일부만 남을 수 있다.
- 입고 레코드 생성 성공 후 첨부 업로드 실패 시 입고 레코드만 남을 수 있다.
- 입고검토 `검토완료` 업데이트 성공 후 발주 `입고완료` 업데이트 실패 시 상태 불일치가 생길 수 있다.
- 현재 대응:
  - 검토완료 재처리 차단
  - 입고완료 발주 추가 입고 차단
  - 동일 발주/일자/확인자 중복 입고 차단
- 수동 복구:
  - 입고 `검토완료`와 발주 `상태`를 비교한다.
  - 첨부가 누락된 입고 레코드는 첨부 필드를 확인해 재처리한다.
  - SQL 전환 시 구매요청+발주+품목 생성, 입고검토+발주상태 업데이트는 트랜잭션 대상이다.

## 14. 운영 점검 기준

- 일일 또는 주간 점검:
  - 입고가 존재하지만 발주 상태가 `입고완료`가 아닌 건
  - `검토완료` 입고인데 발주 상태가 미완료인 건
  - 동일 발주/입고일/확인자 중복 입고
  - linked record가 끊어진 구매요청, 발주, 입고
  - 코드 상수에 없는 상태값
  - 수량 또는 단가가 빈 값, 0 이하, 음수인 발주상세품목
- Airtable View 제안:
  - `OPS_입고검토완료_발주미완료`: RCV `검토완료=true`이고 연결 발주 상태가 `입고완료`가 아닌 건
  - `OPS_중복입고후보`: 동일 `PO NO.`, `입고확인일`, `입고확인자` 후보
  - `OPS_상태값점검`: 상태가 허용 목록에 없는 구매요청/발주
  - `OPS_수량단가점검`: 수량 또는 단가가 비정상인 발주상세품목

## 15. 최종 점검 결과

- `app/api/attendance` GET은 현재 페이지 초기 렌더 경로에서는 사용되지 않지만 외부/향후 조회 API 가능성이 있어 삭제하지 않았다.
- `features/purchase/components/PurchaseRequestDetail.tsx`는 `detail/PurchaseRequestDetail.tsx`의 re-export wrapper로, 기존 import 경로 보존을 위해 유지했다.
- 런타임 점검 중 실제 Airtable 상태값 `요청전`, `발주전`, `선구매`, 발주 `보류`가 확인되어 상태 상수에 반영했다.
- 구매요청 상태 전환 helper, 미사용 amount 합산 helper, PR 입고완료 placeholder repository 함수는 실제 호출 경로가 없어 제거했다.
- `airtableFetch` 단일 페이지 함수는 현재 직접 사용처가 없지만 공통 Airtable client 공개 함수이므로 유지했다.
- `AttendanceEventDetailDrawer.tsx`, `AttendanceRequestDrawer.tsx`는 300줄을 조금 넘지만 동작 보존을 위해 추가 분리하지 않았다.

## 16. 필요한 Airtable 필드

| 우선순위 | 필드 | 대상 테이블 | 타입 | 목적 | 없을 때 위험 |
| --- | --- | --- | --- | --- | --- |
| 필수 | `requestKey` | `01.P-RQST` | Single line text, unique 운용 | 구매요청 idempotency | 재시도 중복 등록 |
| 필수 | `orderKey` | `02.Order` | Single line text, unique 운용 | 발주 idempotency | 동일 발주 중복 생성 |
| 필수 | `receivingKey` | `02-1.RCV` | Single line text, unique 운용 | 입고 idempotency | 동일 입고 중복 생성 |
| 필수 | `금회입고수량` | 입고 품목 테이블 필요 | Number | 품목별 이번 입고량 | 초과입고 차단 불가 |
| 필수 | `누적입고수량` | `03.O-Items` 또는 계산 View | Rollup/Formula | 누적 입고량 | 잔여수량 판단 불가 |
| 필수 | `잔여수량` | `03.O-Items` 또는 계산 View | Formula | 발주수량-누적입고 | 부분/전량입고 판정 불가 |
| 선택 | `이전 상태` | 상태 보유 테이블 | Single select/Text | 상태 변경 이력 | 감사 추적 약함 |
| 선택 | `상태 변경일시` | 상태 보유 테이블 | Date time | 상태 변경 시점 | 운영 원인 추적 어려움 |
| 선택 | `상태 변경자` | 상태 보유 테이블 | Linked/User/Text | 책임 추적 | 권한 적용 전 추적 약함 |
| 선택 | `변경 사유` | 상태 보유 테이블 | Long text | 예외 처리 기록 | 수동 복구 근거 부족 |
| 선택 | `재처리 필요 여부` | 주요 거래 테이블 | Checkbox | 운영 점검 큐 | 장애 후 누락 가능 |
| 선택 | `재처리 메모` | 주요 거래 테이블 | Long text | 복구 기록 | 반복 장애 분석 어려움 |

## 17. 수동 테스트 결과

- `npx tsc --noEmit` 통과
- `npm run lint` 통과
- `npm run build` 통과
- 실제 데이터 생성 없이 `/purchase/request`, `/purchase/order`, `/purchase/receiving`, `/purchase/receiving/review`, `/management/attendance` 페이지 응답 확인

## 18. 남은 제한사항

- 품목별 입고수량 필드가 없어 누적입고/잔여수량/초과입고를 완전 차단할 수 없다.
- 구매요청/발주/입고 idempotency key 필드가 없어 강한 중복 방지는 아직 설계 단계이다.
- Airtable linked field formula는 표시값 의존성이 있어 record ID 기반 조회가 완전히 보장되지 않는다.
- Airtable schema API를 통한 실제 select option 검증은 수행하지 않았다.

## 19. 남은 위험요소 분류

### A. 배포 전 반드시 해결

- 로그인/권한과 외부 공개 접근 차단 정책
- 운영 환경변수 검증과 누락 시 배포 차단
- Airtable API 권한 범위 점검

### B. Airtable 필드 추가 후 해결

- `requestKey`, `orderKey`, `receivingKey` 기반 idempotency
- 품목별 `금회입고수량`, `누적입고수량`, `잔여수량`
- 상태 변경 이력 필드와 재처리 필요 여부

### C. 운영하면서 관찰

- Airtable linked field formula의 표시값 의존성
- 캐시 revalidate 후 사용자 체감 지연
- 근태 drawer와 구매 form의 중복 클릭 방지 동작
- 알 수 없는 상태값 warning 발생 여부

### D. 향후 SQL 전환 시 해결

- 다중 테이블 트랜잭션
- 강한 unique constraint
- 감사로그와 상태 변경 이력
- linked record를 외래키로 전환

## 20. 다음 개발 백로그

1. 품목별 입고 데이터 구조 설계
   - 목적: 초과입고, 부분입고, 잔여수량을 품목 단위로 통제
   - 선행조건: 입고 품목 테이블 또는 RCV 상세 구조 결정
   - 영향 범위: 입고 UI, RCV 테이블, 발주상세품목 계산
   - 지금 구현하지 않는 이유: 현재 Airtable 구조에 품목별 입고수량 필드가 없음
2. `requestKey/orderKey/receivingKey` 필드 도입
   - 목적: 재시도와 다중 클릭으로 인한 중복 등록 방지
   - 선행조건: Airtable 필드 생성과 key 생성 정책 합의
   - 영향 범위: 구매요청/발주/입고 생성 API와 form 상태
   - 지금 구현하지 않는 이유: 필드 생성 금지 범위
3. 대시보드 실데이터 연결
   - 목적: 운영 현황을 의사결정 지표로 연결
   - 선행조건: 상태값과 금액/입고 기준 안정화
   - 영향 범위: dashboard page, service, repository
   - 지금 구현하지 않는 이유: 이번 리팩토링은 안정성 마감 단계
4. 구매 지출관리 흐름
   - 목적: 발주, 입고, 지출 필요, 지출 완료를 하나의 업무 흐름으로 연결
   - 선행조건: 구매 상태와 입고 기준 확정
   - 영향 범위: 구매 service, 지출 관련 UI/API
   - 지금 구현하지 않는 이유: 신규 기능 범위
5. 기준정보 마스터
   - 목적: 공급처, 품목, 프로젝트, 사용자 정보를 Single Source of Truth로 관리
   - 선행조건: 마스터 데이터 소유자와 입력 기준 결정
   - 영향 범위: 구매, 재고, 프로젝트, 검색
   - 지금 구현하지 않는 이유: 업무 표준 정의가 먼저 필요
6. 로그인/권한
   - 목적: 외부 접근 차단과 역할별 입력/승인 통제
   - 선행조건: 사용자/부서/역할 기준 정의
   - 영향 범위: 전체 app route, API route, audit
   - 지금 구현하지 않는 이유: 이번 단계 제외 범위
7. 운영 로그 및 감사기록
   - 목적: 상태 변경과 예외 처리 추적
   - 선행조건: 권한/사용자 식별 체계
   - 영향 범위: mutation API, repository, 운영 점검
   - 지금 구현하지 않는 이유: 사용자 식별 체계가 아직 없음
8. PostgreSQL 전환 검토
   - 목적: 트랜잭션, unique constraint, 외래키로 데이터 안정성 강화
   - 선행조건: Airtable 운영 구조 안정화와 데이터 모델 확정
   - 영향 범위: repository 전체, migration, infra
   - 지금 구현하지 않는 이유: 현재는 Airtable 기반 MVP 단계
