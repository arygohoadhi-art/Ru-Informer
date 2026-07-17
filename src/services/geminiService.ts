import { GoogleGenAI } from "@google/genai";
import { StudentDNA } from "../types";

let genAIInstance: GoogleGenAI | null = null;

function getAI() {
  if (!genAIInstance) {
    const userKey = localStorage.getItem('user_gemini_api_key');
    const key = userKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing. Please add it in the Settings menu (Gear icon) in the Dashboard.");
    }
    genAIInstance = new GoogleGenAI({ apiKey: key });
  }
  return genAIInstance;
}

export async function getEmbedding(text: string) {
  try {
    const ai = getAI();
    const result = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: [{ parts: [{ text }] }],
    });
    return result.embeddings[0].values;
  } catch (error) {
    console.error("Embedding Error:", error);
    throw error;
  }
}

export async function getChatResponse(
  message: string | { text?: string; inlineData?: { data: string; mimeType: string } }[],
  history: { role: 'user' | 'model', parts: { text?: string; inlineData?: { data: string; mimeType: string } }[] }[] = [],
  groundingContext?: string
) {
  try {
    const ai = getAI();
    const userKnowledge = localStorage.getItem('user_knowledge_feed') || '';
    
    // Sanitize the history and message to match exactly what GoogleGenAI expects
    const cleanHistory = history.map(h => ({
      role: h.role,
      parts: h.parts.map(p => {
        const cleanPart: any = {};
        if (p.text !== undefined) cleanPart.text = p.text;
        if (p.inlineData !== undefined) {
          cleanPart.inlineData = {
            data: p.inlineData.data,
            mimeType: p.inlineData.mimeType
          };
        }
        return cleanPart;
      })
    }));

    const cleanMessageParts = Array.isArray(message)
      ? message.map(p => {
          const cleanPart: any = {};
          if (p.text !== undefined) cleanPart.text = p.text;
          if (p.inlineData !== undefined) {
            cleanPart.inlineData = {
              data: p.inlineData.data,
              mimeType: p.inlineData.mimeType
            };
          }
          return cleanPart;
        })
      : [{ text: message }];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...cleanHistory,
        { role: 'user', parts: cleanMessageParts }
      ],
      config: {
        systemInstruction: `You are the official RU Informer AI, the central intelligence for Rajshahi University students. 
        Your purpose is to bridge the gap between academic study and extra-curricular success.
        
        Capabilities:
        1. You can see images and hear audio provided by the user.
        2. You can generate images and provide spoken (audio) responses if explicitly asked.
        3. Provide expert advice on RU departments, clubs, and Bangladesh job market.
        
        ${groundingContext ? `
        CRITICAL REAL-TIME CAMPUS INTELLIGENCE GROUNDING (Use this to analyze, search, synthesize and answer based on latest feeded documents/information/resources):
        --- START OF LIVE CAMPUS INTEL ---
        ${groundingContext}
        --- END OF LIVE CAMPUS INTEL ---
        ` : ''}

        CRITICAL MANUAL KNOWLEDGE:
        The user has provided the following custom knowledge/data to "feed" your intelligence. Use this for queries related to their specific data:
        --- START OF USER DATA ---
        ${userKnowledge}
        --- END OF USER DATA ---
        
        Tone: Visionary, proactive, and highly intelligent.`,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
}

export async function generateImage(prompt: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ text: prompt }],
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
}

export async function generateSpeech(text: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say naturally: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
}

export async function generateRoadmap(studentDNA: StudentDNA) {
  const prompt = `
    As RU Informer AI, generate a localized 4-year career roadmap for a student at Rajshahi University, Bangladesh.
    
    Student Profile:
    - Department: ${studentDNA.dept}
    - Study Year: ${studentDNA.year}
    - Career Goal: ${studentDNA.goals}
    - Goal Progress Stage: ${studentDNA.goalStage}
    - Primary Motivation: ${studentDNA.motivation}
    - Top Strengths: ${studentDNA.topStrengths}
    - Improvement Focus: ${studentDNA.improvementAreas}
    - Market Preference: ${studentDNA.marketPreference}
    - Work Style: ${studentDNA.workStyle}
    - Major Obstacle: ${studentDNA.majorObstacle}
    - 10-Year Vision: ${studentDNA.vision10Years}
    - Specific Technical/Life Habits: ${studentDNA.habits}
    - Previous Involvement (Clubs/Society): ${studentDNA.previousInvolvement}
    - Current Active Node Area: ${studentDNA.currentInvolvement}
    - Technical/General Experience: ${studentDNA.experience}
    
    Context: Ensure advice covers BCS prep (if applicable), Bank/Local job market trends, and RU-specific milestones. Provide a high-fidelity roadmap that uses their motivation and work style to suggest specific clubs, online courses, and networking nodes. Address their major obstacle with a clear mitigation strategy.
    
    Structure the response in JSON format:
    {
      "recommendedClubs": ["Club 1", "Club 2"],
      "alumnusPath": "A brief success story of an RU alumnus with similar background. Mention how they used online guidelines if applicable.",
      "year1": "...",
      "year2": "...",
      "year3": "...",
      "year4": "...",
      "keySkills": ["Skill 1", "Skill 2", "Skill 3"],
      "conductionStrategy": "How to actively use RU clubs at TSC or online resource nodes to achieve this roadmap.",
      "onlineGuidelineReference": "Recent Online Information (e.g. 'LinkedIn Networking BD', 'BCS Prep Groups') analyzed for this path."
    }
    
    Ensure the roadmap reflects the global competitiveness and local reality of students in Bangladesh. Analysis must integrate both physical club nodes and retrieved online intelligence.
  `;
  
  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(result.text);
  } catch (error) {
    console.error("Roadmap Generation Error:", error);
    return null;
  }
}

