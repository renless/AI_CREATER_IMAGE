"use client";

import { useState, useEffect, useCallback } from "react";

interface GeneratedImage {
  url: string;
}

interface GenerateResponse {
  images?: GeneratedImage[];
  error?: string;
}

export default function ProtectedPage() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setImages([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data: GenerateResponse = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.images && data.images.length > 0) {
        setImages(data.images);
      } else {
        setError("No images returned from API");
      }
    } catch {
      setError("Failed to generate images");
    } finally {
      setLoading(false);
    }
  };

  const closeLightbox = useCallback(() => setLightboxIdx(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (lightboxIdx === null) return;
      if (e.key === "ArrowRight" && lightboxIdx < images.length - 1) {
        setLightboxIdx(lightboxIdx + 1);
      }
      if (e.key === "ArrowLeft" && lightboxIdx > 0) {
        setLightboxIdx(lightboxIdx - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, images.length, closeLightbox]);

  return (
    <div className="flex-1 w-full flex flex-col gap-10">
      <div className="text-sm text-muted-foreground">
        输入描述，AI 将为您生成 4 张图片
      </div>

      {/* Prompt Input */}
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Describe the image you want to generate..."
            className="flex-1 px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto w-full">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-accent animate-pulse"
            />
          ))}
        </div>
      )}

      {/* 4-Image Grid */}
      {!loading && images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto w-full">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setLightboxIdx(idx)}
              className="aspect-square rounded-xl overflow-hidden border hover:ring-2 hover:ring-primary/60 transition-all cursor-zoom-in"
            >
              <img
                src={img.url}
                alt={`Generated ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Swipeable Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
          >
            ✕
          </button>

          {lightboxIdx > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition"
            >
              ‹
            </button>
          )}

          {lightboxIdx < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition"
            >
              ›
            </button>
          )}

          <div className="relative max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[lightboxIdx].url}
              alt={`Generated ${lightboxIdx + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white/80 text-sm px-3 py-1 rounded-full">
              {lightboxIdx + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
