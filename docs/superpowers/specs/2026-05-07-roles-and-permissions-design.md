# Design: Roles & Permisos (Change #1)

**Date**: 2026-05-07  
**Project**: avalon-dashboard  
**Status**: Approved

---

## Context

El dashboard tiene hoy dos roles (`admin_global`, `client_user`). Se necesita soporte para roles internos de la agencia: `cm`, `pm`, `comercial`. El sistema debe ser extensible sin redeploy cuando se agreguen nuevas secciones.

---

## Architecture

Modelo **A+C**: enum de rol fijo por usuario + tabla `section_permissions` declarativa.

- Un usuario siempre tiene exactamente un rol (no many-to-many).
- Las secciones habilitadas por rol se leen de Supabase, no están hardcodeadas en el frontend.
- El middleware de Next.js protege las rutas en el edge — no depende solo del sidebar.

---

## Data Model Changes

### 1. Extender check constraint de `user_profiles.role`

```sql
ALTER TABLE user_profiles 
  DROP CONSTRAINT user_profiles_role_check,
  ADD CONSTRAINT user_profiles_role_check 
    CHECK (role = ANY (ARRAY[
      'admin_global',
      'client_user',
      'comercial',
      'pm',
      'cm'
    ]));
```

Roles internos (`admin_global`, `cm`, `pm`, `comercial`) tienen `client_id = NULL`.  
Solo `client_user` tiene `client_id` poblado.

### 2. Nueva tabla `section_permissions`

```sql
CREATE TABLE section_permissions (
  role        text NOT NULL,
  section_key text NOT NULL,
  PRIMARY KEY (role, section_key),
  FOREIGN KEY (role) REFERENCES -- check constraint vía app, no FK a enum
);

ALTER TABLE section_permissions ENABLE ROW LEVEL SECURITY;

-- Solo lectura para usuarios autenticados
CREATE POLICY "authenticated can read section_permissions"
  ON section_permissions FOR SELECT
  TO authenticated
  USING (true);
```

### 3. Seed data — matriz rol → secciones

| section_key    | admin_global | client_user | comercial | pm | cm |
|----------------|:---:|:---:|:---:|:---:|:---:|
| overview       | ✅ | ✅ | ❌ | ✅ | ✅ |
| website        | ✅ | ⚙️ | ❌ | ✅ | ✅ |
| ads            | ✅ | ⚙️ | ❌ | ✅ | ✅ |
| social         | ✅ | ⚙️ | ❌ | ✅ | ✅ |
| chatbot        | ✅ | ⚙️ | ❌ | ✅ | ✅ |
| commercial     | ✅ | ❌ | ✅ | ❌ | ❌ |
| pm             | ✅ | ❌ | ❌ | ✅ | ❌ |
| account        | ✅ | ✅ | ✅ | ✅ | ✅ |
| admin_clients  | ✅ | ❌ | ❌ | ❌ | ❌ |
| settings       | ✅ | ✅ | ✅ | ✅ | ✅ |

(⚙️ = visible solo si `clients.services_contracted` lo incluye — lógica existente, no cambia.)

```sql
INSERT INTO section_permissions (role, section_key) VALUES
  ('admin_global', 'overview'), ('admin_global', 'website'), ('admin_global', 'ads'),
  ('admin_global', 'social'), ('admin_global', 'chatbot'), ('admin_global', 'commercial'),
  ('admin_global', 'pm'), ('admin_global', 'account'), ('admin_global', 'admin_clients'),
  ('admin_global', 'settings'),
  ('client_user', 'overview'), ('client_user', 'website'), ('client_user', 'ads'),
  ('client_user', 'social'), ('client_user', 'chatbot'), ('client_user', 'account'),
  ('client_user', 'settings'),
  ('comercial', 'commercial'), ('comercial', 'account'), ('comercial', 'settings'),
  ('pm', 'overview'), ('pm', 'website'), ('pm', 'ads'), ('pm', 'social'),
  ('pm', 'chatbot'), ('pm', 'pm'), ('pm', 'account'), ('pm', 'settings'),
  ('cm', 'overview'), ('cm', 'website'), ('cm', 'ads'), ('cm', 'social'),
  ('cm', 'chatbot'), ('cm', 'account'), ('cm', 'settings');
```

### 4. RLS fixes

```sql
-- avalon_services: tiene data sensible de integraciones, solo admin_global
ALTER TABLE avalon_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "only admin_global can access avalon_services"
  ON avalon_services FOR ALL TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin_global'
  );

-- grupo_norte_leads: tabla externa, solo habilitar RLS sin acceso desde este sistema
ALTER TABLE grupo_norte_leads ENABLE ROW LEVEL SECURITY;
```

---

## Section Visibility (Frontend)

### Flujo al hacer login

1. Server component lee `user_profiles` (rol + client_id) para el usuario autenticado.
2. Hace un segundo fetch a `section_permissions WHERE role = $role`.
3. Pasa `allowedSections: string[]` como prop al layout del dashboard.

### Middleware (`middleware.ts`)

Protección en el edge para cada ruta de sección:

```
/dashboard/commercial  →  requiere 'commercial' en allowedSections
/dashboard/pm          →  requiere 'pm' en allowedSections
/admin/*               →  requiere 'admin_clients' en allowedSections
```

Si la ruta no está permitida → redirect a la primera sección válida del usuario.

### Sidebar

Renderiza solo las secciones que están en `allowedSections`. Sin condicionales hardcodeados por rol — consume la lista del servidor.

---

## Client Switcher

Vive en `DashboardHeader`. Comportamiento por rol:

- **`client_user`**: sin switcher. Ve solo su `client_id` fijo.
- **`admin_global` / `cm` / `pm`**: dropdown con todos los clientes (query a `clients`).
- **`comercial`**: sin switcher (su sección no es por cliente).

El cliente seleccionado se persiste en **URL param** (`?client=<uuid>`) para que sea recargable y shareable. Estado derivado del param, no de localStorage.

**Future (cuando exista mapeo cm/pm→client)**: el switcher evoluciona a search + dropdown con filtrado por usuario asignado. Agregar barra de búsqueda en ese momento.

---

## Invite Flow

Nueva página `/admin/invite-user` — solo accesible para `admin_global`.

**Formulario**: email + select de rol (`cm` | `pm` | `comercial`).

**Submit**:
1. API route llama a `supabaseAdmin.auth.admin.inviteUserByEmail(email, { data: { role } })`.
2. Usuario recibe magic link, acepta invitación.
3. El callback en `/auth/callback` detecta `user_metadata.role` y hace `INSERT INTO user_profiles (id, role, client_id) VALUES (uid, role, NULL)`.

El signup público (`/signup`) queda bloqueado por middleware para cualquier acceso que no venga del flujo de `create-client` (client_user).

---

## Error Handling

- Rol desconocido o `user_profiles` sin registro → logout automático + toast de error.
- Acceso a ruta no permitida → redirect silencioso (no 403, no pantalla de error).
- `inviteUserByEmail` falla (email ya existe, rate limit) → toast descriptivo en el form.

---

## Out of Scope (este change)

- Mapeo cm→client y pm→client (future change).
- Sección "Redes" (change #2).
- Migración del CRM de Juan (change #3).
- Migración del PM Tracker de Lucas (change #4).
- Roles `designer`, `storyteller` y otros pendientes.
