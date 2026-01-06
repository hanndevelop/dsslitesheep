import React, { useState, useCallback } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import DataUpload from './DataUpload';
import MainTable from './MainTable';
import ConfigurationPanel from './ConfigurationPanel';
import Dashboard from './Dashboard';
import PDFReportGenerator from './PDFReportGenerator';
import * as calculations from '../utils/calculations';

const theme = createTheme({
  palette: {
    primary: {
      main: '#c41e3a', // BKB Red
    },
    secondary: {
      main: '#b8860b', // Gold/Bronze from logo
    },
    success: {
      main: '#2e7d32', // Green for Flock
    },
    warning: {
      main: '#ff6f00', // Orange for 2nd Flock
    },
    error: {
      main: '#c41e3a', // Red for Cull
    },
    grey: {
      main: '#808080', // Grey
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [eventData, setEventData] = useState({
    w1: [],
    w2: [],
    fleeceWeight: [],
    wtb: [],
    ofda: [],
    marks: [],
    motherRepro: [],
    bcs: [],
    registrations: [],
  });
  const [mainTableData, setMainTableData] = useState([]);
  const [configuration, setConfiguration] = useState({
    classificationPoints: {
      stud: 8,
      flock: 6,
      secondFlock: 4,
      cull: 0,
    },
    criteria: [
      {
        id: 'w1',
        name: 'W1 (First Weight)',
        enabled: true,
        operator: 'between', // 'between', 'greater', 'less'
        lowerLimit2: null,
        lowerLimit: null,
        upperLimit: null,
        upperLimit2: null,
        cullIfFailed: false,
      },
      {
        id: 'w2',
        name: 'W2 (Second Weight)',
        enabled: true,
        operator: 'between',
        lowerLimit2: null,
        lowerLimit: null,
        upperLimit: null,
        upperLimit2: null,
        cullIfFailed: false,
      },
      {
        id: 'adg',
        name: 'ADG (Average Daily Gain)',
        enabled: true,
        operator: 'greater',
        lowerLimit2: null,
        lowerLimit: null,
        upperLimit: null,
        upperLimit2: null,
        cullIfFailed: false,
      },
      {
        id: 'fleeceWeight',
        name: 'Fleece Weight',
        enabled: true,
        operator: 'greater',
        lowerLimit2: null,
        lowerLimit: null,
        upperLimit: null,
        upperLimit2: null,
        cullIfFailed: false,
      },
      {
        id: 'cleanYield',
        name: 'Clean Yield',
        enabled: true,
        operator: 'greater',
        lowerLimit2: null,
        lowerLimit: null,
        upperLimit: null,
        upperLimit2: null,
        cullIfFailed: false,
      },
      {
        id: 'percentShornOff',
        name: '% Shorn Off BW',
        enabled: true,
        operator: 'between',
        lowerLimit2: null,
        lowerLimit: null,
        upperLimit: null,
        upperLimit2: null,
        cullIfFailed: false,
      },
      {
        id: 'bcs',
        name: 'BCS (Body Condition Score)',
        enabled: true,
        operator: 'between',
        lowerLimit2: 2,
        lowerLimit: 2.5,
        upperLimit: 3.5,
        upperLimit2: 4,
        cullIfFailed: false,
      },
      {
        id: 'conformationScore',
        name: 'Conformation Score',
        enabled: true,
        operator: 'greater',
        lowerLimit2: null,
        lowerLimit: 6,
        upperLimit: null,
        upperLimit2: null,
        cullIfFailed: false,
      },
      {
        id: 'woolScore',
        name: 'Wool Score',
        enabled: true,
        operator: 'greater',
        lowerLimit2: null,
        lowerLimit: 6,
        upperLimit: null,
        upperLimit2: null,
        cullIfFailed: false,
      },
      {
        id: 'motherRepro',
        name: 'Mother Reproduction',
        enabled: true,
        operator: 'greater',
        lowerLimit2: null,
        lowerLimit: null,
        upperLimit: null,
        upperLimit2: null,
        cullIfFailed: false,
      },
      {
        id: 'comfortFactor',
        name: 'Comfort Factor',
        enabled: true,
        operator: 'greater',
        lowerLimit2: null,
        lowerLimit: 98,
        upperLimit: null,
        upperLimit2: null,
        cullIfFailed: false,
      },
      {
        id: 'woolMicron',
        name: 'Wool Micron',
        enabled: true,
        operator: 'less',
        lowerLimit2: null,
        lowerLimit: null,
        upperLimit: 19,
        upperLimit2: null,
        cullIfFailed: false,
      },
      {
        id: 'cvDifference',
        name: 'CV Difference',
        enabled: true,
        operator: 'less',
        lowerLimit2: null,
        lowerLimit: null,
        upperLimit: 5,
        upperLimit2: null,
        cullIfFailed: false,
      },
      {
        id: 'fiberLength',
        name: 'Fiber/Staple Length (mm)',
        enabled: true,
        operator: 'greater',
        lowerLimit2: null,
        lowerLimit: 80,
        upperLimit: null,
        upperLimit2: null,
        cullIfFailed: false,
      },
    ],
  });

  const handleEventDataUpload = useCallback((eventType, data) => {
    setEventData((prev) => ({
      ...prev,
      [eventType]: data,
    }));
  }, []);

  const handleRecalculate = useCallback(() => {
    // Aggregate all event data per animal
    const aggregated = calculations.aggregateAnimalData(eventData);
    
    // Calculate DSS Mark for each animal
    const withDSSMarks = aggregated.map((animal) => {
      const { dssmark, cullReason, breakdown } = calculations.calculateDSSMark(animal, configuration);
      
      // Classify animal based on DSS mark
      let classification = 'Cull';
      if (dssmark >= configuration.classificationPoints.stud) {
        classification = 'Stud';
      } else if (dssmark >= configuration.classificationPoints.flock) {
        classification = 'Flock';
      } else if (dssmark >= configuration.classificationPoints.secondFlock) {
        classification = '2nd Flock';
      }
      
      // If any cull criteria is breached, force to cull
      if (cullReason) {
        classification = 'Cull';
      }
      
      return {
        ...animal,
        dssmark,
        classification,
        cullReason,
        breakdown,
      };
    });
    
    setMainTableData(withDSSMarks);
  }, [eventData, configuration]);

  const handleConfigurationChange = useCallback((newConfig) => {
    setConfiguration(newConfig);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              DSS Lite - Decision Support System
            </Typography>
            <Typography variant="subtitle1">
              BKB Livestock Management
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab label="Upload Data" />
              <Tab label="Main Table" />
              <Tab label="Configuration" />
              <Tab label="Dashboard" />
            </Tabs>
          </Paper>

          <Box sx={{ mt: 3 }}>
            {activeTab === 0 && (
              <DataUpload
                onDataUpload={handleEventDataUpload}
                onRecalculate={handleRecalculate}
                eventData={eventData}
              />
            )}
            {activeTab === 1 && (
              <MainTable
                data={mainTableData}
                configuration={configuration}
                onOpenPDFReport={() => setPdfDialogOpen(true)}
              />
            )}
            {activeTab === 2 && (
              <ConfigurationPanel
                configuration={configuration}
                onConfigurationChange={handleConfigurationChange}
                animalData={mainTableData}
              />
            )}
            {activeTab === 3 && (
              <Dashboard
                data={mainTableData}
                configuration={configuration}
              />
            )}
          </Box>
        </Container>

        {/* PDF Report Generator Dialog */}
        <PDFReportGenerator
          data={mainTableData}
          configuration={configuration}
          open={pdfDialogOpen}
          onClose={() => setPdfDialogOpen(false)}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
