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
      'Telegram notifications',
      '7-day forecast',
      'Multi-language support',
      'Email support'
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
      'AI-powered insights',
      'Priority support',
      'Advanced forecasts',
      '24/7 assistance'
    ],
    savings: '20% OFF'
  }
}

export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let key = ''
  for (let i = 0; i < 4; i++) {
    if (i > 0) key += '-'
    for (let j = 0; j < 4; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  }
  return key
}

export function getWhatsAppPaymentLink(planType: string, userEmail: string): string {
  const plan = PRICING_PLANS[planType as keyof typeof PRICING_PLANS]
  const message = `Hello! I want to subscribe to WeatherNews Alert.\n\nPlan: ${plan.name}\nPrice: $${plan.price}\nEmail: ${userEmail}\n\nPlease provide payment instructions.`
  return `https://wa.me/923430641457?text=${encodeURIComponent(message)}`
}
