import { cloneElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getIntlLocale, observeUiLanguage, readPreferredLanguage } from "./localization.js";

const categories = [
  { key: "ALL", label: "सर्व अपडेट्स", icon: "◉", color: "green" },
  { key: "WATER", label: "पाणी", icon: "◒", color: "blue" },
  { key: "ELECTRICITY", label: "वीज", icon: "ϟ", color: "amber" },
  { key: "PROGRAM", label: "कार्यक्रम", icon: "✳", color: "violet" },
  { key: "GOOD_NEWS", label: "चांगली बातमी", icon: "✦", color: "green" },
  { key: "BAD_NEWS", label: "दुःखद वार्ता", icon: "♡", color: "rose" },
  { key: "GENERAL", label: "इतर सूचना", icon: "⌑", color: "slate" },
];

const indianLanguages = [
  ["as", "অসমীয়া"], ["bn", "বাংলা"], ["brx", "बड़ो"], ["doi", "डोगरी"],
  ["gu", "ગુજરાતી"], ["hi", "हिन्दी"], ["kn", "ಕನ್ನಡ"], ["ks", "کٲشُر"],
  ["kok", "कोंकणी"], ["mai", "मैथिली"], ["ml", "മലയാളം"], ["mni", "মৈতৈলোন"],
  ["mr", "मराठी"], ["ne", "नेपाली"], ["or", "ଓଡ଼ିଆ"], ["pa", "ਪੰਜਾਬੀ"],
  ["sa", "संस्कृतम्"], ["sat", "ᱥᱟᱱᱛᱟᱲᱤ"], ["sd", "سنڌي"], ["ta", "தமிழ்"],
  ["te", "తెలుగు"], ["ur", "اردو"], ["en", "English"],
];

const complaintTypes = [
  { key: "WATER_SUPPLY", label: "पाणीपुरवठा", icon: "◒", color: "blue" },
  { key: "ELECTRICITY", label: "वीज", icon: "ϟ", color: "amber" },
  { key: "ROAD", label: "रस्ते", icon: "↗", color: "slate" },
  { key: "DRAINAGE", label: "गटार / निचरा", icon: "≈", color: "blue" },
  { key: "CLEANLINESS", label: "स्वच्छता", icon: "✳", color: "green" },
  { key: "STREETLIGHT", label: "पथदिवे", icon: "☼", color: "amber" },
  { key: "OTHER", label: "इतर समस्या", icon: "⌑", color: "violet" },
];

const governmentSchemes = [
  {
    id: "pm-kisan", level: "CENTRAL", category: "शेती", title: "प्रधानमंत्री किसान सन्मान निधी",
    audience: "पात्र जमीनधारक शेतकरी कुटुंबे.",
    summary: "पात्र लाभार्थ्यांना वर्षाला ₹६,००० तीन हप्त्यांत थेट बँक खात्यात. e-KYC आणि लाभाची स्थिती अधिकृत पोर्टलवर तपासा.",
    url: "https://pmkisan.gov.in/",
  },
  {
    id: "pmay-g", level: "CENTRAL", category: "घरकुल", title: "प्रधानमंत्री आवास योजना — ग्रामीण",
    audience: "पात्र ग्रामीण बेघर कुटुंबे किंवा कच्च्या/मोडकळीस आलेल्या घरात राहणारी कुटुंबे.",
    summary: "ग्रामीण भागात पक्के घर बांधण्यासाठी सहाय्य. लाभार्थी निवड, सर्वेक्षण आणि प्रतीक्षा यादीबाबत ग्रामपंचायत किंवा पंचायत समितीकडे चौकशी करा.",
    url: "https://pmayg.dord.gov.in/",
  },
  {
    id: "vb-gram-g", level: "CENTRAL", category: "रोजगार", title: "विकसित भारत ग्रामीण रोजगार हमी (VB–G RAM G)",
    audience: "अकुशल काम करण्यास इच्छुक प्रौढ सदस्य असलेली ग्रामीण कुटुंबे.",
    summary: "पात्र ग्रामीण कुटुंबांना वर्षाकाठी १२५ दिवसांपर्यंत रोजगार हमी आणि गावातील टिकाऊ कामे. जॉब कार्ड, कामाची मागणी आणि चालू नियम ग्रामपंचायत/ग्रामसेवकाकडे तपासा.",
    url: "https://vbgramg.dord.gov.in/vbgramg/home.aspx",
  },
  {
    id: "pmjay", level: "CENTRAL", category: "आरोग्य", title: "आयुष्मान भारत — प्रधानमंत्री जन आरोग्य योजना",
    audience: "सरकारच्या पात्र लाभार्थी यादीतील कुटुंबे.",
    summary: "निवडक रुग्णालयीन उपचारांसाठी कॅशलेस आरोग्य संरक्षण. आपले नाव, पात्रता आणि जवळची रुग्णालये अधिकृत पोर्टलवर तपासा.",
    url: "https://www.myscheme.gov.in/schemes/ab-pmjay",
  },
  {
    id: "pm-ajay-adarsh-gram", level: "CENTRAL", category: "गाव विकास", title: "प्रधानमंत्री अनुसूचित जाती अभ्युदय योजना — आदर्श ग्राम",
    audience: "लोकसंख्येच्या किमान ४०% अनुसूचित जाती आणि किमान ५०० लोकसंख्या असलेली पात्र गावे.",
    summary: "पात्र गावांमध्ये पायाभूत सुविधा आणि सामाजिक विकासासाठी गाव विकास आराखड्याद्वारे मदत. गावाची पात्रता ग्रामपंचायत/अधिकृत पोर्टलवर तपासा.",
    url: "https://pmagy.gov.in/",
  },
  {
    id: "namo-shetkari", level: "STATE", category: "शेती", title: "नमो शेतकरी महासन्मान निधी",
    audience: "PM-KISAN अंतर्गत पात्र आणि राज्याच्या निकषांनुसार निवडलेले शेतकरी.",
    summary: "पात्र PM-KISAN शेतकरी कुटुंबांना महाराष्ट्र शासनाकडून वर्षाला अतिरिक्त ₹६,००० मदत. पात्रता, हप्ते आणि लाभाची स्थिती अधिकृत पोर्टलवर तपासा.",
    url: "https://mahadbt.maharashtra.gov.in/home",
    detailUrl: "https://gr.maharashtra.gov.in/Site/Upload/Government%20Resolutions/Marathi/202306151745513101.pdf",
  },
  {
    id: "mahadbt-farmer", level: "STATE", category: "शेती", title: "महाDBT — शेतकरी योजना",
    audience: "महाराष्ट्रातील पात्र शेतकरी.",
    summary: "सूक्ष्म सिंचन, शेती यंत्रसामग्री, फलोत्पादन आणि इतर कृषी घटकांसाठी उपलब्ध योजनांची यादी. प्रत्येक घटकाचे निकष, Farmer ID आणि अर्जाची सद्यस्थिती पोर्टलवर तपासा.",
    url: "https://mahadbt.maharashtra.gov.in/Farmer/",
  },
  {
    id: "ladki-bahin", level: "STATE", category: "महिला", title: "मुख्यमंत्री माझी लाडकी बहीण योजना",
    audience: "महाराष्ट्र शासनाच्या चालू पात्रता निकषांमध्ये बसणाऱ्या महिला.",
    summary: "महिलांच्या आर्थिक सहाय्यासाठीची योजना. वय, उत्पन्न, आवश्यक कागदपत्रे आणि e-KYC ची सद्यस्थिती अधिकृत पोर्टलवर तपासा.",
    url: "https://ladakibahin.maharashtra.gov.in/",
  },
  {
    id: "lek-ladki", level: "STATE", category: "मुली व शिक्षण", title: "लेक लाडकी योजना",
    audience: "१ एप्रिल २०२३ रोजी किंवा त्यानंतर जन्मलेल्या मुली असलेली पात्र पिवळ्या/केशरी शिधापत्रिकाधारक कुटुंबे.",
    summary: "मुलींच्या जन्मानंतर आणि शिक्षणाच्या टप्प्यांवर आर्थिक मदत. आवश्यक कागदपत्रे आणि अर्ज प्रक्रिया अधिकृत शासन निर्णयात तपासा.",
    url: "https://gr.maharashtra.gov.in/Site/Upload/Government%20Resolutions/Marathi/202310301153280030.pdf",
  },
  {
    id: "maharashtra-gharkul", level: "STATE", category: "घरकुल", title: "महाराष्ट्र ग्रामीण घरकुल योजना",
    audience: "योजनेच्या प्रवर्ग व निकषांनुसार घरकुलासाठी पात्र ग्रामीण कुटुंबे.",
    summary: "रमाई, शबरी, मोदी आवास आणि इतर ग्रामीण घरकुल योजनांची माहिती. प्रवर्ग, ग्रामसभा मंजुरी आणि अर्जासाठी स्थानिक ग्रामपंचायत/पंचायत समितीकडे चौकशी करा.",
    url: "https://rdd.maharashtra.gov.in/ग्रामीण-गृहनिर्माण/",
  },
];

const waterPeriods = ["सकाळी", "दुपारी", "संध्याकाळी"];
const announcementCacheKey = "gram-sandesh-announcements-v1";
const governmentSchemesPublishedAt = "2026-10-29";

function readAnnouncementCache() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(announcementCacheKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function cacheAnnouncements(items) {
  try {
    const latest = [...items]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 100)
      .map((item) => {
        const cachedItem = { ...item };
        delete cachedItem.photoUrl;
        return cachedItem;
      });
    window.localStorage.setItem(announcementCacheKey, JSON.stringify(latest));
  } catch {
    // Local storage can be disabled or full; online updates should still work.
  }
}

function normalizeWard(value) {
  const marathiDigits = "०१२३४५६७८९";
  return String(value || "")
    .toLocaleLowerCase(getIntlLocale())
    .replace(/[०-९]/g, (digit) => String(marathiDigits.indexOf(digit)))
    .replace(/वॉर्ड|वार्ड|ward|क्रमांक|नंबर|no\.?/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function parseWaterTimings(value) {
  const text = String(value || "").trim();
  if (!text) return waterPeriods.map((period) => ({ period, timing: "" }));
  const entries = text.split(/\s*;\s*/).map((entry) => {
    const match = entry.match(/^(सकाळी|दुपारी|संध्याकाळी)\s*[—–-]\s*(.+)$/);
    return match ? { period: match[1], timing: match[2].trim() } : null;
  }).filter(Boolean);
  return entries.length ? entries : [{ period: "सकाळी", timing: text }];
}

function spokenWaterTimings(value) {
  return parseWaterTimings(value).filter((entry) => entry.timing.trim()).map((entry) => `${entry.period} ${entry.timing}`).join(", ");
}

let csrfTokenValue = null;

async function getCsrfToken() {
  if (csrfTokenValue) return csrfTokenValue;
  const response = await fetch("/api/auth/csrf", { credentials: "same-origin" });
  if (!response.ok) throw new Error("सुरक्षित सत्र सुरू करता आले नाही.");
  const data = await response.json();
  csrfTokenValue = data.token;
  return csrfTokenValue;
}

async function apiFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    headers.set("X-XSRF-TOKEN", await getCsrfToken());
  }
  return fetch(url, { ...options, method, headers, credentials: "same-origin" });
}

