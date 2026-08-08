# AI Log — Weather Delay Processor

## 1. Concurrent Fetching Prompt

> "Write a TypeScript weather-order processor that maps every order to an OpenWeatherMap request and starts all requests concurrently with `Promise.all`; do not use a sequential await-in-loop. Keep each result tied to its original order and write the updated array after all requests finish."

**Implementation**: The script uses `Promise.all(orders.map(fetchWeather))`, initiating all HTTP requests to OpenWeatherMap simultaneously in parallel.

## 2. Resilience & Error Handling Prompt

> "Catch an individual 404 or network failure (such as an invalid city name 'InvalidCity123'), log the order ID and exact failure reason, preserve the original order status, and ensure the script continues without crashing so all other valid cities finish processing."

**Implementation**: Each API request is wrapped in its own `try...catch` block inside `fetchWeather`. Errors for specific cities (e.g. 404 Not Found for `InvalidCity123`) are caught, formatted, and logged, while remaining orders finish successfully.

## 3. Weather-Aware Apology Generator Prompt

> "Write a 'Weather-Aware Apology' function that takes an order object and the weather condition, and generates a personalized customer message like: 'Hi Alice, your order to New York is delayed due to heavy rain. We appreciate your patience!'"

**Implementation**: The `generateApologyMessage` function extracts the customer's first name, maps OpenWeatherMap conditions (`Rain`, `Snow`, `Extreme`, `Thunderstorm`) to human-readable weather descriptions (e.g., `light rain`, `heavy snowfall`), and constructs the empathetic apology message.
