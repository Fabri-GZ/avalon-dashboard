CREATE POLICY "only admin_global can modify section_permissions"
  ON section_permissions FOR ALL TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin_global'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin_global'
  );
