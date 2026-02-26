import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, VideoRecommendation, GradeLevel, Language } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Persona Definitions ---

const PERSONAS = {
  sinhala: {
    name: "Guru Thuma (ගුරු තුමා)",
    instruction: `
      You are 'Guru Thuma', a wise, friendly, and highly intelligent virtual teacher for Sri Lankan students.
      Your mission is to make learning fun, culturally relevant, and deeply understandable.

      **IDENTITY:**
      - **Name:** Guru Thuma.
      - **Tone:** Warm, grandfatherly (Seeya), respectful, and enthusiastic.
      - **Language:** Speak primarily in natural, conversational Sinhala. Use English terms for technical concepts but explain them in Sinhala.

      **CULTURAL INTEGRATION:**
      - Address student as "Putha" (Son), "Duwa" (Daughter), or "Daruwa" (Daruwa).
      - Use local metaphors: Cricket, Tuk-tuks, Paddy fields, Elephants, Tea plantations.
      - Praise: "Sha! Niyamai ne.", "Hari shok!"

      **TEACHING STYLE:**
      - Deep Thinking: Solve problems step-by-step.
      - Explain complex topics using simple, daily life examples.
    `
  },
  tamil: {
    name: "Aasiriyar (ஆசிரியர்)",
    instruction: `
      You are 'Aasiriyar', a wise, friendly, and knowledgeable virtual teacher for Tamil-speaking students.
      Your mission is to make learning fun, culturally relevant, and deeply understandable.

      **IDENTITY:**
      - **Name:** Aasiriyar.
      - **Tone:** Mentor-like, patient, respectful, and encouraging.
      - **Language:** Speak primarily in natural, conversational Tamil. Use English terms for technical concepts but explain them in Tamil.

      **CULTURAL INTEGRATION:**
      - Address student respectfully (e.g., "Maanava" / "Thambi" / "Thangachi").
      - Use local metaphors relevant to Sri Lankan/Tamil culture: Palmyrah trees, Temple architecture, Jaffna library, Cricket, Farming.
      - Praise: "Arumai!", "Mikku Nandru!"

      **TEACHING STYLE:**
      - Explain concepts clearly with step-by-step reasoning.
      - Use simple analogies from daily life.
    `
  },
  english: {
    name: "Global Tutor",
    instruction: `
      You are a friendly, energetic, and highly intelligent virtual tutor.
      Your mission is to make learning any subject easy and engaging for everyone.

      **IDENTITY:**
      - **Name:** Tutor.
      - **Tone:** Enthusiastic, clear, and professional yet accessible.
      - **Language:** English.

      **TEACHING STYLE:**
      - Break down complex topics into simple, digestible chunks.
      - Use universal analogies (Cars, Space, Nature, Sports).
      - Be encouraging and interactive.
    `
  }
};

export const sendMessageToGemini = async (
  message: string,
  imageBase64: string | undefined,
  grade: GradeLevel,
  subject: string,
  language: Language,
  history: { role: string; parts: { text: string }[] }[]
): Promise<{ text: string; videos: VideoRecommendation[] }> => {
  try {
    const ai = getClient();
    const persona = PERSONAS[language];

    // Construct the context prompt
    const contextPrompt = `
      [Context]
      Grade Level: ${grade}
      Subject: ${subject}
      Language: ${language}
      User Query: ${message}
      
      Act as ${persona.name}.
      Provide a clear, thought-out explanation strictly in the requested language (${language}).
      Also, suggest 2-3 search queries for YouTube videos.
      
      Format the output strictly as a JSON object with:
      - "explanation" (string): The formatted answer in ${language} (Markdown supported).
      - "videos" (array): Objects with "title", "description", "searchQuery".
    `;

    // Build contents
    const contents: any[] = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: h.parts
    }));

    const currentParts: any[] = [{ text: contextPrompt }];
    if (imageBase64) {
      currentParts.unshift({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      });
    }

    contents.push({ role: "user", parts: currentParts });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: persona.instruction,
        thinkingConfig: { thinkingBudget: 2048 }, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            videos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  searchQuery: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      text: result.explanation || "I'm having trouble explaining that right now.",
      videos: result.videos || []
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    const errorMsg = language === 'sinhala' 
        ? "තාක්ෂණික ගැටලුවක්. කරුණාකර නැවත උත්සාහ කරන්න." 
        : language === 'tamil'
        ? "தொழில்நுட்ப கோளாறு. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
        : "Technical error. Please try again.";
    
    return { text: errorMsg, videos: [] };
  }
};

export const generateQuiz = async (grade: GradeLevel, subject: string, topic: string, language: Language): Promise<QuizQuestion[]> => {
  try {
    const ai = getClient();
    const prompt = `Create a 5-question multiple choice quiz for Grade: ${grade}, Subject: ${subject}, Topic: ${topic || 'General knowledge'}. 
    Language: ${language}.
    Output strictly in JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER, description: "Index of correct option (0-3)" },
              explanation: { type: Type.STRING }
            }
          }
        }
      }
    });

    const questions = JSON.parse(response.text || "[]");
    if (questions.length === 0) throw new Error("No questions generated");
    return questions;

  } catch (error) {
    console.error("Quiz Gen Error:", error);
    return [{
      question: "Quiz generation failed due to an error.",
      options: ["Retry"],
      correctAnswer: 0,
      explanation: "Please try again."
    }];
  }
};

export const generateLesson = async (grade: GradeLevel, subject: string, topic: string, language: Language): Promise<string> => {
    try {
        const ai = getClient();
        const persona = PERSONAS[language];

        const prompt = `
            Act as ${persona.name}.
            Create a comprehensive, easy-to-understand teaching lesson content for:
            - **Grade**: ${grade}
            - **Subject**: ${subject}
            - **Topic**: ${topic}
            - **Output Language**: ${language} (Ensure all explanations are in this language)

            If the subject is a **Language** (e.g., Japanese, English, French):
            - Structure: 
                1. Introduction
                2. Core Vocabulary (5-10 words with pronunciation & meaning)
                3. Grammar / Usage Rule
                4. Common Phrases
                5. Practice Sentence
            
            If the subject is **Academic** (e.g., Science, History, Math):
            - Structure:
                1. Lesson Overview
                2. Key Concepts (explained simply with analogies)
                3. Real-world Example (Sri Lankan context if possible)
                4. Summary / Key Takeaways

            Format the response in clean **Markdown**. Use emoji where appropriate to make it engaging.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: persona.instruction,
                thinkingConfig: { thinkingBudget: 2048 },
            }
        });

        return response.text || "Lesson generation failed.";

    } catch (error) {
        console.error("Lesson Gen Error:", error);
        return language === 'sinhala' ? "පාඩම සකස් කිරීමට නොහැකි විය. නැවත උත්සාහ කරන්න." : "Could not generate lesson. Please try again.";
    }
};