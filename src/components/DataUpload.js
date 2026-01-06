import React, { useState, useCallback } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Calculate as CalculateIcon,
  CheckCircle as CheckCircleIcon,
  DeleteForever as DeleteIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

const eventTypes = [
  { key: 'registrations', label: 'Registrations (BKB101/BKB126)', processIds: ['BKB101', 'BKB126'] },
  { key: 'w1', label: 'W1 - First Weight (BKB118/BKB106)', processIds: ['BKB118', 'BKB106'] },
  { key: 'w2', label: 'W2 - Second Weight (BKB116)', processIds: ['BKB116'] },
  { key: 'fleeceWeight', label: 'Fleece Weight (BKB117)', processIds: ['BKB117'] },
  { key: 'wtb', label: 'WTB - Wool Test Bureau', processIds: [] },
  { key: 'ofda', label: 'OFDA - Wool Testing', processIds: [] },
  { key: 'marks', label: 'Visual Scores (BKB109/BKB114) - includes BCS', processIds: ['BKB109', 'BKB114'] },
  { key: 'motherRepro', label: 'Mother Reproduction', processIds: [] },
];

function DataUpload({ onDataUpload, onRecalculate, eventData }) {
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploading, setUploading] = useState(false);

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all uploaded data? This cannot be undone.')) {
      Object.keys(eventData).forEach(eventType => {
        onDataUpload(eventType, []);
      });
      setUploadStatus({});
      alert('All data has been cleared.');
    }
  };

  const handleFileUpload = useCallback(
    async (eventType, file) => {
      setUploading(true);
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const processedData = processEventData(eventType, jsonData);

        onDataUpload(eventType, processedData);
        setUploadStatus((prev) => ({
          ...prev,
          [eventType]: {
            success: true,
            count: processedData.length,
            timestamp: new Date().toISOString(),
          },
        }));
      } catch (error) {
        setUploadStatus((prev) => ({
          ...prev,
          [eventType]: {
            success: false,
            error: error.message,
          },
        }));
      } finally {
        setUploading(false);
      }
    },
    [onDataUpload]
  );

  const processEventData = (eventType, rawData) => {
    return rawData.map((row) => {
      const processed = {};
      const normalizeKey = (key) => key.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      Object.keys(row).forEach((key) => {
        const normalizedKey = normalizeKey(key);
        const value = row[key];

        if (normalizedKey.includes('eid') || normalizedKey.includes('eartag')) {
          processed.eid = value;
        } else if (normalizedKey.includes('vid')) {
          processed.vid = value;
        } else if (normalizedKey.includes('barcode')) {
          processed.barcode = value;
        } else if (normalizedKey.includes('qr') || normalizedKey.includes('qrid')) {
          processed.qr = value;
        } else if (normalizedKey.includes('tattoo') || normalizedKey.includes('herdmark')) {
          processed.tattoo = value;
        } else if (normalizedKey.includes('processid')) {
          processed.processId = value;
        } else if (normalizedKey.includes('date') && !normalizedKey.includes('shear')) {
          processed.date = value;
        } else if (normalizedKey.includes('time')) {
          processed.time = value;
        }

        if (eventType === 'registrations') {
          if (normalizedKey.includes('dob') || normalizedKey.includes('birthdate')) {
            processed.dob = value;
          } else if (normalizedKey.includes('sex')) {
            processed.sex = value;
          } else if (normalizedKey.includes('birthstatus')) {
            processed.birthStatus = value;
          } else if (normalizedKey.includes('dam')) {
            processed.dam = value;
          } else if (normalizedKey.includes('sire')) {
            processed.sire = value;
          } else if (normalizedKey.includes('weight')) {
            processed.weight = parseFloat(value);
          } else if (normalizedKey.includes('dssreggroup')) {
            processed.dssRegGroup = value;
          } else if (normalizedKey.includes('dssmgroup')) {
            processed.dssMGroup = value;
          }
        } else if (eventType === 'w1') {
          if (normalizedKey.includes('id')) {
            processed.id = value;
          }
          if (normalizedKey.includes('w1') || normalizedKey.includes('weight')) {
            processed.w1 = parseFloat(value);
          }
        } else if (eventType === 'w2') {
          if (normalizedKey.includes('lid')) {
            processed.lid = value;
          }
          if (normalizedKey.includes('w2') || normalizedKey.includes('weight')) {
            processed.w2 = parseFloat(value);
          }
        } else if (eventType === 'fleeceWeight') {
          if (normalizedKey.includes('fw') || normalizedKey.includes('fleeceweight')) {
            processed.fw = parseFloat(value);
          }
        } else if (eventType === 'wtb') {
          if (normalizedKey.includes('jobnumber')) {
            processed.jobNumber = value;
          } else if (normalizedKey.includes('batch')) {
            processed.batch = value;
          } else if (normalizedKey.includes('reference') || normalizedKey.includes('tagreference')) {
            processed.reference = value;
            processed.tagReference = value;
          } else if (normalizedKey.includes('mfd') && !normalizedKey.includes('cv')) {
            processed.mfd = parseFloat(value);
          } else if (normalizedKey.includes('cvmfd') || normalizedKey.includes('cofv')) {
            processed.cvMfd = parseFloat(value);
          } else if (normalizedKey.includes('comfort')) {
            processed.comfortFactorPct = parseFloat(value);
          } else if (normalizedKey.includes('yield')) {
            processed.yieldPct = parseFloat(value);
          } else if (normalizedKey.includes('cvdifference')) {
            processed.cvDifference = parseFloat(value);
          } else if (normalizedKey.includes('manual') && normalizedKey.includes('length')) {
            processed.manualLength = parseFloat(value);
          }
        } else if (eventType === 'ofda') {
          if (normalizedKey.includes('micave')) {
            processed.micAve = parseFloat(value);
          } else if (normalizedKey.includes('cvmic')) {
            processed.cvMic = parseFloat(value);
          } else if (normalizedKey.includes('cfpercent') || normalizedKey.includes('cf%')) {
            processed.cfPercent = parseFloat(value);
          } else if (normalizedKey.includes('yield') && normalizedKey.includes('%')) {
            processed.yieldPercent = parseFloat(value);
          } else if (normalizedKey.includes('cvdifference')) {
            processed.cvDifference = parseFloat(value);
          } else if (normalizedKey.includes('sl') && normalizedKey.includes('mm')) {
            processed.slMm = parseFloat(value);
          }
        } else if (eventType === 'marks') {
          if (normalizedKey.includes('lid')) {
            processed.lid = value;
          }
          if (normalizedKey.includes('conformation')) {
            processed.conformation = parseFloat(value);
          } else if (normalizedKey.includes('wool') && normalizedKey.includes('mark')) {
            processed.woolMark = parseFloat(value);
          } else if (normalizedKey.includes('bcs')) {
            processed.bcs = parseFloat(value);
          }
        } else if (eventType === 'motherRepro') {
          if (normalizedKey.includes('id') && !normalizedKey.includes('dam')) {
            processed.id = value;
          } else if (normalizedKey.includes('damid')) {
            processed.damId = value;
          } else if (normalizedKey.includes('dssvalue')) {
            processed.dssValue = parseFloat(value);
          } else if (normalizedKey.includes('lifetime')) {
            processed.damLifetime = parseFloat(value);
          } else if (normalizedKey.includes('group') && !normalizedKey.includes('dss')) {
            processed.group = value;
          } else if (normalizedKey.includes('dssgroup')) {
            processed.dssGroup = value;
          }
        }
      });

      return processed;
    });
  };

  const getTotalRecords = () => {
    return Object.values(eventData).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Upload Event Data
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Upload CSV or Excel files for each event type. The system will automatically aggregate data per animal.
        </Typography>

        {uploading && <LinearProgress sx={{ mb: 2 }} />}

        {getTotalRecords() > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Total records loaded: {getTotalRecords()}</strong> across all event types
            <br />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Click "Calculate" to process data and see how many unique animals were identified.
            </Typography>
          </Alert>
        )}

        <Grid container spacing={2}>
          {eventTypes.map((eventType) => {
            const status = uploadStatus[eventType.key];
            const hasData = eventData[eventType.key]?.length > 0;

            return (
              <Grid item xs={12} sm={6} md={4} key={eventType.key}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    bgcolor: hasData ? 'success.light' : 'background.paper',
                    opacity: hasData ? 0.9 : 1,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {eventType.label}
                      </Typography>
                      {hasData && <CheckCircleIcon color="success" />}
                    </Box>

                    {eventType.processIds.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        {eventType.processIds.map((pid) => (
                          <Chip key={pid} label={pid} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </Box>
                    )}

                    {hasData && (
                      <Typography variant="body2" color="text.secondary">
                        {eventData[eventType.key].length} records loaded
                      </Typography>
                    )}

                    {status && !status.success && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {status.error}
                      </Alert>
                    )}
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      component="label"
                      startIcon={<UploadIcon />}
                      disabled={uploading}
                    >
                      {hasData ? 'Replace' : 'Upload'}
                      <input
                        type="file"
                        hidden
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleFileUpload(eventType.key, file);
                          }
                        }}
                      />
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Calculate DSS Marks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Process all uploaded data and calculate DSS marks for each animal
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleClearAll}
              disabled={getTotalRecords() === 0}
            >
              Clear All Data
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<CalculateIcon />}
              onClick={onRecalculate}
              disabled={getTotalRecords() === 0}
            >
              Calculate
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default DataUpload;
