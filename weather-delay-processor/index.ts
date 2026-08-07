import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type Order = { order_id: string; customer: string; city: string; status: string };
type WeatherCondition = { id: number; main: string; description: string };
type WeatherResponse = { weather?: WeatherCondition[] };

const ordersPath = resolve(process.cwd(), "orders.json");
const apiKey = process.env.OPENWEATHER_API_KEY;
const useMock = process.env.USE_MOCK_WEATHER === "true";

function generateApologyMessage(order: Order, weatherMain: string): string {
  const causes: Record<string, string> = { Rain: "heavy rain", Snow: "heavy snowfall", Extreme: "severe weather" };
  return `Hi ${order.customer}, your order to ${order.city} is delayed due to ${causes[weatherMain] ?? "adverse weather"}. We appreciate your patience!`;
}

function isDelayWeather(main: string): boolean {
  return ["Rain", "Snow", "Extreme", "Thunderstorm", "Tornado", "Squall"].includes(main);
}

function normalizeMain(main: string): string {
  return ["Thunderstorm", "Tornado", "Squall"].includes(main) ? "Extreme" : main;
}

async function fetchWeather(order: Order): Promise<{ order: Order; delayed: boolean; verified: boolean }> {
  try {
    let main: string;
    if (useMock) {
      const mockConditions: Record<string, string> = {
        "New York": "Rain",
        "Chicago": "Snow",
        "Miami": "Thunderstorm",
        "Los Angeles": "Clear"
      };
      main = mockConditions[order.city] ?? "Clear";
    } else {
      const url = new URL("https://api.openweathermap.org/data/2.5/weather");
      url.searchParams.set("q", order.city);
      url.searchParams.set("appid", apiKey as string);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`OpenWeatherMap ${response.status} ${response.statusText}`);
      const weather = (await response.json()) as WeatherResponse;
      const condition = weather.weather?.[0];
      if (!condition) throw new Error("response did not include a weather condition");
      main = condition.main;
    }
    const normalized = normalizeMain(main);
    if (isDelayWeather(main)) {
      order.status = "Delayed";
      console.log(generateApologyMessage(order, normalized));
      return { order, delayed: true, verified: true };
    }
    return { order, delayed: false, verified: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`Weather lookup failed for order_id=${order.order_id}: ${reason}`);
    console.error(`Could not verify weather for order_id=${order.order_id}; status unchanged.`);
    return { order, delayed: false, verified: false };
  }
}

async function main(): Promise<void> {
  if (!apiKey && !useMock) throw new Error("OPENWEATHER_API_KEY is missing. Copy .env.example to .env and add your key, or set USE_MOCK_WEATHER=true.");
  const orders = JSON.parse(await readFile(ordersPath, "utf8")) as Order[];
  if (!Array.isArray(orders)) throw new Error("orders.json must contain an array of orders");
  const results = await Promise.all(orders.map((order) => fetchWeather(order)));
  await writeFile(ordersPath, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
  const delayed = results.filter((result) => result.delayed).length;
  const failedToVerify = results.filter((result) => !result.verified).length;
  const unaffected = results.length - delayed - failedToVerify;
  console.log(`Final summary: ${delayed} delayed, ${failedToVerify} failed to verify, ${unaffected} unaffected.`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
export { generateApologyMessage };
