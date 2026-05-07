<div align=center>
<a href="https://trichmind.vercel.app/">
<img src="ml/assets/png/app_logo.png" width="100">
</a>
<h3 align="center">
AI-Powered Relapse Risk Prediction & Behavioral Insight Platform for Trichotillomania
</h3>
</div>

---

<p align="center">
  <strong>Machine Learning • Mental Health Technology • Behavioral Analytics • Full-Stack Web Platform</strong>
</p>

<p align="center">
  <a href="https://trichmind.vercel.app">🌐 Live App</a>
  ·
  <a href="#features">✨ Features</a>
  ·
  <a href="#architecture">🏗 Architecture</a>
  ·
  <a href="#installation">⚙️ Installation</a>
  ·
  <a href="#api-overview">🧠 API</a>
</p>

</div>

---

# Overview

**TrichMind** is a full-stack AI-powered behavioral health platform focused on understanding and predicting relapse risk patterns associated with **Trichotillomania (TTM)** - a body-focused repetitive behavior disorder characterized by recurrent hair pulling.

The platform combines:

* Behavioral psychology concepts
* Machine learning risk prediction
* Emotional trigger analysis
* Explainable risk scoring
* Habit & relapse pattern insights
* Interactive dashboards
* Modern web technologies
* REST API architecture
* Dockerized deployment infrastructure

Rather than focusing only on prediction, TrichMind was designed to help users better understand:

* emotional triggers
* behavioral loops
* environmental patterns
* urge intensity
* relapse tendencies
* coping strategy effectiveness

The long-term vision behind TrichMind is to create supportive digital tools that improve self-awareness, encourage healthier coping behaviors, and reduce relapse frequency over time.

---

# Live Application

### 🌐 Production App

**Frontend:**

