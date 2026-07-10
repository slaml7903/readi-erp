export const ATTENDANCE_BASE_ID =
  process.env.AIRTABLE_ATTENDANCE_BASE_ID ?? "app4nAAb3cL0K8qmB";

export const ATTENDANCE_TABLES = {
  master: "Master",
  requests: "근무신청",
} as const;

export const ATTENDANCE_FIELDS = {
  employeeName: "이름",
  employeeDepartment: "부서",
  employeePosition: "직급",
  employeeStatus: "상태",
  requestNumber: "신청번호",
  requester: "신청자",
  attendanceType: "유형",
  flexibleWorkType: "유연근무",
  location: "장소",
  purpose: "사유/목적",
  outsideWorkDateTime: "외근 일시",
  startDate: "시작일",
  endDate: "종료일",
  createdAt: "등록일시",
} as const;
