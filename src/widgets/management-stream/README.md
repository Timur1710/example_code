# ManagementStream Widget

Виджет для управления потоками производства с визуальным конструктором операций.

## Структура

```
management-stream/
├── ui/
│   ├── ManagementStream.vue       # Основной компонент виджета
│   ├── StreamConstructor.vue      # Компонент конструктора операций
│   └── index.ts
├── lib/
│   ├── useManagementStream.ts     # Composable для управления потоком
│   ├── useConstructor.ts          # Composable для конструктора
│   ├── management-stream.types.ts # Типы виджета
│   └── index.ts
└── README.md
```
## API

### ManagementStream Props

- `streamId?: string` - ID потока для загрузки
- `readonly?: boolean` - Режим только для чтения
- `isNew?: boolean` - Флаг создания нового потока
- `streamType?: 'stream' | 'template' | 'subprocess'` - Тип потока

### ManagementStream Events

- `save` - Сохранение потока
- `revert` - Отмена изменений
- `export` - Экспорт потока

### StreamConstructor Props

- `cells: ConstructorOperation[]` - Массив операций
- `names: Record<string, Array<{ label: string; value: string }>>` - Имена операций по типам
- `edit?: boolean` - Режим редактирования
- `streamType?: string` - Тип потока

### StreamConstructor Events

- `update: [cells: ConstructorOperation[]]` - Обновление операций
- `relationCreated: [relationId: string]` - Создание связи
- `relationDeleted: [relationId: string]` - Удаление связи
> События `cellCreated`, `cellDeleted`, `cellDblClick` и `relationClick` больше не пробрасываются наружу —
вся логика обработки этих действий теперь инкапсулирована внутри конструктора.

## Архитектура

Виджет следует принципам Feature-Sliced Design:

1. **UI Layer** (`ui/`) - Компоненты представления
2. **Lib Layer** (`lib/`) - Бизнес-логика и composables

Использует компоненты конструктора из `ui/Constructor`:
- `CellEmpty` - Пустая ячейка сетки
- `ConstructorCell` - Ячейка с операцией
- `RelationLine` - Линия связи
- `RelationLines` - Контейнер для всех линий
- `TemplateRelationLine` - Временная линия при создании связи

Использует утилиты из `lib/constructor`:
- `drawLine` - Рисование SVG путей для связей
- `Relation` - Класс для работы со связями
- `allItemsRelations` - Получение всех связей
- `findRelationParentItem` - Поиск родительской операции связи
- `getUniqueId` - Генерация уникальных ID

## Зависимости

- `svg-path-properties` - Вычисление свойств SVG путей
- `vue` - Vue 3 Composition API
- `vue-i18n` - Интернационализация
- `quasar` - UI компоненты

## TODO

- [ ] Добавить модальное окно редактирования операций
- [ ] Добавить модальное окно редактирования связей
- [ ] Реализовать drag & drop для перемещения операций
- [ ] Добавить поддержку отмены/повтора действий (undo/redo)
- [ ] Реализовать полную версию drawLine с поддержкой всех случаев
- [ ] Добавить валидацию операций и связей
- [ ] Добавить экспорт/импорт потоков
