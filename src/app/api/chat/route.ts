import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;

// Initialize the client if API key exists
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION = `Sen GingivaX ağız ve diş sağlığı kliniğinin yapay zeka asistanı Dr. Perio'sun.
Amacın hastalara şikayetleri veya yükledikleri diş fotoğrafları doğrultusunda nazikçe ön değerlendirme yapmak ve onları doğru diş hekimliği bölümüne (örneğin Ortodonti, Periodontoloji, Çene Cerrahisi, Endodonti, Pedodonti vb.) yönlendirmektir. 
Kesin bir tıbbi teşhis koymadığını, sadece muayene için ön bir yönlendirme yaptığını belirtmeyi unutma.
Cevaplarını kısa, anlaşılır ve empatik bir dille ver. Markdown formatını (kalın yazı, madde imleri vb.) kullanarak daha okunaklı hale getirebilirsin.`;

export async function POST(req: Request) {
  try {
    if (!ai) {
      return NextResponse.json(
        { reply: 'Dr. Perio şu anda uykuda. (Sistem hatası: API anahtarı eksik. Lütfen .env dosyasına GEMINI_API_KEY ekleyin.)' }, 
        { status: 200 } // Don't throw 500 so UI can display it
      );
    }

    const body = await req.json();
    const { message, image, mimeType } = body;

    let userParts: any[] = [];

    // If an image is provided as base64
    if (image && mimeType) {
       userParts.push({
         inlineData: {
           data: image,
           mimeType: mimeType
         }
       });
    }

    if (message && message.trim() !== '') {
      userParts.push({ text: message });
    } else if (userParts.length === 0) {
      userParts.push({ text: 'Merhaba, bana yardımcı olabilir misiniz?' });
    } else {
      userParts.push({ text: 'Bu fotoğrafta ağız ve diş sağlığımla ilgili herhangi bir sorun görebiliyor musunuz? Hangi bölüme gitmeliyim?' });
    }

    const response = await ai.models.generateContent({
       model: 'gemini-2.5-flash',
       contents: [
         {
           role: 'user',
           parts: userParts
         }
       ],
       config: {
         systemInstruction: SYSTEM_INSTRUCTION
       }
    });
    
    return NextResponse.json({ reply: response.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ reply: 'Üzgünüm, analiz sırasında bir ağ hatası oluştu. Lütfen fotoğraf boyutunu veya bağlantınızı kontrol edip tekrar deneyin.' }, { status: 500 });
  }
}
