import { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';

export function useClientData() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const supabase = createClient();

  useEffect(() => {
    fetchClientData();
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
        .select('role, client_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setUserRole(profile.role);

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
          .select('*')
          .eq('id', profile.client_id)
          .single();

        if (clientError) throw clientError;

        setClients([clientData]);
        setSelectedClient(clientData);
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
    loading,
    error,
    refetch: fetchClientData
  };
}