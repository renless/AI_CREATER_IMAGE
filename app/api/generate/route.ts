import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      "https://api.siliconflow.cn/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.qianwen_api_key}`,
          "Content-Type": "application/json",
          "X-Enable-Watermark": "0",
        },
        body: JSON.stringify({
          model: "Qwen/Qwen-Image-Edit-2509",
          prompt,
          n: 4,
          cfg: 4.5,
          num_inference_steps: 28,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `API error ${response.status}: ${err}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
