import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type Order = { order_id: string; customer: string; city: string; status: string };
type WeatherCondition = { id: number; main: string; description: string };
type WeatherResponse = { weather?: WeatherCondition[] };

const ordersPath = resolve(process.cwd(), "orders.json");
const apiKey = process.env.OPENWEATHER_API_KEY;
const useMock = process.env.USE_MOCK_WEATHER === "true";

// Builds a personalized delay message for the customer
function generateApologyMessage(order: Order, weatherMain: string, weatherDesc?: string): string {
  const firstName = order.customer.split(" ")[0];
  const causes: Record<string, string> = {
    Rain: weatherDesc || "heavy rain",
    Snow: weatherDesc || "heavy snowfall",
    Extreme: "severe weather conditions",
    Thunderstorm: "severe thunderstorms",
    Tornado: "tornado warnings",
    Squall: "squalls and high winds"
  };
  const cause = causes[weatherMain] ?? weatherDesc ?? "adverse weather";
  return `Hi ${firstName}, your order to ${order.city} is delayed due to ${cause}. We appreciate your patience!`;
}

function isDelayWeather(main: string): boolean {
  const normalized = main.trim().toLowerCase();
  return ["rain", "snow", "extreme", "thunderstorm", "tornado", "squall"].includes(normalized);
}

function normalizeMain(main: string): string {
  const normalized = main.trim().toLowerCase();
  if (["thunderstorm", "tornado", "squall"].includes(normalized)) {
    return "Extreme";
  }
  return main.charAt(0).toUpperCase() + main.slice(1);
}

async function fetchWeather(order: Order): Promise<{ order: Order; delayed: boolean; verified: boolean }> {
  try {
    let main: string;
    let description: string | undefined;

    if (useMock) {
      const mockConditions: Record<string, string> = {
        "New York": "Rain",
        "Mumbai": "Rain",
        "London": "Clear"
      };
      main = mockConditions[order.city] ?? "Clear";
    } else {
      const url = new URL("https://api.openweathermap.org/data/2.5/weather");
      url.searchParams.set("q", order.city);
      url.searchParams.set("appid", apiKey as string);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenWeatherMap ${response.status} ${response.statusText} for city '${order.city}'`);
      }
      const weather = (await response.json()) as WeatherResponse;
      const condition = weather.weather?.[0];
      if (!condition) {
        throw new Error("API response missing weather condition");
      }
      main = condition.main;
      description = condition.description;
    }

    const normalized = normalizeMain(main);
    if (isDelayWeather(main)) {
      order.status = "Delayed";
      const apology = generateApologyMessage(order, normalized, description);
      console.log(`[DELAY] Order ${order.order_id} (${order.city}): ${apology}`);
      return { order, delayed: true, verified: true };
    }

    console.log(`[OK] Order ${order.order_id} (${order.city}): ${main} - status unchanged`);
    return { order, delayed: false, verified: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] Order ${order.order_id} (${order.city}): ${reason}`);
    console.log(`[INFO] Preserving status for Order ${order.order_id}`);
    return { order, delayed: false, verified: false };
  }
}

async function main(): Promise<void> {
  if (!apiKey && !useMock) {
    throw new Error("OPENWEATHER_API_KEY missing in .env");
  }

  const ordersRaw = await readFile(ordersPath, "utf8");
  const orders = JSON.parse(ordersRaw) as Order[];

  if (!Array.isArray(orders)) {
    throw new Error("orders.json must be an array of orders");
  }

  console.log(`Processing ${orders.length} orders concurrently...`);

  // Fetch weather concurrently for all orders
  const results = await Promise.all(orders.map((order) => fetchWeather(order)));

  // Write updated orders back to orders.json
  await writeFile(ordersPath, `${JSON.stringify(orders, null, 2)}\n`, "utf8");

  const delayed = results.filter((r) => r.delayed).length;
  const failed = results.filter((r) => !r.verified).length;
  const normal = results.length - delayed - failed;

  console.log(`Done. ${delayed} delayed, ${failed} failed lookup, ${normal} normal.`);
}

main().catch((error) => {
  console.error("Fatal error:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

export { generateApologyMessage };
