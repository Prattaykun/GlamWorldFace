# GlamWorldFace — Scoring Rulebook

> This is the official scoring rulebook that governs how contestant scores are computed
> in **JURY** competitions on the GlamWorldFace platform.

---

## 1. Overview

Every contestant who enters a JURY competition is evaluated by **two independent scoring systems**:

| Scorer | Who / What | What They Evaluate |
|--------|-----------|-------------------|
| **Human Jury** | Real judges assigned to the competition by an admin | Profile text + uploaded images + Instagram / social persona |
| **AI System** | LLM (OpenAI primary, Google Gemini fallback) | Profile text fields **only** — never images |

Both systems score using the **same 5 categories** on the **same 1–10 scale**, ensuring consistency.

---

## 2. Scoring Categories

Each category is scored from **1** (very poor) to **10** (outstanding).

### 2.1 Presentation
**What it measures:** Clarity, structure, and overall appeal of the contestant's bio and profile text.

| Score Range | Description |
|-------------|-------------|
| 1–3 (Low) | Poorly written, no clear structure, unappealing or confusing text |
| 4–6 (Medium) | Acceptable writing with basic structure but lacking polish |
| 7–10 (High) | Compelling, well-structured, and engaging prose that draws the reader in |

### 2.2 Confidence
**What it measures:** Strength, ambition, and self-assurance shown in goals, aspirations, and self-description.

| Score Range | Description |
|-------------|-------------|
| 1–3 (Low) | No goals mentioned, vague, passive tone, lacks self-awareness |
| 4–6 (Medium) | Some goals stated but generic, unclear, or lacking conviction |
| 7–10 (High) | Bold and specific aspirations with clear vision and strong self-belief |

### 2.3 Styling
**What it measures:** Quality indicators from occupation, personality, portfolio presence, and overall persona.

| Score Range | Description |
|-------------|-------------|
| 1–3 (Low) | No portfolio, no indication of style awareness or creative interest |
| 4–6 (Medium) | Some indicators of style or creative/professional interest |
| 7–10 (High) | Strong creative portfolio, professional persona, clear aesthetic sensibility |

### 2.4 Profile Quality
**What it measures:** Completeness and detail across all text fields (bio, goals, achievements, languages, occupation, personality).

| Score Range | Description |
|-------------|-------------|
| 1–3 (Low) | Most fields empty, minimal information provided |
| 4–6 (Medium) | Some fields filled with moderate detail |
| 7–10 (High) | All fields complete with rich, detailed, and thoughtful content |

### 2.5 Professionalism
**What it measures:** Tone, grammar, coherence, and maturity of written text across the entire profile.

| Score Range | Description |
|-------------|-------------|
| 1–3 (Low) | Poor grammar, overly informal tone, incoherent or immature writing |
| 4–6 (Medium) | Acceptable grammar, somewhat professional but with noticeable gaps |
| 7–10 (High) | Polished, error-free, mature professional tone throughout |

---

## 3. Who Scores What

This is a critical distinction in the scoring system:

### Human Jury Responsibilities
Human jurors have access to and evaluate **everything**:
- ✅ All text fields (bio, goals, achievements, personality, etc.)
- ✅ Profile photo, face images, and full-body images
- ✅ Instagram handle and social media presence
- ✅ Overall visual impression and persona

### AI System Responsibilities
The AI system evaluates **text fields only**:
- ✅ Bio, Goals & Aspirations, Achievements & Awards
- ✅ Languages, Occupation, Personality Highlights
- ✅ Field completeness (checks how many fields are filled)
- ❌ **Does NOT evaluate images** (no access to visual content)
- ❌ **Does NOT evaluate Instagram** (no web browsing capability)

> **Why this separation?**
> The AI cannot reliably judge visual content like photos or social media presence.
> By restricting it to text-only evaluation, we ensure fair and consistent scoring
> while complementing the human jury's visual assessment.

---

## 4. Individual Score Computation

### Human Jury Score (per juror)
Each juror scores all 5 categories (1–10), and the juror's **overall score** is the average:

```
juror_overall = (presentation + confidence + styling + profile_quality + professionalism) / 5
```

### Average Human Score (across all jurors)
When multiple jurors score the same entry, the **average human score** is computed:

```
avg_human_score = sum(all_jurors_overall_scores) / number_of_jurors
```

### AI System Score
The AI produces scores for all 5 categories (1–10), and the **system overall score** is the average:

```
system_overall = (presentation + confidence + styling + profile_quality + professionalism) / 5
```

---

## 5. Final Score Formula

The final score that determines a contestant's rank on the leaderboard combines both scoring sources using **weighted averaging**:

```
final_score = (avg_human_score × 1.0 + system_score × 0.5) / 1.5
```

### Weights Explained

| Source | Weight | Rationale |
|--------|--------|-----------|
| Human Jury Average | **1.0** (full weight) | Humans can evaluate images, Instagram, and overall persona — the most important aspects of a pageant |
| AI System Score | **0.5** (half weight) | AI provides an objective text-quality baseline but cannot judge visual elements |

### Worked Example

