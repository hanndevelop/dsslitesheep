# DSS Lite - Automated Livestock Decision Support System

A modern web application for automating livestock performance evaluation and classification based on the DSS (Decision Support System) methodology used by BKB (South Africa).

## Features

### ✅ Phase 1A - Core Functionality (COMPLETE)

#### 1. **Multi-Event Data Upload**
- Upload CSV/Excel files for different event types:
  - **Registrations** (BKB101, BKB126) - Animal birth/registration with optional weaning weight
  - **W1** (BKB118, BKB107) - First weight measurement
  - **W2** (BKB116) - Second weight (always final body weight)
  - **Fleece Weight** (BKB117) - Shearing data
  - **WTB** - Wool Test Bureau results
  - **OFDA** - Alternative wool testing format
  - **Visual Scores** (BKB109, BKB114) - Conformation and wool marks
  - **BCS** - Body Condition Score
  - **Mother Reproduction** - Maternal performance data

#### 2. **Intelligent Data Aggregation**
- Automatically combines all event data per animal (by EID/VID)
- Calculates derived metrics:
  - **ADG** (Average Daily Gain) from W1, W2, and dates
  - **% Shorn Off BW** = (Fleece Weight / Final Body Weight) × 100
  - Handles both WTB and OFDA wool test formats

#### 3. **Configurable DSS Mark Calculation**
- **16 configurable criteria** with flexible operators:
  - **Between**: Traditional 4-limit system (optimal range + acceptable ranges)
  - **Greater Than**: For metrics where higher is better
  - **Less Than**: For metrics where lower is better
- Each criterion awards 0, 0.5, or 1 point based on value ranges
- **Cull criteria**: Immediate cull regardless of total score if failed
- Enable/disable individual criteria
- Adjustable classification thresholds per farmer

#### 4. **Animal Classification**
Based on total DSS Mark:
- **Stud** (default: ≥8 points) - Top breeding stock
- **Flock** (default: ≥6 points) - Breeding quality
- **2nd Flock** (default: ≥4 points) - Acceptable quality
- **Cull** (default: <4 points) - Below standard

#### 5. **Main Animal Table**
- Sortable, filterable data grid with all animals
- Search by EID, VID, or classification
- Click-through to detailed breakdown per animal
- Shows:
  - Identifiers (EID, VID, Barcode)
  - Key metrics (W1, W2, ADG, Fleece, BCS, etc.)
  - DSS Mark and Classification
  - Cull reason (if applicable)

#### 6. **Excel Export**
- One-click export of complete main table
- Includes all calculated fields
- Formatted and ready for sharing with farmers
- Timestamped filename

#### 7. **Interactive Dashboard**
- Summary cards (Total animals, counts per classification)
- **Pie chart**: Classification distribution
- **Bar chart**: DSS Mark distribution
- **Average metrics**: W1, W2, ADG, Fleece Weight, Wool Micron, BCS, DSS Mark
- Configuration summary

#### 8. **Configuration Panel**
- Adjust classification point thresholds
- Configure each criterion:
  - Enable/disable
  - Set operator (between/greater/less)
  - Set limit values (up to 4 limits per criterion)
  - Mark as cull criterion
- Save/reset configuration
- Visual feedback on unsaved changes

## Technology Stack

- **Frontend**: React 18
- **UI Framework**: Material-UI (MUI) 5
- **Charts**: Recharts
- **Excel Processing**: SheetJS (xlsx)
- **File Export**: FileSaver.js

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

The app will open at http://localhost:3000

## Usage Guide

### Step 1: Upload Event Data

1. Navigate to the **"Upload Data"** tab
2. Click "Upload" on each event type card
3. Select your CSV or Excel file
4. The system validates and loads the data
5. Green checkmark indicates successful upload
6. See record count on each card

### Step 2: Configure DSS Criteria (Optional)

1. Navigate to the **"Configuration"** tab
2. Adjust **Classification Points** if needed:
   - Default: Stud=8, Flock=6, 2nd Flock=4
