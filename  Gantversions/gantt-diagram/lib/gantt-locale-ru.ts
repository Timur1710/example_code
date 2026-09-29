/**
 * Русская локализация для jordium-gantt-vue3
 * Переводы основных элементов интерфейса диаграммы Ганта
 */

export const ganttLocaleRu = {
  // Китайские ключи (прямой перевод китайских символов)
  '添加前置任务': 'Добавить предшествующую задачу',
  '任务名称': 'Название задачи',
  '资源名称': 'Название ресурса',
  '开始日期': 'Дата начала',
  '结束日期': 'Дата окончания',
  '计划开始日期': 'Плановая дата начала',
  '计划结束日期': 'Плановая дата окончания',
  '实际开始日期': '',
  '实际结束日期': '',
  '进度': 'Прогресс',
  '进度(%)': 'Прогресс (%)',
  '持续时间': 'Длительность',
  '里程碑': 'Веха',
  '里程碑名称': 'Название вехи',
  '里程碑日期': 'Дата вехи',
  '目标日期': 'Целевая дата',
  '添加任务': 'Добавить задачу',
  '新任务': 'Новая задача',
  '添加里程碑': 'Добавить веху',
  '展开所有': 'Развернуть все',
  '折叠所有': 'Свернуть все',
  '导出CSV': 'Экспорт CSV',
  '导出PDF': 'Экспорт PDF',
  '导出': 'Экспорт',
  '年': 'Год',
  '季度': 'Квартал',
  '月': 'Месяц',
  '周': 'Неделя',
  '日': 'День',
  '时': 'Час',
  '今天': 'Сегодня',
  '切换时间刻度': 'Переключить временную шкалу',
  '任务视图': 'Вид задач',
  '资源视图': 'Вид ресурсов',
  '前置任务': 'Предшествующая задача',

  // Английские ключи
  taskName: 'Название задачи',
  resourceName: 'Название ресурса',
  predecessor: 'Предшествующая задача',
  'Add Predecessor': 'Добавить предшествующую задачу',
  addPredecessor: 'Добавить предшествующую задачу',
  startDate: 'Дата начала',
  endDate: 'Дата окончания',
  'Start Date': 'Дата начала',
  'End Date': 'Дата окончания',

  // Планируемые даты (все возможные варианты ключей)
  planStartDate: 'Плановая дата начала',
  planEndDate: 'Плановая дата окончания',
  plannedStartDate: 'Плановая дата начала',
  plannedEndDate: 'Плановая дата окончания',
  'Planned Start Date': 'Плановая дата начала',
  'Planned End Date': 'Плановая дата окончания',
  'planned start date': 'Плановая дата начала',
  'planned end date': 'Плановая дата окончания',
  PLANNED_START_DATE: 'Плановая дата начала',
  PLANNED_END_DATE: 'Плановая дата окончания',

  // Фактические даты - не показываем вообще
  actualStartDate: '',
  actualEndDate: '',
  'Actual Start Date': '',
  'Actual End Date': '',
  'actual start date': '',
  'actual end date': '',
  ACTUAL_START_DATE: '',
  ACTUAL_END_DATE: '',

  // Прогресс и статус
  progress: 'Прогресс',
  'progress(%)': 'Прогресс (%)',
  duration: 'Длительность',

  // Вехи
  milestone: 'Веха',
  milestoneName: 'Название вехи',
  milestoneDate: 'Дата вехи',
  targetDate: 'Целевая дата',

  // Действия
  addTask: 'Добавить задачу',
  newTask: 'Новая задача',
  addRequirement: 'Новое требование/задача',
  'Add Milestone': 'Добавить веху',
  addMilestone: 'Добавить веху',

  // Валидация
  enterTaskName: 'Введите название задачи',
  enterMilestoneName: 'Введите название вехи',
  taskNameRequired: 'Название задачи обязательно',
  milestoneNameRequired: 'Название вехи обязательно',
  milestoneDateRequired: 'Дата вехи обязательна',

  // Представления
  taskView: 'Вид задач',
  'Resource View': 'Вид ресурсов',
  switchTimeScale: 'Переключить временную шкалу',

  // Детали вида ресурсов (плоские ключи с точками для совместимости)
  'resourceView.desc': 'Просмотр загрузки ресурсов',
  'resourceView.capacity': 'Мощность',
  'resourceView.overloaded': 'Перегружен',
  'resourceView.duration': 'Длительность',
  'resourceView.overloadWarning': 'Предупреждение о перегрузке',
  'resourceView.conflictWith': 'Конфликт с',
  'resourceView.conflictDuration': 'Длительность конфликта',
  'resourceView.conflictSuffix': '',

  // Управление деревом задач
  'Expand All': 'Развернуть все',
  expandAll: 'Развернуть все',
  expandTaskList: 'Развернуть список задач',
  'Collapse All': 'Свернуть все',
  collapseAll: 'Свернуть все',
  collapseTaskList: 'Свернуть список задач',

  // Экспорт
  'Export CSV': 'Экспорт CSV',
  exportCSV: 'Экспорт CSV',
  'Export PDF': 'Экспорт PDF',
  exportPDF: 'Экспорт PDF',
  export: 'Экспорт',

  // Временные шкалы
  Year: 'Год',
  year: 'Год',
  Quarter: 'Квартал',
  quarter: 'Квартал',
  Month: 'Месяц',
  month: 'Месяц',
  Week: 'Неделя',
  week: 'Неделя',
  Day: 'День',
  day: 'День',
  Hour: 'Час',
  hour: 'Час',
  hours: 'Часы',
  hoursPlaceholder: 'Часы',

  // Метки временных шкал
  timeScaleYear: 'Год',
  timeScaleQuarter: 'Квартал',
  timeScaleMonth: 'Месяц',
  timeScaleWeek: 'Неделя',
  timeScaleDay: 'День',
  timeScaleHour: 'Час',

  // Полугодия
  halfYearFirst: 'Первая половина',
  halfYearSecond: 'Вторая половина',

  // Дни недели (полные названия)
  Monday: 'Понедельник',
  monday: 'Понедельник',
  Tuesday: 'Вторник',
  tuesday: 'Вторник',
  Wednesday: 'Среда',
  wednesday: 'Среда',
  Thursday: 'Четверг',
  thursday: 'Четверг',
  Friday: 'Пятница',
  friday: 'Пятница',
  Saturday: 'Суббота',
  saturday: 'Суббота',
  Sunday: 'Воскресенье',
  sunday: 'Воскресенье',

  // Сокращения дней недели (3 буквы)
  Mon: 'Пн',
  Tue: 'Вт',
  Wed: 'Ср',
  Thu: 'Чт',
  Fri: 'Пт',
  Sat: 'Сб',
  Sun: 'Вс',

  // Сокращения дней недели (2 буквы)
  Mo: 'Пн',
  Tu: 'Вт',
  We: 'Ср',
  Th: 'Чт',
  Fr: 'Пт',
  Sa: 'Сб',
  Su: 'Вс',

  // Массив дней недели для календарной сетки (начинается с воскресенья)
  weekDays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],

  // Массив названий месяцев
  monthNames: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],

  // Месяцы (полные названия)
  January: 'Январь',
  january: 'Январь',
  February: 'Февраль',
  february: 'Февраль',
  March: 'Март',
  march: 'Март',
  April: 'Апрель',
  april: 'Апрель',
  May: 'Май',
  may: 'Май',
  June: 'Июнь',
  june: 'Июнь',
  July: 'Июль',
  july: 'Июль',
  August: 'Август',
  august: 'Август',
  September: 'Сентябрь',
  september: 'Сентябрь',
  October: 'Октябрь',
  october: 'Октябрь',
  November: 'Ноябрь',
  november: 'Ноябрь',
  December: 'Декабрь',
  december: 'Декабрь',

  // Сокращения месяцев (3 буквы)
  Jan: 'Янв',
  jan: 'Янв',
  Feb: 'Фев',
  feb: 'Фев',
  Mar: 'Мар',
  mar: 'Мар',
  Apr: 'Апр',
  apr: 'Апр',
  Jun: 'Июн',
  jun: 'Июн',
  Jul: 'Июл',
  jul: 'Июл',
  Aug: 'Авг',
  aug: 'Авг',
  Sep: 'Сен',
  sep: 'Сен',
  Oct: 'Окт',
  oct: 'Окт',
  Nov: 'Ноя',
  nov: 'Ноя',
  Dec: 'Дек',
  dec: 'Дек',

  // Языки
  English: 'Русский',
  russian: 'Русский',
  chinese: 'Китайский',

  // Другое
  today: 'Сегодня',
  assignee: 'Исполнитель',
  estimatedHours: 'Оценка часов',
  actualHours: 'Фактические часы',

  // Заголовки колонок таблицы ресурсов
  resourceType: 'Тип ресурса',
  department: 'Отдел',
  capacity: 'Загрузка',
  type: 'Тип',

  // Дополнительные действия
  edit: 'Редактировать',
  delete: 'Удалить',
  save: 'Сохранить',
  cancel: 'Отмена',
  confirm: 'Подтвердить',
  close: 'Закрыть',

  // Фильтры и поиск
  filter: 'Фильтр',
  search: 'Поиск',
  reset: 'Сбросить',

  // Статусы
  completed: 'Завершено',
  inProgress: 'В процессе',
  pending: 'Ожидает',
  delayed: 'Задержано',

  // Приоритеты
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',

  // Сообщения
  noData: 'Нет данных',
  loading: 'Загрузка...',
  error: 'Ошибка',
  success: 'Успешно',

  // Вложенная структура resourceView (дублирует плоские ключи для совместимости)
  resourceView: {
    desc: 'Просмотр загрузки ресурсов',
    capacity: 'Мощность',
    overloaded: 'Перегружен',
    duration: 'Длительность',
    overloadWarning: 'Предупреждение о перегрузке',
    conflictDuration: 'Длительность конфликта',
    conflictWith: 'Конфликт с',
    conflictSuffix: '',
  },
};
