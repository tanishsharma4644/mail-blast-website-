import { useEffect, useMemo, useState } from 'react';
import { campaignsApi } from '../api/campaigns';

export function useCampaign(campaignId, { autoRefresh = false, intervalMs = 3000 } = {}) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCampaign = async () => {
    const { data } = await campaignsApi.getById(campaignId);
    setCampaign(data.campaign);
    return data.campaign;
  };

  useEffect(() => {
    if (!campaignId) return undefined;

    let interval;
    const init = async () => {
      setLoading(true);
      const fetched = await fetchCampaign();
      setLoading(false);

      if (autoRefresh && fetched?.status === 'running') {
        interval = setInterval(fetchCampaign, intervalMs);
      }
    };

    init();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [campaignId, autoRefresh, intervalMs]);

  return useMemo(() => ({ campaign, loading, refresh: fetchCampaign }), [campaign, loading]);
}
