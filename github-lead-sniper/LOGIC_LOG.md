# Logic Log — GitHub Lead Sniper

## Rate limits and backoff

The workflow uses a GitHub Personal Access Token through an n8n HTTP Header Auth credential, not query parameters. Authenticated requests receive GitHub’s 5,000 requests/hour limit versus 60/hour unauthenticated. **Read Rate Limit Headers** reads `X-RateLimit-Remaining` and `X-RateLimit-Reset`. If remaining is under 10 or the response is 403, **Rate Limit Low or 403?** routes through a Wait node before continuing. For production, use the reset epoch and a retry counter to implement `min(base * 2 ** attempt, resetEpoch - now)` with bounded retries; this exponential-backoff path also covers GitHub secondary-rate-limit 403 responses.

## Webhook-first plus polling fallback

The webhook is primary because GitHub can deliver a new star immediately with minimal API usage. The 15-minute stargazer poll recovers missed deliveries, endpoint downtime, and older stars. Workflow static data stores a username/timestamp key so previously seen stargazers are not reprocessed.

## Credentials

The export contains placeholders only. After import, select a GitHub HTTP Header Auth credential with `Authorization: Bearer <PAT>`, an OpenAI header credential, and a Slack credential. No real tokens are included.
