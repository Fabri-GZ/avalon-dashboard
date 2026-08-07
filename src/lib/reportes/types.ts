// Ciclo de vida async del reporte de paid media sobre Supabase (fuente de verdad).
// Espeja el patrón de agente-ia: el route encola `pending` y devuelve el jobId;
// el front pollea `reports` hasta done/error. n8n escribe el estado final por
// service_role.

export type ReportStatus = 'pending' | 'running' | 'done' | 'error';

// Fila de la tabla public.reports.
export interface Report {
  id: string; // jobId (PK)
  account_id: string; // act_xxx (FK a ad_accounts)
  account_name: string; // snapshot, estable aunque la cuenta se renombre
  period_year: number;
  period_month: number; // 1-12
  status: ReportStatus;
  report_url: string | null;
  error: string | null;
  manifest: ReportManifest | null; // lo que emitió el LLM, para auditoría
  requested_by: string;
  created_at: string;
  updated_at: string;
}

// Contrato del manifiesto: lo que emite el LLM. n8n lo renderiza sobre el
// registry de componentes (SVG inline). El LLM NO escribe HTML.
export interface ReportManifest {
  account: { id: string; name: string };
  period: { year: number; month: number; label: string };
  copy: { summary: string; highlights: string[] };
  components: ReportComponent[]; // ordenado: define qué se renderiza y en qué orden
  // Optional so existing rows with `manifest: null` or without this key keep
  // parsing — written by n8n once the compute step's primaryConversion output
  // is merged in (see compute.js resolveConfiguredConversion()).
  primary_conversion?: {
    action_type: string;
    label: string;
    origin: 'config' | 'detected';
    config_error: { field: string; value: string; reason: string } | null;
  };
}

export interface ReportComponent {
  type: string; // clave en el registry de n8n (bar, line, donut, kpi, table, ...)
  props: Record<string, unknown>;
}

// Body del enqueue: el front pide generar (cuenta + período).
export interface GenerateReportRequest {
  accountId: string;
  year: number;
  month: number; // 1-12
}

// Fila de ad_accounts que viaja al webhook de n8n. snake_case a propósito:
// misma clave en la DB, en el payload y en raw.account dentro de compute.js.
export interface ReportWebhookAccount {
  id: string;
  name: string;
  currency: string | null;
  primary_action_type: string | null;
}

// Body real que route.ts postea al webhook de n8n (distinto de
// GenerateReportRequest, que es lo que el front postea a /api/reportes).
export interface GenerateReportWebhookPayload {
  jobId: string;
  accountId: string;
  year: number;
  month: number;
  account: ReportWebhookAccount;
}

// Respuesta del enqueue: el route devuelve el jobId al toque, sin esperar el
// resultado. El front pollea `reports` hasta done/error.
export interface EnqueueResponse {
  jobId: string;
}

// Cuenta para el picker (subset de ad_accounts).
export interface AccountOption {
  id: string;
  name: string;
  business_name?: string | null;
}

// Filtro de estado del topbar.
export type ReportFilter = 'todas' | 'done' | 'proceso' | 'error';

// Fila del historial por cuenta: cada cuenta con su último reporte (o null).
export interface AccountRow {
  account: AccountOption;
  latest: Report | null;
}
