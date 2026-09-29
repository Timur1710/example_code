<template>
  <div class="users-management-panel">
    <div class="users-management-panel__header">
      <q-btn
        v-if="isAdmin"
        color="primary"
        icon="add"
        :label="t('add')"
        @click="onCreateUser"
      />
    </div>
    <div class="users-management-panel__content">
      <q-table
        v-model:pagination="pagination"
        :rows="users"
        :columns="columns"
        :loading="loading"
        :filter="search"
        row-key="_id"
        binary-state-sort
        class="users-management-panel__table"
        @request="onRequest"
      >

        <!-- Колонка роли -->
        <template #body-cell-access="props">
          <q-td :props="props">
            <q-badge
              :color="getRoleColor(props.row)"
              :label="getRoleLabel(props.row)"
            />
          </q-td>
        </template>

        <!-- Колонка сотрудника -->
        <template #body-cell-hasWorker="props">
          <q-td :props="props">
            <q-icon
              :name="props.row.worker ? 'check_circle' : 'cancel'"
              :color="props.row.worker ? 'positive' : 'negative'"
              size="sm"
            />
            <span class="q-ml-xs">
              {{ props.row.worker ? t('yes') : t('no') }}
            </span>
          </q-td>
        </template>

        <!-- Колонка действий -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              round
              dense
              icon="more_vert"
              color="grey-7"
            >
              <q-menu>
                <q-list style="min-width: 150px">
                  <q-item
                    v-close-popup
                    clickable
                    @click="onEditUser(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="edit" color="primary" />
                    </q-item-section>
                    <q-item-section>{{ t('edit') }}</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item
                    v-close-popup
                    clickable
                    @click="onDeleteUser(props.row)"
                  >
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

    <!-- Диалог создания/редактирования пользователя -->
    <UserFormDialog
      v-model="showUserDialog"
      :user="selectedUser"
      @saved="onUserSaved"
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
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useQuasar, type QTableProps } from 'quasar';
import { useSessionStore } from 'src/entities/session';
import { userApi, type UserWithWorker } from 'src/entities/user';
import { roleApi, type RoleInfo } from 'src/entities/role';
import { UserFormDialog } from 'src/widgets';

const { t } = useI18n();
const { isAdmin } = storeToRefs(useSessionStore());
const $q = useQuasar();

// Состояние
const users = ref<UserWithWorker[]>([]);
const roles = ref<RoleInfo[]>([]);
const loading = ref(false);
const search = ref('');

// Состояние диалогов
const showUserDialog = ref(false);
const selectedUser = ref<UserWithWorker | null>(null);
const showDeleteDialog = ref(false);
const userToDelete = ref<UserWithWorker | null>(null);
const isDeleting = ref(false);

// Пагинация
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'createdAt',
  descending: true,
});

// Колонки таблицы
const columns = computed<QTableProps['columns']>(() => [
  {
    name: 'name',
    label: t('name'),
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'access',
    label: t('access'),
    field: 'access',
    align: 'center',
    sortable: true,
  },
  {
    name: 'hasWorker',
    label: t('employee'),
    field: (row: UserWithWorker) => !!row.worker,
    align: 'center',
    sortable: false,
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'right',
    sortable: false,
    style: 'width: 50px',
  },
]);

/**
 * Проверить, является ли пользователь администратором
 */
function isAdminAccess(access: string): boolean {
  return ['admin', 'administrator', 'super_admin'].includes(access?.toLowerCase());
}

/**
 * Получить цвет для роли
 */
function getRoleColor(user: UserWithWorker): string {
  if (isAdminAccess(user.access)) {
    return 'primary';
  }
  // Для кастомных ролей используем другой цвет
  return 'secondary';
}

/**
 * Получить название роли для отображения
 */
function getRoleLabel(user: UserWithWorker): string {
  // Если администратор - показываем "Администратор"
  if (isAdminAccess(user.access)) {
    return t('roles.administrator');
  }
  
  // Если есть roleId - ищем роль по ID
  if (user.roleId) {
    const role = roles.value.find(r => r._id === user.roleId);
    if (role) {
      return role.name;
    }
  }
  
  // Fallback на access
  const key = `roles.${user.access}`;
  const translated = t(key);
  return translated !== key ? translated : user.access;
}

/**
 * Загрузить роли
 */
async function fetchRoles() {
  try {
    roles.value = await roleApi.getAll();
  } catch (error) {
    console.error('Failed to fetch roles:', error);
  }
}

/**
 * Загрузить пользователей
 */
async function fetchUsers() {
  loading.value = true;
  try {
    const response = await userApi.getAll({
      page: pagination.value.page,
      rowsPerPage: pagination.value.rowsPerPage,
      sortBy: pagination.value.sortBy,
      descending: pagination.value.descending,
      search: search.value || undefined,
    });

    users.value = response.data;
    pagination.value.rowsNumber = response.pagination.rowsNumber;
    pagination.value.page = response.pagination.page;
    pagination.value.rowsPerPage = response.pagination.rowsPerPage;

    if (response.pagination.sortBy) {
      pagination.value.sortBy = response.pagination.sortBy;
    }
    if (response.pagination.descending !== undefined) {
      pagination.value.descending = response.pagination.descending;
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
  } finally {
    loading.value = false;
  }
}

/**
 * Обработка запроса таблицы (пагинация, сортировка)
 */
function onRequest(props: {
  pagination: {
    page: number;
    rowsPerPage: number;
    sortBy: string;
    descending: boolean;
  };
  filter?: string;
}) {
  pagination.value.page = props.pagination.page;
  pagination.value.rowsPerPage = props.pagination.rowsPerPage;
  pagination.value.sortBy = props.pagination.sortBy;
  pagination.value.descending = props.pagination.descending;

  void fetchUsers();
}

/**
 * Создать нового пользователя
 */
function onCreateUser() {
  selectedUser.value = null;
  showUserDialog.value = true;
}

/**
 * Редактировать пользователя
 */
function onEditUser(user: UserWithWorker) {
  selectedUser.value = user;
  showUserDialog.value = true;
}

/**
 * Удалить пользователя
 */
function onDeleteUser(user: UserWithWorker) {
  userToDelete.value = user;
  showDeleteDialog.value = true;
}

/**
 * Подтвердить удаление
 */
async function confirmDelete() {
  if (!userToDelete.value) return;

  isDeleting.value = true;
  try {
    await userApi.delete(userToDelete.value._id);
    $q.notify({
      type: 'positive',
      message: t('success'),
    });
    showDeleteDialog.value = false;
    void fetchUsers();
  } catch (error) {
    console.error('Failed to delete user:', error);
    $q.notify({
      type: 'negative',
      message: t('error'),
    });
  } finally {
    isDeleting.value = false;
    userToDelete.value = null;
  }
}

/**
 * Обработчик сохранения пользователя
 */
function onUserSaved() {
  void fetchUsers();
}

// Загрузка данных при монтировании
onMounted(() => {
  void fetchRoles();
  void fetchUsers();
});
</script>

<style lang="scss" scoped>
.users-management-panel {
  height: 100%;

  &__header {
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