3. Expand each criterion to configure:
   - **Enable/Disable** the criterion
   - Choose **Operator**: Between, Greater Than, or Less Than
   - Set **Limit Values**:
     - **Between**: Lower Limit 2, Lower Limit, Upper Limit, Upper Limit 2
     - **Greater**: Lower Limit (1pt), Lower Limit 2 (0.5pt)
     - **Less**: Upper Limit (1pt), Upper Limit 2 (0.5pt)
   - Mark as **Cull Criterion** if failure should force cull
4. Click **"Save Configuration"** to apply changes

### Step 3: Calculate DSS Marks

1. Return to **"Upload Data"** tab
2. Click **"Calculate"** button
3. System processes all data and calculates DSS marks
4. Navigate to other tabs to see results

### Step 4: View Results

#### Main Table
- See all animals with calculated DSS marks
- Sort by any column (click header)
- Filter using search box
- Click **ℹ️** icon for detailed breakdown
- Click **"Export to Excel"** to download

#### Dashboard
- View summary statistics
- See classification distribution pie chart
- Analyze DSS mark distribution
- Review average performance metrics

## File Format Guidelines

### CSV/Excel Column Headers

The system uses flexible column name matching. Use any of these variations:

#### Identifiers (recognized in any event type):
- **EID**: `EID`, `E.I.D`, `Electronic ID`, `Ear Tag`, `Eartag`
- **VID**: `VID`, `Visual ID`, `Tag Number`
- **Barcode**: `Barcode`, `Bar Code`
- **QRID**: `QR`, `QRID`, `QR Code`

#### Event-Specific Fields:

**Registration (BKB101/BKB126):**
- ProcessID, Tattoo/Herdmark, Sex, Birth Status, DOB, DAM, Sire, Weight, DSS Reg Group, DSS M Group

**Weights (W1/W2):**
- ID, Date, W1 (or Weight), W2 (or Weight)

**Fleece Weight (BKB117):**
- VID/EID/Barcode/QR, Date, FW (or Fleece Weight)

**WTB:**
- Job Number, Batch, Tag Reference, MFD, CV_MFD, Comfort Factor %, Yield %, CV Difference

**OFDA:**
- Animal Eartag, Mic Ave, CV Mic, CF %, Yield %, CV Difference

**Visual Scores:**
- VID/EID, Date, Conformation, Wool Mark

**BCS:**
- ID, Date, BCS

**Mother Reproduction:**
- ID, DAM ID, DSS Value, Dam Lifetime

## Calculation Logic

### DSS Mark Formula

For each enabled criterion:

1. **Get animal's value** for that metric
2. **Compare to limits** based on operator:
   
   **Between Operator:**
   - `Lower Limit ≤ value ≤ Upper Limit` → **1 point** (optimal)
   - `Lower Limit 2 ≤ value < Lower Limit` → **0.5 points** (acceptable below)
   - `Upper Limit < value ≤ Upper Limit 2` → **0.5 points** (acceptable above)
   - Otherwise → **0 points** (fail)
   
   **Greater Than Operator:**
   - `value ≥ Lower Limit` → **1 point** (optimal)
   - `value ≥ Lower Limit 2` → **0.5 points** (acceptable)
   - Otherwise → **0 points** (fail)
   
   **Less Than Operator:**
   - `value ≤ Upper Limit` → **1 point** (optimal)
   - `value ≤ Upper Limit 2` → **0.5 points** (acceptable)
   - Otherwise → **0 points** (fail)

3. **Sum all points** across enabled criteria = **Total DSS Mark**

4. **Check cull criteria**: If any criterion marked as "cull if failed" scores 0 points → Force classification to "Cull"

5. **Otherwise classify** based on total DSS Mark:
   - `DSS Mark ≥ Stud threshold` → **Stud**
   - `DSS Mark ≥ Flock threshold` → **Flock**
   - `DSS Mark ≥ 2nd Flock threshold` → **2nd Flock**
   - `DSS Mark < 2nd Flock threshold` → **Cull**

