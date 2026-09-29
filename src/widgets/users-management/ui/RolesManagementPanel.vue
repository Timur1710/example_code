<template>
  <div class="roles-management-panel">
    <div class="roles-management-panel__header">
      <q-btn color="primary" icon="add" :label="t('add')" @click="onCreateRole" />
    </div>
    <div class="roles-management-panel__content">
      <q-table
        :rows="roles"
        :columns="columns"
        :loading="loading"
        :filter="search"
        row-key="_id"
        binary-state-sort
        class="roles-management-panel__table"
      >
        <!-- Поиск -->
        <template #top-right>
          <q-input v-model="search" dense outlined debounce="300" :placeholder="t('search')">
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>

        <!-- Динамические колонки для ресурсов -->
        <template
          v-for="resource in systemResources"
          :key="resource"
          #[`body-cell-${resource}`]="props"
        >
          <q-td :props="props">
            <q-badge
              :color="getPermissionColor(getPermissionValue(props.row.permissions, resource))"
              :label="getPermissionLabel(getPermissionValue(props.row.permissions, resource))"
            />
          </q-td>
        </template>

        <!-- Колонка действий -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <!-- Скрываем меню действий для системной роли -->
            <q-btn v-if="!props.row.isSystem" flat round dense icon="more_vert" color="grey-7">
              <q-menu>
                <q-list style="min-width: 150px">
                  <q-item v-close-popup clickable @click="onEditRole(props.row)">
                    <q-item-section avatar>
                      <q-icon name="edit" color="primary" />
                    </q-item-section>
                    <q-item-section>{{ t('edit') }}</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item v-close-popup clickable @click="onDeleteRole(props.row)">
                    <q-item-section avatar>
                      <q-icon name="delete" color="negative" />
                    </q-item-section>
                    <q-item-section class="text-negative">
                      {{ t('delete') }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
            <q-icon v-else name="lock" color="grey-5" size="sm">
              <q-tooltip>{{ t('system_role') }}</q-tooltip>
            </q-icon>
          </q-td>
        </template>

        <!-- Пустое состояние -->
        <template #no-data>
          <div class="full-width row flex-center q-gutter-sm text-grey-6">
            <q-icon name="warning" size="2em" />
            <span>{{ t('no_data') }}</span>
          </div>
        </template>
    </q-table>
  </div>

    <!-- Диалог формы роли -->
    <RoleFormDialog
      v-model="showRoleFormDialog"
      :role="roleToEdit"
      @saved="onRoleSaved"
    />

    <!-- Диалог подтверждения удаления -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-icon name="warning" color="negative" size="2em" class="q-mr-sm" />
          <span class="q-ml-sm">{{ t('deleteObject') }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="t('cancel')" />
          <q-btn
            flat
            :label="t('delete')"
            color="negative"
            :loading="isDeleting"
            @click="confirmDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar, type QTableProps } from 'quasar';
import { roleApi, type Role, type PermissionLevel, type Permissions } from 'src/entities/role';
import { SYSTEM_RESOURCES_LIST, PERMISSION_LEVELS } from 'src/shared/config/permissions';
import { RoleFormDialog } from 'src/widgets';

const { t } = useI18n();
const $q = useQuasar();

// Состояние
const roles = ref<Role[]>([]);
const loading = ref(false);
const search = ref('');

// Системные ресурсы (загружаются с бэкенда или используются fallback)
const systemResources = ref<string[]>([...SYSTEM_RESOURCES_LIST]);

// Системная роль администратора (нередактируемая)
const createAdminRole = (): Role => {
  const permissions: Permissions = {};
  systemResources.value.forEach((resource) => {
    permissions[resource] = PERMISSION_LEVELS.EDIT;
  });

  return {
    _id: 'system-admin',
    name: 'Администратор',
    description: 'Полный доступ ко всем ресурсам',
    permissions,
    isSystem: true,
  };
};

// Состояние диалогов
const showDeleteDialog = ref(false);
const showRoleFormDialog = ref(false);
const roleToDelete = ref<Role | null>(null);
const roleToEdit = ref<Role | null>(null);
const isDeleting = ref(false);

// Колонки таблицы
const columns = computed<QTableProps['columns']>(() => {
  const cols: QTableProps['columns'] = [
    {
      name: 'name',
      label: t('name'),
      field: 'name',
      align: 'left',
      sortable: true,
    },
  ];

  // Добавляем колонки для каждого ресурса
  systemResources.value.filter((r) => r !== 'Справочники').forEach((resource) => {
    cols.push({
      name: resource,
      label: resource,
      field: (row: Role) => getPermissionValue(row.permissions, resource),
      align: 'center',
      sortable: false,
    });
  });

  // Колонка действий
  cols.push({
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'right',
    sortable: false,
    style: 'width: 50px',
  });

  return cols;
});

/**
 * Получить значение permission из объекта
 */
function getPermissionValue(
  permissions: Permissions | undefined,
  resource: string
): PermissionLevel {
  return permissions?.[resource] ?? 'denied';
}

/**
 * Получить цвет для уровня доступа
 */
function getPermissionColor(level: PermissionLevel): string {
  const colors: Record<PermissionLevel, string> = {
    view: 'info',
    edit: 'positive',
    denied: 'negative',
  };
  return colors[level] || 'grey';
}

/**
 * Получить локализованное название уровня доступа
 */
function getPermissionLabel(level: PermissionLevel): string {
  const key = `permission_levels.${level}`;
  const translated = t(key);
  return translated !== key ? translated : level;
}

/**
 * Загрузить системные ресурсы с бэкенда
 */
async function fetchResources() {
  try {
    const response = await roleApi.getResources();
    if (response.resources && response.resources.length > 0) {
      systemResources.value = response.resources;
    }
  } catch (error) {
    console.warn('Failed to fetch resources, using defaults:', error);
    // Используем локальные константы как fallback
  }
}

/**
 * Загрузить роли
 */
async function fetchRoles() {
  loading.value = true;
  try {
    const loadedRoles = await roleApi.getAllFull();
    // Добавляем системную роль администратора в начало списка
    roles.value = [createAdminRole(), ...loadedRoles];
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    $q.notify({
      type: 'negative',
      message: t('error'),
    });
  } finally {
    loading.value = false;
  }
}

/**
 * Создать новую роль
 */
function onCreateRole() {
  roleToEdit.value = null;
  showRoleFormDialog.value = true;
}

/**
 * Редактировать роль
 */
function onEditRole(role: Role) {
  roleToEdit.value = role;
  showRoleFormDialog.value = true;
}

/**
 * Удалить роль
 */
function onDeleteRole(role: Role) {
  roleToDelete.value = role;
  showDeleteDialog.value = true;
}

/**
 * Обработать сохранение роли
 */
function onRoleSaved() {
  void fetchRoles();
}

/**
 * Подтвердить удаление
 */
async function confirmDelete() {
  if (!roleToDelete.value) return;

  isDeleting.value = true;
  try {
    await roleApi.delete(roleToDelete.value._id);
    $q.notify({
      type: 'positive',
      message: t('success'),
    });
    showDeleteDialog.value = false;
    void fetchRoles();
  } catch (error) {
    console.error('Failed to delete role:', error);
    $q.notify({
      type: 'negative',
      message: t('error'),
    });
  } finally {
    isDeleting.value = false;
    roleToDelete.value = null;
  }
}

// Загрузка данных при монтировании
onMounted(async () => {
  await fetchResources();
  void fetchRoles();
});
</script>

<style lang="scss" scoped>
.roles-management-panel {
  height: 100%;

  &__header {
    padding-top: 10px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-bottom: 10px;
  }

  &__title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #212121;
  }

  &__content {
    color: #424242;
  }

  &__table {
    :deep(.q-table__top) {
      padding: 12px 16px;
    }
  }
}
</style>
