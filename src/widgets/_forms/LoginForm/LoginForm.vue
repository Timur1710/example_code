<template>
  <div class="login__card bg-gray">
    <span class="login-string">
      <i class="login-icon msa-autorization">
        <span class="path1"></span>
        <span class="path2"></span>
        <span class="path3"></span>
      </i>
      <span class="login-title">{{ $t('login.sign_in') }}</span>
    </span>

    <q-form ref="formRef" autofocus @submit.prevent="handleSubmit">
      <q-input
        ref="loginRef"
        class="input-padding"
        :label="$t('login.login_name')"
        v-model="formData.name"
        spellcheck="false"
        outlined
        dense
        :disable="isLoading"
        :rules="[(val: string) => (val && val.length > 0) || $t('login.please_input_login')]"
      />

      <q-input
        class="input-padding"
        :label="$t('login.password')"
        :type="showPassword ? 'text' : 'password'"
        v-model="formData.password"
        outlined
        dense
        :disable="isLoading"
        :rules="[(val: string) => (val && val.length > 0) || $t('login.please_input_password')]"
      >
        <template v-slot:append>
          <q-icon
            :name="showPassword ? 'visibility' : 'visibility_off'"
            class="cursor-pointer icon-eye"
            @click="showPassword = !showPassword"
          />
        </template>
      </q-input>

      <q-input
        class="input-padding"
        :label="$t('hosting')"
        v-model="formData.host"
        spellcheck="false"
        outlined
        dense
        :disable="isLoading"
        :rules="[(val: string) => (val && val.length > 0) || $t('not_empty')]"
      />

      <q-btn
        class="button-margin"
        :label="$t('login.sign')"
        color="primary"
        type="submit"
        :loading="isLoading"
        :disable="isLoading"
      />
    </q-form>

    <div class="login__error" v-if="showError">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13">
        <path
          class="error"
          d="M13.029,11.945l-1.084,1.084L6.529,7.612,1.113,13.029.029,11.945,5.446,6.529.029,1.113,1.113.029,6.529,5.446,11.945.029l1.084,1.084L7.612,6.529Z"
          transform="translate(-0.029 -0.029)"
        />
      </svg>
      <span class="ml10">{{ errorMessage || $t('login.wrong_authorization') }}</span>
    </div>

    <div class="license-error" v-show="showLicenseError">
      <svg
        class="cross"
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="13"
        viewBox="0 0 13 13"
      >
        <path
          id="x"
          d="M13.029,11.945l-1.084,1.084L6.529,7.612,1.113,13.029.029,11.945,5.446,6.529.029,1.113,1.113.029,6.529,5.446,11.945.029l1.084,1.084L7.612,6.529Z"
          transform="translate(-0.029 -0.029)"
          fill="#ecaf36"
          fill-rule="evenodd"
        />
      </svg>
      <span
        >Количество аутентифицированных пользователей превышает количество приобретённых
        лицензий</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { QForm } from 'quasar';
import { useAuth } from 'src/features/auth';
import { setBaseUrl } from 'src/shared/api';
import { BASE_URL_KEY } from 'src/shared/config';

interface LoginFormData {
  name: string;
  password: string;
  host: string;
}

const router = useRouter();
const route = useRoute();
const { login } = useAuth();

// Получаем URL для редиректа после успешного логина
const redirectPath = computed(() => {
  const redirect = route.query.redirect;
  return typeof redirect === 'string' ? redirect : '/';
});

const formRef = ref<QForm>();
const loginRef = ref();
const showPassword = ref(false);
const showError = ref(false);
const showLicenseError = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

const formData = reactive<LoginFormData>({
  name: '',
  password: '',
  host:
    localStorage.getItem(BASE_URL_KEY) ||
    `${window.location.origin.includes('http') ? window.location.origin + '/api' : ''}`,
});

const handleSubmit = async () => {
  // Валидируем форму
  const isValid = await formRef.value?.validate();

  if (!isValid) {
    return;
  }

  showError.value = false;
  showLicenseError.value = false;
  errorMessage.value = '';
  isLoading.value = true;

  try {
    // Устанавливаем baseURL для API
    setBaseUrl(formData.host);

    // Выполняем авторизацию
    await login({
      name: formData.name,
      password: formData.password,
    });

    await router.push(redirectPath.value);
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number; data?: { message?: string } } };

    if (axiosError.response?.status === 400) {
      showError.value = true;
      errorMessage.value = axiosError.response?.data?.message || '';
    } else if (axiosError.response?.status === 403) {
      // Ошибка лицензии
      showLicenseError.value = true;
    } else {
      showError.value = true;
      errorMessage.value = 'Ошибка подключения к серверу';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.bg-gray {
  background-color: #f5f5f5;
}

.ml10 {
  margin-left: 10px;
}

.license-error {
  position: absolute;
  left: 50%;
  bottom: 0;
  display: flex;
  width: 436px;
  height: 52px;
  padding: 12px 19px;
  background-color: #fcfcfc;
  box-shadow: 0 2px 4px #00000029;
  border: 1px solid #d6d6d6;
  border-radius: 3px;
  font-size: 12px;
  line-height: 14px;
  color: #282a2d;
  transform: translate(-50%, -26px);
  animation: hide 5s cubic-bezier(1, 0, 0.58, 1);

  .cross {
    margin-right: 13px;
    min-width: 13px;
  }
}

@keyframes hide {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

.error {
  fill: #ec3636;
  fill-rule: evenodd;
}

.login-string {
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  text-align: left;
  padding-bottom: 19px;
}

.login-title {
  font-size: 20px;
  font-family: 'Montserrat Medium', sans-serif;
  padding-top: 6px;
}

.login-icon {
  font-size: 40px;
  margin-right: 12px;
}

.login__error {
  position: absolute;
  font-size: 14px;
  bottom: -2px;
  padding-left: 50px;
  width: calc(100% + 80px);

  svg {
    fill: #ec3636;
  }
}

.login__card {
  position: relative;
  width: 572px;
  max-width: 100%;
  padding: 54px 106px 56px;
  border-radius: 3px;

  @media (max-width: 575px) {
    padding: 54px 106px 56px;
    width: 334px;
  }
}

.input-padding {
  padding: 10px 0;
}

.button-margin {
  display: block;
  margin: 21px auto 0;
  width: 100%;
}

.icon-eye {
  margin-top: 0;
}
</style>
