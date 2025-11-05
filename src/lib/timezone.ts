// Country to timezone mapping
export const COUNTRY_TIMEZONES: { [key: string]: string } = {
  // Major countries
  'Pakistan': 'Asia/Karachi',
  'India': 'Asia/Kolkata',
  'United States': 'America/New_York',
  'United Kingdom': 'Europe/London',
  'Canada': 'America/Toronto',
  'Australia': 'Australia/Sydney',
  'Germany': 'Europe/Berlin',
  'France': 'Europe/Paris',
  'China': 'Asia/Shanghai',
  'Japan': 'Asia/Tokyo',
  'Brazil': 'America/Sao_Paulo',
  'Mexico': 'America/Mexico_City',
  'Russia': 'Europe/Moscow',
  'South Africa': 'Africa/Johannesburg',
  'Saudi Arabia': 'Asia/Riyadh',
  'UAE': 'Asia/Dubai',
  'Turkey': 'Europe/Istanbul',
  'Egypt': 'Africa/Cairo',
  'Nigeria': 'Africa/Lagos',
  'Kenya': 'Africa/Nairobi',
  'Indonesia': 'Asia/Jakarta',
  'Malaysia': 'Asia/Kuala_Lumpur',
  'Singapore': 'Asia/Singapore',
  'Philippines': 'Asia/Manila',
  'Thailand': 'Asia/Bangkok',
  'Vietnam': 'Asia/Ho_Chi_Minh',
  'South Korea': 'Asia/Seoul',
  'Bangladesh': 'Asia/Dhaka',
  'Sri Lanka': 'Asia/Colombo',
  'Afghanistan': 'Asia/Kabul',
  'Iran': 'Asia/Tehran',
  'Iraq': 'Asia/Baghdad',
  'Spain': 'Europe/Madrid',
  'Italy': 'Europe/Rome',
  'Netherlands': 'Europe/Amsterdam',
  'Belgium': 'Europe/Brussels',
  'Sweden': 'Europe/Stockholm',
  'Norway': 'Europe/Oslo',
  'Denmark': 'Europe/Copenhagen',
  'Poland': 'Europe/Warsaw',
  'Ukraine': 'Europe/Kiev',
  'Greece': 'Europe/Athens',
  'Portugal': 'Europe/Lisbon',
  'Switzerland': 'Europe/Zurich',
  'Austria': 'Europe/Vienna',
  'Argentina': 'America/Argentina/Buenos_Aires',
  'Chile': 'America/Santiago',
  'Colombia': 'America/Bogota',
  'Peru': 'America/Lima',
  'Venezuela': 'America/Caracas',
  'New Zealand': 'Pacific/Auckland'
}

export function getTimezoneForCountry(country: string): string {
  return COUNTRY_TIMEZONES[country] || 'UTC'
}

export function convertLocalToUTC(localTime: string, timezone: string): string {
  // localTime format: "HH:MM" (e.g., "07:00")
  const [hours, minutes] = localTime.split(':').map(Number)
  
  // Create a date in the user's timezone
  const now = new Date()
  const localDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  localDate.setHours(hours, minutes, 0, 0)
  
  // Get UTC time
  const utcHours = localDate.getUTCHours()
  const utcMinutes = localDate.getUTCMinutes()
  
  return `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`
}

export function convertUTCToLocal(utcTime: string, timezone: string): string {
  // utcTime format: "HH:MM"
  const [hours, minutes] = utcTime.split(':').map(Number)
  
  // Create UTC date
  const utcDate = new Date()
  utcDate.setUTCHours(hours, minutes, 0, 0)
  
  // Convert to user's timezone
  const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }))
  
  return `${String(localDate.getHours()).padStart(2, '0')}:${String(localDate.getMinutes()).padStart(2, '0')}`
}

export function getCurrentTimeInTimezone(timezone: string): string {
  const now = new Date()
  const localDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  
  return `${String(localDate.getHours()).padStart(2, '0')}:${String(localDate.getMinutes()).padStart(2, '0')}`
}
