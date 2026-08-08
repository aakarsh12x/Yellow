# Logic Log — GitHub Lead Sniper Workflow

## 1. Handling GitHub API Rate Limits

GitHub enforces strict rate limits depending on authentication status:
- **Unauthenticated requests**: 60 requests per hour per IP address.
- **Authenticated requests**: 5,000 requests per hour per user/token.

To ensure resilience against rate limits and secondary rate limits (abuse limits), the workflow implements the following strategies:

1. **Header-Based Authentication**:
   All HTTP request nodes targeting `api.github.com` pass an `Authorization: Bearer <GITHUB_PAT>` header. This increases the rate limit threshold from 60 to 5,000 requests/hour.

2. **Rate Limit Header Inspection**:
   Immediately following the profile enrichment API call (`GET /users/{username}`), a dedicated Code node parses the response headers:
   - `X-RateLimit-Remaining`: The number of API requests remaining in the current 1-hour window.
   - `X-RateLimit-Reset`: The UTC epoch timestamp when the rate limit window resets.

3. **Conditional Backoff & Rate Limit Guard**:
   An IF node (`Rate Limit Low or 403?`) evaluates two key conditions:
   - If `X-RateLimit-Remaining < 10`, or
   - If HTTP status code is `403` (GitHub rate limit exceeded or secondary rate limit triggered).
   
   If either condition evaluates to true, the workflow pauses execution via an **Exponential Backoff / Wait** node, allowing the rate limit counter to reset before attempting further processing.

4. **Stargazer Deduplication**:
   To minimize redundant API calls, the polling flow uses `n8n` static workflow data (`$getWorkflowStaticData`) to cache previously processed `username:starred_at` keys. Stargazers that have already been enriched are filtered out prior to making API calls.

## 2. Trigger Strategy (Webhook + Polling Fallback)

- **Webhook Trigger**: Receives instant `watch` (star) events directly from GitHub with zero delay and minimal API budget consumption.
- **15-Minute Polling Trigger**: Acts as a safety fallback to poll `/repos/n8n-io/n8n/stargazers` periodically, catching any events missed during network disruptions.

## 3. Lead Qualification & Sales Pitch Logic

- **Qualification Filter**: Checks if `followers > 100` OR `public_repos > 50`. Unqualified leads are safely routed to a NoOp node.
- **AI Sales Pitch**: Qualified profiles pass `bio` and `company` to an LLM node (`gpt-4o-mini`), generating a concise 1-sentence outreach pitch.
- **Notification**: The final formatted output is dispatched directly to Slack/Discord.
