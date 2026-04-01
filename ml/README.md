# <a href="https://trichmind.vercel.app/"><img src="assets/png/app_logo.png" width="100"></a> TrichMind - Relapse Risk Prediction for Trichotillomania

## Overview

**TrichMind** is a machine learning system designed to predict relapse risk levels (low, medium, high) for individuals experiencing Trichotillomania (TTM) — a body-focused repetitive behavior involving hair pulling.

The goal is not only prediction, but insight generation: identifying emotional, behavioral, and contextual patterns that contribute to urges, enabling personalized coping strategies and preventive interventions.

This project combines:

- Behavioral psychology insights
- Data engineering
- Machine learning modeling
- API deployment
- Explainable risk scoring

Ultimately, TrichMind aims to support people in understanding triggers, strengthening coping strategies, and reducing relapse likelihood.

---

## Problem Statement

Hair pulling behavior is often influenced by:

- emotional states (stress, boredom, anxiety)
- environmental context (home, work, night time)
- sensory triggers (hair texture, white hair)
- habits and awareness level
- coping mechanisms tried (fidget tools, therapy, journaling)
- comorbid conditions (OCD, ADHD, anxiety disorders)

However, individuals rarely have visibility into:

- which factors increase relapse risk
- which coping strategies work best
- how emotional intensity correlates with urges

**Key challenge**

Provide a predictive system that transforms survey data into:

1. relapse risk classification
2. interpretable feature importance
3. actionable behavioral insights

---

## ML Objective

Predict **relapse risk level:**

| **Class**  | **Meaning**                  |
| ---------- | ---------------------------- |
| low        | strong control over urges    |
| medium     | moderate vulnerability       |
| high       | strong likelihood of relapse |
|                                           |

Model output can be used to:

- personalize coping recommendations
- identify high-risk patterns
- support therapy progress tracking
- inform digital mental health tools

---

## Dataset Overview

The dataset combines 13 relational tables describing behavioral emotional, and demographic factors related to hair pulling.

### Database tables

| **table**                        | **description**                      |
| -------------------------------- | ------------------------------------ |
| demographics                     | age, gender, occupation, education   |
| hair_pulling_behaviours_patterns | frequency, awareness, severity       |
| emotions_before_pulling          | emotional triggers                   |
| emotions_after_pulling           | emotional outcomes                   |
| coping_strategies_tried          | attempted interventions              |
| effective_coping_strategies      | perceived effective tools            |
| pulling_triggers                 | environmental & sensory triggers     |
| pulling_environment              | where pulling occurs                 |
| activities                       | what person was doing during pulling |
| parts_of_the_body_pulled         | location patterns                    |
| other_mental_health_conditions   | comorbid conditions                  |
| seasons_affect_pulling_intensity | seasonal effects                     |
| relapse_risk_model_features      | unified ML feature table             |
|                                                                         |

---

## Exploratory Data Insights

**Pulling Behavior Patterns**

<a href="artifacts/eda/figures/behaviour_freq_awareness.png"><img src="artifacts/eda/figures/behaviour_freq_awareness.png" width="200" height="100"></a> <a href="artifacts/eda/figures/corr_heatmap.png"><img src="artifacts/eda/figures/corr_heatmap.png" width="200" height="100"></a>  <a href="artifacts/eda/figures/no_pull_streak_text.png"><img src="artifacts/eda/figures/no_pull_streak_text.png" width="200" height="100"></a>

Key observations:

- Most respondents report daily pulling
- Awareness is often partial ("Sometimes")
- Many participants struggle with stopping consistently
- Relapse cycles appear common

---

**Demographic Distribution**

<a href="artifacts/eda/figures/demographics.png"><img src="artifacts/eda/figures/demographics.png" width="300"></a>

Highlights:

- Mean age ≈ 32
- majority gender: Female
- most respondents located in USA
- many uncertain about family history of TTM

---

**Feature Relationships**

