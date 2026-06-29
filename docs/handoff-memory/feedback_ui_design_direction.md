---
name: UI Design Direction Feedback
description: User feedback on agent page design philosophy - chat-first for 점장, calendar-first for 세리
type: feedback
---

점장 페이지는 대시보드가 아닌 채팅 중심 UI여야 함. 세리 페이지는 달력 기반 매출 입력이 핵심.

**Why:** LLM 기반 서비스이므로 채팅이 기본 인터페이스. 점장은 능동적으로 보고서/위험알림을 채팅에 보내고, 사용자는 채팅 내에서 선택형 대응(승인/거부/보류)을 함. 세리는 매출 데이터를 일별로 기입/확인하는 것이 가장 기본적이고 중요한 기능.

**How to apply:**
- 점장 페이지 디자인 시: 메인 영역을 ChatGPT/Claude 스타일 채팅 UI로 구성. 카드형 보고서와 선택형 액션 버튼이 채팅 메시지로 들어옴.
- 세리 페이지 디자인 시: 달력이 메인 뷰. 날짜별 매출 금액이 달력 셀에 표시되고 클릭하면 수정 가능.
- 대시보드 카드 레이아웃은 보조 정보로만 사용 (채팅/달력이 우선).
