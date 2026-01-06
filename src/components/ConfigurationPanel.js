import React, { useState, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import * as calculations from '../utils/calculations';

function ConfigurationPanel({ configuration, onConfigurationChange, animalData }) {
  const [config, setConfig] = useState(configuration);
  const [hasChanges, setHasChanges] = useState(false);

  // Calculate averages from animal data
  const criteriaAverages = useMemo(() => {
    return calculations.calculateCriteriaAverages(animalData || []);
  }, [animalData]);

  const handleClassificationPointChange = (classification, value) => {
    const newConfig = {
      ...config,
      classificationPoints: {
        ...config.classificationPoints,
        [classification]: parseFloat(value) || 0,
      },
    };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleCriterionChange = (index, field, value) => {
    const newCriteria = [...config.criteria];
    newCriteria[index] = {
      ...newCriteria[index],
      [field]: value,
    };
    const newConfig = {
      ...config,
      criteria: newCriteria,
    };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = () => {
    onConfigurationChange(config);
    setHasChanges(false);
  };

  const handleReset = () => {
    setConfig(configuration);
    setHasChanges(false);
  };

  return (
    <Box>
      {hasChanges && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have unsaved changes. Click "Save Configuration" to apply them.
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Classification Points
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Set the minimum DSS mark required for each classification category.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Stud"
              type="number"
              value={config.classificationPoints.stud}
              onChange={(e) => handleClassificationPointChange('stud', e.target.value)}
              helperText="Top performers"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Flock"
              type="number"
              value={config.classificationPoints.flock}
              onChange={(e) => handleClassificationPointChange('flock', e.target.value)}
              helperText="Breeding quality"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="2nd Flock"
              type="number"
              value={config.classificationPoints.secondFlock}
              onChange={(e) => handleClassificationPointChange('secondFlock', e.target.value)}
              helperText="Acceptable quality"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Cull"
              type="number"
              value={config.classificationPoints.cull}
              onChange={(e) => handleClassificationPointChange('cull', e.target.value)}
              helperText="Below threshold"
              disabled
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Criteria Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure limits and operators for each DSS mark criterion. Each criterion can award 0, 0.5, or 1 point.
        </Typography>

        {animalData && animalData.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Averages shown for current data:</strong> Hover over the "Avg" chip to see min, max, and count. 
            Use these values to help set realistic limits for your flock.
          </Alert>
        )}

        {(!animalData || animalData.length === 0) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Upload data and calculate DSS marks to see average values that will help you set limits.
          </Alert>
        )}

        {config.criteria.map((criterion, index) => {
          const avgData = criteriaAverages[criterion.id];
          
          return (
          <Accordion key={criterion.id} defaultExpanded={index < 3}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                <Typography sx={{ flexGrow: 1 }}>{criterion.name}</Typography>
                {avgData && (
                  <Tooltip title={`Min: ${avgData.min.toFixed(2)} | Max: ${avgData.max.toFixed(2)} | Count: ${avgData.count}`}>
                    <Chip 
                      label={`Avg: ${avgData.avg.toFixed(2)}`} 
                      size="small" 
                      color="info"
                      icon={<InfoIcon />}
                    />
                  </Tooltip>
                )}
                {!criterion.enabled && <Chip label="Disabled" size="small" />}
                {criterion.cullIfFailed && <Chip label="Cull Criterion" color="error" size="small" />}
                <Chip label={criterion.operator.toUpperCase()} size="small" color="primary" />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={criterion.enabled}
                        onChange={(e) => handleCriterionChange(index, 'enabled', e.target.checked)}
                      />
                    }
                    label="Enable this criterion"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={criterion.cullIfFailed}
                        onChange={(e) => handleCriterionChange(index, 'cullIfFailed', e.target.checked)}
                      />
                    }
                    label="Cull if failed (immediate cull regardless of total score)"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Operator</InputLabel>
                    <Select
                      value={criterion.operator}
                      label="Operator"
                      onChange={(e) => handleCriterionChange(index, 'operator', e.target.value)}
                    >
                      <MenuItem value="between">Between (4 limits)</MenuItem>
                      <MenuItem value="greater">Greater Than</MenuItem>
                      <MenuItem value="less">Less Than</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {criterion.operator === 'between' && (
                  <>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="subtitle2" gutterBottom>
                        Optimal Range (1 point)
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          label="Lower Limit"
                          type="number"
                          value={criterion.lowerLimit || ''}
                          onChange={(e) =>
                            handleCriterionChange(index, 'lowerLimit', parseFloat(e.target.value) || null)
                          }
                          size="small"
                        />
                        <Typography sx={{ alignSelf: 'center' }}>to</Typography>
                        <TextField
                          label="Upper Limit"
                          type="number"
                          value={criterion.upperLimit || ''}
                          onChange={(e) =>
                            handleCriterionChange(index, 'upperLimit', parseFloat(e.target.value) || null)
                          }
                          size="small"
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Acceptable Range Below (0.5 points)
                      </Typography>
                      <TextField
                        fullWidth
                        label="Lower Limit 2"
                        type="number"
                        value={criterion.lowerLimit2 || ''}
                        onChange={(e) =>
                          handleCriterionChange(index, 'lowerLimit2', parseFloat(e.target.value) || null)
                        }
                        size="small"
                        helperText="From this value up to Lower Limit"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Acceptable Range Above (0.5 points)
                      </Typography>
                      <TextField
                        fullWidth
                        label="Upper Limit 2"
                        type="number"
                        value={criterion.upperLimit2 || ''}
                        onChange={(e) =>
                          handleCriterionChange(index, 'upperLimit2', parseFloat(e.target.value) || null)
                        }
                        size="small"
                        helperText="From Upper Limit up to this value"
                      />
                    </Grid>
                  </>
                )}

                {criterion.operator === 'greater' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Lower Limit (1 point)"
                        type="number"
                        value={criterion.lowerLimit || ''}
                        onChange={(e) =>
                          handleCriterionChange(index, 'lowerLimit', parseFloat(e.target.value) || null)
                        }
                        helperText="Value must be >= this for 1 point"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Lower Limit 2 (0.5 points)"
                        type="number"
                        value={criterion.lowerLimit2 || ''}
                        onChange={(e) =>
                          handleCriterionChange(index, 'lowerLimit2', parseFloat(e.target.value) || null)
                        }
                        helperText="Value must be >= this for 0.5 points"
                      />
                    </Grid>
                  </>
                )}

                {criterion.operator === 'less' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Upper Limit (1 point)"
                        type="number"
                        value={criterion.upperLimit || ''}
                        onChange={(e) =>
                          handleCriterionChange(index, 'upperLimit', parseFloat(e.target.value) || null)
                        }
                        helperText="Value must be <= this for 1 point"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Upper Limit 2 (0.5 points)"
                        type="number"
                        value={criterion.upperLimit2 || ''}
                        onChange={(e) =>
                          handleCriterionChange(index, 'upperLimit2', parseFloat(e.target.value) || null)
                        }
                        helperText="Value must be <= this for 0.5 points"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
        })}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<ResetIcon />}
          onClick={handleReset}
          disabled={!hasChanges}
        >
          Reset Changes
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          Save Configuration
        </Button>
      </Box>
    </Box>
  );
}

export default ConfigurationPanel;