[https://trichmind.vercel.app](https://trichmind.vercel.app)

---

## Demo Login

For demonstration purposes:

```txt
Email: trichmind.app@gmail.com
Password: mydemo
```

> Demo access is intended for viewing the application experience and testing platform functionality.

---

# Why TrichMind Was Built

Trichotillomania is frequently misunderstood.

Hair pulling behavior is often associated with:

* anxiety
* stress
* boredom
* emotional overload
* sensory discomfort
* understimulation
* habit reinforcement cycles
* dissociation or reduced awareness

Many individuals experiencing TTM struggle to identify:

* what triggers urges
* when relapse risk increases
* which coping strategies actually help
* how emotional intensity affects behavior
* what environmental patterns contribute to pulling

TrichMind attempts to bridge this gap using data science and behavioral analysis.

The project was developed as a combination of:

* machine learning engineering
* full-stack software development
* data engineering
* mental health analytics
* explainable AI concepts
* user-centered design

---

# Core Features

## 🧠 AI Relapse Risk Prediction

Predicts relapse risk levels:

| Risk Level | Meaning                                  |
| ---------- | ---------------------------------------- |
| Low        | Stronger urge control and stability      |
| Medium     | Moderate vulnerability to relapse        |
| High       | Increased likelihood of relapse behavior |

Predictions combine:

* emotional indicators
* pulling behavior patterns
* trigger frequency
* environmental factors
* coping activities
* awareness levels
* severity scores

---

## 📊 Behavioral Pattern Analysis

Analyzes behavioral patterns such as:

* pulling frequency
* awareness level
* severity progression
* emotional states before pulling
* emotional states after pulling
* relapse streaks
* environmental triggers
* daily habit patterns

---

## 🧩 Explainable Risk Insights

TrichMind does not only return a prediction.

The platform also provides interpretable insights into:

* what contributed to risk
* protective behaviors
* emotional drivers
* potential trigger combinations
* coping effectiveness

---

## 📈 Data Visualization

The project includes:

* correlation heatmaps
* confusion matrices
* feature importance visualizations
* demographic distributions
* behavioral frequency plots
* model evaluation charts

---

## 🔗 Full-Stack Architecture

The repository includes:

### Frontend

* Next.js
* React
* TypeScript
* Styled Components
* Recharts

### Backend

* Node.js
* Express.js
* TypeScript
* MongoDB
* JWT Authentication

### Machine Learning Service

* FastAPI
* Scikit-learn
* XGBoost
* TensorFlow/Keras
* Pandas & NumPy

---

# Tech Stack

## Frontend

| Technology        | Purpose            |
| ----------------- | ------------------ |
| Next.js           | React framework    |
| React             | UI development     |
| TypeScript        | Type-safe frontend |
| Styled Components | Styling system     |
| Axios             | API requests       |
| Recharts          | Charts & analytics |
| React Toastify    | Notifications      |

---

## Backend

| Technology    | Purpose             |
| ------------- | ------------------- |
| Node.js       | Runtime environment |
| Express.js    | REST API server     |
| TypeScript    | Backend typing      |
| MongoDB Atlas | Database            |
| Mongoose      | ODM                 |
| JWT           | Authentication      |
| bcrypt        | Password hashing    |
| Nodemailer    | Email support       |
| OpenAI SDK    | AI integrations     |

---

## ML / AI Service

| Technology       | Purpose                   |
| ---------------- | ------------------------- |
| FastAPI          | ML inference API          |
| Scikit-learn     | ML pipelines              |
| XGBoost          | Risk classification       |
| TensorFlow/Keras | Deep learning experiments |
| Pandas           | Data processing           |
| NumPy            | Numerical operations      |
| Joblib           | Model serialization       |
| Uvicorn          | ASGI server               |

---

## DevOps & Deployment

| Technology      | Purpose                     |
| --------------- | --------------------------- |
| Docker          | Containerization            |
| Docker Compose  | Multi-service orchestration |
| Vercel          | Frontend deployment         |
| Render / Docker | ML API deployment           |
| MongoDB Atlas   | Cloud database              |
| GitHub          | Version control             |

---

# System Architecture

```text
┌────────────────────┐
│     Frontend       │
│  Next.js + React   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  Node.js Backend   │
│ Express + JWT API  │
└─────────┬──────────┘
          │
          ├──────────────┐
          │              │
          ▼              ▼
┌────────────────┐  ┌──────────────────┐
│ MongoDB Atlas  │  │ FastAPI ML API   │
│ User & App DB  │  │ Risk Prediction  │
└────────────────┘  └─────────┬────────┘
                               │
                               ▼
                     ┌─────────────────┐
                     │ Trained Models  │
                     │ XGBoost / SKL   │
                     └─────────────────┘
```

---

# Repository Structure

```text
TrichMind/
│
├── client/                     # Next.js frontend
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── server/                     # Node.js backend
│   ├── src/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   └── tsconfig.json
│
├── ml/                         # ML inference & training service
│   ├── api/
│   ├── artifacts/
│   ├── assets/
│   ├── common/
│   ├── scripts/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── requirements.txt
│   └── runtime.txt
│
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
```

---

# Machine Learning Pipeline

The ML pipeline processes behavioral survey data into structured predictive features.

## Pipeline Flow

```text
CSV Files
   ↓
Database Construction
   ↓
Feature Engineering
   ↓
EDA & Visualization
   ↓
Model Training
   ↓
Validation & Evaluation
   ↓
Inference API
   ↓
Frontend Predictions
```

---

# Dataset Overview

The dataset combines multiple behavioral and emotional dimensions related to Trichotillomania.

## Main Dataset Tables

| Table                            | Description                        |
| -------------------------------- | ---------------------------------- |
| demographics                     | Age, gender, occupation, education |
| hair_pulling_behaviours_patterns | Frequency, severity, awareness     |
| emotions_before_pulling          | Emotional triggers                 |
| emotions_after_pulling           | Emotional outcomes                 |
| coping_strategies_tried          | Attempted coping methods           |
| effective_coping_strategies      | Most effective interventions       |
| pulling_triggers                 | Environmental & sensory triggers   |
| pulling_environment              | Pulling locations                  |
| activities                       | Activities during pulling          |
| parts_of_the_body_pulled         | Pulling locations on body          |
| other_mental_health_conditions   | Comorbid conditions                |
| seasons_affect_pulling_intensity | Seasonal impact                    |

---

# Feature Engineering

The project generates nearly 200 engineered features from relational behavioral data.

## Feature Categories

### Behavioral Features

* pulling frequency
* awareness level
* successfully stopped
* years since onset
* streak duration

### Emotional Signals

* stress
* anxiety
* boredom
* loneliness
* overwhelm
* sadness

### Environmental Triggers

* social situations
* overstimulation
* understimulation
* nighttime pulling
* studying
* phone usage

### Coping Features

* journaling
* therapy
* fidget tools
* exercise
* support groups
* meditation

---

# Exploratory Data Analysis

The repository includes extensive exploratory analysis.

## Key Findings

### Pulling Frequency

Many participants reported:

* daily pulling behavior
* difficulty stopping consistently
* partial awareness during episodes
* recurring relapse cycles

### Emotional Correlation

Strong emotional predictors included:

* stress
* anxiety
* boredom
* emotional overwhelm

### Risk Indicators

Important predictive features:

* severity level
* awareness level
* trigger count
* emotional intensity
* coping engagement
* years since onset

---

# Model Performance

## Current Results

| Metric              | Score |
| ------------------- | ----- |
| Accuracy            | 1.00  |
| F1 Score            | 1.00  |
| Cross Validation F1 | 1.00  |

---

## Important ML Note

A perfect score in machine learning is often a warning sign.

Possible reasons include:

* small dataset size
* rule-derived labels
* overfitting
* memorization instead of generalization

This project openly acknowledges those limitations.

Future improvements should include:

* larger datasets
* longitudinal behavioral tracking
* real-world validation
* external testing populations
* stronger regularization

The intention of this project is not medical diagnosis.

It is a behavioral insight and risk estimation system.

---

# Frontend Overview

The frontend was built using:

* Next.js
* React
* TypeScript
* Styled Components

## Frontend Features

* responsive UI
* mobile-friendly layout
* dashboard views
* analytics charts
* authentication flow
* API integration
* relapse risk visualization
* bottom navigation for mobile UX

---

# Backend Overview

The Node.js backend manages:

* authentication
* API routing
* MongoDB integration
* JWT sessions
* email functionality
* OpenAI integrations
* user progress endpoints
* client-to-ML communication

---

# ML API Overview

The FastAPI service handles:

* inference requests
* preprocessing
* risk scoring
* model loading
* prediction formatting
* confidence calculations

## Example Endpoint

```http
POST /predict_friendly
```

---

# Example Prediction Request

```json
{
  "age": 28,
  "years_since_onset": 10,
  "pulling_severity": 8,
  "pulling_frequency": "daily",
  "pulling_awareness": "sometimes",
  "successfully_stopped": "no",
  "emotion": "stress"
}
```

---

# Example Response

```json
{
  "risk_score": 0.72,
  "risk_bucket": "high",
  "confidence": 0.45,
  "n_features_used": 197,
  "runtime_sec": 0.18
}
```

---

# Installation

## Prerequisites

Before running the project locally, install:

* Node.js 22+
* Python 3.13+
* Docker Desktop
* MongoDB Atlas account (optional for local dev)
* Git

---

# Local Development Setup

## 1. Clone Repository

```bash
git clone https://github.com/girlierazon84/TrichMind.git
cd TrichMind
```

---

## 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend runs on:

```txt
http://localhost:3000
```

---

## 3. Backend Setup

```bash
cd server
npm install
npm run dev
```

Backend runs on:

```txt
http://localhost:8080
```

---

## 4. ML Service Setup

```bash
cd ml
python -m venv .venv
```

### Windows

```bash
.venv\Scripts\activate
```

### macOS / Linux

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run ML API:

```bash
uvicorn api.api:app --reload --host 0.0.0.0 --port 8000
```

ML API runs on:

```txt
http://localhost:8000
```

---

# Docker Setup

The repository includes:

* production Dockerfiles
* development Dockerfiles
* multi-service docker-compose configuration

---

## Development Mode

```bash
docker-compose -f docker-compose.dev.yml up --build
```

---

## Production Mode

```bash
docker-compose up --build
```

---

# Environment Variables

Environment configuration files are intentionally excluded from public documentation for security reasons.

The project uses separate environment configurations for:

* frontend
* backend
* machine learning service
* Docker deployments
* production deployment

Typical environment variables include:

* API URLs
* MongoDB connection strings
* JWT secrets
* SMTP credentials
* OpenAI configuration
* CORS origins
* model paths
* deployment configuration

> Never commit real secrets or production credentials to public repositories.

---

# API Architecture

## Frontend → Backend

The frontend communicates with the Node.js backend for:

* authentication
* user management
* protected routes
* progress tracking
* dashboard data

---

## Backend → ML API

The backend forwards behavioral data to the FastAPI service for:

* preprocessing
* inference
* risk scoring
* prediction analysis

---

# Deployment

## Frontend Deployment

Hosted on:

### Vercel

```txt
https://trichmind.vercel.app
```

---

## ML Deployment

Configured for:

* Docker deployment
* Render-compatible deployment
* persistent model artifacts

---

# Included Project Assets

The repository includes:

* trained ML models
* evaluation reports
* visualizations
* confusion matrices
* preprocessing outputs
* metadata exports
* Postman collection
* Docker configurations
* API schemas

---

# Ethical Considerations

TrichMind is **not a medical diagnostic system**.

The platform is intended for:

* behavioral insight
* educational analysis
* self-awareness support
* experimental AI research
* relapse pattern exploration

It should not replace:

* licensed therapy
* psychiatric care
* professional mental health treatment

---

# Project Goals

Future development goals include:

## AI & Modeling

* longitudinal behavioral prediction
* time-series relapse modeling
* wearable integrations
* reinforcement learning experiments
* explainable AI dashboards

## Platform Features

* personalized coping recommendations
* mood tracking
* relapse streak tracking
* journaling system
* mobile-first UX
* gamified urge interruption tools

## Data Improvements

* larger datasets
* broader demographic representation
* improved class balancing
* real-world validation

---

# Challenges Faced During Development

Some of the major engineering challenges included:

* merging behavioral relational datasets
* engineering meaningful mental health features
* preventing target leakage
* handling small datasets
* designing explainable risk scoring
* coordinating frontend/backend/ML communication
* Docker orchestration across services
* deployment compatibility between platforms

---

# What Makes This Project Unique

TrichMind is not just another ML classifier.

This project combines:

* mental health awareness
* behavioral analytics
* machine learning engineering
* full-stack architecture
* explainable AI
* human-centered design

The project attempts to approach mental health technology with empathy rather than treating users like generic data points.

---

# Screenshots & Visualizations

The repository contains:

* EDA figures
* feature importance charts
* confusion matrices
* dashboard visualizations
* application branding assets

Example locations:

```text
ml/artifacts/eda/figures/
ml/artifacts/evaluation_outputs/figures/
ml/assets/png/
```

---

# Contributing

Contributions, ideas, and improvements are welcome.

Possible contribution areas:

* UI/UX improvements
* model optimization
* explainability tools
* accessibility
* behavioral analytics
* deployment improvements
* mobile support
* visualization enhancements

---

# License

MIT License

---

# Author

Developed by:

### Girlie Razon

Data Science & Full-Stack Development

Focused on:

* machine learning
* AI systems
* behavioral analytics
* full-stack engineering
* mental health technology

GitHub:

```txt
https://github.com/girlierazon84
```

---

# Final Thoughts

Trichotillomania is often misunderstood as a lack of self-control.

In reality, it is frequently connected to:

* emotional overload
* sensory regulation
* stress relief patterns
* subconscious habit loops
* coping behavior reinforcement

Understanding patterns is often the first step toward meaningful change.

TrichMind was built with the hope that technology can be used not only to predict behavior — but to help people better understand themselves.

---

# Repository

GitHub Repository:

```txt
https://github.com/girlierazon84/TrichMind
```
