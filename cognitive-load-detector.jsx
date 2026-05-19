import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Sparkles,
  Zap,
  Eye,
  Gauge,
  ArrowRight,
  Loader2,
  ChevronDown,
  Activity,
  Cpu,
  BookOpen,
} from "lucide-react";

export default function CognitiveLoadDetector() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [placeholderText, setPlaceholderText] = useState("");
  const [visibleSections, setVisibleSections] = useState(new Set());

  const analyzerRef = useRef(null);
  const featuresRef = useRef(null);
  const aboutRef = useRef(null);
  const textareaRef = useRef(null);

  // Typing animation for placeholder
  const placeholderPhrases = [
    "Enter your text or question…",
    "Try a research abstract…",
    "Paste a paragraph to analyze…",
    "Drop in something you wrote…",
  ];

  useEffect(() => {
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeout;

    const tick = () => {
      const current = placeholderPhrases[phraseIndex];
      if (!isDeleting) {
        setPlaceholderText(current.slice(0, charIndex + 1));
        charIndex++;
        if (charIndex === current.length) {
          timeout = setTimeout(() => {
            isDeleting = true;
            tick();
          }, 2200);
          return;
        }
      } else {
        setPlaceholderText(current.slice(0, charIndex - 1));
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % placeholderPhrases.length;
        }
      }
      timeout = setTimeout(tick, isDeleting ? 30 : 55);
    };
    tick();
    return () => clearTimeout(timeout);
  }, []);

  // Intersection observer for fade-in transitions
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.15 }
    );

    [analyzerRef, featuresRef, aboutRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToAnalyzer = () => {
    analyzerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => textareaRef.current?.focus(), 600);
  };

  const analyzeText = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const systemPrompt = `You are an expert in cognitive psychology and computational linguistics. Analyze the cognitive load required to read and comprehend the given text.

Consider these factors:
- Lexical complexity (rare words, technical vocabulary)
- Syntactic complexity (sentence length, nested clauses, passive voice)
- Conceptual density (abstract ideas, domain expertise required)
- Information load (facts per sentence, working memory demand)
- Discourse coherence (ease of following the thread)

Classify the cognitive load as exactly one of: LOW, MEDIUM, or HIGH.

Respond ONLY with valid JSON in this exact format, no markdown, no extra text:
{"level": "LOW" | "MEDIUM" | "HIGH", "confidence": <number 0-100>, "reasoning": "<one concise sentence explaining the rating>", "factors": {"lexical": <0-100>, "syntactic": <0-100>, "conceptual": <0-100>, "information": <0-100>}}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Analyze the cognitive load of this text:\n\n"""${text}"""`,
            },
          ],
        }),
      });

      const data = await response.json();
      const rawText = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("")
        .replace(/```json|```/g, "")
        .trim();

      const parsed = JSON.parse(rawText);
      setResult(parsed);
    } catch (e) {
      console.error(e);
      setError("Something went wrong analyzing the text. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const levelConfig = {
    LOW: {
      bg: "bg-[#d4f4dd]",
      ring: "ring-[#7fcf9a]/40",
      text: "text-[#2d6b42]",
      bar: "bg-gradient-to-r from-[#a8e6b8] to-[#7fcf9a]",
      glow: "shadow-[0_0_60px_-15px_rgba(127,207,154,0.6)]",
      dot: "bg-[#5fb87e]",
      label: "Easy to read",
    },
    MEDIUM: {
      bg: "bg-[#fff3c4]",
      ring: "ring-[#f0c674]/40",
      text: "text-[#7a5a1f]",
      bar: "bg-gradient-to-r from-[#ffe49a] to-[#f0c674]",
      glow: "shadow-[0_0_60px_-15px_rgba(240,198,116,0.6)]",
      dot: "bg-[#e0a84a]",
      label: "Moderate effort",
    },
    HIGH: {
      bg: "bg-[#ffd6d6]",
      ring: "ring-[#f5a5a5]/40",
      text: "text-[#8b3a3a]",
      bar: "bg-gradient-to-r from-[#ffb8b8] to-[#f08a8a]",
      glow: "shadow-[0_0_60px_-15px_rgba(245,165,165,0.7)]",
      dot: "bg-[#e07070]",
      label: "Demanding read",
    },
  };

  const fadeIn = (id) =>
    visibleSections.has(id)
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-6";

  return (
    <div className="min-h-screen w-full font-sans antialiased text-slate-800 selection:bg-[#c7d9ff] selection:text-slate-900 overflow-x-hidden">
      {/* Font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; letter-spacing: -0.02em; }
        .font-sans { font-family: 'Inter', -apple-system, sans-serif; }
        @keyframes float-slow { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(3deg); } }
        @keyframes float-medium { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(-4deg); } }
        @keyframes pulse-soft { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes draw-line { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
        .animate-pulse-soft { animation: pulse-soft 3s ease-in-out infinite; }
        .animate-blink { animation: blink 1s step-end infinite; }
        .bar-fill { animation: barFill 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @keyframes barFill { from { width: 0%; } }
        .glass { background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.7); }
        .glass-strong { background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.8); }
        html { scroll-behavior: smooth; }
        .transition-fade { transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1); }
      `}</style>

      {/* Ambient gradient background */}
      <div className="fixed inset-0 -z-10 bg-[#fbfaf7]">
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] rounded-full bg-[#cfe0ff] opacity-50 blur-[120px]" />
        <div className="absolute top-20 -right-40 w-[700px] h-[700px] rounded-full bg-[#e8d5ff] opacity-45 blur-[140px]" />
        <div className="absolute top-[60%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#d4f4dd] opacity-40 blur-[130px]" />
        <div className="absolute bottom-0 right-[10%] w-[550px] h-[550px] rounded-full bg-[#ffdcc7] opacity-40 blur-[140px]" />
        {/* subtle grain */}
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-multiply pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* NAV */}
      <nav className="sticky top-0 z-50 px-6 md:px-12 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#a5c4ff] to-[#c9a5ff] flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <span className="font-display text-lg font-medium text-slate-900">
              cognitive load
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#analyzer" className="hover:text-slate-900 transition-colors">
              Analyzer
            </a>
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-slate-900 transition-colors">
              About
            </a>
          </div>
          <button
            onClick={scrollToAnalyzer}
            className="text-sm bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors"
          >
            Try now
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 md:px-12 pt-12 md:pt-20 pb-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 glass rounded-full px-3.5 py-1.5 text-xs text-slate-600 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7fcf9a] animate-pulse-soft" />
              Powered by Claude · NLP-grounded
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.02] font-light text-slate-900">
              Cognitive
              <br />
              <span className="italic font-normal bg-gradient-to-r from-[#7a93d4] via-[#9d7ad4] to-[#d47aa8] bg-clip-text text-transparent">
                Load
              </span>{" "}
              Detector
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed">
              Analyze the mental effort hidden in any piece of text. From a
              tweet to a thesis — measure how hard your reader has to think.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button
                onClick={scrollToAnalyzer}
                className="group inline-flex items-center gap-2 bg-slate-900 text-white pl-5 pr-4 py-3.5 rounded-2xl text-sm font-medium hover:bg-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-0.5"
              >
                Try now
                <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
              <a
                href="#about"
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors py-3.5"
              >
                How it works
                <ChevronDown className="w-4 h-4" />
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                Real-time
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5" />
                LLM-backed
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" />
                Explainable
              </div>
            </div>
          </div>

          {/* Hero illustration */}
          <div className="md:col-span-5 relative">
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Background card */}
              <div className="absolute inset-0 glass-strong rounded-[2.5rem] shadow-[0_30px_80px_-30px_rgba(100,90,180,0.25)]" />

              {/* Floating elements */}
              <div className="absolute top-8 right-8 animate-float-slow">
                <div className="glass rounded-2xl px-3.5 py-2 flex items-center gap-2 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[#7fcf9a]" />
                  <span className="text-xs text-slate-700 font-medium">
                    LOW
                  </span>
                </div>
              </div>
              <div
                className="absolute top-24 left-8 animate-float-medium"
                style={{ animationDelay: "1s" }}
              >
                <div className="glass rounded-2xl px-3.5 py-2 flex items-center gap-2 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[#e0a84a]" />
                  <span className="text-xs text-slate-700 font-medium">
                    MEDIUM
                  </span>
                </div>
              </div>
              <div
                className="absolute bottom-24 right-12 animate-float-slow"
                style={{ animationDelay: "2s" }}
              >
                <div className="glass rounded-2xl px-3.5 py-2 flex items-center gap-2 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[#e07070]" />
                  <span className="text-xs text-slate-700 font-medium">
                    HIGH
                  </span>
                </div>
              </div>

              {/* Central brain */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#cfe0ff] to-[#e8d5ff] blur-2xl scale-110 animate-pulse-soft" />
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-white via-[#f0e8ff] to-[#dde8ff] flex items-center justify-center shadow-xl">
                    <Brain
                      className="w-14 h-14 text-slate-700"
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Orbital dots */}
                  <svg
                    className="absolute -inset-12 animate-spin"
                    style={{ animationDuration: "20s" }}
                    viewBox="0 0 200 200"
                  >
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="rgba(100,100,150,0.15)"
                      strokeWidth="1"
                      strokeDasharray="2 6"
                    />
                    <circle cx="100" cy="20" r="3" fill="#a5c4ff" />
                    <circle cx="180" cy="100" r="3" fill="#c9a5ff" />
                  </svg>
                </div>
              </div>

              {/* Bottom mini-bar viz */}
              <div className="absolute bottom-8 left-8 right-8 glass rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                    Live analysis
                  </span>
                  <Sparkles className="w-3 h-3 text-slate-400" />
                </div>
                <div className="flex items-end gap-1 h-8">
                  {[40, 65, 35, 80, 55, 70, 45, 90, 60, 50, 75, 40].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-gradient-to-t from-[#a5c4ff] to-[#c9a5ff] animate-pulse-soft"
                        style={{
                          height: `${h}%`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ANALYZER */}
      <section
        id="analyzer"
        ref={analyzerRef}
        className={`px-6 md:px-12 py-20 transition-fade ${fadeIn("analyzer")}`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-500 mb-4">
              <span className="w-8 h-px bg-slate-300" />
              The Analyzer
              <span className="w-8 h-px bg-slate-300" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 font-light">
              Paste your text below
            </h2>
            <p className="mt-3 text-slate-600">
              We'll estimate how much mental effort a reader needs to process
              it.
            </p>
          </div>

          <div className="glass-strong rounded-[2rem] p-6 md:p-8 shadow-[0_20px_60px_-25px_rgba(100,90,180,0.2)]">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholderText + (text.length === 0 ? "|" : "")}
                rows={6}
                className="w-full bg-white/60 border border-white/80 rounded-2xl p-5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#a5c4ff]/50 focus:bg-white/80 resize-none text-base leading-relaxed transition-all"
                disabled={loading}
              />
              <div className="absolute bottom-3.5 right-4 text-xs text-slate-400">
                {text.length} chars
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: "Simple",
                    text: "The cat sat on the mat. It was a sunny day.",
                  },
                  {
                    label: "Academic",
                    text: "The epistemological ramifications of quantum decoherence necessitate a reformulation of classical observational frameworks, particularly when considering measurement-induced collapse phenomena.",
                  },
                  {
                    label: "Mixed",
                    text: "Photosynthesis is how plants make food from sunlight. They use chlorophyll, a green pigment, to capture light energy and convert carbon dioxide and water into glucose.",
                  },
                ].map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => setText(ex.text)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/60 border border-white/80 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors disabled:opacity-50"
                  >
                    {ex.label} example
                  </button>
                ))}
              </div>
              <button
                onClick={analyzeText}
                disabled={!text.trim() || loading}
                className="group inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl text-sm font-medium hover:bg-slate-700 transition-all duration-300 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze cognitive load
                  </>
                )}
              </button>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-slate-400 animate-pulse-soft"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                  Measuring lexical, syntactic, conceptual depth…
                </div>
                <div className="h-24 rounded-2xl bg-gradient-to-r from-white/40 via-white/70 to-white/40 bg-[length:200%_100%]"
                     style={{ animation: "shimmer 2s linear infinite" }} />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-2xl bg-[#ffd6d6]/60 border border-[#f5a5a5]/40 text-[#8b3a3a] text-sm px-4 py-3">
                {error}
              </div>
            )}

            {/* Result */}
            {result && !loading && (
              <div className="mt-8 space-y-5 animate-[fadeIn_0.6s_ease-out]">
                <div
                  className={`rounded-3xl p-6 md:p-7 ring-1 ${levelConfig[result.level].ring} ${levelConfig[result.level].bg} ${levelConfig[result.level].glow}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-xs tracking-widest uppercase text-slate-600 mb-1">
                        Cognitive load
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span
                          className={`font-display text-5xl md:text-6xl font-medium ${levelConfig[result.level].text}`}
                        >
                          {result.level}
                        </span>
                        <span className="text-sm text-slate-600">
                          {levelConfig[result.level].label}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs tracking-widest uppercase text-slate-600 mb-1">
                        Confidence
                      </div>
                      <div
                        className={`font-display text-4xl ${levelConfig[result.level].text}`}
                      >
                        {result.confidence}%
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-5">
                    <div className="h-2.5 w-full rounded-full bg-white/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${levelConfig[result.level].bar} bar-fill`}
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                  </div>

                  <p className="mt-5 text-sm md:text-[15px] text-slate-700 leading-relaxed">
                    <span className="font-medium text-slate-900">Why: </span>
                    {result.reasoning}
                  </p>
                </div>

                {/* Factor breakdown */}
                {result.factors && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        key: "lexical",
                        label: "Lexical",
                        desc: "Vocabulary difficulty",
                      },
                      {
                        key: "syntactic",
                        label: "Syntactic",
                        desc: "Sentence structure",
                      },
                      {
                        key: "conceptual",
                        label: "Conceptual",
                        desc: "Abstract depth",
                      },
                      {
                        key: "information",
                        label: "Information",
                        desc: "Density of facts",
                      },
                    ].map((f) => (
                      <div
                        key={f.key}
                        className="glass rounded-2xl p-4"
                      >
                        <div className="text-[10px] tracking-widest uppercase text-slate-500">
                          {f.label}
                        </div>
                        <div className="font-display text-2xl text-slate-900 mt-1">
                          {result.factors[f.key]}
                          <span className="text-sm text-slate-400">/100</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-200/60 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#a5c4ff] to-[#c9a5ff] bar-fill"
                            style={{ width: `${result.factors[f.key]}%` }}
                          />
                        </div>
                        <div className="mt-1.5 text-[10px] text-slate-400">
                          {f.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        ref={featuresRef}
        className={`px-6 md:px-12 py-20 transition-fade ${fadeIn("features")}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-500 mb-4">
              <span className="w-8 h-px bg-slate-300" />
              What you get
              <span className="w-8 h-px bg-slate-300" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-slate-900 font-light">
              Built for clarity
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Activity,
                title: "Real-time analysis",
                desc: "Paste, click, read. No waiting around for batch jobs or model spin-up.",
                tint: "from-[#cfe0ff] to-[#e8d5ff]",
              },
              {
                icon: Cpu,
                title: "AI-powered predictions",
                desc: "A frontier language model evaluates lexical, syntactic, and conceptual signals.",
                tint: "from-[#d4f4dd] to-[#cfe0ff]",
              },
              {
                icon: BookOpen,
                title: "Readable insights",
                desc: "Not just a label — every prediction comes with reasoning you can act on.",
                tint: "from-[#ffdcc7] to-[#e8d5ff]",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group glass-strong rounded-3xl p-7 hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_20px_50px_-20px_rgba(100,90,180,0.25)]"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.tint} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}
                >
                  <f.icon className="w-5 h-5 text-slate-700" strokeWidth={1.8} />
                </div>
                <h3 className="font-display text-2xl text-slate-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        ref={aboutRef}
        className={`px-6 md:px-12 py-20 transition-fade ${fadeIn("about")}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="glass-strong rounded-[2.5rem] p-8 md:p-14 shadow-[0_20px_60px_-30px_rgba(100,90,180,0.2)]">
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7">
                <div className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-500 mb-4">
                  <Gauge className="w-3.5 h-3.5" />
                  About
                </div>
                <h2 className="font-display text-4xl md:text-5xl text-slate-900 font-light leading-tight">
                  How the model thinks
                </h2>
                <p className="mt-5 text-slate-600 leading-relaxed">
                  This system uses natural language processing and machine
                  learning techniques to estimate cognitive effort based on
                  linguistic complexity. It examines vocabulary, sentence
                  structure, conceptual depth, and information density — the
                  same dimensions psycholinguists use to measure reading load —
                  and combines them into a single intuitive rating.
                </p>
                <p className="mt-4 text-slate-600 leading-relaxed">
                  Useful for writers checking accessibility, researchers
                  auditing readability, and teachers calibrating reading
                  material.
                </p>
              </div>
              <div className="md:col-span-5">
                <div className="relative aspect-square">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#a5c4ff" />
                        <stop offset="100%" stopColor="#c9a5ff" />
                      </linearGradient>
                    </defs>
                    {/* concentric arcs */}
                    {[80, 65, 50, 35].map((r, i) => (
                      <circle
                        key={i}
                        cx="100"
                        cy="100"
                        r={r}
                        fill="none"
                        stroke="url(#g1)"
                        strokeWidth="1"
                        strokeDasharray={`${r * 2 * Math.PI * 0.7} 1000`}
                        strokeLinecap="round"
                        opacity={0.5 + i * 0.1}
                        transform={`rotate(${i * 30} 100 100)`}
                      />
                    ))}
                    <circle cx="100" cy="100" r="6" fill="#7a93d4" />
                    {/* labels around */}
                    <text
                      x="100"
                      y="15"
                      textAnchor="middle"
                      className="fill-slate-500"
                      style={{ font: "10px Inter, sans-serif", letterSpacing: "1px" }}
                    >
                      LEXICAL
                    </text>
                    <text
                      x="195"
                      y="103"
                      textAnchor="end"
                      className="fill-slate-500"
                      style={{ font: "10px Inter, sans-serif", letterSpacing: "1px" }}
                    >
                      SYNTACTIC
                    </text>
                    <text
                      x="100"
                      y="195"
                      textAnchor="middle"
                      className="fill-slate-500"
                      style={{ font: "10px Inter, sans-serif", letterSpacing: "1px" }}
                    >
                      INFORMATION
                    </text>
                    <text
                      x="5"
                      y="103"
                      className="fill-slate-500"
                      style={{ font: "10px Inter, sans-serif", letterSpacing: "1px" }}
                    >
                      CONCEPTUAL
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-12 py-12 mt-10">
        <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a5c4ff] to-[#c9a5ff] flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <span className="font-display text-base text-slate-800">
              cognitive load detector
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Built with AI &amp; NLP · Crafted by{" "}
            <span className="text-slate-700 font-medium">Aak</span>
          </div>
          <div className="text-xs text-slate-400">© 2026</div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
