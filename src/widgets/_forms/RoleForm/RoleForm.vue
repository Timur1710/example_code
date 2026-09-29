<template>
  <q-form ref="formRef" class="role-form" @submit.prevent="submit">
    <q-input
      v-model="formData.name"
      outlined
      :label="t('role_name')"
      :rules="[
        (val: string) => !!val || t('validate.required'),
        (val: string) => val.length >= 2 || t('validate.min_length', { min: 2 }),
      ]"
    />

    <q-input
      v-model="formData.description"
      outlined
      :label="t('role_description')"
      type="textarea"
      rows="3"
    />

    <div class="role-form__permissions-section">
      <div class="role-form__permissions-title">
        <q-icon name="security" class="q-mr-sm" />
        {{ t('permissions') }}
      </div>

      <div class="role-form__permissions-grid">
        <div
          v-for="resource in systemResources"
          :key="resource"
          class="role-form__permission-row"
        >
          <div class="role-form__resource-name">
            {{ resource }}
          </div>
          <q-select
            v-model="formData.permissions[resource]"
            outlined
            dense
            :options="permissionLevelOptions"
            emit-value
            map-options
            :rules="[(val: string) => !!val || t('validate.required')]"
            class="role-form__permission-select"
          />
        </div>
      </div>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { QForm, useQuasar } from 'quasar';
import { roleApi, type PermissionLevel, type Role } from 'src/entities/role';
import { PERMISSION_LEVELS, SYSTEM_RESOURCES_LIST } from 'src/shared/config/permissions';

interface Props {
  role?: Role | null;
  /** Активность формы (для сброса при открытии диалога) */
  active?: boolean;
}

interface Emits {
  (e: 'saved'): void;
}

const props = withDefaults(defineProps<Props>(), {
  role: null,
  active: true,
});

const emit = defineEmits<Emits>();

const { t } = useI18n();
const $q = useQuasar();

const isEditMode = computed(() => !!props.role);

const formRef = ref<QForm>();

const formData = reactive({
  name: '',
  description: '',
  permissions: {} as Record<string, PermissionLevel>,
});

const isSubmitting = ref(false);

const systemResources = ref<string[]>([]);
const permissionLevelOptions = ref<{ label: string; value: PermissionLevel }[]>([]);

async function loadSystemResources() {
  try {
    const response = await roleApi.getResources();
    systemResources.value = response.resources.filter((r) => r !== 'Справочники') || [];
    permissionLevelOptions.value =
      response.permissionLevels?.map((level) => ({
        label: t(`permission_levels.${level}`),
        value: level as PermissionLevel,
      })) || [];
  } catch (error) {
    console.error('Failed to load system resources:', error);
    systemResources.value = [...SYSTEM_RESOURCES_LIST];
    permissionLevelOptions.value = Object.values(PERMISSION_LEVELS).map((level) => ({
      label: t(`permission_levels.${level}`),
      value: level,
    }));
  }
}

function reset(): void {
  if (props.role) {
    formData.name = props.role.name;
    formData.description = props.role.description || '';

    formData.permissions = {};
    systemResources.value.forEach((resource) => {
      formData.permissions[resource] = props.role!.permissions?.[resource] || 'denied';
    });
  } else {
    formData.name = '';
    formData.description = '';
    formData.permissions = {};

    systemResources.value.forEach((resource) => {
      formData.permissions[resource] = 'denied';
    });
  }
}

async function submit() {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  isSubmitting.value = true;

  try {
    if (isEditMode.value && props.role) {
      await roleApi.update(props.role._id, {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
      });
    } else {
      await roleApi.create({
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
      });
    }

    $q.notify({
      type: 'positive',
      message: t('success'),
    });

    emit('saved');
  } catch (error) {
    console.error('Failed to save role:', error);
    $q.notify({
      type: 'negative',
      message: t('error'),
    });
  } finally {
    isSubmitting.value = false;
  }
}

watch(
  () => props.active,
  (isActive) => {
    if (isActive) {
      void loadSystemResources();
    }
  },
);

watch(
  () => props.role,
  () => {
    if (props.active) {
      reset();
    }
  },
);

watch(
  () => systemResources.value,
  (newResources) => {
    if (props.active && newResources.length > 0) {
      reset();
    }
  },
);

onMounted(() => {
  if (props.active) {
    void loadSystemResources();
  }
});

defineExpose({
  submit,
  reset,
  isSubmitting,
});
</script>

<style scoped lang="scss">
.role-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.role-form__permissions-section {
  margin-top: 16px;
}

.role-form__permissions-title {
  display: flex;
  align-items: center;
  font-weight: 500;
  margin-bottom: 16px;
  color: #424242;
}

.role-form__permissions-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-form__permission-row {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 16px;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
}

.role-form__resource-name {
  font-weight: 500;
  color: #212121;
}

.role-form__permission-select {
  min-width: 180px;
}
</style>

