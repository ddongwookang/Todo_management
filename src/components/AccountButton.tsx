'use client';

import { useEffect, useState, useRef } from 'react';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useStore } from '@/lib/store';

interface AccountButtonProps {
  onLogout?: () => void;
  onLoginClick?: () => void;
}

export default function AccountButton({ onLogout, onLoginClick }: AccountButtonProps) {
  const { firebaseUser, setFirebaseUser, initFirestoreSync, setSyncEnabled, setAuthState } = useStore();
  const [isHovered, setIsHovered] = useState(false);
  const unsubscribeFirestoreRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Firebase 인증 상태 변경 감지
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      console.log('🔐 [Auth] 인증 상태 변경:', user ? `로그인 (${user.uid})` : '로그아웃');
      
      if (user) {
        console.log('👤 [Auth] 사용자 정보:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });
        
        // 로그인 시
        setAuthState({
          loading: false,
          uid: user.uid,
        });
        console.log('✅ [Auth] Auth 상태 설정됨 (loading=false)');
        // providerId 추출 (google.com 또는 microsoft.com)
        const providerId = user.providerData[0]?.providerId || 'unknown';
        
        setFirebaseUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          providerId: providerId,
        });
        console.log('✅ [Auth] firebaseUser 상태 설정됨, provider:', providerId);
        
        // Firestore 동기화 시작
        console.log('🔄 [Auth] Firestore 동기화 시작...');
        unsubscribeFirestoreRef.current = initFirestoreSync(user.uid);
        console.log('✅ [Auth] Firestore 동기화 초기화 완료');
      } else {
        console.log('🚪 [Auth] 로그아웃 처리 중...');
        
        setAuthState({
          loading: false,
          uid: null,
        });
        console.log('✅ [Auth] Auth 상태 초기화됨');

        // 로그아웃 시
        setFirebaseUser(null);
        setSyncEnabled(false);
        console.log('✅ [Auth] firebaseUser 초기화됨, syncEnabled = false');
        
        // Firestore 구독 해제
        if (unsubscribeFirestoreRef.current) {
          unsubscribeFirestoreRef.current();
          unsubscribeFirestoreRef.current = null;
          console.log('✅ [Auth] Firestore 구독 해제됨');
        }
      }
    });

    return () => {
      unsubscribe();
      // 컴포넌트 언마운트 시 Firestore 구독 해제
      if (unsubscribeFirestoreRef.current) {
        unsubscribeFirestoreRef.current();
      }
    };
  }, [setFirebaseUser, initFirestoreSync, setSyncEnabled, setAuthState]);

  const handleLogout = async () => {
    // 로그아웃 확인
    const confirmed = window.confirm('로그아웃 하시겠습니까?');
    if (!confirmed) return;

    try {
      await signOut(auth);
      console.log('✅ [Auth] 로그아웃 성공');
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('❌ [Auth] 로그아웃 실패:', error);
    }
  };

  // 이니셜 생성 함수
  const getInitials = (name: string | null | undefined, email: string | null | undefined): string => {
    if (name) {
      const words = name.trim().split(' ');
      if (words.length >= 2) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (!firebaseUser) {
    // 로그인 전 - 로그인 버튼
    return (
      <button
        onClick={onLoginClick}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
        aria-label="로그인"
      >
        로그인
      </button>
    );
  }

  // 로그인 후 - 계정 정보
  const initials = getInitials(firebaseUser.displayName, firebaseUser.email);

  return (
    <button
      onClick={handleLogout}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full relative flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-white shadow-sm"
      aria-label="계정 - 로그아웃하려면 클릭"
      title="로그아웃"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleLogout();
        }
      }}
    >
      {/* 아바타 */}
      {firebaseUser.photoURL ? (
        <img
          src={firebaseUser.photoURL}
          alt={firebaseUser.displayName || '프로필'}
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
        />
      ) : (
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
          style={{ 
            backgroundColor: '#4285F4',
            border: '2px solid rgba(66, 133, 244, 0.2)'
          }}
        >
          {initials}
        </div>
      )}

      {/* 이름 & 이메일 - 항상 표시 */}
      <div className="flex-1 flex flex-col items-start min-w-0 overflow-hidden">
        <span className="text-sm font-semibold text-gray-900 truncate w-full" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
          {firebaseUser.displayName || '사용자'}
        </span>
        <span className="text-xs text-gray-500 truncate w-full" style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)' }}>
          {firebaseUser.email || ''}
        </span>
      </div>

      {/* Hover 시 툴팁 표시 */}
      {isHovered && (
        <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
          로그아웃
        </div>
      )}
    </button>
  );
}

