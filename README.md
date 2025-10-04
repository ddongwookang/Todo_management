# Nextro Todo App

현대적이고 직관적인 Todo 관리 웹 애플리케이션입니다. Next.js 14, TypeScript, Tailwind CSS, Zustand를 사용하여 구축되었습니다.

## 🚀 주요 기능

### 📋 작업 관리
- ✅ 작업 추가, 수정, 삭제
- ✅ 완료 상태 토글
- ✅ 작업 우클릭 컨텍스트 메뉴
- ✅ 작업 상세 화면에서 저장 버튼으로 수정사항 저장
- ✅ X 버튼으로 이전 화면 복귀
- ✅ 드래그 앤 드롭으로 작업 순서 변경
- ✅ 새 작업 자동으로 "오늘 할 일"에 추가

### 🎨 사용자 인터페이스
- 📱 반응형 모던 UI
- 🎨 카테고리별 색상 구분
- ⭐ 중요 작업 표시 (메인 페이지에서 별 아이콘 클릭)
- 📅 마감일 관리 (날짜/시간 + 간편 캘린더)
- 😊 커스텀 이모지 선택 (자동으로 목록에 저장)
- 🔍 작은 크기의 검색바

### 📊 데이터 관리
- 🔄 반복 작업 스케줄링
- 🗑️ 휴지통 기능 (7일 보관)
- 📂 카테고리 관리
- 👥 다중 사용자 지원
- 💾 Zustand를 통한 상태 관리 및 지속성

### 🔍 뷰 시스템
- **오늘 할 일**: 오늘 마감인 작업들
- **중요한 업무**: 중요 표시된 작업들
- **계획된 일정**: 전체 작업 일정 보기
- **완료된 업무**: 완료된 작업들
- **나에게 할당된 업무**: 개인 할당 작업들
- **휴지통**: 삭제된 작업들
- **카테고리 관리**: 카테고리 설정 화면

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Drag & Drop**: @dnd-kit
- **ID Generation**: uuid

## 🚀 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

### 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm start
```

## 📁 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # 전역 스타일
│   ├── layout.tsx      # 루트 레이아웃
│   └── page.tsx        # 메인 페이지
├── components/         # React 컴포넌트
│   ├── CategoryManager.tsx
│   ├── ClientOnly.tsx
│   ├── PlannedScheduleView.tsx
│   ├── SearchBar.tsx
│   ├── Sidebar.tsx
│   ├── TaskDetailModal.tsx
│   ├── TaskDetailSidebar.tsx
│   ├── TaskInput.tsx
│   ├── TaskItem.tsx
│   ├── TaskList.tsx
│   └── TrashView.tsx
├── lib/               # 유틸리티 및 설정
│   ├── recurrence.ts  # 반복 작업 로직
│   └── store.ts       # Zustand 스토어
└── types/             # TypeScript 타입 정의
    └── index.ts
```

## 🎯 주요 컴포넌트

### TaskItem
- 작업 아이템 표시 및 상호작용
- 우클릭 컨텍스트 메뉴
- 드래그 앤 드롭 지원

### TaskInput
- 새 작업 추가 입력
- 실시간 유효성 검사

### TaskDetailSidebar
- 작업 상세 정보 사이드바
- 모든 작업 속성 편집 가능

### Sidebar
- 네비게이션 사이드바
- 카테고리별 작업 필터링

## 🔧 커스터마이징

### 카테고리 추가
1. 사이드바에서 "카테고리 관리" 클릭
2. "추가" 버튼으로 새 카테고리 생성
3. 색상과 이름 설정

### 반복 작업 설정
1. 작업을 클릭하여 상세 화면 열기
2. "반복" 섹션에서 반복 유형 선택
3. 주간 반복의 경우 요일 선택 가능

## 📱 반응형 디자인

모든 화면 크기에서 최적화된 사용자 경험을 제공합니다:
- 모바일: 터치 친화적 인터페이스
- 태블릿: 적절한 간격과 크기
- 데스크톱: 풍부한 기능과 키보드 단축키

## 🚀 배포

### Vercel (권장)

```bash
npm run build
```

Vercel 플랫폼에서 자동으로 배포됩니다.

### 기타 플랫폼

```bash
npm run build
npm start
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🙏 감사의 말

- [Next.js](https://nextjs.org/) - React 프레임워크
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크
- [Zustand](https://zustand-demo.pmnd.rs/) - 상태 관리
- [Lucide](https://lucide.dev/) - 아이콘 라이브러리