/**
 * Типы для формы создания узла
 */

/**
 * Интерфейс родительского узла
 */
export interface ParentNodeInfo {
  id: string;
  label: string;
  icon?: string;
}

/**
 * Payload события создания узла
 */
export interface CreateFolderPayload {
  name: string;
  parentId: string | null;
  type: string;
}

export interface UpdateFolderPayload {
  name: string;
}

