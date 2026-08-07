# Yellow.ai Projects

This repository contains two projects:

## 1. Weather Delay Processor (`weather-delay-processor`)
A TypeScript application that checks order shipping cities against OpenWeatherMap API concurrently using `Promise.all`. If severe weather conditions (Rain, Snow, Extreme, Thunderstorm, Tornado, Squall) are detected for an order's destination:
- Updates the order status to `Delayed` in `orders.json`.
- Outputs an personalized apology message for the customer.
- Supports offline mock mode (`USE_MOCK_WEATHER=true`) for testing without an API key.

### Quick Start:
```bash
cd weather-delay-processor
npm install
npm start
```

## 2. GitHub Lead Sniper (`github-lead-sniper`)
An n8n automation workflow designed to capture and process GitHub repository stargazers as sales leads using webhooks, polling fallbacks, rate limit backoff handling, OpenAI, and Slack notifications.

---
