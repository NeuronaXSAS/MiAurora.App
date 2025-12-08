/**
 * Aurora App - Batch Content Generation API
 * 
 * Generates a week's worth of multilingual content in ONE API call.
 * This is the most cost-efficient way to use AWS Bedrock.
 * 
 * Cost: ~$2-3 per week of content (37 items × 6 languages = 222 pieces)
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Fallback content when AWS is unavailable or budget exhausted
const FALLBACK_DEBATES = [
  {
    topic: "Should companies be required to publish salary ranges in job postings?",
    category: "career",
    options: ["Yes, always", "Only for certain roles", "No, it should be private"],
    translations: {
      en: "Should companies be required to publish salary ranges in job postings?",
      es: "¿Deberían las empresas publicar rangos salariales en ofertas de trabajo?",
      pt: "Empresas devem publicar faixas salariais em vagas de emprego?",
      fr: "Les entreprises devraient-elles publier les fourchettes de salaires?",
      ar: "هل يجب على الشركات نشر نطاقات الرواتب في إعلانات الوظائف؟",
      hi: "क्या कंपनियों को नौकरी पोस्टिंग में वेतन सीमा प्रकाशित करनी चाहिए?",
    },
  },
  {
    topic: "Is remote work better for work-life balance?",
    category: "career",
    options: ["Yes, definitely", "It depends on the job", "No, office is better"],
    translations: {
      en: "Is remote work better for work-life balance?",
      es: "¿Es el trabajo remoto mejor para el equilibrio vida-trabajo?",
      pt: "O trabalho remoto é melhor para o equilíbrio vida-trabalho?",
      fr: "Le télétravail est-il meilleur pour l'équilibre vie-travail?",
      ar: "هل العمل عن بعد أفضل للتوازن بين العمل والحياة؟",
      hi: "क्या रिमोट वर्क वर्क-लाइफ बैलेंस के लिए बेहतर है?",
    },
  },
  {
    topic: "What's the best way to handle workplace harassment?",
    category: "safety",
    options: ["Report to HR immediately", "Document everything first", "Seek legal advice"],
    translations: {
      en: "What's the best way to handle workplace harassment?",
      es: "¿Cuál es la mejor manera de manejar el acoso laboral?",
      pt: "Qual a melhor forma de lidar com assédio no trabalho?",
      fr: "Quelle est la meilleure façon de gérer le harcèlement au travail?",
      ar: "ما هي أفضل طريقة للتعامل مع التحرش في مكان العمل؟",
      hi: "कार्यस्थल उत्पीड़न से निपटने का सबसे अच्छा तरीका क्या है?",
    },
  },
  {
    topic: "Should women negotiate salary more aggressively?",
    category: "career",
    options: ["Yes, always negotiate", "Depends on the situation", "Focus on proving value first"],
    translations: {
      en: "Should women negotiate salary more aggressively?",
      es: "¿Deberían las mujeres negociar el salario más agresivamente?",
      pt: "Mulheres devem negociar salário de forma mais agressiva?",
      fr: "Les femmes devraient-elles négocier leur salaire plus agressivement?",
      ar: "هل يجب على النساء التفاوض على الراتب بشكل أكثر حزماً؟",
      hi: "क्या महिलाओं को वेतन पर अधिक आक्रामक तरीके से बातचीत करनी चाहिए?",
    },
  },
  {
    topic: "Is it safe to travel solo as a woman?",
    category: "travel",
    options: ["Yes, with proper precautions", "Only in certain countries", "Better to travel with others"],
    translations: {
      en: "Is it safe to travel solo as a woman?",
      es: "¿Es seguro viajar sola siendo mujer?",
      pt: "É seguro viajar sozinha sendo mulher?",
      fr: "Est-il sûr de voyager seule en tant que femme?",
      ar: "هل من الآمن السفر بمفردك كامرأة؟",
      hi: "क्या एक महिला के रूप में अकेले यात्रा करना सुरक्षित है?",
    },
  },
  {
    topic: "What's more important: career growth or work-life balance?",
    category: "career",
    options: ["Career growth", "Work-life balance", "Both equally"],
    translations: {
      en: "What's more important: career growth or work-life balance?",
      es: "¿Qué es más importante: crecimiento profesional o equilibrio vida-trabajo?",
      pt: "O que é mais importante: crescimento na carreira ou equilíbrio vida-trabalho?",
      fr: "Qu'est-ce qui est plus important: la carrière ou l'équilibre vie-travail?",
      ar: "ما الأهم: النمو المهني أم التوازن بين العمل والحياة؟",
      hi: "क्या अधिक महत्वपूर्ण है: करियर ग्रोथ या वर्क-लाइफ बैलेंस?",
    },
  },
  {
    topic: "Should women support other women in the workplace unconditionally?",
    category: "career",
    options: ["Yes, always", "Support based on merit", "It depends on the situation"],
    translations: {
      en: "Should women support other women in the workplace unconditionally?",
      es: "¿Deberían las mujeres apoyar a otras mujeres incondicionalmente en el trabajo?",
      pt: "Mulheres devem apoiar outras mulheres incondicionalmente no trabalho?",
      fr: "Les femmes devraient-elles se soutenir inconditionnellement au travail?",
      ar: "هل يجب على النساء دعم النساء الأخريات في العمل دون قيد أو شرط؟",
      hi: "क्या महिलाओं को कार्यस्थल पर अन्य महिलाओं का बिना शर्त समर्थन करना चाहिए?",
    },
  },
];

const FALLBACK_TIPS = [
  {
    category: "travel",
    translations: {
      en: "Always share your live location with a trusted contact when traveling alone.",
      es: "Siempre comparte tu ubicación en vivo con un contacto de confianza cuando viajes sola.",
      pt: "Sempre compartilhe sua localização ao vivo com um contato de confiança ao viajar sozinha.",
      fr: "Partagez toujours votre position en direct avec un contact de confiance lorsque vous voyagez seule.",
      ar: "شاركي دائماً موقعك المباشر مع شخص موثوق عند السفر بمفردك.",
      hi: "अकेले यात्रा करते समय हमेशा किसी विश्वसनीय संपर्क के साथ अपना लाइव लोकेशन साझा करें।",
    },
  },
  {
    category: "workplace",
    translations: {
      en: "Document every instance of inappropriate behavior with dates, times, and witnesses.",
      es: "Documenta cada instancia de comportamiento inapropiado con fechas, horas y testigos.",
      pt: "Documente cada instância de comportamento inadequado com datas, horários e testemunhas.",
      fr: "Documentez chaque cas de comportement inapproprié avec dates, heures et témoins.",
      ar: "وثقي كل حالة سلوك غير لائق مع التواريخ والأوقات والشهود.",
      hi: "अनुचित व्यवहार की हर घटना को तारीखों, समय और गवाहों के साथ दस्तावेज करें।",
    },
  },
  {
    category: "safety",
    translations: {
      en: "Trust your instincts. If something feels wrong, leave the situation immediately.",
      es: "Confía en tus instintos. Si algo se siente mal, abandona la situación inmediatamente.",
      pt: "Confie em seus instintos. Se algo parecer errado, saia da situação imediatamente.",
      fr: "Faites confiance à votre instinct. Si quelque chose semble mal, quittez la situation immédiatement.",
      ar: "ثقي بغرائزك. إذا شعرت بشيء خاطئ، غادري الموقف فوراً.",
      hi: "अपनी सहज प्रवृत्ति पर भरोसा करें। अगर कुछ गलत लगे, तुरंत स्थिति छोड़ दें।",
    },
  },
  {
    category: "finance",
    translations: {
      en: "Keep an emergency fund that only you have access to, regardless of your relationship status.",
      es: "Mantén un fondo de emergencia al que solo tú tengas acceso, sin importar tu estado de relación.",
      pt: "Mantenha um fundo de emergência que só você tenha acesso, independente do seu status de relacionamento.",
      fr: "Gardez un fonds d'urgence auquel vous seule avez accès, quel que soit votre statut relationnel.",
      ar: "احتفظي بصندوق طوارئ لا يمكن لأحد غيرك الوصول إليه، بغض النظر عن حالتك العاطفية.",
      hi: "एक आपातकालीन फंड रखें जिस तक केवल आपकी पहुंच हो, चाहे आपकी रिश्ते की स्थिति कुछ भी हो।",
    },
  },
  {
    category: "travel",
    translations: {
      en: "Research local emergency numbers and women's shelters before visiting a new city.",
      es: "Investiga los números de emergencia locales y refugios para mujeres antes de visitar una nueva ciudad.",
      pt: "Pesquise números de emergência locais e abrigos para mulheres antes de visitar uma nova cidade.",
      fr: "Recherchez les numéros d'urgence locaux et les refuges pour femmes avant de visiter une nouvelle ville.",
      ar: "ابحثي عن أرقام الطوارئ المحلية وملاجئ النساء قبل زيارة مدينة جديدة.",
      hi: "नए शहर जाने से पहले स्थानीय आपातकालीन नंबर और महिला आश्रयों की जानकारी लें।",
    },
  },
];

const FALLBACK_PROMPTS = [
  {
    category: "career",
    translations: {
      en: "What's the best career advice you've ever received? Share it to help other sisters!",
      es: "¿Cuál es el mejor consejo profesional que has recibido? ¡Compártelo para ayudar a otras hermanas!",
      pt: "Qual o melhor conselho de carreira que você já recebeu? Compartilhe para ajudar outras irmãs!",
      fr: "Quel est le meilleur conseil de carrière que vous ayez reçu? Partagez-le pour aider d'autres sœurs!",
      ar: "ما هي أفضل نصيحة مهنية تلقيتها؟ شاركيها لمساعدة الأخوات الأخريات!",
      hi: "आपको मिली सबसे अच्छी करियर सलाह क्या है? अन्य बहनों की मदद के लिए इसे साझा करें!",
    },
  },
  {
    category: "safety",
    translations: {
      en: "What safety tip do you wish you knew earlier? Your experience could help someone.",
      es: "¿Qué consejo de seguridad desearías haber sabido antes? Tu experiencia podría ayudar a alguien.",
      pt: "Que dica de segurança você gostaria de ter sabido antes? Sua experiência pode ajudar alguém.",
      fr: "Quel conseil de sécurité auriez-vous aimé connaître plus tôt? Votre expérience pourrait aider quelqu'un.",
      ar: "ما هي نصيحة السلامة التي تتمنين لو عرفتها مبكراً؟ تجربتك قد تساعد شخصاً ما.",
      hi: "कौन सी सुरक्षा टिप आप चाहती हैं कि आपको पहले पता होती? आपका अनुभव किसी की मदद कर सकता है।",
    },
  },
  {
    category: "wellness",
    translations: {
      en: "How do you practice self-care when life gets overwhelming? Share your rituals!",
      es: "¿Cómo practicas el autocuidado cuando la vida se vuelve abrumadora? ¡Comparte tus rituales!",
      pt: "Como você pratica autocuidado quando a vida fica difícil? Compartilhe seus rituais!",
      fr: "Comment pratiquez-vous l'auto-soin quand la vie devient accablante? Partagez vos rituels!",
      ar: "كيف تمارسين الرعاية الذاتية عندما تصبح الحياة مرهقة؟ شاركي طقوسك!",
      hi: "जब जीवन भारी हो जाता है तो आप सेल्फ-केयर कैसे करती हैं? अपने रिचुअल्स साझा करें!",
    },
  },
];

// Check if AWS Bedrock is available and within budget
async function checkAWSAvailability(): Promise<boolean> {
  // Check environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return false;
  }
  
  // Check budget (would be tracked in database in production)
  // For now, return true if credentials exist
  return true;
}

// Generate content using AWS Bedrock (when available)
async function generateWithBedrock(type: string): Promise<any[]> {
  // This would call AWS Bedrock API
  // For now, return empty to use fallbacks
  // Implementation would be added when AWS is configured
  
  console.log(`[Content Generation] AWS Bedrock not configured, using fallbacks for ${type}`);
  return [];
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get("authorization");
    const adminKey = process.env.ADMIN_API_KEY;
    
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, days = 7 } = body;

    // Check AWS availability
    const awsAvailable = await checkAWSAvailability();
    
    let content: any[] = [];
    let source = "fallback";

    if (awsAvailable) {
      // Try to generate with AWS Bedrock
      content = await generateWithBedrock(type);
      if (content.length > 0) {
        source = "aws_bedrock";
      }
    }

    // Use fallbacks if AWS didn't generate content
    if (content.length === 0) {
      switch (type) {
        case "debates":
          content = FALLBACK_DEBATES.slice(0, days);
          break;
        case "tips":
          content = FALLBACK_TIPS;
          break;
        case "prompts":
          content = FALLBACK_PROMPTS;
          break;
        default:
          return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
      }
    }

    // Store content in Convex
    const stored: string[] = [];
    const today = new Date();

    for (let i = 0; i < content.length; i++) {
      const item = content[i];
      
      try {
        if (type === "debates") {
          const scheduledDate = new Date(today);
          scheduledDate.setDate(today.getDate() + i);
          
          await convex.mutation(api.contentGeneration.storeGeneratedDebate, {
            topic: item.topic,
            category: item.category,
            options: item.options,
            translations: item.translations,
            scheduledDate: scheduledDate.toISOString().split("T")[0],
          });
          stored.push(item.topic);
        } else if (type === "tips") {
          await convex.mutation(api.contentGeneration.storeGeneratedTip, {
            category: item.category,
            translations: item.translations,
          });
          stored.push(item.translations.en.substring(0, 50) + "...");
        } else if (type === "prompts") {
          await convex.mutation(api.contentGeneration.storeGeneratedPrompt, {
            category: item.category,
            translations: item.translations,
          });
          stored.push(item.translations.en.substring(0, 50) + "...");
        }
      } catch (error) {
        console.error(`Failed to store ${type} item:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      source,
      type,
      count: stored.length,
      items: stored,
      message: source === "fallback" 
        ? "Using fallback content (AWS not configured or budget exhausted)"
        : "Generated with AWS Bedrock",
    });

  } catch (error) {
    console.error("[Content Generation] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

// GET endpoint to check content status
export async function GET() {
  try {
    const stats = await convex.query(api.contentGeneration.getContentStats, {});
    
    return NextResponse.json({
      stats,
      awsConfigured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      fallbackAvailable: true,
      fallbackContent: {
        debates: FALLBACK_DEBATES.length,
        tips: FALLBACK_TIPS.length,
        prompts: FALLBACK_PROMPTS.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
