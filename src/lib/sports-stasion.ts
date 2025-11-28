// lib/sportsstation.ts

const SPORTSSTATION_URL =
  "https://sportsstat-search.celebros.com/UiSearch/DoSearchParams?answerIds=161,5874&effectOnSearchPath=1&pageSize=36&profile=English&query=Mach+6&siteId=SportsStat";

type ProductRaw = {
  Name: string;
  Price: string;        // "1299500"
  ProductPageUrl: string;
};

type SportsResponse = {
  DoSearchParams: {
    Products: ProductRaw[];
  };
};

export type Product = {
  name: string;
  price: number;
  url: string;
};

export async function fetchMach6Products(): Promise<Product[]> {
  const res = await fetch(SPORTSSTATION_URL, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PriceWatcher/1.0)",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed fetch SportsStation: ${res.status}`);
  }

  const json = (await res.json()) as SportsResponse;

  const products = json.DoSearchParams.Products.map((p) => ({
    name: p.Name,
    price: Number(p.Price),
    url: p.ProductPageUrl,
  })).filter((p) => !Number.isNaN(p.price));

  return products;
}
