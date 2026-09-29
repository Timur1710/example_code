import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ORDERS_TYPE } from "../constants/orders-type";

export function useOrdersTypeOptions() {
  const { t } = useI18n();

  const options = computed(() => 
    ORDERS_TYPE.map(code => ({
      value: code,
      label: t(`${code}_order`),
      disable: false
    }))
  );

  return options;
}