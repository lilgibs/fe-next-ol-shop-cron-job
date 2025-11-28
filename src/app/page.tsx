"use client";

import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleCheck() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/check-mach6?manual=true", {
        method: "GET",
      });

      const json = await res.json();

      if (!json.ok) {
        setResult("Terjadi error saat mengecek harga.");
      } else {
        if (json.sentEmail) {
          setResult(
            `🔥 Ada harga di bawah 1 juta!\nTermurah: Rp${json.cheapest.price.toLocaleString(
              "id-ID"
            )}`
          );
        } else {
          setResult(
            `Tidak ada harga di bawah 1 juta. Termurah saat ini: Rp${json.cheapest.price.toLocaleString(
              "id-ID"
            )}`
          );
        }
      }
    } catch (e) {
      console.error(e);
      setResult("Gagal memanggil API.");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-20 px-10 bg-white dark:bg-black text-center">

        <h1 className="text-3xl font-bold text-black dark:text-white mb-6">
          Manual Check Harga Hoka Mach 6
        </h1>

        <button
          onClick={handleCheck}
          disabled={loading}
          className="px-6 py-3 rounded-full bg-black text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {loading ? "Checking..." : "Cek Harga Sekarang"}
        </button>

        {result && (
          <pre className="mt-6 whitespace-pre-line text-lg text-black dark:text-zinc-200">
            {result}
          </pre>
        )}
      </main>
    </div>
  );
}
