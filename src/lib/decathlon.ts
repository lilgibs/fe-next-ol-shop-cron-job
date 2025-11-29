// lib/decathlon.ts
export type DecathlonAvailability = {
  exists: boolean;
  available: boolean;
  totalQuantity: number;
  raw: any;
};

const DECATHLON_URL =
  "https://www.decathlon.co.id/api/fulfiller/itemAvailability";

/**
 * Panggil API Decathlon dan cek 1 sku_id target.
 * Mengembalikan apakah sku itu muncul + total quantity-nya.
 */
export async function checkDecathlonSku(
  targetSkuId: string
): Promise<DecathlonAvailability> {
  const payload = {
    items: [
      {
        fulfiller_id: "dkt-fulfiller-id",
        sku_id: targetSkuId,
        option_id: "4303769", // kalau size 1 pakai option_id ini, sesuaikan kalau beda
      },
    ],
    fulfillment_types: [
      "SHELF_SERVICE",
      "USER_DELIVERY",
      "STORE_DELIVERY",
      "STORE_PICKUP",
      "EXTERNAL_PICKUP",
    ],
    location_context: {
      country: "ID",
      coordinates: {
        lat: -6.32946,
        lng: 106.95494,
      },
      radius: 600000,
    },
  };

  const res = await fetch(DECATHLON_URL, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (PriceWatcher/1.0)",
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Origin: "https://www.decathlon.co.id",
      Referer:
        "https://www.decathlon.co.id/p/running-belt-black-kiprun-8645720.html",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("Decathlon API error:", res.status, await res.text());
    return { exists: false, available: false, totalQuantity: 0, raw: null };
  }

  const json = await res.json();

  // Response yang kamu kirim: array of { sku_id, availabilities, ... }
  const items = Array.isArray(json) ? json : [];
  const item = items.find((it: any) => it.sku_id === targetSkuId);

  if (!item) {
    // SKU tidak muncul di response → anggap lagi kosong / belum tersedia
    return {
      exists: false,
      available: false,
      totalQuantity: 0,
      raw: json,
    };
  }

  const quantities =
    item.availabilities?.flatMap((a: any) =>
      (a.options ?? []).map((o: any) => o.quantity ?? 0)
    ) ?? [];

  const totalQuantity = quantities.reduce(
    (sum: number, q: number) => sum + q,
    0
  );

  const discontinued =
    item.availabilities?.some((a: any) =>
      (a.options ?? []).some((o: any) => o.discontinued === true)
    ) ?? false;

  const available = !discontinued && totalQuantity > 0;

  return {
    exists: true,
    available,
    totalQuantity,
    raw: json,
  };
}
