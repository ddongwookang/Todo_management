'use client';

import { useEffect, useState, useRef } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { LogOut, ChevronDown } from 'lucide-react';

export default function GoogleAuthButton() {
  const { firebaseUser, setFirebaseUser, initFirestoreSync, setSyncEnabled } = useStore();
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
        setFirebaseUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
        console.log('✅ [Auth] firebaseUser 상태 설정됨');
        
        // Firestore 동기화 시작
        console.log('🔄 [Auth] Firestore 동기화 시작...');
        unsubscribeFirestoreRef.current = initFirestoreSync(user.uid);
        console.log('✅ [Auth] Firestore 동기화 초기화 완료');
      } else {
        console.log('🚪 [Auth] 로그아웃 처리 중...');
        
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
  }, [setFirebaseUser, initFirestoreSync, setSyncEnabled]);

  useEffect(() => {
    // 드롭다운 외부 클릭 감지
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowDropdown(false);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (!firebaseUser) {
    // 로그인 전
    return (
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          {loading ? '로그인 중...' : 'Google로 로그인'}
        </span>
      </button>
    );
  }

  // 로그인 후
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {firebaseUser.photoURL ? (
          <img
            src={firebaseUser.photoURL}
            alt={firebaseUser.displayName || '프로필'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {firebaseUser.displayName?.charAt(0) || firebaseUser.email?.charAt(0) || 'U'}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[150px] truncate">
          {firebaseUser.displayName || firebaseUser.email}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* 드롭다운 메뉴 */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || '프로필'}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                  {firebaseUser.displayName?.charAt(0) || firebaseUser.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {firebaseUser.displayName || '사용자'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {firebaseUser.email}
                </p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

