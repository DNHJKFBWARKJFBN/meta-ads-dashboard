export interface MetaInsights {
  impressions: string;
  reach: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  spend: string;
  conversions?: string;
  purchase_roas?: { action_type: string; value: string }[];
  date_start: string;
  date_stop: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  insights?: { data: MetaInsights[] };
}

export interface MetaAccount {
  id: string;
  name: string;
  currency: string;
  account_status: number;
}

export interface DashboardMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spend: number;
  roas: number;
}

export interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
}
