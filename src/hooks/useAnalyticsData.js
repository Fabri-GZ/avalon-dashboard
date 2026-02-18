import { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';

export function useAnalyticsData(clientId) {
  const [socialInsights, setSocialInsights] = useState([]);
  const [websiteAnalytics, setWebsiteAnalytics] = useState([]);
  const [socialDemographics, setSocialDemographics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = createClient();

  useEffect(() => {
    if (clientId) {
      fetchAnalyticsData();
    }
  }, [clientId]);

  async function fetchAnalyticsData() {
    try {
      setLoading(true);
      setError(null);

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('onboarding_date')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      const dateFromStr = clientData.onboarding_date;

      const { data: socialData, error: socialError } = await supabase
        .from('social_insights')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', dateFromStr)
        .order('date', { ascending: true });

      if (socialError) throw socialError;
      setSocialInsights(socialData || []);

      const { data: websiteData, error: websiteError } = await supabase
        .from('website_analytics')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', dateFromStr)
        .order('date', { ascending: true });

      if (websiteError) throw websiteError;
      setWebsiteAnalytics(websiteData || []);

      const { data: demoData, error: demoError } = await supabase
        .from('social_demographics')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', dateFromStr)
        .order('date', { ascending: false });

      if (demoError) throw demoError;
      setSocialDemographics(demoData || []);

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return {
    socialInsights,
    websiteAnalytics,
    socialDemographics,
    loading,
    error,
    refetch: fetchAnalyticsData
  };
}