Suppose a contestant receives:
- **Juror A** overall: 8.0
- **Juror B** overall: 7.5
- **Juror C** overall: 8.5
- **AI System** overall: 7.0

Step 1: Average human score = (8.0 + 7.5 + 8.5) / 3 = **8.0**
Step 2: Apply formula = (8.0 × 1.0 + 7.0 × 0.5) / 1.5 = (8.0 + 3.5) / 1.5 = **7.67**

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Only human scores exist (no AI score) | Final score = human average only |
| Only AI score exists (no human scores) | Final score = AI score only |
| Neither exists | No final score is computed; entry shows "Not scored" |
| New juror submits scores | Final score is **automatically recomputed** |
| Juror updates their scores | Final score is **automatically recomputed** |

---

## 6. Leaderboard Ranking

| Competition Type | Ranked By | Display |
|------------------|-----------|---------|
| **JURY** | `finalScore` descending | Shows combined final score (1–10 scale) |
| **PUBLIC_VOTING** | `voteCount` descending | Shows total vote count |

In case of a tie in JURY competitions, contestants with the same `finalScore` are shown in order of entry date.

---

## 7. What Contestants See

On their **Dashboard → Results** page (`/dashboard/results`), contestants can view for each competition:

1. **Human Jury Average** — the average across all jurors, per category and overall
2. **AI System Score** — the LLM-generated score, per category and overall
3. **Final Combined Score** — the weighted result
4. **Radar Chart** — a visual comparison of Human vs AI scores across all 5 categories

This transparency ensures contestants understand exactly how their final rank was determined.

---

## 8. Idempotency & Integrity Rules

- **One score set per juror per entry**: If a juror re-scores an entry, it updates (not duplicates) their previous scores.
- **One AI score per entry**: The system generates one LLM score per entry. It is not regenerated unless explicitly forced by an admin.
- **Final score auto-recomputes**: Whenever any human score is added/updated, or a system score is generated, the final score is recalculated.
- **Scores are permanently stored**: Category-level scores, overall scores, and the AI model name used are all persisted in the database for full auditability.

---

## 9. When AI Scoring Runs

AI scoring is **automatically triggered** at the moment an admin approves a contestant's entry in a JURY competition.

| Event | AI Scoring Behavior |
|-------|-------------------|
| Admin approves entry in JURY competition | ✅ Auto-triggered (fire-and-forget, runs in background) |
| Admin clicks "Re-score AI" button | ✅ Manually triggered with `force=true` (overwrites existing) |
| Contestant updates their profile | ❌ Does NOT auto-rescore. Admin must click "Re-score AI" if desired |
| Admin creates the competition | ❌ No scoring happens (no entries exist yet) |

The auto-trigger is **non-blocking** — the approval completes instantly, and the AI scoring runs asynchronously. If the LLM call fails, a log is written and the admin can manually retry via the "Re-score AI" button.

---

## 10. Competition-Specific Scoring Rules

Admins can configure **per-competition scoring rules** when creating a competition. These rules are injected into the LLM prompt, making each competition's AI scoring unique.

### 10.1 Scoring Guidelines (Free Text)

Field: `scoringCriteria` — A free-text field where admins write natural-language instructions for the AI.

**Example:**
```
• Focus heavily on international appeal and multilingual ability
• Contestants with verified pageant achievements should score higher on Confidence
• Professional tone in bio is critical — deduct points for informal writing
• Strong emphasis on fitness and wellness lifestyle
```

The AI reads these instructions and adjusts its scoring accordingly.

### 10.2 Scoring Thresholds (JSON)

Field: `scoringThresholds` — A structured JSON field with machine-readable constraints.

**Supported fields:**

| Field | Type | Effect on AI Scoring |
|-------|------|---------------------|
| `minAge` | number | If contestant's age < minAge, deduct 2 pts from Profile Quality |
| `maxAge` | number | If contestant's age > maxAge, deduct 2 pts from Profile Quality |
| `requiredGender` | string | If contestant's gender doesn't match, deduct 2 pts from Profile Quality |
| `focusAreas` | string[] | If the contestant shows strength in these areas, boost Styling and Confidence |
| `categoryWeights` | object | Multipliers per category (higher = score more strictly/generously) |

**Example JSON:**
```json
{
  "minAge": 18,
  "maxAge": 30,
  "requiredGender": "Female",
  "focusAreas": ["fitness", "international appeal", "charity work"],
  "categoryWeights": {
    "presentation": 1.5,
    "confidence": 1.0,
    "styling": 1.2,
    "profileQuality": 1.0,
    "professionalism": 1.3
  }
}
```

### 10.3 How the AI Uses These Rules

1. The LLM prompt first presents the contestant's full text profile
2. Then it includes a `COMPETITION-SPECIFIC RULES` section with:
   - The competition title and description
   - The admin's free-text scoring guidelines (with a note that they take priority)
   - Parsed threshold rules in human-readable bullet points
3. Finally, it asks for the standard 5-category JSON response

This means the AI will produce **different scores for the same contestant in different competitions**, depending on what the admin configured — just like different real-world pageants have different judging criteria.
