import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Ensure the route is always treated as dynamic
export const maxDuration = 60; // Increase timeout for Gemini API calls

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "AI API Route is reachable",
    env_check: {
      has_gemini_key: !!process.env.GEMINI_API_KEY,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "present" : "missing"
    }
  });
}

export async function POST(req: Request) {
  console.log("[API] /api/generate-tasks request received");

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("[API Error] GEMINI_API_KEY is missing in env variables");
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다. Vercel 환경 변수를 확인해주세요." }, { status: 500 });
  } else {
    console.log(`[API] GEMINI_API_KEY is present (Masked: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 3)})`);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = "gemini-flash-latest";
  console.log(`[API] Using model: ${modelName}`);
  const model = genAI.getGenerativeModel({ model: modelName });

  try {
    const body = await req.json();
    const { type, goalTitle, goalDescription, startDate, endDate, milestoneTitle } = body;
    console.log("[API] Request body:", JSON.stringify(body));

    let prompt = "";
    if (type === "milestones") {
      prompt = `Goal: "${goalTitle}"\nDescription: "${goalDescription}"\nDuration: ${startDate} to ${endDate}\nBreak this into 3-5 milestones. Return ONLY a JSON array of objects with "title", "date", "description".`;
    } else {
      prompt = `Goal: "${goalTitle}"\nMilestone: "${milestoneTitle}"\nSuggest 4-6 checklist items as a JSON array of strings.`;
    }

    console.log("[API] Sending prompt to Gemini. Prompt length:", prompt.length);

    // Set a timeout for the Gemini call if possible or just log start/end
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const duration = Date.now() - startTime;

    console.log(`[API] Gemini responded in ${duration}ms. Raw text length: ${text?.length || 0}`);

    if (!text || text.trim() === "") {
      console.error("[API Error] Gemini returned an empty response.");
      return NextResponse.json({ error: "AI가 빈 응답을 반환했습니다. 다시 시도해주세요." }, { status: 500 });
    }

    // JSON extraction logic
    let jsonStr = "";
    // ... (rest of the logic)

    // 1. Try to find JSON within code blocks
    const jsonMatch = text.match(/```json?([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // 2. Try to find JSON within square brackets or curly braces
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');

      if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        jsonStr = text.substring(firstBracket, lastBracket + 1).trim();
      } else if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = text.substring(firstBrace, lastBrace + 1).trim();
      } else {
        jsonStr = text.trim();
      }
    }

    if (!jsonStr) {
      throw new Error("AI 응답에서 유효한 데이터를 추출하지 못했습니다.");
    }

    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      console.error("[API] JSON Parse Error for string:", jsonStr);
      throw new Error("AI 응답 데이터 형식이 올바르지 않습니다.");
    }

    // Standardize the output format
    if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
      data = data.milestones || data.data || data.checklist || data.items || data;
    }

    const finalData = Array.isArray(data) ? data : [data];

    // Data structure validation/cleaning
    const cleanedData = finalData.map(item => {
      if (type === "milestones") {
        return {
          title: item.title || "새 마일스톤",
          date: item.date || "",
          description: item.description || ""
        };
      }
      return typeof item === 'string' ? item : (item.text || item.title || String(item));
    });

    console.log("[API] Final processed data:", cleanedData);
    return NextResponse.json({ data: cleanedData });

  } catch (error: any) {
    console.error("[API Error Details]:", {
      message: error.message,
      stack: error.stack,
      status: error.status
    });

    return NextResponse.json({
      error: "AI 서비스 오류가 발생했습니다.",
      details: error.message
    }, { status: error.status || 500 });
  }
}
