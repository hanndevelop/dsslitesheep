import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Define colors - will update with cattle app colors once provided
const CLASSIFICATION_COLORS = {
  Stud: '#2e7d32',     // Green
  Flock: '#1976d2',    // Blue
  '2nd Flock': '#ed6c02', // Orange
  Cull: '#d32f2f',     // Red
  Grey: '#757575',     // Grey for other uses
};

function PDFReport({ open, onClose, data, configuration }) {
  const [reportDetails, setReportDetails] = useState({
    farmerName: '',
    farmName: '',
    reportDate: new Date().toISOString().split('T')[0],
    consultant: '',
    notes: '',
  });
  const [activeTab, setActiveTab] = useState(0);
  const [generating, setGenerating] = useState(false);
  
  const distributionChartsRef = useRef(null);
  const correlationChartsRef = useRef(null);

  // Prepare distribution data
  const prepareDistributionData = (field, binSize = null) => {
    const values = data
      .map((a) => a[field])
      .filter((v) => v !== null && v !== undefined && !isNaN(v));

    if (values.length === 0) return [];

    // For categorical data (scores), use as-is
    if (['conformationScore', 'woolScore', 'bcs', 'dssmark'].includes(field)) {
      const counts = {};
      values.forEach((v) => {
        const rounded = Math.round(v * 2) / 2; // Round to nearest 0.5
        counts[rounded] = (counts[rounded] || 0) + 1;
      });

      return Object.entries(counts)
        .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
        .map(([value, count]) => ({
          value: parseFloat(value),
          count,
          label: value.toString(),
        }));
    }

    // For continuous data, create histogram bins
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const numBins = binSize ? Math.ceil(range / binSize) : 10;
    const actualBinSize = range / numBins;

    const bins = Array(numBins).fill(0);
    const binLabels = [];

    for (let i = 0; i < numBins; i++) {
      const binStart = min + i * actualBinSize;
      const binEnd = min + (i + 1) * actualBinSize;
      binLabels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
    }

    values.forEach((v) => {
      const binIndex = Math.min(Math.floor((v - min) / actualBinSize), numBins - 1);
      bins[binIndex]++;
    });

    return bins.map((count, index) => ({
      label: binLabels[index],
      count,
      value: min + index * actualBinSize + actualBinSize / 2,
    }));
  };

  // Prepare correlation data
  const prepareCorrelationData = (xField, yField) => {
    return data
      .filter(
        (a) =>
          a[xField] !== null &&
          a[xField] !== undefined &&
          !isNaN(a[xField]) &&
          a[yField] !== null &&
          a[yField] !== undefined &&
          !isNaN(a[yField])
      )
      .map((a) => ({
        x: a[xField],
        y: a[yField],
        classification: a.classification,
      }));
  };

  // Distribution datasets
  const distributionDatasets = {
    w1: prepareDistributionData('w1', 5),
    w2: prepareDistributionData('w2', 5),
    fleeceWeight: prepareDistributionData('fleeceWeight', 0.5),
    woolMicron: prepareDistributionData('woolMicron', 1),
    comfortFactor: prepareDistributionData('comfortFactor', 2),
    cleanYield: prepareDistributionData('cleanYield', 2),
    conformationScore: prepareDistributionData('conformationScore'),
    woolScore: prepareDistributionData('woolScore'),
    bcs: prepareDistributionData('bcs'),
    dssmark: prepareDistributionData('dssmark'),
  };

  // Correlation datasets
  const correlationDatasets = {
    fleeceVsW2: prepareCorrelationData('w2', 'fleeceWeight'),
    fleeceVsMicron: prepareCorrelationData('woolMicron', 'fleeceWeight'),
    fleeceVsCVDiff: prepareCorrelationData('cvDifference', 'fleeceWeight'),
    cleanYieldVsFleece: prepareCorrelationData('fleeceWeight', 'cleanYield'),
    fleeceVsLength: prepareCorrelationData('fiberLength', 'fleeceWeight'),
    w2VsBCS: prepareCorrelationData('bcs', 'w2'),
  };

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // PAGE 1: FRONT PAGE
      // Add logo
      const logoImg = document.createElement('img');
      logoImg.src = '/dss-logo.png';
      await new Promise((resolve) => {
        logoImg.onload = resolve;
      });
      pdf.addImage(logoImg, 'PNG', 20, 20, 80, 30);

      // Title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DSS Lite Report', pageWidth / 2, 70, { align: 'center' });

      // Report details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      let yPos = 90;

      const details = [
        ['Farmer Name:', reportDetails.farmerName],
        ['Farm Name:', reportDetails.farmName],
        ['Report Date:', reportDetails.reportDate],
        ['Consultant:', reportDetails.consultant],
        ['Total Animals:', data.length.toString()],
      ];

      details.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value || 'N/A', 70, yPos);
        yPos += 8;
      });

      // Classification summary
      yPos += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Classification Summary:', 20, yPos);
      yPos += 10;

      const classificationCounts = data.reduce((acc, animal) => {
        acc[animal.classification] = (acc[animal.classification] || 0) + 1;
        return acc;
      }, {});

      Object.entries(classificationCounts).forEach(([classification, count]) => {
        const percentage = ((count / data.length) * 100).toFixed(1);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${classification}: ${count} (${percentage}%)`, 30, yPos);
        yPos += 7;
      });

      // Notes
      if (reportDetails.notes) {
        yPos += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Notes:', 20, yPos);
        yPos += 7;
        pdf.setFont('helvetica', 'normal');
        const splitNotes = pdf.splitTextToSize(reportDetails.notes, pageWidth - 40);
        pdf.text(splitNotes, 20, yPos);
      }

      // Footer
      pdf.setFontSize(10);
      pdf.text(
        'Generated by DSS Lite - Identify. Inspect. Improve.',
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );

      // PAGE 2+: DISTRIBUTION GRAPHS (Histograms)
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Distribution Analysis', pageWidth / 2, 20, { align: 'center' });

      // Capture distribution charts
      const distributionCanvas = await html2canvas(distributionChartsRef.current);
      const distributionImgData = distributionCanvas.toDataURL('image/png');
      pdf.addImage(distributionImgData, 'PNG', 10, 30, pageWidth - 20, 0);

      // Add logo to distribution page
      pdf.addImage(logoImg, 'PNG', pageWidth - 50, 5, 40, 15);

      // PAGE 3+: CORRELATION GRAPHS (Scatter plots)
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Correlation Analysis', pageWidth / 2, 20, { align: 'center' });

      // Capture correlation charts
      const correlationCanvas = await html2canvas(correlationChartsRef.current);
      const correlationImgData = correlationCanvas.toDataURL('image/png');
      pdf.addImage(correlationImgData, 'PNG', 10, 30, pageWidth - 20, 0);

      // Add logo to correlation page
      pdf.addImage(logoImg, 'PNG', pageWidth - 50, 5, 40, 15);

      // Save PDF
      const fileName = `DSS_Report_${reportDetails.farmName || 'Farm'}_${
        reportDetails.reportDate
      }.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDetailChange = (field, value) => {
    setReportDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isReadyToGenerate =
    reportDetails.farmerName && reportDetails.farmName && data.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Generate PDF Report</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Report Details" />
            <Tab label="Preview Graphs" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Complete the details below before generating your PDF report
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Farmer Name"
                  value={reportDetails.farmerName}
                  onChange={(e) => handleDetailChange('farmerName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Farm Name"
                  value={reportDetails.farmName}
                  onChange={(e) => handleDetailChange('farmName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Report Date"
                  value={reportDetails.reportDate}
                  onChange={(e) => handleDetailChange('reportDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Consultant Name"
                  value={reportDetails.consultant}
                  onChange={(e) => handleDetailChange('consultant', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Notes / Comments"
                  value={reportDetails.notes}
                  onChange={(e) => handleDetailChange('notes', e.target.value)}
                  placeholder="Add any additional notes or observations..."
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Preview of graphs that will be included in the PDF report
            </Alert>

            {/* DISTRIBUTION CHARTS */}
            <Paper ref={distributionChartsRef} sx={{ p: 2, mb: 3, bgcolor: 'white' }}>
              <Typography variant="h6" gutterBottom>
                Distribution Graphs
              </Typography>
              <Grid container spacing={2}>
                {/* W1 Histogram */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    W1 Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionDatasets.w1}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={CLASSIFICATION_COLORS.Flock} />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>

                {/* W2 Histogram */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    W2 Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionDatasets.w2}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={CLASSIFICATION_COLORS.Flock} />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>

                {/* Fleece Weight Histogram */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    Fleece Weight Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionDatasets.fleeceWeight}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={CLASSIFICATION_COLORS.Flock} />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>

                {/* Wool Micron Histogram */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    Wool Micron Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionDatasets.woolMicron}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={CLASSIFICATION_COLORS.Flock} />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>

                {/* Comfort Factor Histogram */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    Comfort Factor Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionDatasets.comfortFactor}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={CLASSIFICATION_COLORS.Flock} />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>

                {/* Clean Yield Histogram */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    Clean Yield Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionDatasets.cleanYield}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={CLASSIFICATION_COLORS.Flock} />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>

                {/* Conformation Score Bar Chart */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    Conformation Score Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionDatasets.conformationScore}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={CLASSIFICATION_COLORS.Stud} />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>

                {/* Wool Score Bar Chart */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    Wool Score Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionDatasets.woolScore}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={CLASSIFICATION_COLORS.Stud} />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>

                {/* BCS Bar Chart */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    BCS Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionDatasets.bcs}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={CLASSIFICATION_COLORS['2nd Flock']} />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>

                {/* DSS Mark Bar Chart */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    DSS Mark Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionDatasets.dssmark}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count">
                        {distributionDatasets.dssmark.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.value >= configuration.classificationPoints.stud
                                ? CLASSIFICATION_COLORS.Stud
                                : entry.value >= configuration.classificationPoints.flock
                                ? CLASSIFICATION_COLORS.Flock
                                : entry.value >= configuration.classificationPoints.secondFlock
                                ? CLASSIFICATION_COLORS['2nd Flock']
                                : CLASSIFICATION_COLORS.Cull
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </Paper>

            {/* CORRELATION CHARTS */}
            <Paper ref={correlationChartsRef} sx={{ p: 2, bgcolor: 'white' }}>
              <Typography variant="h6" gutterBottom>
                Correlation Graphs
              </Typography>
              <Grid container spacing={2}>
                {/* Fleece vs W2 */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    Fleece Weight vs W2
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" name="W2" label={{ value: 'W2 (kg)', position: 'insideBottom', offset: -5 }} />
                      <YAxis dataKey="y" name="Fleece" label={{ value: 'Fleece (kg)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter data={correlationDatasets.fleeceVsW2} fill={CLASSIFICATION_COLORS.Flock} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Grid>

                {/* Fleece vs Micron */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    Fleece Weight vs Micron
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" name="Micron" label={{ value: 'Micron (μm)', position: 'insideBottom', offset: -5 }} />
                      <YAxis dataKey="y" name="Fleece" label={{ value: 'Fleece (kg)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter data={correlationDatasets.fleeceVsMicron} fill={CLASSIFICATION_COLORS.Stud} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Grid>

                {/* Fleece vs CV Difference */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    Fleece Weight vs CV Difference
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" name="CV Diff" label={{ value: 'CV Difference', position: 'insideBottom', offset: -5 }} />
                      <YAxis dataKey="y" name="Fleece" label={{ value: 'Fleece (kg)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter data={correlationDatasets.fleeceVsCVDiff} fill={CLASSIFICATION_COLORS['2nd Flock']} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Grid>

                {/* Clean Yield vs Fleece */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    Clean Yield vs Fleece Weight
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" name="Fleece" label={{ value: 'Fleece (kg)', position: 'insideBottom', offset: -5 }} />
                      <YAxis dataKey="y" name="Clean Yield" label={{ value: 'Clean Yield (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter data={correlationDatasets.cleanYieldVsFleece} fill={CLASSIFICATION_COLORS.Flock} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Grid>

                {/* Fleece vs Length */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    Fleece Weight vs Fiber Length
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" name="Length" label={{ value: 'Length (mm)', position: 'insideBottom', offset: -5 }} />
                      <YAxis dataKey="y" name="Fleece" label={{ value: 'Fleece (kg)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter data={correlationDatasets.fleeceVsLength} fill={CLASSIFICATION_COLORS.Stud} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Grid>

                {/* W2 vs BCS */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" align="center">
                    W2 vs BCS
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" name="BCS" label={{ value: 'BCS', position: 'insideBottom', offset: -5 }} />
                      <YAxis dataKey="y" name="W2" label={{ value: 'W2 (kg)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter data={correlationDatasets.w2VsBCS} fill={CLASSIFICATION_COLORS['2nd Flock']} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={generating ? null : <PdfIcon />}
          onClick={generatePDF}
          disabled={!isReadyToGenerate || generating}
        >
          {generating ? 'Generating...' : 'Generate PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PDFReport;
