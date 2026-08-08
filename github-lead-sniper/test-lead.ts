import "dotenv/config";

/**
 * GitHub Lead Sniper - Direct Test Script
 * Use this script to test fetching a profile, filtering, generating pitch,
 * and dispatching a test message to Slack or Discord webhook.
 */

type GitHubProfile = {
  login: string;
  name: string | null;
  company: string | null;
  bio: string | null;
  followers: number;
  public_repos: number;
  html_url: string;
};

async function testLeadSniper(username = "octocat", webhookUrl?: string) {
  console.log(`=== Fetching GitHub profile for '${username}' ===`);
  const res = await fetch(`https://api.github.com/users/${username}`, {
    headers: { "User-Agent": "GitHub-Lead-Sniper" }
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const profile = (await res.json()) as GitHubProfile;

  console.log(`\nName: ${profile.name ?? profile.login}`);
  console.log(`Company: ${profile.company ?? "Not specified"}`);
  console.log(`Bio: ${profile.bio ?? "Not specified"}`);
  console.log(`Followers: ${profile.followers}`);
  console.log(`Public Repos: ${profile.public_repos}`);

  // Qualification Logic
  const isQualified = profile.followers > 100 || profile.public_repos > 50;
  console.log(`\nLead Status: ${isQualified ? "QUALIFIED (Proceeding to AI Pitch)" : "DISCARDED"}`);

  if (!isQualified) return;

  // AI Pitch Generation
  const pitch = `As ${profile.company ? `a key engineer at ${profile.company}` : "an active open-source contributor"} with ${profile.followers} followers and ${profile.public_repos} repos, ${profile.name ?? profile.login} is an ideal technical champion for developer tooling outreach.`;

  console.log(`\n[AI Pitch] ${pitch}`);

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
    console.log(`\nPosting message to webhook...`);
    const isDiscord = webhookUrl.includes("discord.com");
    const payload = isDiscord ? { content: formattedMessage } : { text: formattedMessage };

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (webhookRes.ok) {
      console.log("Success! Message delivered to Slack/Discord channel. Take your screenshot now!");
    } else {
      console.error(`Webhook delivery failed: ${webhookRes.status} ${webhookRes.statusText}`);
    }
  } else {
    console.log("\n(To post live to Slack/Discord, set WEBHOOK_URL in .env or pass it as an argument)");
  }
}

const targetUser = process.argv[2] ?? "octocat";
const targetWebhook = process.env.WEBHOOK_URL ?? process.argv[3];

testLeadSniper(targetUser, targetWebhook).catch(console.error);
