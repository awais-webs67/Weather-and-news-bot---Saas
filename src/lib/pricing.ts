// Pricing Plans Configuration
export const PRICING_PLANS = {
  monthly: {
    name: 'Monthly Plan',
    price: 9.99,
    currency: 'USD',
    duration_days: 30,
    features: [
      'Unlimited weather updates',
      'Daily news summaries',
      'Telegram & WhatsApp support',
      '7-day forecast',
      'Multi-language support',
      'Priority support'
    ]
  },
  yearly: {
    name: 'Yearly Plan',
    price: 95.99,
    currency: 'USD',
    duration_days: 365,
    features: [
      'All Monthly features',
      'Save 20% annually',
      'Extended weather data',
      'Premium news sources',
      'Advanced AI insights',
      '24/7 priority support'
    ],
    savings: '20% OFF'
  }
}

export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segments = 4
  const segmentLength = 4
  
  let key = ''
  for (let i = 0; i < segments; i++) {
    if (i > 0) key += '-'
    for (let j = 0; j < segmentLength; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  }
  
  return key
}

export function getWhatsAppPaymentMessage(planType: 'monthly' | 'yearly', userEmail: string): string {
  const plan = PRICING_PLANS[planType]
  return `Hello! I want to subscribe to WeatherNews Alert.

Plan: ${plan.name}
Price: $${plan.price}
Email: ${userEmail}

Please provide payment instructions.`
}

export function getWhatsAppPaymentLink(planType: 'monthly' | 'yearly', userEmail: string): string {
  const phoneNumber = '923430641457' // Admin WhatsApp number
  const message = encodeURIComponent(getWhatsAppPaymentMessage(planType, userEmail))
  return `https://wa.me/${phoneNumber}?text=${message}`
}
