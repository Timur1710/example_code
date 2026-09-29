export { default as DetailsPageTemplate } from './DetailsPageTemplate.vue';
export function formatDate(date?: string | Date): string {
  if (!date) return '—';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
}