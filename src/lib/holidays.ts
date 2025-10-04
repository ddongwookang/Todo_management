// 한국 공휴일 데이터
export interface Holiday {
  date: string; // YYYY-MM-DD 형식
  name: string;
}

// 2025년 한국 공휴일
export const holidays2025: Holiday[] = [
  { date: '2025-01-01', name: '신정' },
  { date: '2025-01-28', name: '설날 연휴' },
  { date: '2025-01-29', name: '설날' },
  { date: '2025-01-30', name: '설날 연휴' },
  { date: '2025-03-01', name: '삼일절' },
  { date: '2025-03-03', name: '대체공휴일' },
  { date: '2025-05-05', name: '어린이날' },
  { date: '2025-05-06', name: '대체공휴일' },
  { date: '2025-05-15', name: '부처님오신날' },
  { date: '2025-06-06', name: '현충일' },
  { date: '2025-08-15', name: '광복절' },
  { date: '2025-10-03', name: '개천절' },
  { date: '2025-10-05', name: '추석 연휴' },
  { date: '2025-10-06', name: '추석' },
  { date: '2025-10-07', name: '추석 연휴' },
  { date: '2025-10-08', name: '대체공휴일' },
  { date: '2025-10-09', name: '한글날' },
  { date: '2025-12-25', name: '크리스마스' },
];

// 2024년 한국 공휴일
export const holidays2024: Holiday[] = [
  { date: '2024-01-01', name: '신정' },
  { date: '2024-02-09', name: '설날 연휴' },
  { date: '2024-02-10', name: '설날' },
  { date: '2024-02-11', name: '설날 연휴' },
  { date: '2024-02-12', name: '대체공휴일' },
  { date: '2024-03-01', name: '삼일절' },
  { date: '2024-04-10', name: '국회의원선거' },
  { date: '2024-05-05', name: '어린이날' },
  { date: '2024-05-06', name: '대체공휴일' },
  { date: '2024-05-15', name: '부처님오신날' },
  { date: '2024-06-06', name: '현충일' },
  { date: '2024-08-15', name: '광복절' },
  { date: '2024-09-16', name: '추석 연휴' },
  { date: '2024-09-17', name: '추석' },
  { date: '2024-09-18', name: '추석 연휴' },
  { date: '2024-10-03', name: '개천절' },
  { date: '2024-10-09', name: '한글날' },
  { date: '2024-12-25', name: '크리스마스' },
];

// 모든 공휴일
const allHolidays = [...holidays2024, ...holidays2025];

// 날짜가 공휴일인지 확인
export const isHoliday = (date: Date): boolean => {
  const dateStr = date.toISOString().split('T')[0];
  return allHolidays.some(h => h.date === dateStr);
};

// 날짜가 주말인지 확인
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 일요일(0) 또는 토요일(6)
};

// 날짜가 빨간 날(공휴일 또는 주말)인지 확인
export const isRedDay = (date: Date): boolean => {
  return isWeekend(date) || isHoliday(date);
};

// 공휴일 이름 가져오기
export const getHolidayName = (date: Date): string | null => {
  const dateStr = date.toISOString().split('T')[0];
  const holiday = allHolidays.find(h => h.date === dateStr);
  return holiday ? holiday.name : null;
};

