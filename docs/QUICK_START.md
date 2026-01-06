# DSS Lite - Quick Start Guide

## Get Running in 5 Minutes

### 1. Installation (First Time Only)

```bash
# Navigate to the project folder
cd dss-lite-app

# Install dependencies (takes 2-3 minutes)
npm install

# Start the development server
npm start
```

The app will automatically open in your browser at `http://localhost:3000`

---

## 2. Upload Your First Data

### Option A: Use Sample Data (Testing)

Create a simple CSV file called `sample_registrations.csv`:

```csv
EID,VID,Sex,DOB,Birth Status,Weight,Date,ProcessID
12345,R001,M,2024-08-15,Single,5.2,2024-11-10,BKB126
12346,R002,F,2024-08-16,Twin,4.8,2024-11-10,BKB126
12347,R003,M,2024-08-17,Single,5.5,2024-11-10,BKB126
```

Create `sample_w2.csv`:

```csv
EID,Date,W2
12345,2025-01-05,42.5
12346,2025-01-05,38.2
12347,2025-01-05,45.1
```

### Option B: Use Your Real Data

Make sure your files have these columns:

**For Registrations (minimum):**
- EID or VID
- Date
- Weight (optional for BKB126)

**For W2:**
- EID or VID
- Date
- W2

---

## 3. Configure Limits (Critical Step!)

Before calculating, go to **Configuration** tab and set your limits.

### Quick Configuration Example (Merino sheep):

#### W1 (First Weight - at ~4 months)
- Operator: **Between**
- Lower Limit 2: `25`
- Lower Limit: `30`
- Upper Limit: `40`
- Upper Limit 2: `45`

#### W2 (Second Weight - at ~12 months)
- Operator: **Between**
- Lower Limit 2: `35`
- Lower Limit: `40`
- Upper Limit: `55`
- Upper Limit 2: `60`

#### ADG (Average Daily Gain)
- Operator: **Greater**
- Lower Limit: `0.15` (150g/day)
- Lower Limit 2: `0.10` (100g/day)

#### BCS (Body Condition Score)
- Already configured: `2-2.5-3.5-4`

#### Wool Micron
- Operator: **Less**
- Upper Limit: `19` (finer is better)
- Upper Limit 2: `21`

**Save Configuration** when done!

---

## 4. Calculate & Review

1. Go back to **Upload Data** tab
2. Click the big green **"Calculate"** button
3. Go to **Main Table** to see all animals with their DSS marks
4. Go to **Dashboard** to see summary statistics

---

## 5. Export Results

In the **Main Table** tab:
- Click **"Export to Excel"**
- File will download as `DSS_Lite_Main_Table_YYYY-MM-DD.xlsx`
- Share this with your farmer!

---

## Typical Workflow

```
┌─────────────────────────────────────────────┐
│ 1. UPLOAD DATA                              │
│    - Registrations (birth data)             │
│    - W1, W2 (weights)                       │
│    - Fleece weights                         │
│    - Wool tests (WTB or OFDA)               │
│    - Visual scores                          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. CONFIGURE LIMITS (first time only)       │
│    - Set optimal & acceptable ranges        │
│    - Enable/disable criteria                │
│    - Set classification points              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. CALCULATE                                │
│    - Click "Calculate" button               │
│    - System aggregates all data             │
│    - Calculates DSS marks                   │
│    - Classifies animals                     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. REVIEW & EXPORT                          │
│    - Check Main Table for details           │
│    - Review Dashboard for trends            │
│    - Export to Excel                        │
│    - Share with farmer                      │
└─────────────────────────────────────────────┘
```

---

## Quick Checklist

### Before First Use:
- [ ] npm install completed successfully
- [ ] App opens in browser at localhost:3000
- [ ] All 4 tabs visible (Upload, Main Table, Configuration, Dashboard)

### For Each New Dataset:
- [ ] Upload event data files (CSV/Excel)
- [ ] Green checkmarks show on uploaded events
- [ ] Configuration limits are set (or use existing)
- [ ] Click "Calculate" button
- [ ] Main Table shows animals with DSS marks
- [ ] Dashboard shows classification distribution
- [ ] Export to Excel works

---

## Common Questions

### Q: Do I need to upload all event types?
**A:** No! Minimum is just registrations OR weights. More data = more accurate DSS marks, but system works with partial data.

### Q: What if an animal is missing some data?
**A:** That's fine. Missing criteria simply score 0 points. Animal still gets classified based on available data.

### Q: Can I change limits after calculating?
**A:** Yes! Change configuration and click "Calculate" again. Results update immediately.

### Q: What's the difference between WTB and OFDA?
**A:** Both are wool testing methods. Use whichever your lab provides. Don't upload both for the same animals.

### Q: How do I know if my limits are good?
**A:** Check the Dashboard after first calculation. Look at:
- Average metrics (should be realistic for your flock)
- Distribution (should have a bell curve, not all in one category)
- Adjust limits if too many culls or too many studs

### Q: What does "Cull Criterion" mean?
**A:** If enabled, an animal that fails this criterion is automatically culled, regardless of other scores. Use for critical issues only (e.g., severe conformation defect).

---

## Getting Help

1. **Check the full README.md** for detailed documentation
2. **Review sample data format** in this guide
3. **Test with small dataset** (5-10 animals) first
4. **Compare with Excel version** for validation

---

## Next Steps After Mastering Basics

- **Fine-tune your limits** based on breeding goals
- **Add more event types** for comprehensive evaluation
- **Use cull criteria** strategically
- **Compare year-over-year** by keeping historical exports
- **Share best practices** with your DSS team

---

**You're ready to go! Start with sample data, then switch to real data once comfortable.**

Good luck! 🐑 📊 🚀
