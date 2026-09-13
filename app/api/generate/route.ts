import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const prompt = formData.get("prompt") as string;
  const imageFile = formData.get("image") as File | null;

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const apiKey = process.env.qianwen_api_key;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const baseUrl = "https://api.siliconflow.cn/v1/images/generations";
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Enable-Watermark": "0",
    };
    const model = imageFile ? "Qwen/Qwen-Image-Edit-2509" : "Qwen/Qwen-Image";

    // Qwen models return 1 image per request, so make 4 parallel requests
    const requests = Array(4).fill(null).map(async (_, i) => {
      const body = imageFile
        ? {
            model,
            prompt,
            image: await (async () => {
              const buf = await imageFile.arrayBuffer();
              return `data:${imageFile.type || "image/png"};base64,${Buffer.from(buf).toString("base64")}`;
            })(),
            cfg: 4.5,
            num_inference_steps: 28,
          }
        : {
            model,
            prompt,
            cfg: 4.5,
            num_inference_steps: 28,
          };

      const res = await fetch(baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`Request ${i} failed:`, err);
        return null;
      }

      const data = await res.json();
      return data?.images?.[0]?.url || null;
    });

    const urls = (await Promise.all(requests)).filter(Boolean) as string[];

    if (urls.length === 0) {
      return NextResponse.json({ error: "All requests failed" }, { status: 500 });
    }

    return NextResponse.json({ images: urls.map((url) => ({ url })) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
