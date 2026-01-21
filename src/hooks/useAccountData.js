"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createClient } from '@/app/utils/supabase/client';


export function useAccountData(clientId) {
  const [clientProfile, setClientProfile] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [reports, setReports] = useState([]);
  const [driveResource, setDriveResource] = useState(null);
  const [websiteResource, setWebsiteResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const supabase = useMemo(() => createClient(), []);

  const refetch = useCallback(() => {
    setTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    async function fetchAccountData() {
      if (!clientId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Obtener datos del cliente
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, company_name, logo_url, onboarding_date, services_contracted, status')
          .eq('id', clientId)
          .single();

        if (clientError) throw clientError;
        setClientProfile(clientData);

        // Obtener recursos del cliente
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('client_resources')
          .select('*')
          .eq('client_id', clientId);


        if (resourcesError) throw resourcesError;

        // Filtrar por tipo
        const creds = resourcesData?.filter(r => r.type === 'credential') || [];
        const reps = resourcesData?.filter(r => r.type === 'report') || [];
        const drive = resourcesData?.find(r => r.type === 'drive') || null;
        const web = resourcesData?.find(r => r.type === 'website') || null;


        setCredentials(creds);
        setReports(reps);
        setDriveResource(drive);
        setWebsiteResource(web);

      } catch (err) {
        console.error('Error fetching account data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAccountData();
  }, [clientId, supabase, trigger]);

  const requestOffboarding = async (webhookUrl) => {
    if (!clientId || isUpdatingStatus) return { success: false, error: 'Invalid state' };

    try {
      setIsUpdatingStatus(true);

      const { error: updateError } = await supabase
        .from('clients')
        .update({ status: 'offboarding' })
        .eq('id', clientId);

      if (updateError) throw updateError;

      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId,
              action: 'offboarding_request',
              timestamp: new Date().toISOString()
            })
          });
        } catch (webhookError) {
          console.warn('Webhook failed:', webhookError);
        }
      }

      setClientProfile(prev => prev ? { ...prev, status: 'offboarding' } : null);

      return { success: true };
    } catch (err) {
      console.error('Error requesting offboarding:', err);
      return { success: false, error: err.message };
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return {
    clientProfile,
    credentials,
    reports,
    driveResource,
    websiteResource,
    loading,
    error,
    isUpdatingStatus,
    requestOffboarding,
    refetch
  };
}

