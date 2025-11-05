import { Hono } from 'hono'
import { Bindings } from '../types'

const dashboard = new Hono<{ Bindings: Bindings }>()

// Redirect to static dashboard HTML
dashboard.get('/', async (c) => {
  const dashboardHTML = await fetch('/static/dashboard.html')
  const html = await dashboardHTML.text()
  return c.html(html)
})

export default dashboard
