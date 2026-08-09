// Script to test profile enrichment and webhook notifications
async function testLeadSniper(username = "octocat", webhookUrl = process.env.WEBHOOK_URL) {
  console.log(`Fetching GitHub profile for '${username}'...`);
  const res = await fetch(`https://api.github.com/users/${username}`, {
    headers: { "User-Agent": "GitHub-Lead-Sniper" }
  });

  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status} ${res.statusText}`);
  }

  const profile = await res.json();

  console.log(`User: ${profile.name ?? profile.login}`);
  console.log(`Company: ${profile.company ?? "N/A"}`);
  console.log(`Bio: ${profile.bio ?? "N/A"}`);
  console.log(`Followers: ${profile.followers} | Repos: ${profile.public_repos}`);

  // Qualify lead (>100 followers OR >50 repos)
  const isQualified = profile.followers > 100 || profile.public_repos > 50;
  console.log(`Status: ${isQualified ? "QUALIFIED" : "DISCARDED"}`);

  if (!isQualified) return;

  const pitch = `As ${profile.company ? `a key representative of ${profile.company}` : "an active developer"} with ${profile.followers} followers and ${profile.public_repos} repos, ${profile.name ?? profile.login} is a strong target for developer outreach.`;

  const formattedMessage = [
    `*GitHub Lead Sniper*`,
    `*Name:* ${profile.name ?? profile.login}`,
    `*Profile:* https://github.com/${profile.login}`,
    `*Bio:* ${profile.bio ?? "Not provided"}`,
    `*Followers:* ${profile.followers} | *Public Repos:* ${profile.public_repos}`,
    `*Why Reach Out:* ${pitch}`
  ].join("\n");

  if (webhookUrl) {
    console.log(`Posting payload to webhook...`);
    const isDiscord = webhookUrl.includes("discord.com");
    const payload = isDiscord ? { content: formattedMessage } : { text: formattedMessage };

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (webhookRes.ok) {
      console.log("Message delivered successfully.");
    } else {
      console.error(`Webhook error: ${webhookRes.status} ${webhookRes.statusText}`);
    }
  } else {
    console.log("\nPayload Preview:\n" + formattedMessage);
  }
}

const targetUser = process.argv[2] ?? "octocat";
const targetWebhook = process.argv[3] ?? process.env.WEBHOOK_URL;

testLeadSniper(targetUser, targetWebhook).catch(console.error);
