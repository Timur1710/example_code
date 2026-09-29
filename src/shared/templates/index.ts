/**
 * Templates - шаблоны страниц и layouts
 */

export { PageTemplate } from './PageTemplate';
export { BasePageTemplate } from './BasePageTemplate';
export { AlternativesListTemplate } from './AlternativesListTemplate';
export { AlternativesSelectionTemplate } from './AlternativesSelectionTemplate';
export { ScheduleFormTemplate } from './ScheduleFormTemplate';
export { RouteDialogTemplate } from './RouteDialogTemplate';
export { CloseModalConfirmTemplate } from './CloseModalConfirmTemplate';
export { DeleteConfirmationTemplate } from './DeleteConfirmationTemplate';
export type {
  ScheduleFormData,
  ScheduleCycleSetting,
  ScheduleFormTemplateProps,
  ScheduleFormTemplateEmits,
} from './ScheduleFormTemplate';
export { ResourceSelectionTemplate } from './ResourceSelectionTemplate';
export type { ResourceSelectionTemplateProps, ResourceType } from './ResourceSelectionTemplate';
export { SingleSelectionTemplate } from './SingleSelectionTemplate';
export type { SingleSelectionTemplateProps, SingleSelectionTemplateEmits } from './SingleSelectionTemplate';
export { ProductionUnitSelectionTemplate } from './ProductionUnitSelectionTemplate';
export { default as ProductionUnitSelectionDialog } from './ProductionUnitSelectionTemplate/ProductionUnitSelectionDialog.vue';
export type { ProductionUnitSelectionTemplateProps } from './ProductionUnitSelectionTemplate';
