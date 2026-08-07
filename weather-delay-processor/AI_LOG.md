# AI Log

## Concurrent fetching prompt

“Write a TypeScript weather-order processor that maps every order to an OpenWeatherMap request and starts all requests concurrently with `Promise.all`; do not use a sequential await-in-loop. Keep each result tied to its original order and write the updated array after all requests finish.”

The implementation uses `Promise.all(orders.map(fetchWeather))`, starting all network requests concurrently.

## Resilience prompt

“Catch an individual 404 or network failure, log the order ID and reason, emit a distinct ‘could not verify weather’ message, preserve the original status, and let all other requests finish.”

The implementation uses a per-request `try/catch` inside `fetchWeather`, so one failed city cannot reject the batch.