export async function matchClubs(studentDNA: string, clubs: string[]) {
  const prompt = `
    As RU Informer AI, analyze the match between this student and the following RU clubs.
    Student Profile: ${studentDNA}
    Available Clubs: ${clubs.join(', ')}
    
    Return a JSON array of matched clubs (top 3) with reasonings:
    [
      { "clubName": "Name", "matchScore": 0.95, "reason": "Why this matches their department or hobbies" }
    ]
  `;
  
  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(result.text);
  } catch (error) {
    console.error("Match Clubs Error:", error);
    return [];
  }
}

export async function analyzeStudentMatch(studentDNA: string, eventDetails: string) {
  const prompt = `
    Analyze the match between a student's profile and a club event.
    Student Profile: ${studentDNA}
    Event Details: ${eventDetails}
    
    Provide a brief, encouraging "Why this matches you" explanation in 2-3 sentences.
  `;
  
  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    return result.text;
  } catch (error) {
    console.error("Match Analysis Error:", error);
    return "This event aligns with your indicated interests and goals.";
  }
}

export async function generateCustomSynthesis(
  selectedResources: { title: string; contentOrDesc: string; type: string }[],
  demandType: 'summary' | 'notes' | 'exam' | 'career',
  studentProfile: string
) {
  const prompt = `
    You are RU Informer AI, the central intelligence for Rajshahi University students.
    Perform an advanced AI synthesis on the following selected campus documents/resources.
    
    Student Profile:
    ${studentProfile}
    
    Selected Documents/Resources to Synthesize:
    ${selectedResources.map((r, i) => `${i + 1}. [${r.type}] Title: "${r.title}"\nContent/Description: "${r.contentOrDesc}"`).join('\n\n')}
    
    Information Demand Style: ${demandType.toUpperCase()}
    Detailed Instructions for Style:
    - SUMMARY: Create a high-impact, synthesized executive summary extracting key takeaways, central themes, and relevance to the student's department or goals.
    - NOTES: Create highly structured, comprehensive, student-friendly revision/study notes. Use neat lists, bold terms, and outline formats.
    - EXAM: Formulate 5 high-fidelity exam-prep multiple choice questions (with answer keys and explanations) and 2 critical-thinking essay-type questions based on the resources.
    - CAREER: Map these resources directly to a 4-year career path, highlighting exactly how to utilize the insights for competitive jobs in Bangladesh (BCS, Bank Jobs, Tech, Pharma, etc.) and what skills to master.
    
    Format your response in a beautiful, structured format. Use clean markdown formatting (headers, bullets, bold text) to present your analysis. Make sure the tone is encouraging, professional, and precise.
  `;
  
  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    return result.text;
  } catch (error) {
    console.error("Custom Synthesis Error:", error);
    return "Failed to synthesize resources due to an API timeout. Please ensure your GEMINI_API_KEY is configured in Settings and try again.";
  }
}

export async function generateStudentPlaybook(
  studentProfile: string,
  articles: any[],
  mediaResources: any[],
  clubFeeds: any[],
  events: any[]
) {
  const prompt = `
    You are RU Informer AI, the central intelligence for Rajshahi University.
    You must synthesize ALL current campus intelligence, articles, and media files to generate a personalized "RU Campus Playbook & Action Guide" for this student.
    
    Student Profile:
    ${studentProfile}
    
    Latest Campus Articles:
    ${articles.slice(0, 10).map(a => `- [Article] "${a.title}" (${a.category}) - ${a.content.slice(0, 150)}...`).join('\n')}
    
    Multimedia Vault Files:
    ${mediaResources.slice(0, 10).map(m => `- [${m.type}] "${m.title}" - Description: ${m.description}`).join('\n')}
    
    Active Club Feeds & TSC Updates:
    ${clubFeeds.slice(0, 10).map(f => `- [${f.clubPostType || 'Update'}] "${f.title}" - ${f.content.slice(0, 150)}...`).join('\n')}
    
    Current Events:
    ${events.slice(0, 10).map(e => `- [Event] "${e.title}" at ${e.venue} (${e.category})`).join('\n')}
    
    Structure the response strictly in JSON format so we can display it beautifully in the user interface:
    {
      "executiveSummary": "A concise, visionary summary (2-3 sentences) explaining how the current RU landscape matches their exact goals.",
      "tscAlignment": "A synthesized recommendation of 2-3 specific actions or club milestones they should target based on the newest events/feeds, explained in detail.",
      "multimediaStudyGuide": "A unified study list highlighting key takeaways synthesized from the Multimedia Vault that they should access immediately for their department/goals.",
      "tacticalToDos": [
        "To-do item 1 (related to latest events or articles)",
        "To-do item 2 (related to vault resources or career skills)",
        "To-do item 3 (specific to their major obstacles)"
      ]
    }
  `;
  
  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(result.text);
  } catch (error) {
    console.error("Playbook Generation Error:", error);
    return null;
  }
}
