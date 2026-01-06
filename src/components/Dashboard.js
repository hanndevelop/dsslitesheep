import React, { useMemo, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import * as calculations from '../utils/calculations';
import PDFReport from './PDFReport';

const CLASSIFICATION_COLORS = {
  Stud: '#c41e3a',      // BKB Red
  Flock: '#2e7d32',     // Green  
  '2nd Flock': '#ff6f00', // Orange
  Cull: '#808080',      // Grey
};

function Dashboard({ data, configuration }) {
  const stats = useMemo(() => calculations.getStatistics(data), [data]);
  const [pdfReportOpen, setPdfReportOpen] = useState(false);

  // Prepare classification pie chart data
  const classificationData = Object.entries(stats.byClassification).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / stats.total) * 100).toFixed(1),
  }));

  // Prepare DSS mark distribution bar chart data
  const dssMarkData = Object.entries(stats.distributions.dssmark)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([mark, count]) => ({
      mark: parseInt(mark),
      count,
    }));

  // Performance averages
  const performanceMetrics = [
    { label: 'W1 (kg)', value: stats.averages.w1, decimals: 1 },
    { label: 'W2 (kg)', value: stats.averages.w2, decimals: 1 },
    { label: 'ADG (kg/day)', value: stats.averages.adg, decimals: 3 },
    { label: 'Fleece Weight (kg)', value: stats.averages.fleeceWeight, decimals: 2 },
    { label: 'Wool Micron (μm)', value: stats.averages.woolMicron, decimals: 1 },
    { label: 'BCS', value: stats.averages.bcs, decimals: 1 },
    { label: 'DSS Mark', value: stats.averages.dssmark, decimals: 2 },
  ];

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No data to display. Upload data and calculate DSS marks to see dashboard.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* PDF Report Button */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6">Generate Report</Typography>
            <Typography variant="body2" color="text.secondary">
              Create a professional PDF report with all graphs and statistics
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={() => setPdfReportOpen(true)}
            size="large"
            disabled={data.length === 0}
          >
            Generate PDF Report
          </Button>
        </Box>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Animals
              </Typography>
              <Typography variant="h3">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {Object.entries(stats.byClassification).map(([classification, count]) => (
          <Grid item xs={12} sm={6} md={3} key={classification}>
            <Card sx={{ borderLeft: 4, borderColor: CLASSIFICATION_COLORS[classification] }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {classification}
                </Typography>
                <Typography variant="h3">{count}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {((count / stats.total) * 100).toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Classification Pie Chart */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Classification Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={classificationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {classificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CLASSIFICATION_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* DSS Mark Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              DSS Mark Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dssMarkData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mark" label={{ value: 'DSS Mark', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Performance Averages */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Average Performance Metrics
        </Typography>
        <Grid container spacing={2}>
          {performanceMetrics.map((metric) => (
            <Grid item xs={12} sm={6} md={3} key={metric.label}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {metric.label}
                </Typography>
                <Typography variant="h5">
                  {metric.value ? metric.value.toFixed(metric.decimals) : 'N/A'}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Configuration Summary */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current Configuration
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              Classification Points
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2">
                Stud: {configuration.classificationPoints.stud}
              </Typography>
              <Typography variant="body2">
                Flock: {configuration.classificationPoints.flock}
              </Typography>
              <Typography variant="body2">
                2nd Flock: {configuration.classificationPoints.secondFlock}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              Active Criteria
            </Typography>
            <Typography variant="body2">
              {configuration.criteria.filter((c) => c.enabled).length} of{' '}
              {configuration.criteria.length} criteria enabled
            </Typography>
            <Typography variant="body2">
              {configuration.criteria.filter((c) => c.cullIfFailed).length} cull criteria
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* PDF Report Dialog */}
      <PDFReport
        open={pdfReportOpen}
        onClose={() => setPdfReportOpen(false)}
        data={data}
        configuration={configuration}
      />
    </Box>
  );
}

export default Dashboard;
