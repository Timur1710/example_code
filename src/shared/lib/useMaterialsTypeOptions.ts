import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { MATERIALS_TYPE } from "../constants/material-type";

export function useMaterialsTypeOptions() {
  const { t } = useI18n();

  const options = computed(() => 
    MATERIALS_TYPE.map(code => ({
      value: code,
      label: t(`material_modal.${code}`),
      disable: false
    }))
  );

  return options;
}