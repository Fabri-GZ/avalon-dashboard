CREATE POLICY "admin_global can modify avalon_services"
  ON avalon_services FOR ALL TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin_global'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin_global'
  );
