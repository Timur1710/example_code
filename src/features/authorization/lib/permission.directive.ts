/**
 * Директива v-permission для проверки прав в template
 *
 * Использование:
 * <button v-permission="'Заказы'">Создать заказ</button>
 * <button v-permission="{ section: 'Заказы', level: 'edit' }">Редактировать</button>
 * <button v-permission="['Заказы', 'Товары']">Требует доступ к обоим</button>
 */

import type { Directive, DirectiveBinding } from 'vue';
import { useSessionStore } from 'src/entities/session';
interface PermissionBindingObject {
  section: string;
  level?: 'view' | 'edit';
}

type PermissionBinding = string | PermissionBindingObject | (string | PermissionBindingObject)[];

function checkPermission(binding: PermissionBinding): boolean {
  const store = useSessionStore();

  // Если массив — проверяем все
  if (Array.isArray(binding)) {
    return binding.every((item) => {
      if (typeof item === 'string') {
        return store.hasPermission(item, 'view');
      }
      return store.hasPermission(item.section, item.level ?? 'view');
    });
  }

  // Если объект
  if (typeof binding === 'object' && binding !== null) {
    return store.hasPermission(binding.section, binding.level ?? 'view');
  }

  // Если строка
  return store.hasPermission(binding, 'view');
}

function updateElement(el: HTMLElement, binding: DirectiveBinding<PermissionBinding>): void {
  const hasAccess = checkPermission(binding.value);

  if (!hasAccess) {
    // Скрываем элемент
    el.style.display = 'none';
    // Добавляем атрибут для отладки
    el.setAttribute('data-permission-denied', 'true');
  } else {
    // Показываем элемент
    el.style.display = '';
    el.removeAttribute('data-permission-denied');
  }
}

export const vPermission: Directive<HTMLElement, PermissionBinding> = {
  mounted(el, binding) {
    updateElement(el, binding);
  },

  updated(el, binding) {
    updateElement(el, binding);
  },
};

/**
 * Директива v-permission-disabled
 * Вместо скрытия делает элемент disabled
 */
export const vPermissionDisabled: Directive<HTMLElement, PermissionBinding> = {
  mounted(el, binding) {
    const hasAccess = checkPermission(binding.value);
    if (!hasAccess) {
      el.setAttribute('disabled', 'true');
      el.classList.add('permission-disabled');
    }
  },

  updated(el, binding) {
    const hasAccess = checkPermission(binding.value);
    if (!hasAccess) {
      el.setAttribute('disabled', 'true');
      el.classList.add('permission-disabled');
    } else {
      el.removeAttribute('disabled');
      el.classList.remove('permission-disabled');
    }
  },
};
