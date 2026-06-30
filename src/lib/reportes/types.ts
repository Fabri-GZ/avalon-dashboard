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