async function responseMessage(response, fallback) {
  const body = await response.json().catch(() => ({}));
  return body.message || body.detail || fallback;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(getIntlLocale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function formatSchemePublishedDate(value) {
  const date = new Date(`${value}T12:00:00+05:30`);
  return new Intl.DateTimeFormat(getIntlLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatPostedAt(value) {
  if (!value) return "आत्ताच";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "नुकतेच";
  return new Intl.DateTimeFormat(getIntlLocale(), {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatEventTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(getIntlLocale(), {
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function getCategory(key) {
  return categories.find((category) => category.key === key) ?? categories.at(-1);
}

function getComplaintType(key) {
  return complaintTypes.find((type) => type.key === key) ?? complaintTypes.at(-1);
}

async function resizePhotoToJpeg(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("हे छायाचित्र उघडता आलं नाही."));
    });
    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) throw new Error("छायाचित्र तयार करता आलं नाही.");
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("छायाचित्र वाचता आलं नाही."));
      reader.readAsDataURL(blob);
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [language, setLanguage] = useState(readPreferredLanguage);

  useEffect(() => {
    try { window.localStorage.setItem("gram-sandesh-language", language); } catch { /* Browser storage may be unavailable. */ }
    return observeUiLanguage(language);
  }, [language]);

  useEffect(() => {
    async function restoreSession() {
      try {
        const csrfResponse = await fetch("/api/auth/csrf", { credentials: "same-origin" });
        if (!csrfResponse.ok) throw new Error("सर्व्हरशी संपर्क होत नाही.");
        csrfTokenValue = (await csrfResponse.json()).token;
        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (response.status === 204) {
          setAuthUser(null);
        } else if (!response.ok) {
          throw new Error("खाते तपासता आले नाही.");
        } else {
          setAuthUser(await response.json());
        }
      } catch (error) {
        setAuthError(error.message || "सर्व्हरशी संपर्क होत नाही.");
      } finally {
        setAuthLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function logout() {
    try {
      const response = await apiFetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("बाहेर पडता आले नाही. पुन्हा प्रयत्न करा.");
      csrfTokenValue = null;
      setAuthUser(null);
      setAuthError("");
    } catch (error) {
      setAuthError(error.message || "बाहेर पडता आले नाही.");
    }
  }

  if (authLoading) return <div className="auth-loading"><span className="spinner" /> ग्रामसंदेश उघडत आहे...</div>;
  if (!authUser) return <AuthPage onAuthenticated={setAuthUser} initialError={authError} language={language} onLanguageChange={setLanguage} />;
  return <VillageApp authUser={authUser} onLogout={logout} onProfileUpdated={setAuthUser} language={language} />;
}

function AuthPage({ onAuthenticated, initialError, language, onLanguageChange }) {
  const [mode, setMode] = useState("login");
  const [selectedRole, setSelectedRole] = useState("VILLAGER");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(initialError);
  useEffect(() => setMessage(initialError), [initialError]);

  async function submit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const role = String(formData.get("role"));
    const username = String(formData.get("username")).trim();
    const password = String(formData.get("password"));
    if (mode === "register" && role === "ADMIN") {
      setMessage("प्रशासक खातं निश्चित आहे. नोंदणीऐवजी प्रवेश निवडा.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (mode === "register") {
        const registerResponse = await apiFetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: String(formData.get("fullName")).trim(),
            username,
            mobileNumber: String(formData.get("mobileNumber")).trim(),
            wardNo: String(formData.get("wardNo")).trim(),
            villageName: String(formData.get("villageName")).trim(),
            password,
          }),
        });
        if (!registerResponse.ok) throw new Error(await responseMessage(registerResponse, "नोंदणी करता आली नाही."));
      }

      const loginResponse = await apiFetch("/api/auth/login", {
        method: "POST",
        body: new URLSearchParams({ username, password }),
      });
      if (!loginResponse.ok) throw new Error(await responseMessage(loginResponse, "प्रवेश करता आला नाही."));
      const user = await loginResponse.json();
      csrfTokenValue = null;
      if (user.role !== role) {
        await apiFetch("/api/auth/logout", { method: "POST" });
        csrfTokenValue = null;
        throw new Error("निवडलेला खाते प्रकार आणि वापरकर्तानाव जुळत नाही.");
      }
      onAuthenticated(user);
    } catch (error) {
      setMessage(error.message || "प्रवेश करता आला नाही. पुन्हा प्रयत्न करा.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-art" aria-hidden="true"><span className="auth-sun">☼</span><span className="auth-hill auth-hill-one" /><span className="auth-hill auth-hill-two" /><span className="auth-home">⌂</span><span className="auth-art-label">आपलं गाव · आपली माहिती</span></div>
      <section className="auth-card">
        <a className="brand auth-brand" href="#top">
          <span className="brand-mark"><svg viewBox="0 0 44 44" fill="none"><path d="M5 21.2 22 7l17 14.2v16H5v-16Z" fill="currentColor" opacity=".16" /><path d="M6 21.5 22 8l16 13.5M10 20v15h24V20M18 35V24h8v11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span className="brand-copy"><strong data-no-translate>ग्रामसंदेश</strong><small>गावाचा माहिती फलक</small></span>
        </a>
        <label className="auth-language-picker">
          <span><span aria-hidden="true">文</span> भाषा निवडा / Choose language</span>
          <select data-no-translate value={language} onChange={(event) => onLanguageChange(event.target.value)}>
            {indianLanguages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
        <div className="auth-heading"><span className="auth-eyebrow">गावाशी जोडलेले रहा</span><h1>{mode === "login" ? "पुन्हा स्वागत आहे!" : "ग्रामसंदेशमध्ये सामील व्हा"}</h1><p>{mode === "login" ? "बातम्या वाचण्यासाठी आणि तक्रारी पाहण्यासाठी प्रवेश करा." : "गावकरी खातं तयार करा आणि ग्रामपंचायतीपर्यंत समस्या पोहोचवा."}</p></div>
        <div className="auth-mode-tabs" role="tablist" aria-label="प्रवेश किंवा नोंदणी">
          <button className={mode === "login" ? "selected" : ""} onClick={() => { setMode("login"); setMessage(""); }} role="tab" aria-selected={mode === "login"}>प्रवेश</button>
          <button className={mode === "register" ? "selected" : ""} onClick={() => { setMode("register"); setMessage(""); }} role="tab" aria-selected={mode === "register"}>नवीन नोंदणी</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label className="field-label">खाते प्रकार <span>*</span>
            <select name="role" value={selectedRole} onChange={(event) => { setSelectedRole(event.target.value); setMessage(""); }}>
              <option value="VILLAGER">गावकरी सदस्य</option>
              <option value="ADMIN">ग्रामपंचायत प्रशासक</option>
            </select>
          </label>
          {mode === "register" && selectedRole === "ADMIN" ? (
            <div className="admin-fixed-note"><strong>प्रशासक खातं निश्चित आहे.</strong><span>ग्रामपंचायत प्रशासकासाठी नवीन नोंदणी बंद आहे. प्रवेश टॅब निवडून निश्चित वापरकर्तानाव आणि पासवर्ड वापरा.</span><button type="button" onClick={() => { setMode("login"); setMessage(""); }}>प्रशासक प्रवेशाकडे जा</button></div>
          ) : (
            <>
              {mode === "register" && <>
                <label className="field-label">पूर्ण नाव <span>*</span><VoiceInput language={language}><input name="fullName" required maxLength="70" autoComplete="name" placeholder="तुमचं नाव" /></VoiceInput></label>
                <label className="field-label">गावाचे नाव <span>*</span><VoiceInput language={language}><input name="villageName" required maxLength="80" defaultValue="मसुचीवाडी" placeholder="उदा. मसुचीवाडी" autoComplete="address-level2" /></VoiceInput></label>
                <label className="field-label">मोबाइल नंबर <span>*</span><VoiceInput language={language}><input name="mobileNumber" required type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" minLength="10" maxLength="10" autoComplete="tel-national" placeholder="१० अंकी मोबाइल नंबर" /></VoiceInput></label>
                <label className="field-label">वॉर्ड नंबर <span>*</span><VoiceInput language={language}><input name="wardNo" required maxLength="32" placeholder="उदा. वॉर्ड २" /></VoiceInput></label>
              </>}
              <label className="field-label">वापरकर्तानाव <span>*</span><VoiceInput language={language}><input name="username" required minLength="3" maxLength="32" autoComplete="username" placeholder="उदा. rahul_patil" /></VoiceInput></label>
              <label className="field-label">पासवर्ड <span>*</span><input name="password" required minLength="8" maxLength="72" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "register" ? "किमान ८ अक्षरे" : "तुमचा पासवर्ड"} /></label>
              {message && <div className="auth-message" role="alert">{message}</div>}
              <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? "थांबा..." : mode === "login" ? "प्रवेश करा" : "खातं तयार करा"}<span aria-hidden="true">↗</span></button>
            </>
          )}
        </form>
        <div className="auth-footnote"><span>⌑</span> {mode === "login" ? "भूमिका निवडा; प्रशासकासाठी निश्चित खाते वापरा." : "मोबाइल नंबर आणि वॉर्ड नंबर तक्रारींच्या पाठपुराव्यासाठी वापरले जातील."}</div>
      </section>
      <footer className="auth-footer">आपल्या गावासाठी, आपल्याच माणसांकडून <span>♥</span></footer>
    </main>
  );
}

function VoiceAssistant({ language, targetRef }) {
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function insertTranscript(field, transcript) {
    if (!field?.isConnected || field.disabled || field.readOnly) return false;
    const value = field.value || "";
    const start = field.selectionStart ?? value.length;
    const end = field.selectionEnd ?? start;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const spoken = transcript.trim();
    if (!spoken) return false;
    const prefixSpace = before && !/\s$/u.test(before) ? " " : "";
    const suffixSpace = after && !/^\s/u.test(after) ? " " : "";
    const inserted = `${prefixSpace}${spoken}${suffixSpace}`;
    const nextValue = `${before}${inserted}${after}`;
    const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(field, nextValue);
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.focus();
    const cursor = before.length + inserted.length;
    try { field.setSelectionRange(cursor, cursor); } catch { /* Some mobile keyboards do not expose cursor selection. */ }
    return true;
  }

  function toggleListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
      return;
    }

    const field = targetRef.current;
    if (!field?.isConnected) {
      setStatus("आधी मजकूर लिहिण्याची जागा निवडा.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("या ब्राउझरमध्ये आवाजाने लिहिण्याची सुविधा उपलब्ध नाही.");
      return;
    }

    const speechLocales = {
      as: "as-IN", bn: "bn-IN", brx: "as-IN", doi: "doi-IN", gu: "gu-IN", hi: "hi-IN",
      kn: "kn-IN", ks: "ur-IN", kok: "kok-IN", mai: "mai-IN", ml: "ml-IN", mni: "mni-IN",
      mr: "mr-IN", ne: "ne-IN", or: "or-IN", pa: "pa-IN", sa: "sa-IN", sat: "sat-IN",
      sd: "sd-IN", ta: "ta-IN", te: "te-IN", ur: "ur-IN", en: "en-IN",
    };
    const recognition = new SpeechRecognition();
    recognition.lang = speechLocales[language] || "mr-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => {
      setListening(true);
      setStatus("ऐकत आहे... बोला.");
    };
    recognition.onresult = (event) => {
      const finalText = Array.from(event.results).slice(event.resultIndex).filter((result) => result.isFinal).map((result) => result[0].transcript).join(" ");
      if (finalText && insertTranscript(field, finalText)) setStatus("बोललेले शब्द मजकूरात जोडले.");
    };
    recognition.onerror = (event) => {
      setListening(false);
      setStatus(event.error === "not-allowed" ? "माइकची परवानगी द्या आणि पुन्हा प्रयत्न करा." : event.error === "no-speech" ? "आवाज ऐकू आला नाही. पुन्हा प्रयत्न करा." : "माइक सुरू करता आला नाही.");
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setStatus("माइक सुरू करता आला नाही.");
    }
  }

  return (
    <aside className={`voice-field-assistant ${listening ? "is-listening" : ""}`}>
      {status && <span className="voice-assistant-status" role="status" aria-live="polite">{status}</span>}
      <button type="button" className="voice-field-mic" onMouseDown={(event) => { event.preventDefault(); const field = targetRef.current; if (field && document.activeElement !== field) { field.focus(); const end = field.value.length; try { field.setSelectionRange(end, end); } catch { /* Some inputs do not expose cursor selection. */ } } }} onClick={(event) => { event.stopPropagation(); toggleListening(); }} aria-pressed={listening} aria-label={listening ? "बोलणे थांबवा" : "आवाजाने लिहा"} title={listening ? "बोलणे थांबवा" : "आवाजाने लिहा"}>
        <span aria-hidden="true">{listening ? "■" : "🎙"}</span>
      </button>
    </aside>
  );
}

function VoiceInput({ children, language, multiline = false }) {
  const fieldRef = useRef(null);
  const field = cloneElement(children, { ref: fieldRef });
  return (
    <span className={`voice-input-wrap ${multiline ? "voice-input-multiline" : ""}`}>
      {field}
      <VoiceAssistant language={language} targetRef={fieldRef} />
    </span>
  );
}

function VillageApp({ authUser, onLogout, onProfileUpdated, language }) {
  const [announcements, setAnnouncements] = useState(() => readAnnouncementCache());
  const [complaints, setComplaints] = useState([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [waterTab, setWaterTab] = useState("REGULAR");
  const [boardTab, setBoardTab] = useState("updates");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isWaterForm, setIsWaterForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [newWaterUpdateType, setNewWaterUpdateType] = useState("REGULAR");
  const [newAnnouncementCategory, setNewAnnouncementCategory] = useState("GENERAL");
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState(null);
  const [isComplaintFormOpen, setIsComplaintFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isComplaintSaving, setIsComplaintSaving] = useState(false);
  const [loadState, setLoadState] = useState(() => readAnnouncementCache().length > 0 ? "ready" : "loading");
  const [complaintLoadState, setComplaintLoadState] = useState("loading");
  const [notice, setNotice] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const isAdmin = authUser.role === "ADMIN";

  const loadChatUnreadCount = useCallback(async () => {
    try {
      const response = await apiFetch("/api/village-chat/unread-count");
      if (!response.ok) return;
      const data = await response.json();
      setUnreadChatCount(data.count || 0);
    } catch {
      // Keep the last unread count visible if the connection is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    loadChatUnreadCount();
    const timer = window.setInterval(loadChatUnreadCount, 5000);
    return () => window.clearInterval(timer);
  }, [loadChatUnreadCount]);

  const loadAnnouncements = useCallback(async () => {
    setLoadState((current) => current === "ready" ? current : "loading");
    try {
      const response = await apiFetch("/api/announcements");
      if (!response.ok) throw new Error("सूचना मिळवता आली नाही.");
      const items = await response.json();
      setAnnouncements(items);
      cacheAnnouncements(items);
      setLoadState("ready");
    } catch {
      setLoadState("offline");
    }
  }, []);

  const loadComplaints = useCallback(async () => {
    setComplaintLoadState("loading");
    try {
      const response = await apiFetch("/api/complaints");
      if (!response.ok) throw new Error("तक्रारी मिळवता आल्या नाहीत.");
      setComplaints(await response.json());
      setComplaintLoadState("ready");
    } catch {
      setComplaintLoadState("offline");
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
    loadComplaints();
  }, [loadAnnouncements, loadComplaints]);

  useEffect(() => cacheAnnouncements(announcements), [announcements]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await apiFetch("/api/announcements");
        if (!response.ok) throw new Error("सूचना मिळवता आली नाही.");
        const items = await response.json();
        setAnnouncements(items);
        cacheAnnouncements(items);
        setLoadState("ready");
      } catch {
        setLoadState("offline");
      }
      try {
        const response = await apiFetch("/api/complaints");
        if (!response.ok) throw new Error("तक्रारी मिळवता आल्या नाहीत.");
        setComplaints(await response.json());
        setComplaintLoadState("ready");
      } catch {
        setComplaintLoadState("offline");
      }
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredAnnouncements = useMemo(() => {
    const searchText = search.trim().toLocaleLowerCase(getIntlLocale());
    return announcements.filter((item) => {
      const matchesCategory = activeCategory === "ALL"
        ? item.category !== "WATER" || item.waterUpdateType === "CHANGE"
        : item.category === activeCategory;
      const matchesWaterTab = activeCategory !== "WATER" || (waterTab === "CHANGE"
        ? item.waterUpdateType === "CHANGE"
        : item.waterUpdateType !== "CHANGE");
      const matchesSearch =
        !searchText ||
        [item.title, item.message, item.area, item.author]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase(getIntlLocale()).includes(searchText));
      return matchesCategory && matchesWaterTab && matchesSearch;
    });
  }, [activeCategory, announcements, search, waterTab]);

  const allUpdatesCount = announcements.filter((item) => item.category !== "WATER" || item.waterUpdateType === "CHANGE").length;

  const currentWaterSchedules = useMemo(() => {
    const latestByWard = new Map();
    const searchText = search.trim().toLocaleLowerCase(getIntlLocale());
    [...announcements]
      .filter((item) => item.category === "WATER" && item.waterUpdateType !== "CHANGE" && item.area?.trim())
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .forEach((item) => {
        const key = item.area.trim().toLocaleLowerCase(getIntlLocale());
        if (!latestByWard.has(key)) latestByWard.set(key, item);
      });
    return [...latestByWard.values()]
      .filter((item) => !searchText || [item.area, item.title, item.message].some((value) => value?.toLocaleLowerCase(getIntlLocale()).includes(searchText)))
      .sort((a, b) => a.area.localeCompare(b.area, getIntlLocale(), { numeric: true }));
  }, [announcements, search]);

  const waterChanges = useMemo(() => [...announcements]
    .filter((item) => item.category === "WATER" && item.waterUpdateType === "CHANGE")
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)), [announcements]);

  const wardWaterChanges = useMemo(() => {
    const ward = normalizeWard(authUser.wardNo);
    return ward ? waterChanges.filter((item) => normalizeWard(item.area) === ward) : [];
  }, [authUser.wardNo, waterChanges]);

  useEffect(() => {
    if (isAdmin || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      const enabledKey = `gram-sandesh-water-alerts-enabled:${authUser.username}`;
      if (window.localStorage.getItem(enabledKey) !== "true") return;
      const seenKey = `gram-sandesh-water-alerts-seen:${authUser.username}`;
      let seen = [];
      try { seen = JSON.parse(window.localStorage.getItem(seenKey) || "[]"); } catch { seen = []; }
      const unseen = wardWaterChanges.filter((item) => !seen.includes(String(item.id)));
      if (unseen.length === 0) return;
      const latest = unseen[0];
      window.localStorage.setItem(seenKey, JSON.stringify([...seen, ...unseen.map((item) => String(item.id))].slice(-500)));
      const notification = new Notification("तुमच्या वॉर्डच्या पाणी वेळेत बदल", {
        body: `वॉर्ड ${latest.area}: ${latest.message}`,
        tag: `gram-sandesh-water-${latest.id}`,
      });
      notification.onclick = () => { window.focus(); notification.close(); };
    } catch {
      // Notifications are optional; keep the schedule usable when browser storage is unavailable.
    }
  }, [authUser.username, isAdmin, wardWaterChanges]);

  const visibleWaterChangeCount = isAdmin ? waterChanges.length : wardWaterChanges.length;

  const filteredComplaints = useMemo(() => {
    const searchText = search.trim().toLocaleLowerCase(getIntlLocale());
    return complaints.filter((item) =>
      !searchText ||
      [item.title, item.details, item.area, item.reporterName]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase(getIntlLocale()).includes(searchText)),
    );
  }, [complaints, search]);

  const urgentCount = announcements.filter((item) => item.priority === "URGENT").length;
  const todayCount = announcements.filter((item) => {
    if (!item.createdAt) return false;
    return new Date(item.createdAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) ===
      new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  }).length;

  function openAnnouncementForm(item = null, waterType = null) {
    const waterForm = item ? item.category === "WATER" : waterType !== null || activeCategory === "WATER";
    setEditingAnnouncement(item);
    setIsWaterForm(waterForm);
    setNewWaterUpdateType(item?.waterUpdateType || waterType || "REGULAR");
    setNewAnnouncementCategory(item?.category || (activeCategory === "ALL" || activeCategory === "WATER" ? "GENERAL" : activeCategory));
    setIsFormOpen(true);
  }

  function closeAnnouncementForm() {
    setIsFormOpen(false);
    setEditingAnnouncement(null);
  }

  async function submitAnnouncement(event, announcementToEdit = null) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const category = formData.get("category");
    const isWaterAnnouncement = category === "WATER";
    const area = String(formData.get("area") || "").trim();
    const startsAtValue = formData.get("startsAt");
    const waterTiming = String(formData.get("waterTiming") || "").trim();
    const waterUpdateType = formData.get("waterUpdateType");
    const payload = {
      title: isWaterAnnouncement
        ? `वॉर्ड ${area} ${waterUpdateType === "CHANGE" ? "पाणीपुरवठ्याची वेळ बदलली" : "पाणीपुरवठ्याचे वेळापत्रक"}`
        : String(formData.get("title") || "").trim(),
      message: isWaterAnnouncement ? waterTiming : String(formData.get("message") || "").trim(),
      category,
      priority: !isWaterAnnouncement && formData.get("priority") ? "URGENT" : "NORMAL",
      area,
      waterUpdateType: isWaterAnnouncement ? waterUpdateType : null,
      author: announcementToEdit?.author || authUser.fullName,
      startsAt: !isWaterAnnouncement && startsAtValue ? `${startsAtValue}:00` : null,
      photoDataUrl: formData.get("photoDataUrl") || null,
    };

    setIsSaving(true);
    setNotice("");
    try {
      const response = await apiFetch(announcementToEdit ? `/api/announcements/${announcementToEdit.id}` : "/api/announcements", {
        method: announcementToEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message ?? "सूचना पाठवता आली नाही. पुन्हा प्रयत्न करा.");
      }
      const saved = await response.json();
      setAnnouncements((items) => announcementToEdit
        ? items.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...items]);
      setActiveCategory(saved.category === "WATER" ? "WATER" : "ALL");
      if (saved.category === "WATER") setWaterTab(saved.waterUpdateType === "CHANGE" ? "CHANGE" : "REGULAR");
      setSearch("");
      closeAnnouncementForm();
      formElement.reset();
      setNotice(announcementToEdit ? "सूचना अद्ययावत केली आहे." : "तुमची सूचना गाव फलकावर जोडली आहे.");
    } catch (error) {
      setNotice(error.message || "सर्व्हरशी संपर्क होत नाही. Java सर्व्हर सुरू आहे का ते तपासा.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteAnnouncement(item) {
    if (!window.confirm(`“${item.title}” ही सूचना कायमची हटवायची आहे का?`)) return;
    setDeletingAnnouncementId(item.id);
    setNotice("");
    try {
      const response = await apiFetch(`/api/announcements/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseMessage(response, "सूचना हटवता आली नाही."));
      setAnnouncements((items) => items.filter((announcement) => announcement.id !== item.id));
      setNotice("सूचना हटवली आहे.");
    } catch (error) {
      setNotice(error.message || "सूचना हटवता आली नाही. पुन्हा प्रयत्न करा.");
    } finally {
      setDeletingAnnouncementId(null);
    }
  }

  async function submitComplaint(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const payload = {
      title: formData.get("title").trim(),
      details: formData.get("details").trim(),
      category: formData.get("category"),
      area: formData.get("area").trim(),
    };

    setIsComplaintSaving(true);
    setNotice("");
    try {
      const response = await apiFetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message ?? "तक्रार नोंदवता आली नाही. पुन्हा प्रयत्न करा.");
      }
      const saved = await response.json();
      setComplaints((items) => [saved, ...items]);
      setSearch("");
      setBoardTab("complaints");
      setIsComplaintFormOpen(false);
      formElement.reset();
      setNotice("तक्रार ग्रामसंदेशमध्ये नोंदवली आहे.");
    } catch (error) {
      setNotice(error.message || "सर्व्हरशी संपर्क होत नाही. पुन्हा प्रयत्न करा.");
    } finally {
      setIsComplaintSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ग्रामसंदेश मुख्यपृष्ठ">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 44 44" fill="none">
              <path d="M5 21.2 22 7l17 14.2v16H5v-16Z" fill="currentColor" opacity=".16" />
              <path d="M6 21.5 22 8l16 13.5M10 20v15h24V20M18 35V24h8v11M13.5 23h1M29.5 23h1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M29 11V7h5v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="brand-copy">
            <strong data-no-translate>ग्रामसंदेश</strong>
            <small>गावाचा माहिती फलक</small>
          </span>
        </a>

        <div className="topbar-right">
          <div className="date-chip">
            <span className="date-dot" />
            <span>{formatDate(new Date())}</span>
          </div>
          <div className="account-pill"><strong>{authUser.fullName}</strong><small>{isAdmin ? "ग्रामपंचायत प्रशासक" : "गावकरी"}</small></div>
          {!isAdmin && <button className={`profile-nav-button ${boardTab === "profile" ? "active" : ""}`} onClick={() => setBoardTab("profile")} aria-label="माझं प्रोफाइल उघडा" aria-pressed={boardTab === "profile"}>
            <span className="profile-nav-avatar">{authUser.fullName?.slice(0, 1) || "ग"}</span><span>माझं प्रोफाइल</span>
          </button>}
          <button className="logout-button" onClick={onLogout}>बाहेर पडा</button>
          {isAdmin && <button className="button button-primary top-post" onClick={() => openAnnouncementForm()}><span aria-hidden="true">＋</span> सूचना द्या</button>}
        </div>
      </header>

      <main id="top" className="page-content">
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="kicker-star">✦</span> आपलं गाव · आपली माहिती</div>
            <h1>गावातलं प्रत्येक अपडेट,<br /><em>आता एका ठिकाणी.</em></h1>
            <p>पाणी आणि वीजेच्या सूचना, गावातील कार्यक्रम, चांगल्या बातम्या आणि महत्त्वाचे संदेश — सगळं आपल्या गावासाठी.</p>
            <div className="hero-actions">
              {isAdmin && <button className="button button-light" onClick={() => openAnnouncementForm()}>सूचना शेअर करा <span aria-hidden="true">↗</span></button>}
              <a className="hero-text-link" href="#village-board">गाव फलक पहा <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="sun-orbit"><span className="sun-core">☼</span></div>
            <div className="hill hill-back" />
            <div className="hill hill-front" />
            <div className="house house-one"><span /></div>
            <div className="house house-two"><span /></div>
            <div className="hero-note"><span className="note-icon">✉</span><span><b>गावकऱ्यांसाठी</b><small>एकत्र, अद्ययावत, सोपं</small></span></div>
            <div className="hero-flower flower-one">✿</div>
            <div className="hero-flower flower-two">✿</div>
          </div>
          <div className="hero-grain" aria-hidden="true" />
        </section>

        <section className="stats-row" aria-label="गाव फलकाची माहिती">
          <div className="stat-card stat-total">
            <span className="stat-icon">▤</span>
            <span className="stat-label">एकूण अपडेट्स</span>
            <strong>{announcements.length.toLocaleString(getIntlLocale())}</strong>
            <small>गाव फलकावर</small>
          </div>
          <div className="stat-card stat-today">
            <span className="stat-icon">◷</span>
            <span className="stat-label">आजच्या सूचना</span>
            <strong>{todayCount.toLocaleString(getIntlLocale())}</strong>
            <small>आज जोडलेल्या</small>
          </div>
          <div className="stat-card stat-urgent">
            <span className="stat-icon">ϟ</span>
            <span className="stat-label">तातडीच्या</span>
            <strong>{urgentCount.toLocaleString(getIntlLocale())}</strong>
            <small>लक्ष देण्यासारख्या</small>
          </div>
          <div className="stat-note">
            <span className="stat-note-icon">◌</span>
            <span><strong>{isAdmin ? "माहिती शेअर करा" : "गावासाठी सूचना"}</strong><small>{isAdmin ? "तुमची एक सूचना सगळ्या गावासाठी उपयोगी ठरू शकते." : "गावातील अपडेट्स आणि सूचना इथे वाचा."}</small></span>
            {isAdmin && <button onClick={() => openAnnouncementForm()} aria-label="नवीन सूचना द्या">↗</button>}
          </div>
        </section>

        {urgentCount > 0 && (
          <section className="urgent-summary" aria-label="तातडीच्या सूचना">
            <span className="urgent-symbol">ϟ</span>
            <div><strong>{urgentCount.toLocaleString(getIntlLocale())} तातडीच्या सूचना</strong><span>गावकऱ्यांसाठी महत्त्वाचे अपडेट्स तपासा.</span></div>
            <button onClick={() => { setBoardTab("updates"); setActiveCategory("ALL"); }}>सर्व पहा <span aria-hidden="true">→</span></button>
          </section>
        )}

        {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="संदेश बंद करा">×</button></div>}

        <section id="village-board" className="board-section">
          <div className="board-heading">
            <div>
              <div className="section-eyebrow"><span /> {boardTab === "schemes" ? "शेतकरी, महिला व गावासाठी" : boardTab === "villagers" ? "प्रशासकासाठी" : boardTab === "password" ? "खाते सुरक्षा" : boardTab === "profile" ? "खाते माहिती" : boardTab === "chat" ? "खाजगी संपर्क" : boardTab === "complaints" ? "ग्रामपंचायतीसाठी" : "गावकऱ्यांचा आवाज"}</div>
              <h2>{boardTab === "schemes" ? "शासकीय योजना" : boardTab === "villagers" ? "नोंदणीकृत गावकरी" : boardTab === "password" ? "प्रशासकाचा पासवर्ड" : boardTab === "profile" ? "माझं प्रोफाइल" : boardTab === "chat" ? (isAdmin ? "गावकऱ्यांशी थेट संवाद" : "प्रशासकाशी थेट चॅट") : boardTab === "complaints" ? "तक्रार नोंदवा" : "गाव फलक"} <span className="heading-spark">✳</span></h2>
              <p>{boardTab === "schemes" ? "केंद्र सरकार आणि महाराष्ट्र शासनाच्या गावकऱ्यांसाठी उपयोगी योजनांची माहिती." : boardTab === "villagers" ? "गावकरी सदस्यांची नोंदणी माहिती पाहा आणि संपर्क साधा." : boardTab === "password" ? "गावकऱ्यांसाठी अॅप सुरू करण्यापूर्वी सुरुवातीचा प्रशासक पासवर्ड बदला." : boardTab === "profile" ? "तुमचं नाव, गाव, मोबाइल नंबर आणि वॉर्डची माहिती अद्ययावत ठेवा." : boardTab === "chat" ? "खाजगी संदेशातून ग्रामपंचायत प्रशासकाशी संपर्क साधा." : boardTab === "complaints" ? "गावातील समस्या ग्रामसंदेशवर नोंदवा." : "आजूबाजूला काय घडतंय, एक नजर टाका."}</p>
            </div>
            {boardTab !== "chat" && boardTab !== "profile" && boardTab !== "villagers" && boardTab !== "password" && <div className="board-tools">
              <label className="search-box">
                <span aria-hidden="true">⌕</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={boardTab === "complaints" ? "तक्रार शोधा..." : boardTab === "schemes" ? "योजना शोधा..." : "सूचना शोधा..."} aria-label={boardTab === "complaints" ? "तक्रार शोधा" : boardTab === "schemes" ? "योजना शोधा" : "सूचना शोधा"} />
                {search && <button onClick={() => setSearch("")} aria-label="शोध पुसून टाका">×</button>}
              </label>
              {boardTab !== "schemes" && <button className="button button-primary board-post" onClick={() => boardTab === "complaints" || !isAdmin ? setIsComplaintFormOpen(true) : openAnnouncementForm(null, activeCategory === "WATER" ? (waterTab === "CHANGE" ? "CHANGE" : "REGULAR") : null)}><span aria-hidden="true">＋</span> {boardTab === "complaints" || !isAdmin ? "तक्रार नोंदवा" : activeCategory === "WATER" ? (waterTab === "CHANGE" ? "बदल नोंदवा" : "वेळ नोंदवा") : "नवीन सूचना"}</button>}
            </div>}
          </div>

          <div className="board-layout">
          <nav className="board-sidebar" aria-label="गाव फलक विभाग">
          <div className="category-row" role="group" aria-label="सूचना प्रकार">
            {categories.map((category) => (
              <div className="category-entry" key={category.key}>
              <button
                className={`category-pill ${boardTab === "updates" && activeCategory === category.key ? "active" : ""}`}
                onClick={() => { setBoardTab("updates"); setActiveCategory(category.key); if (category.key === "WATER") setWaterTab("REGULAR"); }}
                aria-pressed={boardTab === "updates" && activeCategory === category.key}
              >
                <span className={`category-icon tone-${category.color}`} aria-hidden="true">{category.icon}</span>
                {category.label}
                {category.key === "ALL" && <span className="category-count">{allUpdatesCount.toLocaleString(getIntlLocale())}</span>}
                {category.key === "WATER" && visibleWaterChangeCount > 0 && <span className="water-change-notice-count" aria-label={`${visibleWaterChangeCount} पाणी वेळेतील बदल`}>{visibleWaterChangeCount > 99 ? "९९+" : visibleWaterChangeCount.toLocaleString(getIntlLocale())}</span>}
              </button>
              {category.key === "WATER" && boardTab === "updates" && activeCategory === "WATER" && <div className="water-subtabs" role="group" aria-label="पाणी वेळापत्रक प्रकार">
                <button className={waterTab === "REGULAR" ? "active" : ""} type="button" onClick={() => setWaterTab("REGULAR")} aria-pressed={waterTab === "REGULAR"}>
                  ठरलेले वेळापत्रक <span>{currentWaterSchedules.length.toLocaleString(getIntlLocale())}</span>
                </button>
                <button className={`water-changes-tab ${waterTab === "CHANGE" ? "active" : ""} ${visibleWaterChangeCount > 0 ? "has-notice" : ""}`} type="button" onClick={() => setWaterTab("CHANGE")} aria-pressed={waterTab === "CHANGE"}>
                  वेळेत बदल <span>{visibleWaterChangeCount > 99 ? "९९+" : visibleWaterChangeCount.toLocaleString(getIntlLocale())}</span>
                  {visibleWaterChangeCount > 0 && <i aria-label="नवीन बदल सूचना">●</i>}
                </button>
              </div>}
              </div>
            ))}
            <button
              className={`category-pill government-schemes-tab ${boardTab === "schemes" ? "active" : ""}`}
              onClick={() => { setBoardTab("schemes"); setSearch(""); }}
              aria-pressed={boardTab === "schemes"}
            >
              <span className="category-icon tone-amber" aria-hidden="true">▦</span>
              शासकीय योजना
            </button>
            <button
              className={`category-pill complaint-tab ${boardTab === "complaints" ? "active" : ""}`}
              onClick={() => setBoardTab("complaints")}
              aria-pressed={boardTab === "complaints"}
            >
              <span className="category-icon tone-rose" aria-hidden="true">✎</span>
              ग्रामपंचायत तक्रार
              <span className="category-count">{complaints.length.toLocaleString(getIntlLocale())}</span>
            </button>
            <button
              className={`category-pill village-chat-tab ${boardTab === "chat" ? "active" : ""}`}
              onClick={() => setBoardTab("chat")}
              aria-pressed={boardTab === "chat"}
            >
              <span className="category-icon tone-green" aria-hidden="true">✉</span>
              प्रशासकाशी चॅट
              {unreadChatCount > 0 && <span className="unread-chat-count" aria-label={`${unreadChatCount} न वाचलेले संदेश`}>{unreadChatCount > 99 ? "९९+" : unreadChatCount.toLocaleString(getIntlLocale())}</span>}
            </button>
            {isAdmin && <button
              className={`category-pill villager-directory-tab ${boardTab === "villagers" ? "active" : ""}`}
              onClick={() => setBoardTab("villagers")}
              aria-pressed={boardTab === "villagers"}
            >
              <span className="category-icon tone-violet" aria-hidden="true">♙</span>
              गावकरी माहिती
            </button>}
            {isAdmin && <button
              className={`category-pill admin-security-tab ${boardTab === "password" ? "active" : ""}`}
              onClick={() => setBoardTab("password")}
              aria-pressed={boardTab === "password"}
            >
              <span className="category-icon tone-rose" aria-hidden="true">♙</span>
              पासवर्ड बदला
            </button>}
          </div>

          </nav>
          <div className="board-main">

          {boardTab === "complaints" && (
            <div className="complaint-disclosure">
              <span className="disclosure-icon">✎</span>
              <span><strong>{isAdmin ? "गावकऱ्यांच्या तक्रारी." : "तुमच्या तक्रारी."}</strong><small>{isAdmin ? "तक्रारींची स्थिती बदला आणि निवारणाची प्रगती दाखवा." : "तक्रारीच्या निवारणाची सद्यस्थिती आणि प्रगती पाहा."}</small></span>
            </div>
          )}

          {boardTab === "updates" && loadState === "offline" && (
            <div className="connection-banner" role="alert">
              <span>⌁</span>
              <div><strong>सर्व्हरशी संपर्क होत नाही</strong><small>{announcements.length > 0 ? "जतन केलेल्या अलीकडील सूचना आणि वेळापत्रक दाखवत आहोत. नवीन माहिती मिळवण्यासाठी पुन्हा प्रयत्न करा." : "सूचना पाहण्यासाठी Java सर्व्हर सुरू करा. पृष्ठ पुन्हा लोड करून पाहा."}</small></div>
              <button onClick={loadAnnouncements}>पुन्हा प्रयत्न करा</button>
            </div>
          )}

          {boardTab === "updates" && activeCategory === "WATER" && waterTab === "REGULAR" && loadState !== "loading" && (
            <WaterSchedulePanel schedules={currentWaterSchedules} search={search} isAdmin={isAdmin} onAdd={() => openAnnouncementForm(null, "REGULAR")} onEdit={openAnnouncementForm} onDelete={deleteAnnouncement} deletingId={deletingAnnouncementId} />
          )}

          {boardTab === "updates" && activeCategory === "WATER" && waterTab === "CHANGE" && loadState !== "loading" && (
            <>
              <WaterChangeNotice changes={waterChanges.length} wardChanges={wardWaterChanges} username={authUser.username} hasWard={Boolean(normalizeWard(authUser.wardNo))} isAdmin={isAdmin} onAdd={() => openAnnouncementForm(null, "CHANGE")} />
              <WaterChangesTable changes={filteredAnnouncements} isAdmin={isAdmin} onEdit={openAnnouncementForm} onDelete={deleteAnnouncement} deletingId={deletingAnnouncementId} search={search} />
            </>
          )}

          {boardTab === "schemes" ? (
            <GovernmentSchemesPanel search={search} />
          ) : boardTab === "villagers" ? (
            <VillagerDirectoryPanel language={language} />
          ) : boardTab === "profile" ? (
            <ProfilePanel authUser={authUser} onProfileUpdated={onProfileUpdated} onClose={() => setBoardTab("updates")} language={language} />
          ) : boardTab === "chat" ? (
            <VillageChatPanel authUser={authUser} onMessagesRead={loadChatUnreadCount} language={language} />
          ) : boardTab === "password" && isAdmin ? (
            <PasswordPanel />
          ) : boardTab === "complaints" ? (
            complaintLoadState === "loading" ? (
              <div className="loading-state"><span className="spinner" /> तक्रारी लोड होत आहेत...</div>
            ) : complaintLoadState === "offline" && complaints.length === 0 ? (
              <div className="unavailable-state"><span aria-hidden="true">⌁</span><strong>तक्रारी सध्या मिळत नाहीत.</strong><p>Java सर्व्हर सुरू करून पुन्हा प्रयत्न करा.</p><button onClick={loadComplaints}>पुन्हा प्रयत्न करा</button></div>
            ) : filteredComplaints.length > 0 ? (
              <div className="complaint-grid">
                {filteredComplaints.map((item) => <ComplaintCard key={item.id} item={item} isAdmin={isAdmin} onUpdated={(updated) => setComplaints((items) => items.map((complaint) => complaint.id === updated.id ? updated : complaint))} />)}
              </div>
            ) : (
              <div className="complaint-empty">
                <div className="complaint-empty-icon">✎</div>
                <span>गावासाठी काही सांगायचं आहे?</span>
                <h3>{search ? "या शोधासाठी तक्रार सापडली नाही." : "अजून तक्रार नोंदवलेली नाही."}</h3>
                <p>{search ? "दुसरा शब्द वापरून पाहा." : "पाणी, वीज, रस्ता किंवा स्वच्छतेची समस्या इथे नोंदवा."}</p>
              </div>
            )
          ) : loadState === "loading" ? (
            <div className="loading-state"><span className="spinner" /> सूचना लोड होत आहेत...</div>
          ) : loadState === "offline" && announcements.length === 0 ? (
            <div className="unavailable-state"><span aria-hidden="true">⌁</span><strong>गाव फलक सध्या उघडता येत नाही.</strong><p>Java सर्व्हर सुरू करून पुन्हा प्रयत्न करा.</p><button onClick={loadAnnouncements}>पुन्हा प्रयत्न करा</button></div>
          ) : filteredAnnouncements.length > 0 && activeCategory !== "WATER" ? (
            <div className={`announcement-grid horizontal-updates-list ${activeCategory === "ALL" ? "all-updates-list" : ""}`}>
              {filteredAnnouncements.map((item) => <AnnouncementCard key={item.id} item={item} isAdmin={isAdmin} onEdit={() => openAnnouncementForm(item)} onDelete={() => deleteAnnouncement(item)} isDeleting={deletingAnnouncementId === item.id} />)}
            </div>
          ) : activeCategory === "WATER" ? null : (
            <div className="empty-state">
              <div className="empty-art" aria-hidden="true"><span className="empty-sun">☼</span><span className="empty-ground" /><span className="empty-sprout">✿</span></div>
              <div className="empty-copy">
                <span className="empty-label">गाव फलक तयार आहे</span>
                <h3>{search ? "या शोधासाठी सूचना सापडली नाही." : activeCategory === "ALL" ? "अजून कोणतीही सूचना नाही." : "या प्रकारची सूचना अजून नाही."}</h3>
                <p>{search ? "दुसरा शब्द वापरून पाहा किंवा शोध पुसून टाका." : isAdmin ? "गावासाठी पहिली बातमी किंवा सूचना शेअर करा." : "नवीन बातम्या ग्रामपंचायत प्रशासक पोस्ट करतात."}</p>
                {isAdmin && <button className="button button-primary" onClick={() => openAnnouncementForm()}><span aria-hidden="true">＋</span> पहिली सूचना द्या</button>}
              </div>
            </div>
          )}

          <div className="board-footer"><span className="footer-leaf">✳</span> {boardTab === "chat" ? "तुमचे संदेश फक्त तुम्हाला आणि ग्रामपंचायत प्रशासकाला दिसतात." : "गावासाठी उपयुक्त माहिती — गावकऱ्यांकडून, गावकऱ्यांसाठी."}</div>
          </div>
          </div>
        </section>

        <section className="how-it-works">
          <div className="how-title"><span>थोडक्यात</span><h2>ग्रामसंदेश कसा वापराल?</h2></div>
          <div className="how-step"><span className="step-number">०१</span><div><strong>माहिती मिळवा</strong><p>पाणी, वीज, बातम्या आणि कार्यक्रम एका फलकावर पहा.</p></div></div>
          <div className="how-step"><span className="step-number">०२</span><div><strong>सूचना शेअर करा</strong><p>गावाला उपयोगी अपडेट सोप्या फॉर्ममधून जोडा.</p></div></div>
          <div className="how-step"><span className="step-number">०३</span><div><strong>गावाशी जोडलेले रहा</strong><p>नवीन माहिती तपासा आणि गावकऱ्यांपर्यंत पोहोचवा.</p></div></div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="footer-brand" href="#top"><span className="footer-mark" data-no-translate>ग्रा</span><b data-no-translate>ग्रामसंदेश</b></a>
        <span>आपल्या गावासाठी, आपल्याच माणसांकडून. <span aria-hidden="true">♥</span></span>
        <a href="#top">वर जा ↑</a>
      </footer>

      {isFormOpen && (isWaterForm ? (
        <WaterScheduleForm key={`water-${editingAnnouncement?.id ?? "new"}`} initialAnnouncement={editingAnnouncement} defaultWaterUpdateType={newWaterUpdateType} onClose={closeAnnouncementForm} onSubmit={(event) => submitAnnouncement(event, editingAnnouncement)} isSaving={isSaving} language={language} />
      ) : (
        <AnnouncementForm key={`announcement-${editingAnnouncement?.id ?? "new"}`} initialAnnouncement={editingAnnouncement} defaultCategory={newAnnouncementCategory} onClose={closeAnnouncementForm} onSubmit={(event) => submitAnnouncement(event, editingAnnouncement)} isSaving={isSaving} language={language} />
      ))}
      {isComplaintFormOpen && <ComplaintForm onClose={() => setIsComplaintFormOpen(false)} onSubmit={submitComplaint} isSaving={isComplaintSaving} language={language} />}
    </div>
  );
}

function AnnouncementCard({ item, isAdmin, onEdit, onDelete, isDeleting }) {
  const category = getCategory(item.category);
  const eventTime = formatEventTime(item.startsAt);
  return (
    <article className={`announcement-card card-${category.color} ${item.photoUrl ? "has-photo" : ""} ${item.priority === "URGENT" ? "card-urgent" : ""} ${item.category === "WATER" && item.waterUpdateType === "CHANGE" ? "water-change-highlight" : ""}`}>
      <div className="card-topline">
        <span className={`card-category tone-${category.color}`}><span aria-hidden="true">{category.icon}</span> {category.label}</span>
        {item.category === "WATER" && <span className={`water-update-badge ${item.waterUpdateType === "CHANGE" ? "changed" : "regular"}`}>{item.waterUpdateType === "CHANGE" ? "वेळेत बदल" : "नियमित वेळापत्रक"}</span>}
        {item.priority === "URGENT" && <span className="urgent-tag"><span /> तातडीचे</span>}
      </div>
      {item.photoUrl && <img className="announcement-photo" src={item.photoUrl} alt={`${item.title} यासाठी छायाचित्र`} loading="lazy" />}
      <h3>{item.title}</h3>
      <p className="card-message">{item.message}</p>
      {eventTime && <div className="event-time"><span aria-hidden="true">◷</span> {eventTime}</div>}
      {item.area && <div className="card-area"><span aria-hidden="true">⌖</span> {item.category === "WATER" ? `वॉर्ड ${item.area}` : item.area}</div>}
      <div className="card-meta"><span className="author-avatar">{(item.author || "ग").slice(0, 1)}</span><span>{item.author || "गावकरी"}</span><i /> <time>{formatPostedAt(item.updatedAt || item.createdAt)}</time><ReadAloudButton text={[category.label, item.title, item.message, item.area && `वॉर्ड ${item.area}`].filter(Boolean).join(". ")} /></div>
      {isAdmin && <div className="announcement-admin-actions"><button type="button" onClick={onEdit}>बदल करा</button><button type="button" className="delete" onClick={onDelete} disabled={isDeleting}>{isDeleting ? "हटवत आहे..." : "हटवा"}</button></div>}
    </article>
  );
}

function ReadAloudButton({ text }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  function toggleSpeech() {
    if (!supported) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getIntlLocale();
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return <button className="read-aloud-button" type="button" onClick={toggleSpeech} disabled={!supported} aria-label={speaking ? "वाचन थांबवा" : "मराठीत वाचा"} title={speaking ? "वाचन थांबवा" : supported ? "मराठीत वाचा" : "या ब्राउझरमध्ये आवाज उपलब्ध नाही"}>{speaking ? "■ थांबवा" : "🔊 ऐका"}</button>;
}

function WaterSchedulePanel({ schedules, search, isAdmin, onAdd, onEdit, onDelete, deletingId }) {
  return (
    <section className="water-schedule-panel" aria-labelledby="water-schedule-title">
      <div className="water-schedule-heading"><span className="water-schedule-icon" aria-hidden="true">◒</span><span><strong id="water-schedule-title">वॉर्डनिहाय ठरलेले पाणी वेळापत्रक</strong><small>{isAdmin ? "प्रत्येक वॉर्डची नियमित वेळ. दुसऱ्या वॉर्डची वेळही इथे जोडता येते." : "प्रत्येक वॉर्डची नियमित पाणीपुरवठ्याची वेळ येथे पाहा."}</small></span>{isAdmin && <button type="button" className="water-schedule-add" onClick={onAdd}>＋ वॉर्डची वेळ जोडा</button>}</div>
      {schedules.length === 0 ? (
        <p className="water-schedule-empty">{search ? "या शोधासाठी वॉर्डचे वेळापत्रक सापडले नाही." : "ग्रामपंचायतीने अजून वॉर्डनिहाय पाणी वेळापत्रक दिलेले नाही."}</p>
      ) : (
        <div className="water-schedule-table-wrap">
          <table className="water-schedule-table">
            <thead><tr><th>वॉर्ड क्रमांक</th><th>सकाळी</th><th>दुपारी</th><th>संध्याकाळी</th><th>अद्ययावत</th><th>ऐका</th>{isAdmin && <th>कृती</th>}</tr></thead>
            <tbody>{schedules.map((item) => {
              const times = parseWaterTimings(item.message);
              const timingFor = (period) => times.filter((entry) => entry.period === period && entry.timing.trim()).map((entry) => entry.timing.trim()).join(" / ") || "—";
              const spokenTimes = times.filter((entry) => entry.timing.trim()).map((entry) => `${entry.period} ${entry.timing}`).join(", ");
              return <tr key={item.id}>
                <th scope="row">{item.area}</th>
                <td>{timingFor("सकाळी")}</td>
                <td>{timingFor("दुपारी")}</td>
                <td>{timingFor("संध्याकाळी")}</td>
                <td className="water-table-updated">{formatPostedAt(item.updatedAt || item.createdAt)}</td>
                <td><ReadAloudButton text={`वॉर्ड ${item.area}. ठरलेले पाणी वेळापत्रक. ${spokenTimes}`} /></td>
                {isAdmin && <td><div className="water-table-actions"><button type="button" onClick={() => onEdit(item)}>बदल करा</button><button type="button" className="delete" onClick={() => onDelete(item)} disabled={deletingId === item.id}>{deletingId === item.id ? "हटवत आहे..." : "हटवा"}</button></div></td>}
              </tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function WaterChangeNotice({ changes, wardChanges = [], username, hasWard, isAdmin, onAdd }) {
  const visibleChanges = isAdmin ? changes : wardChanges.length;
  return (
    <aside className={`water-change-notice ${visibleChanges > 0 ? "has-changes" : ""}`}>
      <span className="water-change-notice-icon" aria-hidden="true">!</span>
      <span><strong>{isAdmin ? (changes > 0 ? "पाणी वेळापत्रकात बदल" : "सध्या वेळेत बदल नाही") : (visibleChanges > 0 ? "तुमच्या वॉर्डच्या पाणी वेळेत बदल" : "तुमच्या वॉर्डसाठी नवीन बदल नाही")}</strong><small>{isAdmin ? (changes > 0 ? `${changes.toLocaleString(getIntlLocale())} वॉर्डनिहाय बदल येथे दिसतात. नवीनतम बदल आधी दाखवला आहे.` : "ग्रामपंचायतीने वेळ बदलाची सूचना दिल्यास ती इथे दिसेल.") : (hasWard ? (visibleChanges > 0 ? "तुमच्या वॉर्डसाठी नवीन बदल तपासा आणि सूचना सुरू करा." : "तुमच्या वॉर्डची वेळ बदलल्यास इथे सूचना दिसेल.") : "सूचना मिळवण्यासाठी प्रोफाइलमध्ये तुमचा वॉर्ड क्रमांक भरा.")}</small></span>
      {isAdmin && <button className="water-change-add" type="button" onClick={onAdd}>＋ बदल वेळ जोडा</button>}
      {!isAdmin && <WaterAlertOptIn username={username} wardChanges={wardChanges} />}
    </aside>
  );
}

function WaterAlertOptIn({ username, wardChanges }) {
  const enabledKey = `gram-sandesh-water-alerts-enabled:${username}`;
  const seenKey = `gram-sandesh-water-alerts-seen:${username}`;
  const [enabled, setEnabled] = useState(() => {
    try { return typeof Notification !== "undefined" && Notification.permission === "granted" && window.localStorage.getItem(enabledKey) === "true"; }
    catch { return false; }
  });
  const [message, setMessage] = useState("");

  async function enableAlerts() {
    setMessage("");
    if (typeof Notification === "undefined") {
      setMessage("या ब्राउझरमध्ये सूचना उपलब्ध नाहीत.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage(permission === "denied" ? "ब्राउझर सेटिंग्जमध्ये सूचना परवानगी सुरू करा." : "सूचना परवानगी दिलेली नाही.");
        return;
      }
      window.localStorage.setItem(enabledKey, "true");
      window.localStorage.setItem(seenKey, JSON.stringify(wardChanges.map((item) => String(item.id))));
      setEnabled(true);
      setMessage("तुमच्या वॉर्डच्या बदलांसाठी सूचना सुरू केल्या.");
    } catch {
      setMessage("सूचना सुरू करता आल्या नाहीत. ब्राउझर परवानगी तपासा.");
    }
  }

  return <div className="water-alert-opt-in"><button type="button" onClick={enableAlerts} disabled={enabled || (typeof Notification !== "undefined" && Notification.permission === "denied")}>{enabled ? "✓ सूचना सुरू आहेत" : "सूचना सुरू करा"}</button>{message && <small role="status">{message}</small>}</div>;
}

function WaterChangesTable({ changes, isAdmin, onEdit, onDelete, deletingId, search }) {
  if (changes.length === 0) {
    return <p className="water-schedule-empty water-change-table-empty">{search ? "या शोधासाठी पाणी वेळेतील बदल सापडला नाही." : "अजून पाणी वेळेतील बदल नोंदवलेला नाही."}</p>;
  }
  const rows = changes.flatMap((item) => {
    const timings = parseWaterTimings(item.message).filter((entry) => entry.timing.trim());
    const entries = timings.length > 0 ? timings : [{ period: "—", timing: "—" }];
    return entries.map((entry, index) => ({ item, entry, index, rowCount: entries.length }));
  });
  return (
    <div className="water-schedule-table-wrap water-changes-table-wrap">
      <table className="water-schedule-table water-changes-table">
        <thead><tr><th>वॉर्ड क्रमांक</th><th>दिवस / पाळी</th><th>वेळ</th><th>बदल नोंदवला</th><th>ऐका</th>{isAdmin && <th>कृती</th>}</tr></thead>
        <tbody>{rows.map(({ item, entry, index, rowCount }) => <tr key={`${item.id}-${index}`}>
          {index === 0 && <th scope="row" rowSpan={rowCount}>{item.area}</th>}
          <td>{entry.period}</td>
          <td>{entry.timing}</td>
          {index === 0 && <td className="water-table-updated" rowSpan={rowCount}>{formatPostedAt(item.updatedAt || item.createdAt)}</td>}
          {index === 0 && <td rowSpan={rowCount}><ReadAloudButton text={`वॉर्ड ${item.area}. पाण्याच्या वेळेत बदल. ${spokenWaterTimings(item.message)}`} /></td>}
          {index === 0 && isAdmin && <td rowSpan={rowCount}><div className="water-table-actions"><button type="button" onClick={() => onEdit(item)}>बदल करा</button><button type="button" className="delete" onClick={() => onDelete(item)} disabled={deletingId === item.id}>{deletingId === item.id ? "हटवत आहे..." : "हटवा"}</button></div></td>}
        </tr>)}</tbody>
      </table>
    </div>
  );
}

function ComplaintCard({ item, isAdmin, onUpdated }) {
  const type = getComplaintType(item.category);
  const resolved = item.status === "RESOLVED";
  const inProgress = item.status === "IN_PROGRESS";
  const progress = resolved ? 100 : inProgress ? 50 : 0;
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus() {
    setUpdating(true);
    setError("");
    try {
      const action = inProgress ? "resolve" : "start";
      const response = await apiFetch(`/api/complaints/${item.id}/${action}`, { method: "POST" });
      if (!response.ok) throw new Error(await responseMessage(response, "तक्रारीची स्थिती बदलता आली नाही."));
      onUpdated(await response.json());
    } catch (updateError) {
      setError(updateError.message || "तक्रारीची स्थिती बदलता आली नाही.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <article className="complaint-card">
      <div className="complaint-card-top">
        <span className={`card-category tone-${type.color}`}><span aria-hidden="true">{type.icon}</span> {type.label}</span>
        <span className={`complaint-status ${resolved ? "resolved" : item.status === "IN_PROGRESS" ? "in-progress" : "open"}`}><span /> {resolved ? "निकाली" : item.status === "IN_PROGRESS" ? "काम सुरू" : "नवीन"}</span>
      </div>
      <h3>{item.title}</h3>
      <p>{item.details}</p>
      <div className="complaint-location"><span aria-hidden="true">⌖</span> {item.area}</div>
      <div className="complaint-contact">
        <span className="complaint-contact-field"><small>तक्रारदार</small><strong>{item.reporterName || "गावकरी"}</strong></span>
        <span className="complaint-contact-field"><small>वॉर्ड क्रमांक</small><strong>{item.reporterWard || "नोंद नाही"}</strong></span>
        <span className="complaint-contact-field"><small>मोबाइल नंबर</small>{item.reporterMobile ? <a href={`tel:${item.reporterMobile}`}>{item.reporterMobile}</a> : <strong>नोंद नाही</strong>}</span>
      </div>
      <div className="card-meta"><time>{formatPostedAt(item.createdAt)}</time></div>
      <div className="complaint-progress-block">
        <div className="complaint-progress-copy"><span><span>निवारण प्रगती</span><small>शेवटचे अपडेट: {formatPostedAt(item.updatedAt || item.createdAt)}</small></span><strong>{resolved ? "निकाली" : inProgress ? "काम सुरू" : "नवीन"} · {progress.toLocaleString(getIntlLocale())}%</strong></div>
        <div className="complaint-progress-track" role="progressbar" aria-label="तक्रार निवारण प्रगती" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
          <span className={resolved ? "complete" : ""} style={{ width: `${progress}%` }} />
        </div>
      </div>
      {error && <p className="complaint-card-error" role="alert">{error}</p>}
      {isAdmin && !resolved && <button className="complaint-admin-action" type="button" onClick={updateStatus} disabled={updating}>{updating ? "स्थिती जतन होत आहे..." : inProgress ? "निकाली काढा" : "काम सुरू करा"}</button>}
    </article>
  );
}

function ComplaintChatModal({ complaint: initialComplaint, authUser, onClose, onUpdated, language }) {
  const [complaint, setComplaint] = useState(initialComplaint);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const type = getComplaintType(complaint.category);
  const resolved = complaint.status === "RESOLVED";
  const isAdmin = authUser.role === "ADMIN";

  const loadMessages = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/complaints/${complaint.id}/messages`);
      if (!response.ok) throw new Error("चॅट लोड करता आली नाही.");
      setMessages(await response.json());
      setError("");
    } catch (loadError) {
      setError(loadError.message || "चॅट लोड करता आली नाही.");
    } finally {
      setLoading(false);
    }
  }, [complaint.id]);

  useEffect(() => {
    loadMessages();
    const timer = window.setInterval(loadMessages, 5000);
    function handleKey(event) { if (event.key === "Escape") onClose(); }
    window.addEventListener("keydown", handleKey);
    return () => { window.clearInterval(timer); window.removeEventListener("keydown", handleKey); };
  }, [loadMessages, onClose]);

  async function sendMessage(event) {
    event.preventDefault();
    if (!draft.trim() || resolved) return;
    setSending(true);
    setError("");
    try {
      const response = await apiFetch(`/api/complaints/${complaint.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim() }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, "संदेश पाठवता आला नाही."));
      const saved = await response.json();
      setMessages((items) => [...items, saved]);
      setDraft("");
    } catch (sendError) {
      setError(sendError.message || "संदेश पाठवता आला नाही.");
    } finally {
      setSending(false);
    }
  }

  async function resolveComplaint() {
    setResolving(true);
    setError("");
    try {
      const response = await apiFetch(`/api/complaints/${complaint.id}/resolve`, { method: "POST" });
      if (!response.ok) throw new Error(await responseMessage(response, "तक्रार निकाली काढता आली नाही."));
      const updated = await response.json();
      setComplaint(updated);
      onUpdated(updated);
    } catch (resolveError) {
      setError(resolveError.message || "तक्रार निकाली काढता आली नाही.");
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="modal-backdrop chat-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="chat-modal" role="dialog" aria-modal="true" aria-labelledby="complaint-chat-title">
        <header className="chat-header">
          <div className="chat-header-icon">{type.icon}</div>
          <div className="chat-header-copy"><span className="modal-eyebrow">{type.label} · {complaint.area}</span><h2 id="complaint-chat-title">{complaint.title}</h2><small>{isAdmin ? `${complaint.reporterName}${complaint.reporterWard ? ` · वॉर्ड ${complaint.reporterWard}` : ""}${complaint.reporterMobile ? ` · ${complaint.reporterMobile}` : ""}` : "ग्रामपंचायत प्रशासकाशी चर्चा"}</small></div>
          <span className={`complaint-status ${resolved ? "resolved" : complaint.status === "IN_PROGRESS" ? "in-progress" : "open"}`}><span /> {resolved ? "निकाली" : complaint.status === "IN_PROGRESS" ? "काम सुरू" : "नवीन"}</span>
          <button className="modal-close" onClick={onClose} aria-label="चॅट बंद करा">×</button>
        </header>
        <div className="chat-privacy"><span>⌑</span> ही चर्चा फक्त तक्रारदार आणि ग्रामपंचायत प्रशासकाला दिसते.</div>
        <div className="chat-messages" aria-live="polite">
          {loading ? <div className="chat-empty">चॅट लोड होत आहे...</div> : messages.length === 0 ? (
            <div className="chat-empty"><span>✦</span><strong>चर्चा सुरू करा</strong><small>तक्रारीबद्दल अधिक माहिती किंवा कामाची स्थिती इथे कळवा.</small></div>
          ) : messages.map((message) => {
            const mine = message.senderUsername === authUser.username;
            return <article className={`chat-message ${mine ? "mine" : "theirs"}`} key={message.id}><span className="chat-sender">{message.senderRole === "ADMIN" ? "ग्रामपंचायत" : message.senderName}</span><p>{message.body}</p><time>{formatPostedAt(message.createdAt)}</time></article>;
          })}
        </div>
        {error && <div className="chat-error" role="alert">{error}</div>}
        {resolved ? (
          <div className="chat-locked"><span>✓</span><div><strong>ही तक्रार निकाली काढली आहे.</strong><small>या तक्रारीची चॅट आता बंद आहे.</small></div></div>
        ) : (
          <form className="chat-composer" onSubmit={sendMessage}>
            <VoiceInput language={language}><input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength="1000" placeholder="संदेश लिहा..." aria-label="चॅट संदेश" /></VoiceInput>
            {isAdmin && <button type="button" className="resolve-button" onClick={resolveComplaint} disabled={resolving}>{resolving ? "..." : "निकाली काढा"}</button>}
            <button className="chat-send" disabled={sending || !draft.trim()} aria-label="संदेश पाठवा">{sending ? "…" : "↑"}</button>
          </form>
        )}
      </section>
    </div>
  );
}

function VillagerDirectoryPanel({ language }) {
  const [villagers, setVillagers] = useState([]);
  const [search, setSearch] = useState("");
  const [loadState, setLoadState] = useState("loading");

  const loadVillagers = useCallback(async () => {
    try {
      const response = await apiFetch("/api/admin/villagers");
      if (!response.ok) throw new Error("गावकऱ्यांची माहिती मिळाली नाही.");
      setVillagers(await response.json());
      setLoadState("ready");
    } catch {
      setLoadState("offline");
    }
  }, []);

  useEffect(() => {
    loadVillagers();
    const timer = window.setInterval(loadVillagers, 30_000);
    return () => window.clearInterval(timer);
  }, [loadVillagers]);

  const normalizedSearch = search.trim().toLocaleLowerCase(getIntlLocale());
  const filteredVillagers = villagers.filter((villager) =>
    !normalizedSearch || [villager.fullName, villager.username, villager.mobileNumber, villager.wardNo, villager.villageName]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase(getIntlLocale()).includes(normalizedSearch)),
  );

  return (
    <section className="villager-directory">
      <div className="directory-toolbar">
        <div className="directory-count"><strong>{villagers.length.toLocaleString(getIntlLocale())}</strong><span>नोंदणीकृत गावकरी</span></div>
        <label className="search-box directory-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="नाव, वॉर्ड, मोबाइल शोधा..." aria-label="गावकरी शोधा" /></label>
        <button className="button button-quiet" type="button" onClick={loadVillagers}>पुन्हा लोड करा</button>
      </div>
      {loadState === "loading" && villagers.length === 0 ? (
        <div className="loading-state"><span className="spinner" /> गावकऱ्यांची माहिती लोड होत आहे...</div>
      ) : loadState === "offline" && villagers.length === 0 ? (
        <div className="unavailable-state"><strong>गावकऱ्यांची माहिती मिळत नाही.</strong><p>सर्व्हर सुरू आहे का ते तपासून पुन्हा प्रयत्न करा.</p><button onClick={loadVillagers}>पुन्हा प्रयत्न करा</button></div>
      ) : filteredVillagers.length === 0 ? (
        <div className="directory-empty">{search ? "या शोधासाठी गावकरी सापडला नाही." : "अजून कोणी नोंदणी केलेली नाही."}</div>
      ) : (
        <div className="villager-directory-grid">
          {filteredVillagers.map((villager) => (
            <article className="villager-detail-card" key={villager.id}>
              <div className="villager-detail-head"><span className="profile-avatar">{villager.fullName?.slice(0, 1) || "ग"}</span><span><strong>{villager.fullName}</strong><small>@{villager.username}</small></span></div>
              <div className="villager-detail-row"><span>गाव</span><strong>{villager.villageName || "मसुचीवाडी"}</strong></div>
              <div className="villager-detail-row"><span>वॉर्ड</span><strong>{villager.wardNo || "नोंद नाही"}</strong></div>
              <div className="villager-detail-row"><span>मोबाइल</span>{villager.mobileNumber ? <a href={`tel:${villager.mobileNumber}`}>{villager.mobileNumber}</a> : <strong>नोंद नाही</strong>}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ProfilePanel({ authUser, onProfileUpdated, onClose, language }) {
  const [fullName, setFullName] = useState(authUser.fullName || "");
  const [mobileNumber, setMobileNumber] = useState(authUser.mobileNumber || "");
  const [wardNo, setWardNo] = useState(authUser.wardNo || "");
  const [villageName, setVillageName] = useState(authUser.villageName || "मसुचीवाडी");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), mobileNumber: mobileNumber.trim(), wardNo: wardNo.trim(), villageName: villageName.trim() }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, "प्रोफाइल जतन करता आले नाही."));
      const updated = await response.json();
      setFullName(updated.fullName);
      setMobileNumber(updated.mobileNumber || "");
      setWardNo(updated.wardNo || "");
      setVillageName(updated.villageName || "");
      onProfileUpdated(updated);
      setMessage("प्रोफाइल यशस्वीपणे अद्ययावत केलं.");
    } catch (saveError) {
      setIsError(true);
      setMessage(saveError.message || "प्रोफाइल जतन करता आले नाही. पुन्हा प्रयत्न करा.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-panel">
      <div className="profile-summary">
        <span className="profile-avatar">{fullName.slice(0, 1) || "ग"}</span>
        <span><strong>{fullName || "गावकरी सदस्य"}</strong><small>@{authUser.username} · {villageName || "मसुचीवाडी"}</small></span>
        <button className="profile-close" type="button" onClick={onClose} disabled={saving} aria-label="प्रोफाइल फॉर्म बंद करा"><span aria-hidden="true">×</span> बंद करा</button>
      </div>
      <form className="profile-form" onSubmit={saveProfile}>
        <label className="field-label">पूर्ण नाव <span>*</span>
          <VoiceInput language={language}><input value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength="70" autoComplete="name" /></VoiceInput>
        </label>
        <label className="field-label">गावाचे नाव <span>*</span>
          <VoiceInput language={language}><input value={villageName} onChange={(event) => setVillageName(event.target.value)} required maxLength="80" autoComplete="address-level2" /></VoiceInput>
        </label>
        <label className="field-label">मोबाइल नंबर <span>*</span>
          <VoiceInput language={language}><input value={mobileNumber} onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, "").slice(0, 10))} required type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" minLength="10" maxLength="10" autoComplete="tel-national" /></VoiceInput>
        </label>
        <label className="field-label">वॉर्ड नंबर <span>*</span>
          <VoiceInput language={language}><input value={wardNo} onChange={(event) => setWardNo(event.target.value)} required maxLength="32" /></VoiceInput>
        </label>
        {message && <div className={`profile-message ${isError ? "error" : "success"}`} role={isError ? "alert" : "status"}>{message}</div>}
        <div className="profile-actions"><small>वापरकर्तानाव बदलता येणार नाही.</small><button className="button button-primary" type="submit" disabled={saving}>{saving ? "जतन करत आहे..." : "बदल जतन करा"}</button></div>
      </form>
    </section>
  );
}

function GovernmentSchemesPanel({ search }) {
  const [scope, setScope] = useState("ALL");
  const normalizedSearch = search.trim().toLocaleLowerCase(getIntlLocale());
  const filteredSchemes = useMemo(() => governmentSchemes.filter((scheme) => {
    const matchesScope = scope === "ALL" || scheme.level === scope;
    const matchesSearch = !normalizedSearch || [scheme.title, scheme.category, scheme.audience, scheme.summary]
      .some((value) => value.toLocaleLowerCase(getIntlLocale()).includes(normalizedSearch));
    return matchesScope && matchesSearch;
  }), [normalizedSearch, scope]);

  return (
    <section className="scheme-directory" aria-label="केंद्र आणि महाराष्ट्र शासनाच्या योजना">
      <div className="scheme-intro">
        <div><strong>गावकऱ्यांसाठी केंद्र व राज्य सरकारच्या योजना</strong><p>शेती, घरकुल, रोजगार, आरोग्य, महिला आणि गाव विकासासाठी उपयुक्त योजना पाहा.</p></div>
        <div className="scheme-shortcuts">
          <a href="https://www.myscheme.gov.in/" target="_blank" rel="noopener noreferrer">सर्व सरकारी योजना शोधा ↗</a>
          <a href="https://mahadbt.maharashtra.gov.in/" target="_blank" rel="noopener noreferrer">महाराष्ट्र DBT पोर्टल ↗</a>
        </div>
      </div>
      <div className="scheme-filters" role="group" aria-label="योजना शासनानुसार निवडा">
        <button type="button" className={scope === "ALL" ? "active" : ""} onClick={() => setScope("ALL")} aria-pressed={scope === "ALL"}>सर्व योजना <span>{governmentSchemes.length.toLocaleString(getIntlLocale())}</span></button>
        <button type="button" className={scope === "CENTRAL" ? "active" : ""} onClick={() => setScope("CENTRAL")} aria-pressed={scope === "CENTRAL"}>केंद्र सरकार</button>
        <button type="button" className={scope === "STATE" ? "active" : ""} onClick={() => setScope("STATE")} aria-pressed={scope === "STATE"}>महाराष्ट्र शासन</button>
      </div>
      {filteredSchemes.length > 0 ? (
        <div className="scheme-list">
          {filteredSchemes.map((scheme) => (
            <article className="scheme-row" key={scheme.id}>
              <div className="scheme-row-heading">
                <span className={`scheme-level ${scheme.level === "CENTRAL" ? "central" : "state"}`}>{scheme.level === "CENTRAL" ? "केंद्र सरकार" : "महाराष्ट्र शासन"}</span>
                <span className="scheme-category">{scheme.category}</span>
              </div>
              <div className="scheme-row-copy">
                <h3>{scheme.title}</h3>
                <time className="scheme-published" dateTime={governmentSchemesPublishedAt}>ग्रामसंदेशमध्ये प्रकाशित: {formatSchemePublishedDate(governmentSchemesPublishedAt)}</time>
                <p>{scheme.summary}</p>
                <div className="scheme-audience"><strong>कोणासाठी:</strong> {scheme.audience}</div>
              </div>
              <div className="scheme-row-actions">
                <ReadAloudButton text={`${scheme.title}. कोणासाठी: ${scheme.audience}. ${scheme.summary}`} />
                <a href={scheme.url} target="_blank" rel="noopener noreferrer">अधिकृत माहिती ↗</a>
                {scheme.detailUrl && <a className="scheme-secondary-link" href={scheme.detailUrl} target="_blank" rel="noopener noreferrer">शासन निर्णय ↗</a>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="scheme-empty"><strong>या शोधासाठी योजना सापडली नाही.</strong><span>दुसरा शब्द वापरून पाहा किंवा शोध पुसून टाका.</span></div>
      )}
      <p className="scheme-disclaimer">पात्रता, अर्जाची मुदत आणि लाभाचे नियम बदलू शकतात. अर्ज करण्यापूर्वी अधिकृत सरकारी पोर्टल किंवा ग्रामपंचायतीकडे खात्री करा.</p>
    </section>
  );
}

function PasswordPanel() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function changePassword(event) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage("नवीन पासवर्ड आणि पुष्टीचा पासवर्ड जुळत नाही.");
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, "पासवर्ड बदलता आला नाही."));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("प्रशासकाचा पासवर्ड यशस्वीपणे बदलला.");
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "पासवर्ड बदलता आला नाही. पुन्हा प्रयत्न करा.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-panel admin-password-panel">
      <div className="password-guidance"><span aria-hidden="true">♢</span><div><strong>प्रशासक खाते सुरक्षित ठेवा</strong><small>किमान ८ अक्षरांचा, सहज ओळखता न येणारा पासवर्ड निवडा. पासवर्ड गावकऱ्यांशी शेअर करू नका.</small></div></div>
      <form className="profile-form" onSubmit={changePassword}>
        <label className="field-label">सध्याचा पासवर्ड <span>*</span>
          <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required maxLength="72" autoComplete="current-password" />
        </label>
        <label className="field-label">नवीन पासवर्ड <span>*</span>
          <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength="8" maxLength="72" autoComplete="new-password" />
        </label>
        <label className="field-label">नवीन पासवर्ड पुन्हा लिहा <span>*</span>
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength="8" maxLength="72" autoComplete="new-password" />
        </label>
        {message && <div className={`profile-message ${isError ? "error" : "success"}`} role={isError ? "alert" : "status"}>{message}</div>}
        <div className="profile-actions"><small>पासवर्ड बदलल्यानंतर पुढील प्रवेशासाठी नवीन पासवर्ड वापरा.</small><button className="button button-primary" type="submit" disabled={saving}>{saving ? "बदलत आहे..." : "पासवर्ड बदला"}</button></div>
      </form>
    </section>
  );
}

function VillageChatPanel({ authUser, onMessagesRead, language }) {
  const isAdmin = authUser.role === "ADMIN";
  const [conversations, setConversations] = useState([]);
  const [selectedVillagerId, setSelectedVillagerId] = useState(isAdmin ? null : authUser.id);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [conversationLoading, setConversationLoading] = useState(isAdmin);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const loadConversations = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await apiFetch("/api/village-chat/conversations");
      if (!response.ok) throw new Error("गावकऱ्यांची यादी मिळाली नाही.");
      const list = await response.json();
      setConversations(list);
      setSelectedVillagerId((current) => current ?? list[0]?.villagerId ?? null);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "गावकऱ्यांची यादी मिळाली नाही.");
    } finally {
      setConversationLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    loadConversations();
    const timer = window.setInterval(loadConversations, 4000);
    return () => window.clearInterval(timer);
  }, [isAdmin, loadConversations]);

  const messagesUrl = isAdmin
    ? `/api/village-chat/conversations/${selectedVillagerId}/messages`
    : "/api/village-chat/messages";

  const loadMessages = useCallback(async () => {
    if (!selectedVillagerId) return;
    try {
      const response = await apiFetch(messagesUrl);
      if (!response.ok) throw new Error("चॅटमधील संदेश मिळाले नाहीत.");
      setMessages(await response.json());
      setError("");
      const readUrl = isAdmin
        ? `/api/village-chat/conversations/${selectedVillagerId}/read`
        : "/api/village-chat/read";
      const readResponse = await apiFetch(readUrl, { method: "POST" });
      if (readResponse.ok) onMessagesRead();
    } catch (loadError) {
      setError(loadError.message || "चॅटमधील संदेश मिळाले नाहीत.");
    } finally {
      setMessagesLoaded(true);
    }
  }, [isAdmin, messagesUrl, onMessagesRead, selectedVillagerId]);

  useEffect(() => {
    setMessages([]);
    setDraft("");
    setMessagesLoaded(false);
    if (!selectedVillagerId) return undefined;
    loadMessages();
    const timer = window.setInterval(loadMessages, 3000);
    return () => window.clearInterval(timer);
  }, [loadMessages, selectedVillagerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const selectedConversation = conversations.find((conversation) => conversation.villagerId === selectedVillagerId);

  async function sendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedVillagerId) return;
    setSending(true);
    setError("");
    try {
      const response = await apiFetch(messagesUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, "संदेश पाठवता आला नाही. पुन्हा प्रयत्न करा."));
      const saved = await response.json();
      setMessages((items) => [...items, saved]);
      setDraft("");
      if (isAdmin) {
        setConversations((items) => items.map((item) => item.villagerId === selectedVillagerId
          ? { ...item, lastMessage: saved.body, lastMessageAt: saved.createdAt }
          : item));
      }
    } catch (sendError) {
      setError(sendError.message || "संदेश पाठवता आला नाही. पुन्हा प्रयत्न करा.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className={`village-chat-shell ${isAdmin ? "admin-chat" : "villager-chat"}`} aria-label="ग्रामपंचायत प्रशासकाशी खाजगी चॅट">
      {isAdmin && (
        <aside className="village-chat-people">
          <div className="village-chat-people-heading"><strong>गावकरी</strong><small>खाजगी संभाषण</small></div>
          {conversationLoading && conversations.length === 0 ? (
            <div className="village-chat-list-state"><span className="spinner" /> गावकरी लोड होत आहेत...</div>
          ) : conversations.length === 0 ? (
            <div className="village-chat-list-state">{error || "नोंदणीकृत गावकरी अजून उपलब्ध नाहीत."}</div>
          ) : (
            <div className="village-chat-people-list">
              {conversations.map((conversation) => (
                <button
                  className={`village-chat-person ${conversation.villagerId === selectedVillagerId ? "selected" : ""}`}
                  key={conversation.villagerId}
                  onClick={() => setSelectedVillagerId(conversation.villagerId)}
                  aria-pressed={conversation.villagerId === selectedVillagerId}
                >
                  <span className="village-chat-avatar">{conversation.villagerName?.slice(0, 1) || "ग"}</span>
                  <span className="village-chat-person-copy"><strong>{conversation.villagerName}</strong><small>{conversation.lastMessage || "चर्चा सुरू करा"}</small></span>
                  {conversation.wardNo && <span className="village-chat-ward">वॉर्ड {conversation.wardNo}</span>}
                </button>
              ))}
            </div>
          )}
        </aside>
      )}

      <div className="village-chat-main">
        <header className="village-chat-header">
          <span className="village-chat-avatar large">{isAdmin ? (selectedConversation?.villagerName?.slice(0, 1) || "ग") : "ग्रा"}</span>
          <span><strong>{isAdmin ? (selectedConversation?.villagerName || "गावकरी निवडा") : "ग्रामपंचायत प्रशासक"}</strong><small>{isAdmin && selectedConversation?.wardNo ? `वॉर्ड ${selectedConversation.wardNo} · खाजगी चॅट` : "खाजगी चॅट · संदेश दर काही सेकंदांनी तपासले जातात"}</small></span>
        </header>

        <div className="village-chat-messages" aria-live="polite">
          {!selectedVillagerId ? (
            <div className="village-chat-empty"><strong>संभाषण निवडा</strong><span>गावकऱ्याला निवडून संदेश पाठवा.</span></div>
          ) : !messagesLoaded ? (
            <div className="village-chat-empty"><span className="spinner" /> चॅट उघडत आहे...</div>
          ) : messages.length === 0 ? (
            <div className="village-chat-empty"><span aria-hidden="true">✉</span><strong>संभाषण सुरू करा</strong><span>{isAdmin ? "गावकऱ्याला पहिला संदेश पाठवा." : "तुमचा संदेश थेट ग्रामपंचायत प्रशासकाला पाठवा."}</span></div>
          ) : messages.map((message) => {
            const mine = message.senderUsername === authUser.username;
            return <article className={`chat-message ${mine ? "mine" : "theirs"}`} key={message.id}><span className="chat-sender">{message.senderRole === "ADMIN" ? "ग्रामपंचायत" : message.senderName}</span><p>{message.body}</p><time>{formatPostedAt(message.createdAt)}</time></article>;
          })}
          <div ref={messagesEndRef} />
        </div>

        {error && <div className="chat-error" role="alert">{error}</div>}
        <form className="village-chat-composer" onSubmit={sendMessage}>
          <VoiceInput language={language}><input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength="1000" placeholder="तुमचा संदेश लिहा..." aria-label="प्रशासकाशी चॅट संदेश" disabled={!selectedVillagerId || sending} /></VoiceInput>
          <button className="button button-primary" disabled={!selectedVillagerId || sending || !draft.trim()}>{sending ? "पाठवत आहे..." : "पाठवा"}</button>
        </form>
      </div>
    </section>
  );
}

function ComplaintForm({ onClose, onSubmit, isSaving, language }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="post-modal complaint-modal" role="dialog" aria-modal="true" aria-labelledby="complaint-form-title">
        <div className="modal-head">
          <div><span className="modal-eyebrow">गावासाठी तुमचा आवाज</span><h2 id="complaint-form-title">तक्रार नोंदवा</h2><p>समस्या आणि ठिकाणाची माहिती द्या.</p></div>
          <button className="modal-close" onClick={onClose} aria-label="फॉर्म बंद करा">×</button>
        </div>
        <form onSubmit={onSubmit}>
          <label className="field-label">समस्येचा प्रकार <span>*</span>
            <select name="category" required defaultValue="WATER_SUPPLY">
              {complaintTypes.map((type) => <option value={type.key} key={type.key}>{type.label}</option>)}
            </select>
          </label>
          <label className="field-label">तक्रारीचा विषय <span>*</span>
            <VoiceInput language={language}><input name="title" required maxLength="90" placeholder="उदा. गल्लीतील पाण्याची गळती" /></VoiceInput>
          </label>
          <label className="field-label">समस्येचे वर्णन <span>*</span>
            <VoiceInput language={language} multiline><textarea name="details" required maxLength="700" rows="4" placeholder="समस्या कधीपासून आहे आणि नेमकं काय घडतंय?" /></VoiceInput>
          </label>
          <label className="field-label">समस्येचे ठिकाण <span>*</span>
            <VoiceInput language={language}><input name="area" required maxLength="100" placeholder="वॉर्ड, गल्ली किंवा जवळची खूण" /></VoiceInput>
          </label>
          <div className="complaint-form-note"><span aria-hidden="true">ⓘ</span><span>तक्रार तुमच्या खात्याशी जोडली जाईल. ती ग्रामपंचायत प्रशासकाला आणि तुम्हालाच दिसेल; संवेदनशील माहिती लिहू नका.</span></div>
          <div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>रद्द करा</button><button className="button button-primary" type="submit" disabled={isSaving}>{isSaving ? "नोंदवत आहे..." : "तक्रार नोंदवा"}<span aria-hidden="true">↗</span></button></div>
        </form>
      </section>
    </div>
  );
}

function AnnouncementForm({ initialAnnouncement, defaultCategory = "GENERAL", onClose, onSubmit, isSaving, language }) {
  const [category, setCategory] = useState(initialAnnouncement?.category || defaultCategory);
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef(null);
  const photoSupported = ["PROGRAM", "GOOD_NEWS", "BAD_NEWS", "GENERAL"].includes(category);
  const previewPhoto = photoDataUrl || (photoSupported ? initialAnnouncement?.photoUrl : "");

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function choosePhoto(event) {
    const file = event.target.files?.[0];
    setPhotoError("");
    if (!file) {
      setPhotoDataUrl("");
      setPhotoName("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setPhotoError("कृपया image प्रकारची फाइल निवडा.");
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("छायाचित्र १० MB पेक्षा कमी असावं.");
      event.target.value = "";
      return;
    }
    setPhotoBusy(true);
    try {
      const resized = await resizePhotoToJpeg(file);
      setPhotoDataUrl(resized);
      setPhotoName(file.name);
    } catch (error) {
      setPhotoDataUrl("");
      setPhotoName("");
      setPhotoError(error.message || "छायाचित्र तयार करता आलं नाही.");
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="post-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div className="modal-head">
          <div><span className="modal-eyebrow">गावकऱ्यांसाठी एक संदेश</span><h2 id="form-title">{initialAnnouncement ? "सूचना बदला" : "नवीन सूचना द्या"}</h2><p>बातमी, वीज किंवा कार्यक्रमाची माहिती द्या.</p></div>
          <button className="modal-close" onClick={onClose} aria-label="फॉर्म बंद करा">×</button>
        </div>
        <form onSubmit={onSubmit}>
          <label className="field-label">सूचना कोणत्या प्रकारची आहे? <span>*</span>
            <select name="category" required value={category} onChange={(event) => {
              const nextCategory = event.target.value;
              setCategory(nextCategory);
              if (!["PROGRAM", "GOOD_NEWS", "BAD_NEWS", "GENERAL"].includes(nextCategory)) {
                setPhotoDataUrl("");
                setPhotoName("");
                setPhotoError("");
                if (photoInputRef.current) photoInputRef.current.value = "";
              }
            }}>
              <option value="ELECTRICITY">वीजपुरवठा</option>
              <option value="PROGRAM">कार्यक्रम</option>
              <option value="GOOD_NEWS">चांगली बातमी</option>
              <option value="BAD_NEWS">दुःखद वार्ता</option>
              <option value="GENERAL">इतर सूचना</option>
            </select>
          </label>
          <label className="field-label">शीर्षक <span>*</span>
            <VoiceInput language={language}><input name="title" required maxLength="90" defaultValue={initialAnnouncement?.title || ""} placeholder="उदा. उद्याच्या कार्यक्रमाची माहिती" /></VoiceInput>
          </label>
          <label className="field-label">सविस्तर माहिती <span>*</span>
            <VoiceInput language={language} multiline><textarea name="message" required maxLength="600" rows="3" defaultValue={initialAnnouncement?.message || ""} placeholder="काय, कुठे आणि केव्हा? थोडक्यात लिहा..." /></VoiceInput>
          </label>
          <div className={`announcement-photo-picker ${photoSupported ? "supported" : "unavailable"}`}>
            <label className="field-label">छायाचित्र जोडा <span className="optional-label">(ऐच्छिक)</span>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={choosePhoto} disabled={photoBusy || !photoSupported} />
            </label>
            <small className="photo-hint">{photoSupported ? (initialAnnouncement?.photoUrl && !photoDataUrl ? "सध्याचं छायाचित्र जतन राहील; नवीन छायाचित्र निवडल्यास ते बदलेल." : "या सूचनेसाठी छायाचित्र जोडू शकता.") : "छायाचित्रासाठी कार्यक्रम, चांगली बातमी, दुःखद वार्ता किंवा इतर सूचना निवडा."}</small>
            {photoBusy && <small className="photo-hint">छायाचित्र तयार करत आहे...</small>}
            {photoError && <small className="photo-hint error">{photoError}</small>}
            {previewPhoto && <div className="photo-preview-row"><img src={previewPhoto} alt="सूचनेच्या छायाचित्राचा पूर्वदृश्य" /><span>{photoDataUrl ? photoName : "सध्याचं छायाचित्र"}</span>{photoDataUrl && <button type="button" onClick={() => { setPhotoDataUrl(""); setPhotoName(""); if (photoInputRef.current) photoInputRef.current.value = ""; }}>नवीन फोटो काढा</button>}</div>}
            {initialAnnouncement?.photoUrl && !photoSupported && <small className="photo-hint">हा प्रकार निवडल्यास सूचना जतन करताना सध्याचं छायाचित्र काढलं जाईल.</small>}
            <input type="hidden" name="photoDataUrl" value={photoDataUrl} />
          </div>
          <div className="field-pair">
            <label className="field-label">ठिकाण / परिसर
              <VoiceInput language={language}><input name="area" maxLength="80" defaultValue={initialAnnouncement?.area || ""} placeholder="उदा. बस स्टँड जवळ" /></VoiceInput>
            </label>
            <label className="field-label">तारीख आणि वेळ
              <input name="startsAt" type="datetime-local" defaultValue={initialAnnouncement?.startsAt || ""} />
            </label>
          </div>
          <label className="urgent-check"><input type="checkbox" name="priority" defaultChecked={initialAnnouncement?.priority === "URGENT"} /><span className="fake-check">ϟ</span><span><b>ही तातडीची सूचना आहे</b><small>फक्त वेळेच्या दृष्टीने महत्त्वाच्या अपडेट्ससाठी निवडा.</small></span></label>
          <div className="form-hint"><span aria-hidden="true">ⓘ</span> पोस्ट करण्यापूर्वी माहितीची खात्री करा. ही सूचना सर्वांना दिसेल.</div>
          <div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>रद्द करा</button><button className="button button-primary" type="submit" disabled={isSaving || photoBusy}>{isSaving ? "जतन करत आहे..." : photoBusy ? "थोडं थांबा..." : initialAnnouncement ? "बदल जतन करा" : "सूचना पोस्ट करा"}<span aria-hidden="true">↗</span></button></div>
        </form>
      </section>
    </div>
  );
}

function WaterScheduleForm({ initialAnnouncement, defaultWaterUpdateType = "REGULAR", onClose, onSubmit, isSaving, language }) {
  const [waterUpdateType, setWaterUpdateType] = useState(initialAnnouncement?.waterUpdateType || defaultWaterUpdateType);
  const [waterTimes, setWaterTimes] = useState(() => parseWaterTimings(initialAnnouncement?.category === "WATER" ? initialAnnouncement.message : ""));
  const [waterTimingError, setWaterTimingError] = useState("");
  const serializedWaterTimes = waterTimes
    .filter((entry) => entry.timing.trim())
    .map((entry) => `${entry.period} — ${entry.timing.trim()}`)
    .join("; ");

  function updateWaterTime(index, field, value) {
    setWaterTimes((entries) => entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry));
  }

  function submitForm(event) {
    if (!serializedWaterTimes) {
      event.preventDefault();
      setWaterTimingError("किमान एका वेळेसाठी पाणी येण्याची वेळ भरा.");
      return;
    }
    setWaterTimingError("");
    onSubmit(event);
  }

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="post-modal water-post-modal" role="dialog" aria-modal="true" aria-labelledby="water-form-title">
        <div className="modal-head">
          <div><span className="modal-eyebrow">वॉर्डनिहाय पाणीपुरवठा</span><h2 id="water-form-title">{initialAnnouncement ? "पाणी वेळापत्रक बदला" : waterUpdateType === "CHANGE" ? "पाण्याच्या वेळेतील बदल नोंदवा" : "ठरलेली पाण्याची वेळ नोंदवा"}</h2><p>वॉर्डची नियमित वेळ किंवा वेळेतील बदल नोंदवा.</p></div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="पाण्याची वेळ फॉर्म बंद करा">×</button>
        </div>
        <form onSubmit={submitForm}>
          <input type="hidden" name="category" value="WATER" />
          <label className="field-label">वेळापत्रकाचा प्रकार <span>*</span>
            <select name="waterUpdateType" required value={waterUpdateType} onChange={(event) => setWaterUpdateType(event.target.value)}>
              <option value="REGULAR">ठरलेली वेळ</option>
              <option value="CHANGE">वेळेत बदल</option>
            </select>
          </label>
          <label className="field-label">वॉर्ड क्रमांक <span>*</span>
            <VoiceInput language={language}><input name="area" maxLength="32" required defaultValue={initialAnnouncement?.area || ""} placeholder="उदा. वॉर्ड २" /></VoiceInput>
          </label>
          <section className="water-timing-editor" aria-label="वॉर्डसाठी पाणी येण्याच्या वेळा">
            <div className="water-timing-editor-heading"><strong>पाणी येण्याच्या वेळा <span>*</span></strong><small>लागू असलेल्या वेळा भरा; बाकीच्या रिकाम्या ठेवा. जास्तीत जास्त ६ वेळा जोडता येतील.</small></div>
            {waterTimes.map((entry, index) => (
              <div className="water-timing-row" key={`${entry.period}-${index}`}>
                <label className="field-label">वेळेची पाळी
                  <select value={entry.period} onChange={(event) => updateWaterTime(index, "period", event.target.value)}>
                    {waterPeriods.map((period) => <option key={period} value={period}>{period}</option>)}
                  </select>
                </label>
                <label className="field-label">वेळ
                  <VoiceInput language={language}><input type="text" value={entry.timing} onChange={(event) => { updateWaterTime(index, "timing", event.target.value); setWaterTimingError(""); }} maxLength="80" placeholder="उदा. ६ ते ८" /></VoiceInput>
                </label>
                <button className="water-timing-remove" type="button" onClick={() => setWaterTimes((entries) => entries.filter((_, entryIndex) => entryIndex !== index))} disabled={waterTimes.length <= 1} aria-label={`${entry.period} वेळ काढा`}>काढा</button>
              </div>
            ))}
            <button className="water-timing-add" type="button" onClick={() => setWaterTimes((entries) => [...entries, { period: "सकाळी", timing: "" }])} disabled={waterTimes.length >= 6}>＋ आणखी वेळ जोडा</button>
            {waterTimingError && <small className="water-timing-error" role="alert">{waterTimingError}</small>}
            <input type="hidden" name="waterTiming" value={serializedWaterTimes} />
          </section>
          <div className="form-hint"><span aria-hidden="true">ⓘ</span> वॉर्ड निवडा आणि लागू असलेल्या पाळ्यांची वेळ भरा. ही वेळ गावकऱ्यांना पाणी टॅबमध्ये दिसेल.</div>
          <div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>रद्द करा</button><button className="button button-primary" type="submit" disabled={isSaving}>{isSaving ? "जतन करत आहे..." : initialAnnouncement ? "बदल जतन करा" : waterUpdateType === "CHANGE" ? "बदल नोंदवा" : "वेळापत्रक जतन करा"}<span aria-hidden="true">↗</span></button></div>
        </form>
      </section>
    </div>
  );
}

export default App;
