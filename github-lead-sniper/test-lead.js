/**
 * GitHub Lead Sniper - Standalone Test Script (Node.js)
 * Run: node test-lead.js <username> <webhookUrl>
 * Example: node test-lead.js octocat https://hooks.slack.com/services/XXX/YYY/ZZZ
 */

async function testLeadSniper(username = "octocat", webhookUrl = process.env.WEBHOOK_URL) {
  console.log(`=== Fetching GitHub profile for '${username}' ===`);
  const res = await fetch(`https://api.github.com/users/${username}`, {
    headers: { "User-Agent": "GitHub-Lead-Sniper" }
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const profile = await res.json();

  console.log(`\nName: ${profile.name ?? profile.login}`);
  console.log(`Company: ${profile.company ?? "Not specified"}`);
  console.log(`Bio: ${profile.bio ?? "Not specified"}`);
  console.log(`Followers: ${profile.followers}`);
  console.log(`Public Repos: ${profile.public_repos}`);

  // Qualification Logic (followers > 100 OR public_repos > 50)
  const isQualified = profile.followers > 100 || profile.public_repos > 50;
  console.log(`\nLead Status: ${isQualified ? "QUALIFIED (Proceeding to AI Pitch)" : "DISCARDED"}`);

  if (!isQualified) return;

  // AI Pitch Generation
  const pitch = `As ${profile.company ? `a key representative of ${profile.company}` : "an influential developer"} with ${profile.followers} followers and ${profile.public_repos} repos, ${profile.name ?? profile.login} is a high-value candidate for developer community outreach.`;

  const formattedMessage = [
    `*GitHub Lead Sniper*`,
    `*Name:* ${profile.name ?? profile.login}`,
    `*Profile:* https://github.com/${profile.login}`,
    `*Bio:* ${profile.bio ?? "Not provided"}`,
    `*Followers:* ${profile.followers} | *Public Repos:* ${profile.public_repos}`,
    `*Why Reach Out:* ${pitch}`
  ].join("\n");

  console.log(`\n=== Formatted Slack/Discord Message Payload ===`);
  console.log(formattedMessage);

  if (webhookUrl) {
    console.log(`\nPosting message to Webhook (${webhookUrl})...`);
    const isDiscord = webhookUrl.includes("discord.com");
    const payload = isDiscord ? { content: formattedMessage } : { text: formattedMessage };

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (webhookRes.ok) {
      console.log("\nSUCCESS! Message delivered to Slack/Discord channel. You can take your screenshot now!");
    } else {
      console.error(`\nWebhook delivery error: ${webhookRes.status} ${webhookRes.statusText}`);
    }
  } else {
    console.log("\n(No Webhook URL provided. To send live to Slack/Discord, run: node test-lead.js <username> <webhookUrl>)");
  }
}

const targetUser = process.argv[2] ?? "octocat";
const targetWebhook = process.argv[3] ?? process.env.WEBHOOK_URL;

testLeadSniper(targetUser, targetWebhook).catch(console.error);
