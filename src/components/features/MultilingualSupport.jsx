import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// 1. Language Data Grid Config
export const SUPPORTED_LANGUAGES = [
  { id: 'English', name: 'English', flag: '🇬🇧', label: 'Most Common' },
  { id: 'Hindi', name: 'Hindi', flag: '🇮🇳', label: null },
  { id: 'Telugu', name: 'Telugu', flag: '🇮🇳', label: null },
  { id: 'Tamil', name: 'Tamil', flag: '🇮🇳', label: null },
  { id: 'Kannada', name: 'Kannada', flag: '🇮🇳', label: null },
  { id: 'Malayalam', name: 'Malayalam', flag: '🇮🇳', label: null },
  { id: 'Bengali', name: 'Bengali', flag: '🇮🇳', label: null },
  { id: 'Marathi', name: 'Marathi', flag: '🇮🇳', label: null }
];

// 2. High-Quality Pre-written Professional Teleprompter Scripts
export const TELEPROMPTER_SCRIPTS = {
  English: `Hi everyone, I'm Emily Chen. I'm a passionate Mobile Developer specializing in building native iOS and Android applications. Over the past four years, I've focused extensively on Swift, Kotlin, and hybrid systems like React Native. I love creating highly interactive interfaces with responsive gestures and fluid layouts. One of my proudest achievements was optimizing a high-traffic mobile commerce app, reducing load times by 40% and implementing a custom offline synchronization engine using Firebase and SQLite. I really value clean architecture, test-driven development in mobile environments, and close collaboration with design teams to deliver polished, pixel-perfect user experiences. Thank you for listening!`,
  
  Hindi: `नमस्ते, मेरा नाम एमिली चेन है। मैं एक समर्पित मोबाइल डेवलपर हूँ जो नेटिव iOS और एंड्रॉइड ऐप्स बनाने में माहिर हूँ। पिछले चार वर्षों में, मैंने स्विफ्ट, कोटलिन और रिएक्ट नेटिव जैसी हाइब्रिड प्रणालियों पर ध्यान केंद्रित किया है। मुझे प्रतिक्रियाशील इशारों और तरल लेआउट के साथ अत्यधिक इंटरैक्टिव इंटरफेस बनाना पसंद है। मेरी सबसे बड़ी उपलब्धियों में से एक एक हाई-ट्रैफ़िक मोबाइल कॉमर्स ऐप को ऑप्टिमाइज़ करना था, जिससे लोड समय में 40% की कमी आई और फ़ायरबेस और SQLite का उपयोग करके एक कस्टम ऑफ़लाइन सिंक्रनाइज़ेशन इंजन लागू किया गया। मैं मोबाइल वातावरण में स्वच्छ वास्तुकला, परीक्षण-संचालित विकास और पॉलिश, पिक्सेल-परफेक्ट उपयोगकर्ता अनुभव प्रदान करने के लिए डिज़ाइन टीमों के साथ घनिष्ठ सहयोग को महत्व देती हूँ। सुनने के लिए धन्यवाद!`,
  
  Telugu: `నమస్తే, నా పేరు ఎమిలీ చెన్. నేను నెటివ్ iOS మరియు ఆండ్రాయిడ్ అప్లికేషన్లను నిర్మించడంలో నిపుణురాలైన మొబైల్ డెవలపర్ను. గత నాలుగు సంవత్సరాలుగా, నేను స్విఫ్ట్, కోట్లిన్ మరియు రియాక్ట్ నెటివ్ వంటి హైబ్రిడ్ సిస్టమ్స్ పై విస్తృతంగా దృష్టి సారించాను. రెస్పాన్సివ్ గెస్చర్స్ మరియు ఫ్లూయిడ్ లేఅవుట్లతో కూడిన ఇంటరాక్టివ్ ఇంటర్ఫేస్లను సృష్టించడం నాకు చాలా ఇష్టం. నా విజయాలలో ఒకటి, ఒక హై-ట్రాఫిక్ మొబైల్ కామర్స్ యాప్ను ఆప్టిమైజ్ చేయడం, దీని ద్వారా లోడింగ్ సమయాన్ని 40% తగ్గించగలిగాను మరియు ఫైర్బేస్ & SQLite ఉపయోగించి కస్టమ్ ఆఫ్లైన్ సింక్రొనైజేషన్ ఇంజిన్ ను విజయవంతంగా అమలు చేసాను. క్లీన్ ఆర్కిటెక్చర్, టెస్ట్-డ్రైవెన్ డెవలప్మెంట్ మరియు డిజైన్ టీమ్ లతో కలిసి పని చేయడం నా ముఖ్య విలువలు. ధన్యవాదాలు!`,
  
  Tamil: `வணக்கம், என் பெயர் எமிலி சென். நான் நேட்டிவ் iOS மற்றும் ஆண்ட்ராய்டு செயலிகளை உருவாக்குவதில் நிபுணத்துவம் பெற்ற ஒரு மொபைல் டெவலப்பர். கடந்த நான்கு ஆண்டுகளில், நான் ஸ்விஃப்ட், கோட்லின் மற்றும் ரியாக்ட் நேட்டிவ் போன்ற ஹைப்ரிட் அமைப்புகளில் கவனம் செலுத்தியுள்ளேன். ஈர்க்கக்கூடிய பயனர் இடைமுகங்கள் மற்றும் மென்மையான அனிமேஷன்களை உருவாக்குவது எனக்கு மிகவும் பிடிக்கும். எனது மிகப்பெரிய சாதனைகளில் ஒன்று, ஒரு மொபைல் காமர்ஸ் செயலியின் வேகத்தை 40% அதிகரித்தது மற்றும் ஃபயர்பேஸ் & SQLite ஐப் பயன்படுத்தி ஆஃப்லைன் ஒத்திசைவு தொழில்நுட்பத்தை உருவாக்கியது ஆகும். சுத்தமான குறியீடு கட்டமைப்பு, மொபைல் சோதனை உத்திகள் மற்றும் வடிவமைப்பு குழுக்களுடன் நெருக்கமான ஒத்துழைப்பு ஆகியவற்றை நான் மிகவும் மதிக்கிறேன். நன்றி!`,
  
  Kannada: `ನಮಸ್ತೆ, ನನ್ನ ಹೆಸರು ಎಮಿಲಿ ಚೆನ್. ನಾನು ನೆಟಿವ್ iOS ಮತ್ತು ಆಂಡ್ರಾಯ್ಡ್ ಅಪ್ಲಿಕೇಶನ್ಗಳನ್ನು ನಿರ್ಮಿಸುವ ಮೊಬೈಲ್ ಡೆವಲಪರ್. ಕಳೆದ ನಾಲ್ಕು ವರ್ಷಗಳಲ್ಲಿ, ನಾನು ಸ್ವಿಫ್ಟ್, ಕೋಟ್ಲಿನ್ ಮತ್ತು ರಿಯಾಕ್ಟ್ ನೆಟಿವ್ ತಂತ್ರಜ್ಞಾನಗಳಲ್ಲಿ ಕೆಲಸ ಮಾಡಿದ್ದೇನೆ. ಬಳಕೆದಾರ ಸ್ನೇಹಿ ಇಂಟರ್ಫೇಸ್ಗಳನ್ನು ವಿನ್ಯಾಸಗೊಳಿಸುವುದು ನನಗೆ ತುಂಬಾ ಆಸಕ್ತಿದಾಯಕವಾಗಿದೆ. ಹೈ-ಟ್ರಾಫಿಕ್ ಮೊಬೈಲ್ ವಾಣಿಜ್ಯ ಅಪ್ಲಿಕೇಶನ್ ಅನ್ನು ಆಪ್ಟಿಮೈಜ್ ಮಾಡಿ, ಲೋಡ್ ಸಮಯವನ್ನು 40% ಕಡಿಮೆಗೊಳಿಸಿದ್ದು ಮತ್ತು ಫೈರ್ಬೇಸ್ ಬಳಸಿಕೊಂಡು ಆಫ್ಲೈನ್ ಸಿಂಕ್ ಇಂಜಿನ್ ಜಾರಿಗೊಳಿಸಿದ್ದು ನನ್ನ ಹೆಮ್ಮೆಯ ಸಾಧನೆ. ಕ್ಲೀನ್ ಆರ್ಕಿಟೆಕ್ಚರ್ ಮತ್ತು ಟೆಸ್ಟ್-ಡ್ರೈವನ್ ಡೆವಲಪ್ಮೆಂಟ್ ಪ್ರಕ್ರಿಯೆಯನ್ನು ನಾನು ಸದಾ ಪಾಲಿಸುತ್ತೇನೆ. ಧನ್ಯವಾದಗಳು!`,
  
  Malayalam: `നമസ്കാരം, എന്റെ പേര് എമിലി ചെൻ. ഞാൻ നെറ്റീവ് iOS, ആൻഡ്രോയിഡ് ആപ്ലിക്കേഷനുകൾ നിർമ്മിക്കുന്നതിൽ വിദഗ്ദ്ധയായ ഒരു മൊബൈൽ ഡെവലപ്പറാണ്. കഴിഞ്ഞ നാല് വർഷമായി ഞാൻ സ്വിഫ്റ്റ്, കോട്ലിൻ, റിയാക്ട് നെറ്റീവ് എന്നീ സാങ്കേതികവിദ്യകളിലാണ് പ്രവർത്തിക്കുന്നത്. ആകർഷകമായ യൂസർ ഇന്റർഫേസുകൾ നിർമ്മിക്കാൻ ഞാൻ താല്പര്യപ്പെടുന്നു. ഒരു പ്രമുഖ മൊബൈൽ കൊമേഴ്സ് ആപ്പിന്റെ വേഗത 40% വർദ്ധിപ്പിച്ചതും, ഫയർബേസ് ഉപയോഗിച്ച് ഓഫ്‌ലൈൻ സിൻക്രണൈസേഷൻ സിസ്റ്റം തയ്യാറാക്കിയതുമാണ് എന്റെ പ്രധാന വിജയങ്ങൾ. ക്ലീൻ കോഡ് ഘടനയിലും മികച്ച ഗുണനിലവാരത്തിലും ഞാൻ വിശ്വസിക്കുന്നു. നന്ദി!`,
  
  Bengali: `নমস্কার, আমার নাম এমিলি চেন। আমি একজন মোবাইল ডেভেলপার, নেটভ iOS এবং অ্যান্ড্রয়েড অ্যাপ্লিকেশন তৈরিতে পারদর্শী। গত চার বছর ধরে আমি সুইফট, কোটলিন এবং রিঅ্যাক্ট নেটিভ এর মতো হাইব্রিড ফ্রেমওয়ার্কে কাজ করছি। রেসপন্সিভ জেসচার এবং ফ্লুইড লেআউট সহ ইন্টারঅ্যাক্টিভ ইন্টারফেস ডিজাইন করতে আমি ভালোবাসি। আমার অন্যতম বড় অর্জন ছিল একটি হাই-ট্রাফিক কমার্স অ্যাপের লোড টাইম ৪০% হ্রাস করা এবং ফায়ারবেস ও SQLite এর মাধ্যমে অফলাইন ডেটা সিঙ্ক ইঞ্জিন তৈরি করা। আমি সর্বদা ক্লিন কোড আর্কিটেকচার এবং টেস্ট-ড্রিভেন ডেভেলপমেন্টের নীতি মেনে কাজ করতে পছন্দ করি। ধন্যবাদ!`,
  
  Marathi: `नमस्कार, माझे नाव एमिली चेन आहे. मी नेटिव्ह iOS आणि अँड्रॉइड ॲप्लिकेशन्स तयार करण्यात तज्ञ असणारी मोबाईल डेव्हलपर आहे. गेल्या चार वर्षात मी स्विफ्ट, कोटलिन आणि रिएक्ट नेटिव्ह या तंत्रज्ञानावर प्रामुख्याने काम केले आहे. युझर इंटरफेस अधिक आकर्षक आणि गतिमान बनवण्यात मला विशेष रस आहे. माझ्या प्रमुख कामांमध्ये एका मोठ्या ई-कॉमर्स ॲपचा लोड वेळ ४०% ने कमी करणे आणि फायरबेस आणि SQLite चा वापर करून ऑफलाईन सिंक इंजिन तयार करणे यांचा समावेश आहे. स्वच्छ आर्किटेक्चर आणि गुणवत्तापूर्ण कोडिंग नियमांवर माझा भर असतो. धन्यवाद!`
};

