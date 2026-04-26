import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json({ 
        error: 'Gemini API key is missing. Please add it to your .env file.' 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // System prompt to set the persona
    const systemPrompt = "You are FinSense AI, a helpful and professional financial assistant for the FinSense app. Your goal is to help users track expenses, plan budgets, and provide general financial advice. Keep your responses concise, friendly, and focused on fintech/finance.";

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I am FinSense AI, ready to help with financial tracking and planning.' }] },
        ...(history || [])
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return NextResponse.json({ 
      error: 'An error occurred while communicating with the AI.', 
      details: error.message 
    }, { status: 500 });
  }
}
