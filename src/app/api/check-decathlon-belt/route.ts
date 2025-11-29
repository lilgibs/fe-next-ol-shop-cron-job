// app/api/check-decathlon-belt/route.ts
import { NextResponse } from "next/server";
import { createTransporter } from "@/lib/mailer";
import { checkDecathlonSku } from "@/lib/decathlon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TARGET_SKU_ID = "d1752bea-1730-45af-9926-db2bfecf8aa5"; // size 1
const PRODUCT_URL =
  "https://www.decathlon.co.id/p/running-belt-black-kiprun-8645720.html";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const isManual = searchParams.get("manual") === "true";
    const isTesting = process.env.TESTING === "true";

    const { MAIL_FROM, MAIL_TO } = process.env;
    if (!MAIL_FROM || !MAIL_TO) {
      return NextResponse.json(
        { ok: false, error: "Mail not configured" },
        { status: 500 }
      );
    }

    const status = await checkDecathlonSku(TARGET_SKU_ID);

    let sentEmail = false;

    // Kapan kita kirim email?
    // - Manual → SELALU kirim (seperti Sports Station)
    // - Testing → SELALU kirim
    // - Otomatis (cron) → kirim hanya kalau available = true
    const shouldSendEmail =
      isManual || isTesting || status.available === true;

    if (shouldSendEmail) {
      const transporter = createTransporter();

      const baseSubject = status.available
        ? "Decathlon — Size 1 SUDAH tersedia 🎉"
        : "Decathlon — Size 1 masih belum tersedia";

      const subject = isTesting ? `TEST MODE — ${baseSubject}` : baseSubject;

      const html = `
        <h2>Monitor Decathlon — Running Belt Kiprun (Size 1)</h2>

        ${
          isTesting
            ? `<p style="color:red"><strong>TEST MODE — email ini hanya untuk pengujian.</strong></p>`
            : ""
        }

        <p><strong>SKU ID:</strong> ${TARGET_SKU_ID}</p>
        <p><strong>Tersedia?</strong> ${
          status.available ? "✅ YES" : "❌ NO"
        }</p>
        <p><strong>Total quantity (approx):</strong> ${
          status.totalQuantity
        }</p>

        <p>Link produk: <a href="${PRODUCT_URL}" target="_blank">${PRODUCT_URL}</a></p>
      `;

      await transporter.sendMail({
        from: `"Decathlon Watcher" <${MAIL_FROM}>`,
        to: MAIL_TO,
        subject,
        html,
      });

      sentEmail = true;
    }

    return NextResponse.json({
      ok: true,
      skuId: TARGET_SKU_ID,
      available: status.available,
      totalQuantity: status.totalQuantity,
      sentEmail,
      manual: isManual,
      testingMode: isTesting,
    });
  } catch (err) {
    console.error("CHECK_DECATHLON_BELT_ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to check Decathlon belt" },
      { status: 500 }
    );
  }
}