### Example Configuration

```
Criterion: W1 (First Weight)
Operator: Between
Lower Limit 2: 25 kg  (0.5 points)
Lower Limit:   30 kg  (1 point starts)
Upper Limit:   40 kg  (1 point ends)
Upper Limit 2: 45 kg  (0.5 points)

Animal with W1 = 35 kg → 1 point (optimal)
Animal with W1 = 27 kg → 0.5 points (acceptable)
Animal with W1 = 20 kg → 0 points (fail)
```

## Default Criteria Configuration

The system includes 13 pre-configured criteria with sensible defaults:

| # | Criterion | Operator | Default Limits | Cull? |
|---|-----------|----------|----------------|-------|
| 1 | W1 (First Weight) | Between | Not set | No |
| 2 | W2 (Second Weight) | Between | Not set | No |
| 3 | ADG (Average Daily Gain) | Greater | Not set | No |
| 4 | Fleece Weight | Greater | Not set | No |
| 5 | Clean Yield | Greater | Not set | No |
| 6 | % Shorn Off BW | Between | Not set | No |
| 7 | BCS (Body Condition) | Between | 2.5-3.5 (optimal), 2-4 (acceptable) | No |
| 8 | Conformation Score | Greater | ≥6 (optimal) | No |
| 9 | Wool Score | Greater | ≥6 (optimal) | No |
| 10 | Mother Reproduction | Greater | Not set | No |
| 11 | Comfort Factor | Greater | ≥98 (optimal) | No |
| 12 | Wool Micron | Less | ≤19 (optimal) | No |
| 13 | CV Difference | Less | ≤5 (optimal) | No |

**You must configure the "Not set" limits** in the Configuration panel based on your breeding objectives and flock characteristics.

## Tips & Best Practices

### Data Upload
- ✅ **Upload in logical order**: Registrations → Weights → Fleece → Wool tests → Scores
- ✅ **Consistent identifiers**: Use the same EID/VID format across all files
- ✅ **Date formats**: YYYY-MM-DD or Excel date format
- ✅ **Clean data**: Remove empty rows and ensure numeric fields are numbers

### Configuration
- ✅ **Start conservative**: Set wider acceptable ranges initially
- ✅ **Review averages**: Check Dashboard averages before setting limits
- ✅ **Iterative refinement**: Adjust limits based on your flock's performance
- ✅ **Use cull criteria sparingly**: Only for critical failures (e.g., poor temperament, severe defects)

### Workflow
1. Upload all available data for your animals
2. Calculate to see initial results
3. Review Dashboard to understand flock distribution
4. Adjust configuration based on breeding goals
5. Recalculate and compare results
6. Export main table for farmer reports

## Troubleshooting

### "No animals to display"
- ✅ Ensure you've uploaded at least registration or weight data
- ✅ Click "Calculate" button after uploading
- ✅ Check that files have matching EID/VID identifiers

### "Missing data" in breakdown
- ✅ Not all criteria need data for every animal
- ✅ Missing criteria simply award 0 points
- ✅ Upload additional event files to fill gaps

### Excel export is empty
- ✅ You must calculate DSS marks before exporting
- ✅ Check that browser allows downloads

## Future Enhancements (Phase 1B & 2)

### Phase 1B
- [ ] PDF report generation for farmers
- [ ] Customizable report templates
- [ ] Comparison view (year-over-year)
- [ ] Advanced filtering (by DSS reg group, test group, etc.)

### Phase 2
- [ ] Backend API for data persistence
- [ ] Multi-user authentication
- [ ] Historical data tracking
- [ ] Mobile-responsive data entry forms
- [ ] Batch configuration templates
- [ ] Email report delivery

## Support

For questions or issues:
1. Check this README first
2. Review the sample data formats
3. Test with a small dataset (10-20 animals) first
4. Contact DSS support team

## License

© 2025 BKB - Internal Use Only

---

**Built with ❤️ for South African livestock producers**
