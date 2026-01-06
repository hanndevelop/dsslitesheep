import React, { useState, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Info as InfoIcon,
  FilterList as FilterListIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function MainTable({ data, configuration, onOpenPDFReport }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('dssmark');
  const [order, setOrder] = useState('desc');
  const [filterText, setFilterText] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply text filter
    if (filterText) {
      const lower = filterText.toLowerCase();
      filtered = data.filter(
        (animal) =>
          (animal.eid && animal.eid.toLowerCase().includes(lower)) ||
          (animal.vid && animal.vid.toLowerCase().includes(lower)) ||
          (animal.classification && animal.classification.toLowerCase().includes(lower))
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [data, orderBy, order, filterText]);

  const paginatedData = filteredAndSortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredAndSortedData.map((animal) => ({
      'EID/QR Code': animal.eid || '',
      VID: animal.vid || '',
      Barcode: animal.barcode || '',
      Birthdate: animal.birthdate || '',
      'Birth Status': animal.birthStatus || '',
      DAM: animal.dam || '',
      Sire: animal.sire || '',
      Sex: animal.sex || '',
      W1: animal.w1 || '',
      'W1 Date': animal.w1Date || '',
      W2: animal.w2 || '',
      'W2 Date': animal.w2Date || '',
      ADG: animal.adg ? animal.adg.toFixed(3) : '',
      'Fleece Weight': animal.fleeceWeight || '',
      'Fiber Length (mm)': animal.fiberLength || '',
      'Final Body Weight': animal.finalBodyWeight || '',
      '% Shorn Off': animal.percentShornOff ? animal.percentShornOff.toFixed(2) : '',
      'Clean Yield': animal.cleanYield || '',
      'Wool Micron': animal.woolMicron || '',
      'CV Difference': animal.cvDifference || '',
      'Comfort Factor': animal.comfortFactor || '',
      BCS: animal.bcs || '',
      'Conformation Score': animal.conformationScore || '',
      'Wool Score': animal.woolScore || '',
      'Mother Repro': animal.motherRepro || '',
      'Mother Repro Group': animal.motherReproGroup || '',
      'DSS Mark': animal.dssmark ? animal.dssmark.toFixed(2) : '',
      Classification: animal.classification || '',
      'Cull Reason': animal.cullReason || '',
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Main Table');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Save file
    const timestamp = new Date().toISOString().split('T')[0];
    saveAs(blob, `DSS_Lite_Main_Table_${timestamp}.xlsx`);
  };

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'Stud':
        return 'success';
      case 'Flock':
        return 'primary';
      case '2nd Flock':
        return 'warning';
      case 'Cull':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Main Animal Table
          </Typography>

          <TextField
            size="small"
            placeholder="Filter by EID, VID, or Classification..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            InputProps={{
              startAdornment: <FilterListIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ minWidth: 300 }}
          />

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportToExcel}
            disabled={data.length === 0}
          >
            Export to Excel
          </Button>

          <Button
            variant="contained"
            color="error"
            startIcon={<PdfIcon />}
            onClick={onOpenPDFReport}
            disabled={data.length === 0}
          >
            Generate PDF Report
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Total: {filteredAndSortedData.length} animals
          {filterText && ` (filtered from ${data.length})`}
        </Typography>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'eid'}
                  direction={orderBy === 'eid' ? order : 'asc'}
                  onClick={() => handleSort('eid')}
                >
                  EID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'vid'}
                  direction={orderBy === 'vid' ? order : 'asc'}
                  onClick={() => handleSort('vid')}
                >
                  VID
                </TableSortLabel>
              </TableCell>
              <TableCell>Sex</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'w1'}
                  direction={orderBy === 'w1' ? order : 'asc'}
                  onClick={() => handleSort('w1')}
                >
                  W1
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'w2'}
                  direction={orderBy === 'w2' ? order : 'asc'}
                  onClick={() => handleSort('w2')}
                >
                  W2
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'adg'}
                  direction={orderBy === 'adg' ? order : 'asc'}
                  onClick={() => handleSort('adg')}
                >
                  ADG
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Fleece</TableCell>
              <TableCell align="right">Length</TableCell>
              <TableCell align="right">% Shorn</TableCell>
              <TableCell align="right">Micron</TableCell>
              <TableCell align="right">BCS</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'dssmark'}
                  direction={orderBy === 'dssmark' ? order : 'asc'}
                  onClick={() => handleSort('dssmark')}
                >
                  DSS Mark
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'classification'}
                  direction={orderBy === 'classification' ? order : 'asc'}
                  onClick={() => handleSort('classification')}
                >
                  Classification
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No animals to display. Upload data and click "Calculate" to see results.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((animal, index) => (
                <TableRow key={index} hover>
                  <TableCell>{animal.eid || '-'}</TableCell>
                  <TableCell>{animal.vid || '-'}</TableCell>
                  <TableCell>{animal.sex || '-'}</TableCell>
                  <TableCell align="right">{animal.w1 ? animal.w1.toFixed(1) : '-'}</TableCell>
                  <TableCell align="right">{animal.w2 ? animal.w2.toFixed(1) : '-'}</TableCell>
                  <TableCell align="right">{animal.adg ? animal.adg.toFixed(3) : '-'}</TableCell>
                  <TableCell align="right">
                    {animal.fleeceWeight ? animal.fleeceWeight.toFixed(2) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {animal.fiberLength ? animal.fiberLength.toFixed(1) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {animal.percentShornOff ? animal.percentShornOff.toFixed(1) + '%' : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {animal.woolMicron ? animal.woolMicron.toFixed(1) : '-'}
                  </TableCell>
                  <TableCell align="right">{animal.bcs ? animal.bcs.toFixed(1) : '-'}</TableCell>
                  <TableCell align="right">
                    <strong>{animal.dssmark ? animal.dssmark.toFixed(1) : '-'}</strong>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={animal.classification}
                      color={getClassificationColor(animal.classification)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View breakdown">
                      <IconButton size="small" onClick={() => setSelectedAnimal(animal)}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredAndSortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Animal Detail Dialog */}
      <Dialog
        open={Boolean(selectedAnimal)}
        onClose={() => setSelectedAnimal(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedAnimal && (
          <>
            <DialogTitle>
              Animal Details: {selectedAnimal.eid || selectedAnimal.vid}
              <Chip
                label={selectedAnimal.classification}
                color={getClassificationColor(selectedAnimal.classification)}
                size="small"
                sx={{ ml: 2 }}
              />
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="h6" gutterBottom>
                DSS Mark Breakdown: {selectedAnimal.dssmark.toFixed(2)}
              </Typography>

              {selectedAnimal.cullReason && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography color="error.dark">
                    <strong>Cull Reason:</strong> {selectedAnimal.cullReason}
                  </Typography>
                </Box>
              )}

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Criterion</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Points</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedAnimal.breakdown?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.criterion}</TableCell>
                      <TableCell>
                        {item.value === 'N/A' ? 'N/A' : Number(item.value).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <strong>{item.points}</strong>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          size="small"
                          color={
                            item.status === 'optimal'
                              ? 'success'
                              : item.status === 'acceptable'
                              ? 'warning'
                              : item.status === 'missing'
                              ? 'default'
                              : 'error'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Additional Information
                </Typography>
                <Typography variant="body2">Birthdate: {selectedAnimal.birthdate || 'N/A'}</Typography>
                <Typography variant="body2">DAM: {selectedAnimal.dam || 'N/A'}</Typography>
                <Typography variant="body2">Sire: {selectedAnimal.sire || 'N/A'}</Typography>
                <Typography variant="body2">
                  DSS Reg Group: {selectedAnimal.dssRegGroup || 'N/A'}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedAnimal(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default MainTable;
