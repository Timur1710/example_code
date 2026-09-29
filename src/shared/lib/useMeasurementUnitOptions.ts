import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { MEASUREMENT_UNITS } from "../constants/measurement-units";

export function useMeasurementUnitOptions() {
  const { t } = useI18n();

  const options = computed(() => 
    MEASUREMENT_UNITS.map(code => ({
      value: code,
      label: t(`measurement_units.${code}`)
    }))
  );

  return options
}