<a href="artifacts/preprocessed_outputs/figure-png/correlation_heatmap.png"><img src="artifacts/preprocessed_outputs/figure-png/correlation_heatmap.png" width="180" height="150"></a> <a href="artifacts/evaluation_outputs/figures/feature_importances.png"><img src="artifacts/evaluation_outputs/figures/feature_importances.png" height="150"></a>

Strong predictors:

- pulling_severity
- awareness_level
- years_since_onset
- emotional intensity
- trigger_count
- coping activity frequency

---

## Model Performance

**Confusion Matrix**

<a href="artifacts/evaluation_outputs/figures/confusion_matrix_combined.png"><img src="artifacts/evaluation_outputs/figures/confusion_matrix_combined.png" width="300" height="150"></a>

### Metrics

| **metric**   | **value** |
| ------------ | --------- |
| Accuracy     | 1.00      |
| F1-score     | 1.00      |
| CV F1        | 1.00      |
|                          |

**Important note:**

A perfect score is usually suspicious in machine learning.

Possible reasons:

- dataset size is small (122 samples)
- target label derived from rule-based severity thresholds
- model may memorize patterns instead of generalizing

This is called **overfitting**.

Future improvements should include:

- larger dataset
- longitudinal tracking
- external validation
- regularization tuning

---

## Feature Engineering Strategy
197 features created from relational tables.

**Feature groups**

Behavioral patterns
- pulling_frequency_encoded
- awareness_level_encoded
- successfully_stopped_encoded
- years_since_onset

Emotional intensity signals
- stress
- anxious
- depress
- bored
- lonely
- worried
- overwhelmed

Coping effectiveness
- support_groups
- therapy_counseling
- journaling
- fidget_toys
- exercise

Environmental triggers
- social_situations
- overstimulation
- understimulation
- sensory triggers

### Derived aggregate features

| **feature**               | **meaning**                     |
| ------------------------- | ------------------------------- |
| emotion_intensity_sum     | cumulative emotional activation |
| coping_activity_sum       | engagement with coping tools    |
| trigger_count             | number of known triggers        |
| years_since_onset         | chronicity indicator            |
| how_long_stopped_days_est | resilience metric               |
|                                                             |

---

## Project Structure
```
ML
│
├── api
│   ├── api.py
│   ├── inference_schemas.py
│
├── artifacts
│   ├── database
│   ├── eda
│   ├── preprocessed_outputs
│   ├── training_outputs
│   ├── tuning_outputs
│   ├── evaluation_outputs
│   ├── testing_outputs
│
├── assets
│   ├── csv_files
│   ├── png
│
├── common
│   ├── config.py
│   ├── utils.py
│   ├── column_selector.py
│   ├── risk_thresholds.py
│   ├── model_registry.py
│
├── scripts
│   ├── build_db.py
│   ├── data_preprocessing.py
│   ├── eda.py
│   ├── train.py
│   ├── model_validation.py
│   ├── model_evaluation.py
│   ├── test_model.py
│
├── Dockerfile
├── Dockerfile.dev
├── requirements.txt
├── runtime.txt
```
---

## Pipeline Flow
```
CSV files
   ↓
build_db.py
   ↓
SQLite database
   ↓
data_preprocessing.py
   ↓
feature engineering
   ↓
EDA
   ↓
train.py
   ↓
model tuning
   ↓
evaluation
   ↓
FastAPI inference API
```

---

## Running the Project

**1. Install dependencies**

```
python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

---

**2. Build database**

```
python scripts/build_db.py
```

---

**3. Run preprocessing**

```
python scripts/data_preprocessing.py
```

**Outputs:**

```
artifacts/preprocessed_outputs/
    scaler_model/
    metadata/
    summary/
    figure-png/
```

---

**4. Run EDA**

```
python scripts/eda.py
```

**Outputs:**

```
artifacts/eda/
    figures/
    report/
    summary/
