import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;

// Initialize the client if API key exists
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION = `Sen GingivaX ağız ve diş sağlığı kliniğinin yapay zeka asistanı Dr. Perio'sun.
Amacın hastalara şikayetleri veya yükledikleri diş fotoğrafları doğrultusunda nazikçe ön değerlendirme yapmak ve onları doğru diş hekimliği bölümüne (örneğin Ortodonti, Periodontoloji, Çene Cerrahisi, Endodonti, Pedodonti vb.) yönlendirmektir. 
Kesin bir tıbbi teşhis koymadığını, sadece muayene için ön bir yönlendirme yaptığını belirtmeyi unutma.

Önemli Kurallar:
1. Üslup: Hastalara asla 'sen' diye hitap etme. Her zaman 'Siz' diye hitap et ve son derece empatik, kibar, profesyonel bir dil kullan.
2. Fiyat Bilgisi: Hastalar tedavi fiyatı sorarsa asla net veya tahmini bir rakam verme. Klinik muayenesi olmadan fiyat vermenin doğru olmadığını ve detaylı bilgi/fiyat için kliniğimizi aramaları gerektiğini nazikçe belirt.
3. Randevu Alma: Hasta randevu oluşturmak isterse, sadece kliniği aramasını söyleme. Mutlaka "[Buraya tıklayarak hemen online randevu oluşturabilirsiniz](/randevu)" şeklinde tıklanabilir bir bağlantı (markdown linki) vererek onu online randevu sistemine yönlendir.
4. Bölüm Yönlendirmesi: Hastaları şikayetlerine göre BİREBİR ŞU BÖLÜMLERDEN birine yönlendir: Ağız, Diş ve Çene Cerrahisi, Ağız, Diş ve Çene Radyolojisi, Endodonti, Ortodonti, Pedodonti, Periodontoloji, Protetik Diş Tedavisi, Restoratif Diş Tedavisi. Bu isimlerin dışına çıkma.

Cevaplarını kısa ve anlaşılır tut. Markdown formatını (kalın yazı, madde imleri vb.) kullanarak daha okunaklı hale getirebilirsin.`;

function getStaticReply(message: string, hasImage: boolean): string {
  const text = (message || "").toLowerCase();
  let reply = "";
  
  if (text.includes("ağrı") || text.includes("agri") || text.includes("sızı") || text.includes("sizi") || text.includes("zonkla")) {
    reply = "Geçmiş olsun! Diş ağrısı genellikle çürük, kanal tedavisi gereksinimi veya diş eti enfeksiyonu kaynaklı olabilir. En kısa sürede **Endodonti (Kanal Tedavisi)** veya **Restoratif Diş Tedavisi** uzmanımıza muayene olmanızı öneririm. Şiddetli ağrılarda hekim muayenesi olmadan antibiyotik kullanmayınız. [Hemen online randevu oluşturabilirsiniz](/randevu)";
  } else if (text.includes("tel") || text.includes("şeffaf") || text.includes("seffaf") || text.includes("yamuk") || text.includes("çapraşık") || text.includes("caprasik") || text.includes("ortodonti")) {
    reply = "Dişlerdeki çapraşıklıklar ve dizilim sorunları için **Ortodonti** (Diş Teli ve Şeffaf Plak) bölümümüz hizmet vermektedir. Hekimimiz size en uygun tedavi yöntemini (telsiz şeffaf plaklar veya geleneksel braketler) sunacaktır. [Hemen online randevu oluşturabilirsiniz](/randevu)";
  } else if (text.includes("diş eti") || text.includes("dis eti") || text.includes("kanama") || text.includes("şişlik") || text.includes("sislik") || text.includes("koku")) {
    reply = "Diş eti kanaması, şişlik veya ağız kokusu genellikle diş eti hastalıklarının (Periodontitis/Gingivitis) belirtisidir. Diş taşı temizliği ve diş eti tedavileri için **Periodontoloji** birimimizden randevu almanızı öneririz. [Hemen online randevu oluşturabilirsiniz](/randevu)";
  } else if (text.includes("çekim") || text.includes("cekim") || text.includes("yirmilik") || text.includes("gömülü") || text.includes("gomulu") || text.includes("cerrahi")) {
    reply = "Yirmilik diş ağrıları, gömülü diş operasyonları ve implant cerrahisi **Ağız, Diş ve Çene Cerrahisi** bölümümüzün uzmanlık alanıdır. Cerrahi muayene için randevunuzu online oluşturabilirsiniz. [Hemen online randevu oluşturabilirsiniz](/randevu)";
  } else if (text.includes("implant") || text.includes("zirkonyum") || text.includes("protez") || text.includes("kaplama") || text.includes("lamina")) {
    reply = "Eksik dişlerin tamamlanması, zirkonyum kaplamalar, porselen laminalar ve gülüş tasarımı uygulamaları **Protetik Diş Tedavisi** uzmanlarımızın alanıdır. Size en estetik çözümleri sunmak için hazırız. [Hemen online randevu oluşturabilirsiniz](/randevu)";
  } else if (text.includes("çocuk") || text.includes("cocuk") || text.includes("bebek") || text.includes("pedodonti")) {
    reply = "Çocuklarımızın süt dişi tedavileri, koruyucu dolgular (fissür örtücü) ve diş gelişim takipleri **Pedodonti (Çocuk Diş Hekimliği)** bölümümüz tarafından sevgiyle gerçekleştirilmektedir. [Hemen online randevu oluşturabilirsiniz](/randevu)";
  } else {
    reply = "Merhaba! Ben GingivaX Akıllı Klinik Asistanı Dr. Perio. Şikayetinizi (örneğin ağrı, diş eti kanaması, diş teli, implant vb.) yazabilirseniz size en uygun tedavi birimimizi önerebilirim. Dilerseniz [buraya tıklayarak online randevunuzu](/randevu) hemen oluşturabilirsiniz.";
  }

  if (hasImage) {
    reply = `**Not:** Yapay zeka servisimizdeki geçici yoğunluk nedeniyle fotoğraf analizi şu anda devre dışıdır, ancak şikayetinize göre size şu bilgiyi verebilirim:\n\n${reply}`;
  }
  return reply;
}

async function generateWithRetry(aiClient: any, userParts: any[], retries = 2, delayMs = 1000): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await aiClient.models.generateContent({
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
      return response.text;
    } catch (error: any) {
      const isTemporary = error.status === 503 || error.status === 429 || 
                          (error.message && (error.message.includes('503') || error.message.includes('429') || error.message.includes('overload') || error.message.includes('demand')));
      
      if (isTemporary && i < retries) {
        console.warn(`Gemini API geçici hata verdi (status ${error.status || 'bilinmiyor'}), ${delayMs}ms içinde tekrar deneniyor... (Deneme ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error("Yeniden denemeler başarısız oldu.");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, image, mimeType } = body;

    if (!ai) {
      return NextResponse.json({ reply: getStaticReply(message, !!image) });
    }

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

    try {
      const replyText = await generateWithRetry(ai, userParts);
      return NextResponse.json({ reply: replyText });
    } catch (apiError) {
      console.error('Gemini API hatası, statik mesaja yönlendiriliyor:', apiError);
      return NextResponse.json({ reply: getStaticReply(message, !!image) });
    }
  } catch (error) {
    console.error('Genel sunucer hatası:', error);
    return NextResponse.json({ reply: 'Üzgünüm, şu anda asistan servisinde teknik bir sorun yaşanıyor. Lütfen daha sonra tekrar deneyin.' }, { status: 500 });
  }
}
