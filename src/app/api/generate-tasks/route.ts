import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("[API] /api/generate-tasks request received");

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("[API Error] GEMINI_API_KEY is missing");
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = "gemini-flash-latest";
  console.log(`[API] Using model: ${modelName}`);
  const model = genAI.getGenerativeModel({ model: modelName });

  try {
    const { type, goalTitle, goalDescription, startDate, endDate, milestoneTitle } = await req.json();

    let prompt = "";
    if (type === "milestones") {
      prompt = `Goal: "${goalTitle}"\nDescription: "${goalDescription}"\nDuration: ${startDate} to ${endDate}\nBreak this into 3-5 milestones. Return ONLY a JSON array of objects with "title", "date", "description".`;
    } else {
      prompt = `Goal: "${goalTitle}"\nMilestone: "${milestoneTitle}"\nSuggest 4-6 checklist items as a JSON array of strings.`;
    }

    console.log("[API] Sending prompt to Gemini...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("[API] Raw response from Gemini:", text);

    // JSON extraction logic
    let jsonStr = "";

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
