# Resources Layer

Этот слой содержит компоненты для управления ресурсами операции, деструктурированные по типам ресурсов в соответствии с архитектурой FSD.

## Структура

```
resources/
├── ui/
│   ├── OperationResourcesManager.vue    # Координирующий компонент
│   ├── OperationMaterialsBlock.vue      # Управление материалами
│   ├── OperationWorkersBlock.vue        # Управление работниками
│   └── OperationEquipmentsBlock.vue     # Управление оборудованием
├── index.ts                              # Экспорты компонентов
└── README.md                             # Документация
```

## Компоненты

### OperationResourcesManager

Координирующий компонент, который:
- Управляет общим состоянием редактирования
- Координирует работу трёх блоков ресурсов
- Обрабатывает сохранение изменений
- Эмитит события обновления операции

**Props:**
- `operation: OperationInfoDto` - Данные операции

**Emits:**
- `updated(operation: OperationInfoDto)` - Событие обновления операции

### OperationMaterialsBlock

Компонент для управления материалами операции.

**Props:**
- `materials: OperationResource[]` - Список материалов
- `isEditing: boolean` - Режим редактирования

**Emits:**
- `add(resources: OperationResource[])` - Добавление материалов
- `remove(resourceId: string)` - Удаление материала
- `update-params(resourceId: string, params: Partial<ResourceCondition>)` - Обновление параметров

### OperationWorkersBlock

Компонент для управления работниками операции.

**Props:**
- `workers: OperationResource[]` - Список работников
- `isEditing: boolean` - Режим редактирования

**Emits:**
- `add(resources: OperationResource[])` - Добавление работников
- `remove(resourceId: string)` - Удаление работника
- `update-params(resourceId: string, params: Partial<ResourceCondition>)` - Обновление параметров

### OperationEquipmentsBlock

Компонент для управления оборудованием операции.

**Props:**
- `equipments: OperationResource[]` - Список оборудования
- `isEditing: boolean` - Режим редактирования

**Emits:**
- `add(resources: OperationResource[])` - Добавление оборудования
- `remove(resourceId: string)` - Удаление оборудования
- `update-params(resourceId: string, params: Partial<ResourceCondition>)` - Обновление параметров

## Использование

```vue
<template>
  <OperationResourcesManager
    :operation="operation"
    @updated="handleOperationUpdated"
  />
</template>

<script setup lang="ts">
import { OperationResourcesManager } from './resources';
import type { OperationInfoDto } from 'src/entities/operation';

const handleOperationUpdated = (operation: OperationInfoDto) => {
  // Обработка обновления
};
</script>
```

## Преимущества деструктуризации

1. **Разделение ответственности**: Каждый компонент отвечает только за свой тип ресурса
2. **Упрощённая поддержка**: Легче находить и исправлять ошибки в конкретном типе ресурса
3. **Переиспользуемость**: Компоненты можно использовать отдельно друг от друга
4. **Тестируемость**: Каждый компонент можно тестировать изолированно
5. **Масштабируемость**: Легче добавлять новые типы ресурсов или изменять существующие

## Миграция

Старый монолитный компонент `OperationResourcesBlock.vue` сохранён для обратной совместимости, но рекомендуется использовать новую структуру с `OperationResourcesManager`.

