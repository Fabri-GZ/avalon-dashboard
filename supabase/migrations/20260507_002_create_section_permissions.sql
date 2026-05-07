CREATE TABLE section_permissions (
  role        text NOT NULL,
  section_key text NOT NULL,
  PRIMARY KEY (role, section_key)
);

ALTER TABLE section_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own role permissions"
  ON section_permissions FOR SELECT
  TO authenticated
  USING (
    role = (
      SELECT role
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );

INSERT INTO section_permissions (role, section_key) VALUES
  -- admin_global: all 10 sections
  ('admin_global', 'overview'),
  ('admin_global', 'website'),
  ('admin_global', 'ads'),
  ('admin_global', 'social'),
  ('admin_global', 'chatbot'),
  ('admin_global', 'commercial'),
  ('admin_global', 'pm'),
  ('admin_global', 'account'),
  ('admin_global', 'admin_clients'),
  ('admin_global', 'settings'),
  -- client_user: 7 sections
  ('client_user', 'overview'),
  ('client_user', 'website'),
  ('client_user', 'ads'),
  ('client_user', 'social'),
  ('client_user', 'chatbot'),
  ('client_user', 'account'),
  ('client_user', 'settings'),
  -- comercial: 3 sections
  ('comercial', 'commercial'),
  ('comercial', 'account'),
  ('comercial', 'settings'),
  -- pm: 8 sections
  ('pm', 'overview'),
  ('pm', 'website'),
  ('pm', 'ads'),
  ('pm', 'social'),
  ('pm', 'chatbot'),
  ('pm', 'pm'),
  ('pm', 'account'),
  ('pm', 'settings'),
  -- cm: 7 sections
  ('cm', 'overview'),
  ('cm', 'website'),
  ('cm', 'ads'),
  ('cm', 'social'),
  ('cm', 'chatbot'),
  ('cm', 'account'),
  ('cm', 'settings');

CREATE POLICY "only admin_global can modify section_permissions"
  ON section_permissions FOR ALL TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin_global'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin_global'
  );
