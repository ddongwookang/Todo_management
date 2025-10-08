'use client';

import { useState } from 'react';
import { signInWithPopup, OAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      console.log('✅ Google 로그인 성공');
      onClose(); // 로그인 성공 시 모달 닫기
    } catch (error: any) {
      console.error('❌ Google 로그인 실패:', error);
      setError(error.message || '로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    console.log('🔵 [Microsoft Login] 로그인 시작...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔵 [Microsoft Login] OAuthProvider 생성...');
      const provider = new OAuthProvider('microsoft.com');
      
      // 선택적 설정
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      provider.addScope('User.Read');
      console.log('✅ [Microsoft Login] Provider 설정 완료');
      
      console.log('🔵 [Microsoft Login] signInWithPopup 호출 중...');
      const result = await signInWithPopup(auth, provider);
      
      console.log('✅ [Microsoft Login] 로그인 성공!');
      console.log('👤 [Microsoft Login] 사용자 정보:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        providerId: result.user.providerData[0]?.providerId,
        providerData: result.user.providerData,
      });
      
      // Credential 정보 (있는 경우)
      const credential = OAuthProvider.credentialFromResult(result);
      if (credential) {
        console.log('🔑 [Microsoft Login] Credential:', {
          accessToken: credential.accessToken ? '존재함' : '없음',
          idToken: credential.idToken ? '존재함' : '없음',
        });
      }
      
      onClose(); // 로그인 성공 시 모달 닫기
    } catch (error: any) {
      console.error('❌ [Microsoft Login] 로그인 실패');
      console.error('📋 [Microsoft Login] Error Code:', error.code);
      console.error('📋 [Microsoft Login] Error Message:', error.message);
      console.error('📋 [Microsoft Login] Full Error:', error);
      
      // 에러 메시지 처리
      if (error.code === 'auth/popup-blocked') {
        setError('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('현재 도메인이 Firebase에 등록되지 않았습니다. Firebase Console에서 도메인을 추가해주세요.');
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        setError('로그인이 취소되었습니다.');
      } else if (error.message?.includes('AADSTS50011') || error.message?.includes('redirect_uri')) {
        setError('Azure Portal에서 Redirect URI를 등록해주세요: https://todo-management-948f5.firebaseapp.com/__/auth/handler');
      } else if (error.message?.includes('AADSTS')) {
        const aadMessage = error.message?.split('Message:')[1]?.trim() || error.message;
        setError(`Azure 인증 오류: ${aadMessage}`);
        console.error('🔴 [Microsoft Login] Azure Error Details:', aadMessage);
      } else {
        setError(`로그인 실패: ${error.code || error.message || '알 수 없는 오류'}`);
      }
    } finally {
      setLoading(false);
      console.log('🏁 [Microsoft Login] 프로세스 종료');
    }
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* 모달 컨텐츠 */}
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 헤더 */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              로그인
            </h2>
            <p className="text-sm text-gray-600">
              계정을 선택하여 시작하세요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 로그인 버튼들 */}
          <div className="space-y-3">
            {/* Google 로그인 */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium text-gray-700"
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
              <span>{loading ? '로그인 중...' : 'Google로 계속하기'}</span>
            </button>

            {/* Microsoft 로그인 */}
            <button
              onClick={handleMicrosoftLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium text-gray-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#f25022" d="M0 0h11.377v11.372H0z"/>
                <path fill="#00a4ef" d="M12.623 0H24v11.372H12.623z"/>
                <path fill="#7fba00" d="M0 12.623h11.377V24H0z"/>
                <path fill="#ffb900" d="M12.623 12.623H24V24H12.623z"/>
              </svg>
              <span>{loading ? '로그인 중...' : 'Microsoft로 계속하기'}</span>
            </button>
          </div>

          {/* 하단 안내 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              로그인하면{' '}
              <a href="#" className="text-blue-500 hover:underline">
                이용약관
              </a>
              {' '}및{' '}
              <a href="#" className="text-blue-500 hover:underline">
                개인정보처리방침
              </a>
              에 동의하게 됩니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

