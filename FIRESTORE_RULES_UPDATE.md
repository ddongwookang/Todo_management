# 🔥 Firestore 보안 규칙 업데이트 방법

## ⚠️ 현재 문제
`permission-denied` 오류 발생 중
→ Firebase Console에 보안 규칙이 업데이트되지 않았습니다.

## 📋 해결 방법 (Firebase Console에서 직접 수정)

### 1️⃣ Firebase Console 접속
https://console.firebase.google.com/

### 2️⃣ 프로젝트 선택
- 프로젝트: **todo-management-948f5**

### 3️⃣ Firestore Database 선택
- 좌측 메뉴: **Firestore Database**
- 상단 탭: **규칙(Rules)**

### 4️⃣ 아래 규칙 복사해서 붙여넣기

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ⚠️ 임시 테스트용 규칙 (개발 중에만 사용!)
    // 로그인한 모든 사용자가 모든 문서에 읽기/쓰기 가능
    match /users/{userId}/tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5️⃣ 게시(Publish) 버튼 클릭

### 6️⃣ 브라우저에서 테스트
- http://localhost:3000 새로고침
- 로그인 후 Task 생성
- Console에서 확인:
  ```
  ✅✅✅ [addTask] Firestore 저장 성공! ✅✅✅
  [verify] exists = true
  ```

---

## 🔒 프로덕션 규칙 (나중에 적용)

테스트 완료 후 아래 규칙으로 교체하세요:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/tasks/{taskId} {
      // 읽기: 인증된 사용자이고, 자신의 문서만
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // 쓰기: 인증된 사용자이고, 자신의 문서만
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## ✅ 확인 사항
1. Firebase Console에서 규칙 게시 완료
2. 브라우저 새로고침
3. 로그인 후 Task 생성 테스트
4. Console에서 성공 메시지 확인

