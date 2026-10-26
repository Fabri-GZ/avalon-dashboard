// Ciclo de vida async del reporte de paid media sobre Supabase (fuente de verdad).
// Espeja el patrón de agente-ia: el route encola `pending` y devuelve el jobId;
// el front pollea `reports` hasta done/error. n8n escribe el estado final por
// service_role.

// `draft_ready` is terminal only for complete reports (drafts generated, ready
// to edit); render/send state lives on child rows, never on `reports`.
export type ReportStatus = 'pending' | 'running' | 'draft_ready' | 'done' | 'error';

export type ReportType = 'summary' | 'complete';

// Fila de la tabla public.reports.
export interface Report {
  id: string; // jobId (PK)
  account_id: string; // act_xxx (FK a ad_accounts)
  account_name: string; // snapshot, estable aunque la cuenta se renombre
  period_year: number;
  period_month: number; // 1-12
  report_type: ReportType;
  version: number; // summary is always 1; complete increments per regeneration
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
  reportType?: ReportType; // default 'summary'
  // Complete only: the user confirmed creating a new version although a draft
  // already exists for the account+period (otherwise the route answers 409).
  confirmRegenerate?: boolean;
}

// Config opt-in del modo "resultados de campaña" (ad_accounts.results_config).
// La DB valida solo la forma; el vocabulario de indicadores vive en compute.js.
export interface ResultsConfig {
  mode: 'campaign_results';
  primaryIndicator: string;
  secondaryIndicators?: string[];
}

// Fila de ad_accounts que viaja al webhook de n8n. snake_case a propósito:
// misma clave en la DB, en el payload y en raw.account dentro de compute.js.
export interface ReportWebhookAccount {
  id: string;
  name: string;
  currency: string | null;
  primary_action_type: string | null;
  results_config: ResultsConfig | null;
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

// --- Complete report (drafts -> edit -> render -> send) ---------------------

// Fila de public.report_texts. `ai_text` is written only by n8n and never
// changes; humans write `edited_text`. Effective text = edited_text ?? ai_text.
export interface ReportText {
  id: string;
  report_id: string;
  section_key: string;
  section_label: string;
  sort_order: number;
  ai_text: string;
  ai_rationale: string | null;
  edited_text: string | null;
  edited_by: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

// Entry of report_renders.texts_snapshot: the effective text frozen at render
// time so a published version never changes when the draft is edited later.
export interface ReportTextSnapshot {
  section_key: string;
  section_label: string;
  sort_order: number;
  text: string;
  edited: boolean;
}

export type RenderStatus = 'pending' | 'running' | 'done' | 'error';

// Fila de public.report_renders (one published URL per render).
export interface ReportRender {
  id: string;
  report_id: string;
  public_id: string; // 8 chars, part of the published URL
  status: RenderStatus;
  texts_snapshot: ReportTextSnapshot[];
  report_url: string | null;
  pdf_url: string | null;
  error: string | null;
  error_detail: Record<string, unknown> | null;
  rendered_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DeliveryStatus = 'pending' | 'sending' | 'sent' | 'error';

// Fila de public.report_deliveries (email + Drive send of one render).
export interface ReportDelivery {
  id: string;
  render_id: string;
  to_email: string;
  cc_emails: string[];
  drive_file_name: string;
  status: DeliveryStatus;
  drive_url: string | null;
  error: string | null;
  error_detail: Record<string, unknown> | null;
  sent_by: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// Body que la app postea al webhook de borradores (n8n).
export interface DraftsWebhookPayload {
  jobId: string;
  accountId: string;
  year: number;
  month: number;
  version: number;
  account: ReportWebhookAccount;
  client: { id: string; name: string };
}

// Webhook de render: n8n lee texts_snapshot y report_data desde las filas.
export interface RenderWebhookPayload {
  renderId: string;
  reportId: string;
  publicId: string;
}

// Webhook de envío: n8n lee destinatarios y nombre de archivo desde la fila.
export interface SendWebhookPayload {
  deliveryId: string;
  renderId: string;
}

// Typed error codes returned by the complete-report route and server actions.
export type EnqueueErrorCode =
  | 'no_client'
  | 'complete_exists'
  | 'in_progress'
  | 'not_editable'
  | 'not_found'
  | 'render_in_progress'
  | 'missing_email'
  | 'recipients_changed'
  | 'send_in_progress';

// Respuesta del enqueue: el route devuelve el jobId al toque, sin esperar el
// resultado. El front pollea `reports` hasta done/error.
export interface EnqueueResponse {
  jobId: string;
  version: number; // version of the enqueued row (always 1 for summary)
}

// Plataforma de la cuenta. Solo 'meta' tiene pipeline de generación hoy —
// google/tiktok existen en ad_accounts pero Reportes las deshabilita.
export type Platform = 'meta' | 'google' | 'tiktok';

// Cuenta para el picker (subset de ad_accounts).
export interface AccountOption {
  id: string;
  name: string;
  business_name?: string | null;
  platform: Platform;
  client_id: string | null; // complete reports need a client (recipients live there)
}

// Filtro de estado del topbar.
export type ReportFilter = 'todas' | 'done' | 'proceso' | 'error';

// Fila del historial por cuenta: cada cuenta con su último reporte (o null).
export interface AccountRow {
  account: AccountOption;
  /** Most recent report by `created_at`, whatever its status. Drives the period
   *  column and the status badge. */
  latest: Report | null;
  /** Most recent report that is actually readable: `done` AND carrying a
   *  `report_url`. Deliberately separate from `latest` — while a new report is
   *  generating, `latest` is the pending row, and without this the link to the
   *  last good report would vanish from the table exactly while the user waits
   *  for its replacement. */
  lastDone: Report | null;
}
