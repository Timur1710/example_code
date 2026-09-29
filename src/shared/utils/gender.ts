/**
 * Форматирование пола работника
 */
export const formatGender = (gender?: string): string => {
  switch (gender) {
    case 'male':
      return 'Мужской';
    case 'female':
      return 'Женский';
    case 'other':
      return 'Другое';
    default:
      return '—';
  }
};