```

---

**5. Train model**

```
python scripts/train.py
```

**Outputs:**

```
artifacts/training_outputs/
    models/
    label_encoder/
    metrics_csv/
    performance_history/
    splits/
```

---

**6. Evaluate model**

```
python scripts/model_evaluation.py
```

**Outputs:**

```
artifacts/evaluation_outputs/
    figures/
    reports/
```

---

**7. Run API locally**

```
uvicorn api.api:app --reload
```

**API endpoint:**

```
POST /predict_friendly
```

---

## Run with Docker

**dev mode**

```
docker build -f Dockerfile.dev -t trichmind-ml-dev .
docker run -p 8000:8000 trichmind-ml-dev
```

---

**production mode**

```
docker build -f Dockerfile -t trichmind-ml .
docker run -p 8000:8000 trichmind-ml
```

---

## API Usage

**Example request:**

```
POST /predict_friendly

{
 "age": 42,
 "age_of_onset": 27,
 "years_since_onset": 15,
 "pulling_severity": 9,
 "pulling_frequency": "daily",
 "pulling_awareness": "sometimes",
 "successfully_stopped": "yes",
 "how_long_stopped_days": 6,
 "emotion": "stress"
}
```

**Response:**

```
{
    "risk_score": 0.728,
    "risk_bucket": "high",
    "risk_code": 2,
    "confidence": 0.455,
    "n_features_used": 197,
    "model_version": "best_tuned_model_v1.pkl",
    "runtime_sec": 0.182,
    "debug": {
        "model_score": 0.999,
        "rule_score": 0.457,
        "alpha": 0.5
    }
}
```

**Postman collection included:**

```
TrichMind_Risk_API.postman_collection.json
```

---

## Interpreting Model Insights

**Key Risk Factors**

emotional drivers
- anxiety
- boredom
- loneliness
- mindless habit loops

sensory triggers
- coarse hair
- white hair
- scalp irritation

situational triggers
- night time
- inactivity
- phone use
- studying

protective behaviors
- fidget tools
- support groups
- therapy
- journaling
- habit tracking

---

## Example Insights Generated

| **pattern**                      | **interpretation**         |
| -------------------------------- | -------------------------- |
| high boredom + understimulation  | urge occurs when idle      |
| high anxiety + social situations | emotional overload trigger |
| high mindless_habit              | automatic pulling behavior |
| high coping_activity_sum         | protective factor          |
| high trigger_count               | vulnerability indicator    |
|                                                               |

---

## Limitations

**dataset size**
122 samples is relatively small for ML.

**risk of overfitting**

perfect accuracy may indicate:
- model memorization
- rule-based target leakage
- insufficient generalization testing

**bias**

dataset mostly female respondents.

**self-reported data**

may include subjective bias.

---

## Future Improvements

modeling
- longitudinal data
- time-series modeling
- probabilistic relapse forecasting
- survival analysis

features
- wearable sensor data
- daily mood logs
- sleep patterns
- habit streak tracking

evaluation
- cross-population validation
- real-world testing

---

## Ethical Considerations

This model:

does *NOT* diagnose medical conditions.

It provides:
- risk estimation
- pattern insights
- decision support

Should be used alongside:
- therapy
- self-awareness tools
- mental health support

---

## Author Notes

Building this model highlights a common truth in ML:

*A perfect score does not always mean a perfect model.*

When data is limited, models can appear highly accurate while lacking robustness.

The goal is not perfection - it is **useful insight**.

If this model helps even one person better understand their triggers and feel more in control, it has value.

---

## 📜 License

MIT License

---

## Contributions

Ideas welcome:
- new features
- better modeling approaches
- behavioral insights
- UX improvements

---

## Final Thought

Hair pulling is often misunderstood as lack of control.

In reality, it is often a response to:
- emotional overload
- sensory discomfort
- habit reinforcement loops

Understanding patterns is the first step toward change.

TrichMind exists to make those patterns visible.