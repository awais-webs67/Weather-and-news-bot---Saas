// Database bindings
export type Bindings = {
  DB: D1Database;
}

// User types
export interface User {
  id: number;
  email: string;
  password: string;
  name?: string;
  telegram_username?: string;
  telegram_chat_id?: string;
  whatsapp_phone?: string;
  preferred_channel: 'telegram' | 'whatsapp';
  trial_ends_at?: string;
  subscription_plan: 'free' | 'trial' | 'premium';
  subscription_status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Location preferences
export interface Location {
  id: number;
  user_id: number;
  country: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  language: 'en' | 'ur';
  temperature_unit: 'C' | 'F';
  is_active: number;
  created_at: string;
}

// Schedule types
export interface Schedule {
  id: number;
  user_id: number;
  schedule_type: 'weather_morning' | 'weather_night' | 'news';
  delivery_time: string; // Format: 'HH:MM'
  is_enabled: number;
  created_at: string;
}

// Message types
export interface Message {
  id: number;
  user_id: number;
  message_type: 'weather' | 'news' | 'command';
  channel: 'telegram' | 'whatsapp';
  content?: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

// News types
export interface NewsItem {
  id: number;
  country: string;
  city?: string;
  title: string;
  summary?: string;
  url?: string;
  published_at?: string;
  source?: string;
  created_at: string;
}

// API Settings
export interface APISetting {
  id: number;
  setting_key: string;
  setting_value?: string;
  is_enabled: number;
  updated_at: string;
}

// Weather cache
export interface WeatherCache {
  id: number;
  city: string;
  country: string;
  weather_data?: string; // JSON string
  cached_at: string;
  expires_at?: string;
}

// Subscription plans
export interface SubscriptionPlan {
  id: number;
  plan_name: string;
  plan_description?: string;
  price: number;
  duration_days: number;
  features?: string; // JSON array
  is_active: number;
  created_at: string;
}

// Weather API response types
export interface WeatherData {
  temperature: number;
  feels_like: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  high: number;
  low: number;
  hourly_forecast?: HourlyForecast[];
  weekly_forecast?: DailyForecast[];
  alerts?: WeatherAlert[];
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
}

export interface DailyForecast {
  date: string;
  high: number;
  low: number;
  condition: string;
}

export interface WeatherAlert {
  event: string;
  description: string;
  severity: string;
}
