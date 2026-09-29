<template>
  <q-form ref="formRef" class="user-form" @submit.prevent="onSubmit">
    <q-input
      v-model="formData.name"
      outlined
      :label="t('login_name')"
      :disable="isEditMode"
      :rules="[(val: string) => !!val || t('validate.required')]"
    >
    <template v-slot:append>
      <q-icon class="pointer" v-show="formData.name.length > 0" @click="translateName" name="translate" />
    </template>
    </q-input>

    <q-checkbox v-model="formData.isAdministrator" :label="t('roles.administrator')" />

    <q-select
      v-if="!isAdminSelected"
      v-model="formData.roleId"
      outlined
      :label="t('role')"
      :options="roleOptions"
      emit-value
      map-options
      :loading="rolesLoading"
      :rules="[(val: string) => !!val || t('validate.required')]"
    />

    <q-select
      v-model="formData.u_id"
      outlined
      :label="t('employee')"
      :options="workerOptions"
      emit-value
      map-options
      clearable
      :loading="workersLoading"
      option-value="_id"
      option-label="name"
    >
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey">
            {{ t('no_data') }}
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <div class="user-form__password-section">
      <q-btn
        :label="showPasswordFields ? t('password_hide') : t('change_password')"
        flat
        color="primary"
        icon="lock_reset"
        class="user-form__password-toggle"
        @click="showPasswordFields = !showPasswordFields"
      />

      <q-slide-transition>
        <div v-show="showPasswordFields" class="user-form__password-fields">
          <q-input
            v-model="formData.password"
            outlined
            :label="t('password_new')"
            :type="showPassword ? 'text' : 'password'"
            :rules="passwordRules"
          >
          <template v-slot:prepend>
            <q-icon class="pointer" name="sym_o_shield_lock" @click="generate_password" />
          </template>  
          <template #append>
              <q-icon
                :name="showPassword ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-input
            v-model="formData.confirmPassword"
            outlined
            :label="t('password_repeat')"
            :type="showConfirmPassword ? 'text' : 'password'"
            :rules="confirmPasswordRules"
          >
          <template v-slot:prepend>
            <q-icon class="text-white" name="sym_o_shield_lock" />
          </template> 
            <template #append>
              <q-icon
                :name="showConfirmPassword ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </q-input>

          <q-btn
            v-if="isEditMode"
            :label="t('reset_password')"
            :disable="
              !formData.password ||
              !formData.confirmPassword ||
              formData.password !== formData.confirmPassword
            "
            color="red"
            icon="key"
            class="user-form__reset-password-btn"
            @click="onResetPassword"
          />
        </div>
      </q-slide-transition>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { QForm, useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import { roleApi } from 'src/entities/role';
import { workerApi, type WorkerSelector } from 'src/entities/worker';
import { userApi, type UserWithWorker } from 'src/entities/user';
import { useTransliterationsWord, useGeneratePassword  } from 'src/shared/lib';

const { transliterate } = useTransliterationsWord();
const { generatePassword } = useGeneratePassword();

interface Props {
  user?: UserWithWorker | null;
  /** Активность формы (для сброса при открытии диалога) */
  active?: boolean;
}

interface Emits {
  (e: 'saved'): void;
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  active: true,
});

const emit = defineEmits<Emits>();

const { t } = useI18n();
const $q = useQuasar();

const isEditMode = computed(() => !!props.user);

const formRef = ref<QForm>();

const formData = reactive({
  name: '',
  isAdministrator: false,
  roleId: '' as string | undefined,
  u_id: '' as string | undefined,
  password: '',
  confirmPassword: '',
});

const isAdminSelected = computed(() => formData.isAdministrator);

const showPasswordFields = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isSubmitting = ref(false);

const roleOptions = ref<{ label: string; value: string }[]>([]);
const workerOptions = ref<WorkerSelector[]>([]);
const rolesLoading = ref(false);
const workersLoading = ref(false);

const translateName = () => {
  if (!formData.name) return;
  formData.name = transliterate(formData.name);
};

const generate_password = () => {
  const newPassword = generatePassword();
  formData.password = newPassword;
  formData.confirmPassword = newPassword;
  showPassword.value = true;
  showConfirmPassword.value = true;
};

const passwordRules = computed(() => {
  if (!showPasswordFields.value) return [];
  if (isEditMode.value && !formData.password) return [];
  return [
    (val: string) => !!val || t('validate.required'),
    (val: string) => val.length >= 6 || t('validate.min_password_length'),
  ];
});

