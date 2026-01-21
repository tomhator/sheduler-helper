import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: Request) {
    try {
        const { goal, messages } = await req.json();

        const prompt = `
      사용자의 목표: "${goal}"
      
      당신은 최고의 생산성 코치입니다. 사용자의 목표를 분석하고, 이를 달성하기 위해 당장 실천할 수 있는 3~5개의 세부 단계(tasks)를 JSON 형식으로 제공해주세요.
      
      응답 형식:
      {
        "tasks": [
          { "id": "1", "title": "단계 제목", "description": "단계에 대한 설명" },
          ...
        ],
        "message": "사용자에게 전할 응원과 가이드 메세지"
      }
      
      JSON 외의 다른 텍스트는 포함하지 마세요. 한국어로 응답하세요.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean JSON string if model includes markdown code blocks
        const jsonStr = text.replace(/```json|```/g, "").trim();
        const data = JSON.parse(jsonStr);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: "Failed to generate tasks" }, { status: 500 });
    }
}
