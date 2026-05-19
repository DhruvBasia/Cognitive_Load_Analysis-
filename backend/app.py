from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from sentence_transformers import SentenceTransformer

# --- One-time downloads (NLTK data) ---
for pkg in ["punkt", "punkt_tab", "stopwords"]:
    try:
        nltk.data.find(f"tokenizers/{pkg}" if "punkt" in pkg else f"corpora/{pkg}")
    except LookupError:
        nltk.download(pkg, quiet=True)

stop_words = set(stopwords.words("english"))

# --- Load model + embedder ONCE at startup ---
print("Loading classifier…")
clf = joblib.load("cognitive_model.pkl")
print("Loading sentence embedder…")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
print("Ready.")

LABELS = ["LOW", "MEDIUM", "HIGH"]

def extract_features(text: str):
    """Must match training pipeline EXACTLY."""
    words = word_tokenize(text.lower())
    word_count = len(words)
    unique_words = len(set(words))
    avg_word_length = sum(len(w) for w in words) / len(words) if words else 0
    complex_words = sum(1 for w in words if len(w) > 6)
    stopword_ratio = sum(1 for w in words if w in stop_words) / len(words) if words else 0
    return [word_count, unique_words, avg_word_length, complex_words, stopword_ratio]

# --- FastAPI app ---
app = FastAPI(title="Cognitive Load API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OK for local dev; lock down for production
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextIn(BaseModel):
    text: str

@app.get("/")
def root():
    return {"status": "ok", "msg": "POST /predict with {text: '...'}"}

@app.post("/predict")
def predict(payload: TextIn):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")

    # 1. Hand-crafted features (5 dims)
    hand = np.array(extract_features(text))

    # 2. Sentence embedding (384 dims)
    embed = embedder.encode([text])[0]

    # 3. Concatenate → 389 dims, same as training
    x = np.hstack([hand, embed]).reshape(1, -1)

    # 4. Predict
    pred_idx = int(clf.predict(x)[0])
    probs = clf.predict_proba(x)[0]
    confidence = float(np.max(probs)) * 100

    # 5. Build factor breakdown from the 5 hand-crafted features
    #    (normalized to 0-100 for the UI bars)
    word_count, unique_words, avg_word_length, complex_words, stopword_ratio = hand
    factors = {
        "lexical": min(100, int(avg_word_length * 12)),          # longer words → harder
        "syntactic": min(100, int(word_count / 2)),              # longer text → harder
        "conceptual": min(100, int(complex_words * 5)),          # more 6+ letter words → harder
        "information": min(100, int((1 - stopword_ratio) * 100)) # fewer stopwords → denser
    }

    return {
        "level": LABELS[pred_idx],
        "confidence": round(confidence, 1),
        "reasoning": (
            f"Model classified this as {LABELS[pred_idx].lower()} cognitive load "
            f"based on {int(word_count)} words, {int(complex_words)} complex words, "
            f"and an average word length of {avg_word_length:.1f} characters."
        ),
        "factors": factors,
    }