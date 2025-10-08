/**
 * 객체에서 undefined 값을 제거하는 유틸리티
 * 중첩 객체와 배열도 재귀적으로 처리
 */
export function cleanUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  
  for (const key in obj) {
    const value = obj[key];
    
    // undefined는 제외
    if (value === undefined) {
      continue;
    }
    
    // null은 유지
    if (value === null) {
      result[key] = null;
      continue;
    }
    
    // 배열 처리
    if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (item && typeof item === 'object') {
          return cleanUndefined(item);
        }
        return item;
      }).filter(item => item !== undefined);
      continue;
    }
    
    // 객체 처리 (Date, Timestamp 등 특수 객체는 그대로 유지)
    if (value && typeof value === 'object' && value.constructor === Object) {
      result[key] = cleanUndefined(value);
      continue;
    }
    
    // 그 외의 값은 그대로 유지
    result[key] = value;
  }
  
  return result;
}
