# 🧠 TrichMind Machine Learning Pipeline

## Overview

This module powers the **relapse risk prediction model** within the **TrichMind App** — a data-driven mental health support tool for trichotillomania sufferers.  
It processes behavioral, demographic, and emotional data into **machine-learning-ready features**, stores them in an SQLite database, and scales them for predictive modeling.

---

## ⚙️ Key Features

- **Automated Data Preprocessing**
  - Reads from the original 12 source tables in the local SQLite database.
  - Merges and engineers features from:
    - `hair_pulling_behaviours_&_patterns.csv`
    - `demographics.csv`
    - `emotions_before_pulling.csv`
  - Outputs a single ML-ready table:  
    ➜ `relapse_risk_model_features`

- **Feature Engineering**
  - Frequency & awareness encoding  
  - Derived metrics (years since onset, emotion intensity, etc.)  
  - Relapse risk tagging (`low`, `moderate`, `high`, `unknown`)

- **Normalization & Scaling**
  - Option to use either:
    - `StandardScaler` (default)
    - `MinMaxScaler` (for skewed data)
  - Fitted scaler saved as:
    ```
    ml/artifacts/models/scaler.pkl
    ```

- **Database Integration**
  - Final feature set stored in:
    ```
    ml/artifacts/database/ttm_database.db
    ```
  - Table name: `relapse_risk_model_features`

- **Detailed Logging**
  - Every run logged to:
    ```
    ml/artifacts/logs/preprocessing_log.txt
    ```

---

## 📁 Folder Structure

