import { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';

/**
 * @param {object} options
 * @param {string[]|null} [options.initialPmGids] When role=pm, the asana_project_gids
 *   from pm_user_configs (fetched server-side via supabaseAdmin). null/undefined
 *   for non-PM roles. Empty array means PM has no projects assigned.
 */
export function useClientData(options = {}) {
  const { initialPmGids } = options;
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [allowedSections, setAllowedSections] = useState(null);
  const [profile, setProfile] = useState(null);

  const supabase = createClient();

  useEffect(() => {
    fetchClientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchClientData() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No user found');
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profile);
      setUserRole(profile.role);

      const { data: perms } = await supabase
        .from('section_permissions')
        .select('section_key')
        .eq('role', profile.role);
      setAllowedSections((perms ?? []).map(p => p.section_key));

      if (profile.role === 'admin_global') {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('company_name');

        if (clientsError) throw clientsError;

        setClients(clientsData);
        if (clientsData.length > 0) {
          const savedClientId = typeof window !== 'undefined' ? localStorage.getItem('avalon_selected_client_id') : null;
          const foundClient = savedClientId ? clientsData.find(c => c.id === savedClientId) : null;

          setSelectedClient(foundClient || clientsData[0]);
        }
      }
      else if (profile.role === 'client_user' && profile.client_id) {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*, services_contracted')
          .eq('id', profile.client_id)
          .single();

        if (clientError) throw clientError;

        setClients([clientData]);
        setSelectedClient(clientData);

        const SERVICE_GATED = ['website', 'ads', 'social', 'chatbot'];
        const contracted = clientData?.services_contracted || [];
        const sections = (perms ?? []).map(p => p.section_key);
        const filtered = sections.filter(s =>
          !SERVICE_GATED.includes(s) || contracted.includes(s)
        );
        setAllowedSections(filtered);
      } else if (profile.role === 'pm') {
        // PM sees their pm_clients (filtered by asana_project_gids from pm_user_configs,
        // fetched server-side and passed via initialPmGids). pm_clients shape is
        // adapted to the dashboard Client shape so CompanySwitcher stays agnostic.
        const gids = Array.isArray(initialPmGids) ? initialPmGids : [];
        if (gids.length === 0) {
          setClients([]);
          setSelectedClient(null);
        } else {
          const { data: pmClients, error: pmErr } = await supabase
            .from('pm_clients')
            .select('id, name, asana_project_id, status')
            .in('asana_project_id', gids)
            .order('name');

          if (pmErr) throw pmErr;

          const adapted = (pmClients ?? []).map(c => ({
            id: c.id,
            company_name: c.name,
            logo_url: null,
            status: c.status,
            asana_project_id: c.asana_project_id,
          }));
          setClients(adapted);
          if (adapted.length > 0) {
            const savedClientId = typeof window !== 'undefined' ? localStorage.getItem('avalon_selected_client_id') : null;
            const foundClient = savedClientId ? adapted.find(c => c.id === savedClientId) : null;
            setSelectedClient(foundClient || null);
          } else {
            setSelectedClient(null);
          }
        }
      } else if (profile.role === 'cm') {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('company_name');

        if (clientsError) throw clientsError;

        setClients(clientsData ?? []);
        if (clientsData && clientsData.length > 0) {
          const savedClientId = typeof window !== 'undefined' ? localStorage.getItem('avalon_selected_client_id') : null;
          const foundClient = savedClientId ? clientsData.find(c => c.id === savedClientId) : null;
          setSelectedClient(foundClient || clientsData[0]);
        } else {
          setSelectedClient({ id: null, company_name: 'Sin cliente' });
        }
      } else {
        // comercial and other internal roles: no client context needed
        setSelectedClient({ id: null, company_name: 'Avalon' });
        setClients([]);
      }

    } catch (err) {
      console.error('Error fetching client data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedClient?.id) {
      localStorage.setItem('avalon_selected_client_id', selectedClient.id);
    }
  }, [selectedClient]);



  return {
    clients,
    selectedClient,
    setSelectedClient,
    userRole,
    allowedSections,
    profile,
    loading,
    error,
    refetch: fetchClientData
  };
}
