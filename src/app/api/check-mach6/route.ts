// app/api/check-mach6/route.ts

import { NextResponse } from "next/server";
import { createTransporter } from "@/lib/mailer";
import { fetchMach6Products } from "@/lib/sports-stasion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRICE_THRESHOLD = 1000000; // 1 juta

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const isManual = searchParams.get("manual") === "true";
    const isTesting = process.env.TESTING === "true";

    const products = await fetchMach6Products();
    if (!products.length) {
      return NextResponse.json(
        { ok: false, error: "No products found" },
        { status: 500 }
      );
    }

    // Cari termurah
    const cheapest = products.reduce((min, cur) =>
      cur.price < min.price ? cur : min
    );

    const { MAIL_FROM, MAIL_TO } = process.env;
    if (!MAIL_FROM || !MAIL_TO) {
      return NextResponse.json(
        { ok: false, error: "Mail not configured" },
        { status: 500 }
      );
    }

    // Email HTML
    const rows = products
      .map(
        (p) => `
          <tr>
            <td>${p.name}</td>
            <td>Rp${p.price.toLocaleString("id-ID")}</td>
            <td><a href="${p.url}">Link</a></td>
          </tr>`
      )
      .join("");

    const html = `
      <h2>Laporan Harga Hoka Mach 6</h2>
      <p><strong>Termurah:</strong> ${cheapest.name}</p>
      <p><strong>Harga:</strong> Rp${cheapest.price.toLocaleString(
      "id-ID"
    )}</p>
      <p><a href="${cheapest.url}">Lihat Produk</a></p>
      <hr/>
      <h3>Daftar Semua Varian</h3>
      <table border="1" cellpadding="6" cellspacing="0">
        <tr><th>Nama</th><th>Harga</th><th>Link</th></tr>
        ${rows}
      </table>
    `;

    let sentEmail = false;
    const shouldSendEmail = isManual || isTesting || cheapest.price < PRICE_THRESHOLD;


    // 🔥 LOGIC EMAIL
    if (shouldSendEmail) {
      const transporter = createTransporter();

      const baseSubject = isManual
        ? "Manual Check — Laporan Harga Hoka Mach 6"
        : cheapest.price < PRICE_THRESHOLD
          ? "Harga Hoka Mach 6 Turun di Bawah Threshold"
          : "Cron Report — Harga Hoka Mach 6";

      const subject = isTesting
        ? `TEST MODE — ${baseSubject}`
        : baseSubject;

      await transporter.sendMail({
        from: `"Price Watcher" <${MAIL_FROM}>`,
        to: MAIL_TO,
        subject,
        html,
      });

      sentEmail = true;
    }

    return NextResponse.json({
      ok: true,
      cheapest,
      threshold: PRICE_THRESHOLD,
      sentEmail,
      manual: isManual,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Failed to check price" },
      { status: 500 }
    );
  }
}
