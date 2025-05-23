#!/usr/bin/env python3
"""
trichmind_app.py

Responsive Streamlit app matching your mobile prototype,
with centered, scrollable content, generous margins,
justified text in containers, and a permanently visible bottom nav on mobile.
"""
import os
import datetime
import sqlite3
import joblib
import pandas as pd
import streamlit as st
import seaborn as sns

# PAGE CONFIG & CUSTOM STYLES
LOGO = "assets/logo.png"
ICON = LOGO if os.path.exists(LOGO) else "🧠"
st.set_page_config("TrichMind", page_icon=ICON, layout="centered")

st.markdown("""
<style>
/* Fill height, allow scroll */
.stApp {
  min-height: 100vh !important;
  overflow-y: auto !important;
  background: #eaf6f6;
}
/* Center and pad content, with max-width for readability */
.main .block-container {
  max-width: 650px !important;
  margin: 2.5rem auto 0 auto !important;
  padding: 1.8rem 1.2rem 8rem 1.2rem !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f5fcfc;
  border-radius: 16px;
  box-shadow: 0 2px 16px 0 rgba(44,62,80,.07);
}
/* Logo */
.stImage {
  margin-bottom: 1.5rem !important;
}
/* Content cards/containers: center and justify text */
.card-ctn {
  width: 100%;
  max-width: 480px;
  margin: 1.2rem auto 1.7rem auto;
  padding: 1.1rem 1.3rem;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 8px 0 rgba(0,0,0,.08);
  text-align: justify;
}
.card-ctn h2, .card-ctn h4, .card-ctn small {
  text-align: center !important;
}
.card-risk {
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: .5px;
  margin-bottom: 0.4rem;
}
@media (max-width: 650px) {
  .main .block-container {
    max-width: 99vw !important;
    margin: 0.3rem !important;
    padding: 1.1rem 0.2rem 6.7rem 0.2rem !important;
    border-radius: 0;
  }
  .card-ctn { max-width: 98vw; }
}
@media (max-width: 400px) {
  .main .block-container {
    padding: 0.4rem 0.1rem 6rem 0.1rem !important;
  }
  .card-ctn {
    padding: 0.7rem 0.2rem;
    font-size: .97rem;
  }
  .card-risk { font-size: 1.1rem; }
}
/* Pin bottom nav (tabs) on mobile ONLY, below content and above footer */
@media (max-width: 700px) {
  .stTabs {
    position: fixed !important;
    bottom: 48px !important;
    left: 0 !important;
    width: 100vw !important;
    background: #e0f2f1 !important;
    z-index: 9999 !important;
    border-top: 1.5px solid #b0c7c7 !important;
    box-shadow: 0 -1px 8px #b0c7c775;
  }
  .stTabs [role="tab"] {
    flex: 1 !important;
    text-align: center !important;
    padding: .9rem 0 .7rem 0 !important;
    margin: 0 !important;
    font-size: 1.1rem !important;
  }
}
.stButton > button {
  background: #26A69A !important;
  color: #fff !important;
  margin: 0.6rem auto !important;
  padding: 0.7rem 1.4rem !important;
  font-size: 1.1rem !important;
  border-radius: 0.6rem !important;
}
.stButton > button:hover {
  background: #80CBC4 !important;
}
</style>
""", unsafe_allow_html=True)

if os.path.exists(LOGO):
    st.image(LOGO, use_container_width=True)

sns.set_theme(style="whitegrid")

# 2) LOAD DATA & MODEL
@st.cache_resource
def load_data_and_model():
    conn = sqlite3.connect("ttm_database.db")
    demo      = pd.read_sql("SELECT * FROM demographics_enriched", conn).set_index("id")
    beh       = pd.read_sql("SELECT * FROM behaviour_enriched",    conn).set_index("id")
    cps_flags = pd.read_sql("SELECT * FROM effective_coping_strategies_flags", conn)
    conn.close()
    df = demo.join(beh, how="inner", on="id", validate="one_to_one").reset_index()
    numeric_cols = [c for c in df.select_dtypes(include=["int64","float64"]).columns if c!="id"]
    best_model = joblib.load("models/best_model.pkl")
    label_enc  = joblib.load("models/label_encoder.pkl")
    return df, cps_flags, best_model, label_enc, numeric_cols

df, cps_flags, best_model, label_enc, numeric_cols = load_data_and_model()

tabs = st.tabs([
    "🏠 Home", "📅 Daily Log", "🛠 Coping Tools", "📓 Journal & Progress", "💬 Chat"
])

