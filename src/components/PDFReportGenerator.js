import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Download as DownloadIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function PDFReportGenerator({ data, configuration, open, onClose }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const generatePDF = async () => {
    setGenerating(true);
    setProgress(0);
    setError(null);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;

      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text('DSS Lite Report', pageWidth / 2, 40, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'normal');
      pdf.text('Livestock Performance Analysis', pageWidth / 2, 55, { align: 'center' });
      
      pdf.setFontSize(12);
      const reportDate = new Date().toLocaleDateString();
      pdf.text(`Generated: ${reportDate}`, pageWidth / 2, 70, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.text(`Total Animals: ${data.length}`, pageWidth / 2, 90, { align: 'center' });

      setProgress(10);

      pdf.addPage();
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('Summary Statistics', margin, 20);
      
      const classificationCounts = data.reduce((acc, animal) => {
        acc[animal.classification] = (acc[animal.classification] || 0) + 1;
        return acc;
      }, {});

      let yPos = 35;
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      
      Object.entries(classificationCounts).forEach(([classification, count]) => {
        const percentage = ((count / data.length) * 100).toFixed(1);
        pdf.text(`${classification}: ${count} (${percentage}%)`, margin, yPos);
        yPos += 8;
      });

      setProgress(20);

      yPos += 10;
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Average Performance Metrics', margin, yPos);
      yPos += 10;

      const metrics = ['w1', 'w2', 'adg', 'fleeceWeight', 'woolMicron', 'bcs', 'dssmark'];
      const metricLabels = {
        w1: 'W1 (kg)',
        w2: 'W2 (kg)',
        adg: 'ADG (kg/day)',
        fleeceWeight: 'Fleece Weight (kg)',
        woolMicron: 'Wool Micron (μm)',
        bcs: 'BCS',
        dssmark: 'DSS Mark'
      };

      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');

      metrics.forEach(metric => {
        const values = data
          .map(a => a[metric])
          .filter(v => v !== null && v !== undefined && !isNaN(v));
        
        if (values.length > 0) {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          const decimals = metric === 'adg' ? 3 : metric === 'dssmark' ? 2 : 1;
          pdf.text(`${metricLabels[metric]}: ${avg.toFixed(decimals)}`, margin, yPos);
          yPos += 7;
        }
      });

      setProgress(40);

      pdf.addPage();
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('Animal Data', margin, 20);

      const tableData = data.slice(0, 50).map(animal => [
        animal.eid || animal.vid || '-',
        animal.sex || '-',
        animal.w1 ? animal.w1.toFixed(1) : '-',
        animal.w2 ? animal.w2.toFixed(1) : '-',
        animal.adg ? animal.adg.toFixed(3) : '-',
        animal.dssmark ? animal.dssmark.toFixed(1) : '-',
        animal.classification || '-',
      ]);

      pdf.autoTable({
        startY: 30,
        head: [['ID', 'Sex', 'W1', 'W2', 'ADG', 'DSS Mark', 'Class']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94], fontSize: 10 },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      if (data.length > 50) {
        const finalY = pdf.lastAutoTable.finalY;
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(`Note: Showing first 50 of ${data.length} animals`, margin, finalY + 10);
        pdf.setTextColor(0);
      }

      setProgress(80);

      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(128);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      setProgress(90);

      const filename = `DSS_Lite_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      setProgress(100);
      
      setTimeout(() => {
        setGenerating(false);
        onClose();
      }, 500);

    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report. Please try again.');
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generate PDF Report</DialogTitle>
      <DialogContent>
        {!generating && !error && (
          <Box>
            <Typography variant="body1" paragraph>
              This will generate a comprehensive PDF report including:
            </Typography>
            <ul>
              <li>Summary statistics</li>
              <li>Classification distribution</li>
              <li>Average performance metrics</li>
              <li>Animal data table (first 50 animals)</li>
            </ul>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Total animals: {data.length}
            </Typography>
          </Box>
        )}

        {generating && (
          <Box sx={{ py: 3 }}>
            <Typography variant="body1" gutterBottom>
              Generating PDF report...
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ mt: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {progress}% complete
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={generating}>
          Cancel
        </Button>
        <Button
          onClick={generatePDF}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={generating || data.length === 0}
        >
          Generate PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PDFReportGenerator;
