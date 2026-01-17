'use server'

import { GoogleGenAI } from '@google/genai';

export async function getGeminiResponse(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
    });

    const model = 'gemini-2.5-flash';

    const config = {

    };

    const contents = [
        {
            role: 'user',
            parts: [{ text: prompt }],
        },
    ];

    try {
        const response = await ai.models.generateContentStream({
            model,
            config,
            contents,
        });

        let fullResponse = "";
        for await (const chunk of response) {
            fullResponse += chunk.text;
        }

        return fullResponse;
    } catch (error) {
        console.error("Error calling Gemini:", error);
        return "Sorry, I encountered an error processing your request.";
    }
}