# ---- HOME ----
with tabs[0]:
    st.subheader("Relapse Risk", anchor=False)
    latest = df.sort_values("id").iloc[-1]
    Xl     = pd.DataFrame([latest[numeric_cols]], columns=numeric_cols)
    pred   = best_model.predict(Xl)[0]
    risk   = label_enc.inverse_transform([pred])[0].upper()
    cmap   = {"LOW":"#A5D6A7","MODERATE":"#FFF59D","HIGH":"#EF9A9A"}
    st.markdown(
        f"""
        <div class='card-ctn' style="background:{cmap[risk]};">
            <div class='card-risk'>{risk}</div>
            <small>As of today</small>
        </div>
        """, unsafe_allow_html=True
    )

    st.markdown("<div class='card-ctn'><b>Today's Entries</b><br>", unsafe_allow_html=True)
    cnt = df[df["id"]==latest["id"]].shape[0]
    st.metric("Entries recorded", cnt)
    st.markdown("</div>", unsafe_allow_html=True)

    if "hours_since_pull" in latest and "days_since_pull" in latest:
        h = int(latest["hours_since_pull"])
        d = int(latest["days_since_pull"])
        st.markdown(
            f"<div class='card-ctn'><b>No-Pull Streak</b><br>"
            f"⏱️ {h} hours ({d} days) since last pull</div>",
            unsafe_allow_html=True,
        )

    st.markdown("<div class='card-ctn'><b>Top Coping Strategies</b><ul style='text-align:left;'>", unsafe_allow_html=True)
    top5 = (
        cps_flags["feature"]
        .value_counts()
        .head(5)
        .index
        .tolist()
    )
    for strat in top5:
        st.markdown(f"<li style='margin-bottom:2px'>{strat}</li>", unsafe_allow_html=True)
    st.markdown("</ul></div>", unsafe_allow_html=True)

# ---- DAILY LOG ----
with tabs[1]:
    st.markdown("<div class='card-ctn'>", unsafe_allow_html=True)
    st.subheader("Daily Log", anchor=False)
    _ = st.selectbox("Mood", ["Anxious","Stressed","Calm","Happy"])
    _ = st.slider("Stress Level", 0, 10, 5)
    _ = st.slider("Pulling Urges", 0, 10, 3)
    _ = st.radio("Environment", ["Home","Work","Public","Other"])
    if st.button("Log Entry"):
        st.success("Entry saved!")
    st.markdown("</div>", unsafe_allow_html=True)

# ---- COPING TOOLS ----
with tabs[2]:
    st.markdown("<div class='card-ctn'>", unsafe_allow_html=True)
    st.subheader("Coping Tools", anchor=False)
    st.markdown("**AI-Recommended**", unsafe_allow_html=True)
    try:
        recs = top5[:2]
        c1, c2 = st.columns(2)
        with c1:
            st.markdown(f"<div style='padding:1rem;'><h4>{recs[0]}</h4></div>", unsafe_allow_html=True)
        with c2:
            st.markdown(f"<div style='padding:1rem;'><h4>{recs[1]}</h4></div>", unsafe_allow_html=True)
    except IndexError:
        st.info("No recommendations yet.")
    st.markdown("</div>", unsafe_allow_html=True)

# ---- JOURNAL & PROGRESS ----
with tabs[3]:
    st.markdown("<div class='card-ctn'>", unsafe_allow_html=True)
    st.subheader("Journal & Progress", anchor=False)
    sel = st.date_input("Select date", datetime.date.today())
    st.markdown(f"**Entries on {sel}:** {cnt}")
    st.info("Time-series charts coming soon.")
    st.markdown("</div>", unsafe_allow_html=True)

# ---- CHAT ----
with tabs[4]:
    st.markdown("<div class='card-ctn'>", unsafe_allow_html=True)
    st.subheader("Emotion Assistant", anchor=False)
    txt = st.text_input("How are you feeling?", "")
    if st.button("Send"):
        tl = txt.lower()
        if any(k in tl for k in ["stress","anxious"]):
            sugg = ["Deep breathing","Short walk","Guided meditation"]
        elif "sad" in tl:
            sugg = ["Listen to music","Write in journal"]
        else:
            sugg = ["Take a break","Call a friend"]
        for s in sugg:
            st.markdown(f"- {s}")
    st.markdown("</div>", unsafe_allow_html=True)

# ---- FOOTER ----
st.markdown(
    "<hr style='opacity:0.3;margin-top:1.5rem;'/>"
    "<p style='text-align:center;color:#555;margin-bottom:2.2rem;'>"
    "© 2025 TrichMind Research • Data remains anonymous</p>",
    unsafe_allow_html=True
)
# ---- END OF APP ----