// 3. Dynamic Database Sync Failsafe Query
export const saveVideoLanguageToDb = async (candidateId, language) => {
  if (!supabase || !candidateId) return false;
  try {
    const { error } = await supabase
      .from('candidate_profiles')
      .update({ video_language: language })
      .eq('user_id', candidateId);
      
    if (error) {
      console.warn("Could not save video_language column in DB (column might not exist):", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("DB saveVideoLanguage transaction error:", err);
    return false;
  }
};

// 4. Main Component: Selector before Candidate Recording starts
export default function MultilingualSupport({ selectedLang, setSelectedLang, onLanguageChange }) {
  
  const handleSelectLanguage = (langId) => {
    setSelectedLang(langId);
    if (onLanguageChange) {
      onLanguageChange(langId);
    }
  };

  return (
    <div className="bg-[#0B1020]/60 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
      
      {/* Title Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
        <span className="text-xl bg-purple-600/10 p-2 rounded-xl border border-purple-500/20 select-none shrink-0">
          🌐
        </span>
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-slate-200">Select your video language</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Choose your presentation language. The teleprompter will load standard scripts instantly.</p>
        </div>
      </div>

      {/* 4x2 Grid language cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-2 select-none">
        {SUPPORTED_LANGUAGES.map(lang => {
          const isSelected = selectedLang === lang.id;
          return (
            <div
              key={lang.id}
              onClick={() => handleSelectLanguage(lang.id)}
              className={`p-4 rounded-xl border flex flex-col justify-between items-center text-center cursor-pointer transition-all hover:-translate-y-0.5 relative overflow-hidden ${
                isSelected
                  ? 'border-purple-500 bg-purple-600/10 shadow-lg shadow-purple-500/5 ring-1 ring-purple-500/25'
                  : 'border-white/5 bg-slate-950/40 hover:border-white/10 hover:bg-slate-900/60'
              }`}
            >
              {/* Flag Emoji */}
              <span className="text-3xl filter drop-shadow-md select-none">{lang.flag}</span>
              
              {/* Language Name */}
              <span className={`text-[11px] font-extrabold tracking-tight mt-2.5 ${
                isSelected ? 'text-purple-300' : 'text-slate-300'
              }`}>
                {lang.name}
              </span>

              {/* Optional Common Badge */}
              {lang.label && (
                <span className="absolute top-1 right-1 text-[7px] font-black uppercase px-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/20 tracking-wider scale-90 origin-top-right select-none">
                  {lang.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
    </div>
  );
}

// 5. Auxiliary Sub-component: Recruiter Translation Summary panel below video player
export function RecruiterTranslationSummary({ activeCand }) {
  const [showSummary, setShowSummary] = useState(false);
  
  const language = activeCand?.videoLanguage || 'English';
  const hasTranslation = language !== 'English';

  // Realistic Translated Summaries seeded dynamically
  const getTranslationSummary = (lang) => {
    switch (lang) {
      case 'Hindi':
        return {
          confidence: 90,
          milestones: ["0:05 Introduction in Hindi", "0:23 Native iOS and Android framework projects review", "0:45 Optimizing mobile commerce app loading times by 40%", "1:38 Clean code paradigm, TDD engineering, and conclusion"],
          summary: "Emily introduces herself fluently in Hindi. She details 4 years of native iOS/Android expertise (Swift & Kotlin) alongside hybrid systems (React Native). Highly competent segment explaining a mobile commerce optimization cycle, which cut rendering load latencies by 40% using custom SQLite sync adapters. Articulates TDD and clean architecture requirements clearly."
        };
      case 'Telugu':
        return {
          confidence: 93,
          milestones: ["0:05 Introduction in Telugu", "0:23 Focused expertise on Swift, Kotlin, and React Native layouts", "0:45 Reducing mobile e-commerce load latency by 40%", "1:38 Emphasizing clean structure, TDD, and conclusion"],
          summary: "Emily delivers a highly impressive mobile engineering synopsis in Telugu. She explains Swift/Kotlin view hierarchies, gesture responders, and React Native bindings with solid competency. Specifically addresses implementing offline Firebase syncing to reduce load latencies by 40% in a shopping application. Exceptional articulation of test-driven mobile architecture."
        };
      case 'Tamil':
        return {
          confidence: 89,
          milestones: ["0:05 Mobile Developer intro in Tamil", "0:25 Swift, Kotlin, and hybrid component stack review", "0:48 Custom Firebase offline SQL database synchronization review", "1:42 Pixel-perfect visual designs collaboration and wrap-up"],
          summary: "Emily presents clean modular code guidelines in Tamil. Highlights strong React Native interface animations, gesture events, and native integrations. Details optimizing transaction adapters to slash database lags by 40%. Projects robust organizational communication and architectural capabilities."
        };
      case 'Kannada':
        return {
          confidence: 91,
          milestones: ["0:05 Introduction in Kannada", "0:24 Objective Swift & Kotlin mobile project parameters", "0:44 Implementing custom SQLite offline synchronization engine", "1:32 Delivering pixel-perfect client experiences"],
          summary: "Emily articulately explains mobile development guidelines in Kannada. Discusses structuring native view layouts, managing database locks, and saving offline state changes. She demonstrates highly confident engineering foundations and visual empathy for design requirements."
        };
      case 'Malayalam':
        return {
          confidence: 88,
          milestones: ["0:05 Native software engineer intro in Malayalam", "0:24 Swift & Kotlin framework configurations", "0:44 Offline SQLite syncing and mobile optimizations", "1:32 TDD guidelines and closing"],
          summary: "Emily speaks confidently in Malayalam, explaining native Swift and Kotlin concepts. She details custom SQLite caching routines that achieved a 40% performance gains. She communicates technical guidelines effectively with high articulation."
        };
      case 'Bengali':
        return {
          confidence: 90,
          milestones: ["0:05 Intro in Bengali", "0:24 Highlighting Swift, Kotlin, and React Native mobile frameworks", "0:44 Restructuring local SQLite caching databases", "1:32 Pixel-perfect UI compliance and conclusion"],
          summary: "Emily delivers a fluid mobile development summary in Bengali. Explains rendering view metrics, utilizing SQLite local cache layers, and working inside agile product pipelines. Demonstrates solid software architecture logic and clear delivery pacing."
        };
      case 'Marathi':
        return {
          confidence: 92,
          milestones: ["0:05 Native developer intro in Marathi", "0:24 Swift, Kotlin, and React Native architectures", "0:44 Minimizing rendering load latency by 40%", "1:32 Standard software clean code guidelines"],
          summary: "Emily Chen presents her native iOS and Android developer background in Marathi. Highlights building responsive user interfaces, writing custom SQLite transaction classes, and collaborating with design leads. Projects high analytical clarity and team commitment."
        };
      default:
        return null;
    }
  };

  const translationData = getTranslationSummary(language);

  if (!hasTranslation || !translationData) {
    return (
      <div className="bg-[#0B1020]/40 border border-white/5 rounded-xl p-4 flex justify-between items-center text-xs text-slate-400 select-none">
        <span>📹 Presentation Language: <span className="text-slate-200 font-bold">English 🇬🇧</span></span>
        <span className="text-[10px] text-slate-500">Standard summary active</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0B1020]/80 border border-purple-500/20 rounded-xl p-5 shadow-lg flex flex-col gap-3 relative overflow-hidden transition-all">
      
      {/* Alert Header bar */}
      <div className="flex justify-between items-center select-none pb-2.5 border-b border-white/5">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
          <span className="text-slate-400 font-semibold">Video in:</span>
          <span className="text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/25">
            {language} 🇮🇳
          </span>
        </div>

        {/* View Translated Summary Toggle */}
        <button
          onClick={() => setShowSummary(prev => !prev)}
          className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/10 flex items-center gap-1 transition-all"
        >
          {showSummary ? "Hide AI Summary" : "View English Summary →"}
        </button>
      </div>

      {/* Expanded Translated Summary Panel */}
      {showSummary && (
        <div className="flex flex-col gap-3.5 mt-2 animate-fade-in select-text border-t border-white/5 pt-3">
          
          {/* Section 1: Paragraph Translation summary */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-purple-400 select-none">AI English Translation Summary</span>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">{translationData.summary}</p>
          </div>

          {/* Section 2: Milestones timeline */}
          <div className="flex flex-col gap-1.5 mt-1 select-none">
            <span className="text-[9px] uppercase font-black tracking-widest text-indigo-400">Speech Milestones</span>
            <div className="flex flex-col gap-1.5">
              {translationData.milestones.map((m, i) => (
                <div key={i} className="flex gap-3.5 items-center text-[10px] text-slate-400 pl-3 border-l border-white/5 hover:border-purple-500/30 transition-colors">
                  <span className="font-mono text-purple-400 bg-purple-500/10 border border-purple-500/15 px-1.5 py-0.5 rounded">
                    {m.split(' ')[0]}
                  </span>
                  <span>{m.split(' ').slice(1).join(' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom badge score row */}
          <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-white/5 mt-2 select-none">
            <span className="text-[9px] text-slate-500 font-bold">Accuracy Index</span>
            <div className="flex items-center gap-1.5 text-[9px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              {translationData.confidence}% Translation Confidence
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