const confirmPasswordRules = computed(() => {
  if (!showPasswordFields.value) return [];
  if (isEditMode.value && !formData.password) return [];
  return [
    (val: string) => !!val || t('validate.required'),
    (val: string) => val === formData.password || t('password_mismatch'),
  ];
});

async function loadRoles() {
  rolesLoading.value = true;
  try {
    const roles = await roleApi.getAll();
    roleOptions.value = roles.map((role) => ({
      label: role.name,
      value: role._id,
    }));
  } catch (error) {
    console.error('Failed to load roles:', error);
    roleOptions.value = [];
  } finally {
    rolesLoading.value = false;
  }
}

async function loadWorkers() {
  workersLoading.value = true;
  try {
    workerOptions.value = await workerApi.getAllForSelector();
  } catch (error) {
    console.error('Failed to load workers:', error);
  } finally {
    workersLoading.value = false;
  }
}

function isAdminAccess(access: string): boolean {
  return ['admin', 'administrator', 'super_admin'].includes(access?.toLowerCase());
}

function resetForm() {
  if (props.user) {
    formData.name = props.user.name;

    formData.isAdministrator = isAdminAccess(props.user.access);
    if (formData.isAdministrator) {
      formData.roleId = undefined;
    } else {
      formData.roleId = props.user.roleId || '';
    }

    formData.u_id = props.user.u_id;
  } else {
    formData.name = '';
    formData.isAdministrator = false;
    formData.roleId = undefined;
    formData.u_id = undefined;
  }
  formData.password = '';
  formData.confirmPassword = '';
  showPasswordFields.value = !isEditMode.value;
  formRef.value?.resetValidation();
}

async function onResetPassword() {
  if (!isEditMode.value || !props.user || !formData.password) return;

  isSubmitting.value = true;

  try {
    await userApi.resetPassword({
      userId: props.user._id,
      newPassword: formData.password,
    });

    showPasswordFields.value = false;

    $q.notify({
      type: 'positive',
      message: t('password_reset_success'),
    });
  } catch (error) {
    console.error('Failed to reset password:', error);
    $q.notify({
      type: 'negative',
      message: t('error'),
    });
  } finally {
    isSubmitting.value = false;
  }
}

async function onSubmit() {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  isSubmitting.value = true;

  try {
    const isAdmin = formData.isAdministrator;

    if (isEditMode.value && props.user) {
      const updateData: {
        name?: string;
        access?: string;
        roleId?: string;
        u_id?: string;
      } = {
        name: formData.name,
      };

      if (formData.u_id !== undefined) {
        updateData.u_id = formData.u_id;
      }

      if (isAdmin) {
        updateData.access = 'administrator';
      } else {
        updateData.access = 'worker';
        if (formData.roleId) {
          updateData.roleId = formData.roleId;
        }
      }

      await userApi.update(props.user._id, updateData);
      $q.notify({
        type: 'positive',
        message: t('success'),
      });
    } else {
      const createData: {
        name: string;
        password: string;
        access: string;
        roleId?: string;
        u_id?: string;
      } = {
        name: formData.name,
        password: formData.password,
        access: isAdmin ? 'administrator' : 'worker',
      };

      if (!isAdmin && formData.roleId) {
        createData.roleId = formData.roleId;
      }

      if (formData.u_id) {
        createData.u_id = formData.u_id;
      }

      await userApi.create(createData);
      $q.notify({
        type: 'positive',
        message: t('success'),
      });
    }

    emit('saved');
  } catch (error: unknown) {
    console.error('Failed to save user:', error);
    if (error instanceof AxiosError && error.response?.data?.message) {
      $q.notify({
        type: 'negative',
        message: error.response.data.message,
      });
    } else {
      $q.notify({
        type: 'negative',
        message: t('error'),
      });
    }
  } finally {
    isSubmitting.value = false;
  }
}

watch(
  () => props.active,
  (newVal) => {
    if (newVal) {
      resetForm();
      void loadRoles();
      void loadWorkers();
    }
  },
);

watch(
  () => props.user,
  () => {
    if (props.active) {
      resetForm();
    }
  },
);

onMounted(() => {
  if (props.active) {
    resetForm();
    void loadRoles();
    void loadWorkers();
  }
});

defineExpose({
  submit: onSubmit,
  reset: resetForm,
  isSubmitting,
});
</script>

<style scoped lang="scss">
.user-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-form__password-section {
  margin-top: 8px;
}

.user-form__password-toggle {
  margin-bottom: 8px;
}

.user-form__password-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.user-form__reset-password-btn {
  margin-top: 8px;
  align-self: flex-start;
}
</style>

