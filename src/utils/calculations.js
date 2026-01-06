// calculations.js - Core calculation logic for DSS Lite

/**
 * Extract barcode from EID (last 12 digits) or use QRID
 */
function extractBarcode(eid, qrid) {
  if (qrid) return qrid;
  if (eid && eid.length >= 12) {
    return eid.slice(-12);
  }
  return null;
}

/**
 * Smart animal ID matching - handles EID, VID, QRID, and Barcode
 */
function getAnimalId(record) {
  const eid = record.eid;
  const vid = record.vid;
  const qrid = record.qr || record.qrid;
  const barcode = record.barcode;
  const tattoo = record.tattoo;
  
  const generatedBarcode = extractBarcode(eid, qrid);
  
  if (eid) return `EID:${eid}`;
  if (vid) return `VID:${vid}`;
  if (qrid) return `QRID:${qrid}`;
  if (generatedBarcode) return `BC:${generatedBarcode}`;
  if (barcode) return `BC:${barcode}`;
  if (tattoo) return `TAT:${tattoo}`;
  
  return null;
}

/**
 * Try to match an animal across different ID types
 */
function findMatchingAnimal(animalMap, record) {
  const eid = record.eid;
  const vid = record.vid;
  const qrid = record.qr || record.qrid;
  const barcode = record.barcode;
  const generatedBarcode = extractBarcode(eid, qrid);
  
  const possibleKeys = [
    eid ? `EID:${eid}` : null,
    vid ? `VID:${vid}` : null,
    qrid ? `QRID:${qrid}` : null,
    generatedBarcode ? `BC:${generatedBarcode}` : null,
    barcode ? `BC:${barcode}` : null,
  ].filter(Boolean);
  
  for (const [existingId, animal] of animalMap.entries()) {
    const animalEid = animal.eid ? `EID:${animal.eid}` : null;
    const animalVid = animal.vid ? `VID:${animal.vid}` : null;
    const animalQrid = animal.qrid ? `QRID:${animal.qrid}` : null;
    const animalBarcode = animal.barcode ? `BC:${animal.barcode}` : null;
    
    const animalKeys = [animalEid, animalVid, animalQrid, animalBarcode].filter(Boolean);
    
    for (const possibleKey of possibleKeys) {
      if (animalKeys.includes(possibleKey)) {
        return existingId;
      }
    }
  }
  
  return null;
}

/**
 * Aggregate event data per animal
 */
function aggregateAnimalData(eventData) {
  const animalMap = new Map();

  const getAnimal = (record) => {
    const existingId = findMatchingAnimal(animalMap, record);
    
    if (existingId) {
      const animal = animalMap.get(existingId);
      
      if (record.eid && !animal.eid) animal.eid = record.eid;
      if (record.vid && !animal.vid) animal.vid = record.vid;
      if (record.qr && !animal.qrid) animal.qrid = record.qr;
      if (record.qrid && !animal.qrid) animal.qrid = record.qrid;
      
      if (!animal.barcode) {
        animal.barcode = extractBarcode(animal.eid, animal.qrid) || record.barcode;
      }
      
      return animal;
    }
    
    const id = getAnimalId(record);
    if (!id) return null;
    
    const newAnimal = {
      id,
      eid: record.eid || null,
      vid: record.vid || null,
      qrid: record.qr || record.qrid || null,
      barcode: extractBarcode(record.eid, record.qr || record.qrid) || record.barcode || null,
      birthdate: null,
      birthStatus: null,
      dam: null,
      sire: null,
      sex: null,
      w1: null,
      w1Date: null,
      w2: null,
      w2Date: null,
      adg: null,
      fleeceWeight: null,
      fleeceWeightDate: null,
      finalBodyWeight: null,
      percentShornOff: null,
      cleanYield: null,
      woolMicron: null,
      cvDifference: null,
      comfortFactor: null,
      fiberLength: null,
      bcs: null,
      bcsDate: null,
      conformationScore: null,
      woolScore: null,
      motherRepro: null,
      motherReproGroup: null,
      dssRegGroup: null,
      dssMGroup: null,
      testGroup: null,
      woolType: null,
    };
    
    animalMap.set(id, newAnimal);
    return newAnimal;
  };

  eventData.registrations?.forEach((reg) => {
    const animal = getAnimal(reg);
    if (!animal) return;
    
    animal.birthdate = reg.dob || animal.birthdate;
    animal.birthStatus = reg.birthStatus || animal.birthStatus;
    animal.sex = reg.sex || animal.sex;
    animal.dam = reg.dam || animal.dam;
    animal.sire = reg.sire || animal.sire;
    animal.dssRegGroup = reg.dssRegGroup || animal.dssRegGroup;
    animal.dssMGroup = reg.dssMGroup || animal.dssMGroup;
    
    if (reg.processId === 'BKB126' && reg.weight) {
      animal.w1 = reg.weight;
      animal.w1Date = reg.date;
    }
  });

  eventData.w1?.forEach((w) => {
    const animal = getAnimal(w);
    if (!animal) return;
    
    if (!animal.w1 && w.w1) {
      animal.w1 = parseFloat(w.w1);
      animal.w1Date = w.date;
    }
  });

  eventData.w2?.forEach((w) => {
    const animal = getAnimal(w);
    if (!animal) return;
    
    animal.w2 = parseFloat(w.w2);
    animal.w2Date = w.date;
    animal.finalBodyWeight = animal.w2;
  });

  animalMap.forEach((animal) => {
    if (animal.w1 && animal.w2 && animal.w1Date && animal.w2Date) {
      const date1 = new Date(animal.w1Date);
      const date2 = new Date(animal.w2Date);
      const days = Math.abs((date2 - date1) / (1000 * 60 * 60 * 24));
      if (days > 0) {
        animal.adg = (animal.w2 - animal.w1) / days;
      }
    }
  });

  eventData.fleeceWeight?.forEach((fw) => {
    const animal = getAnimal(fw);
    if (!animal) return;
    
    animal.fleeceWeight = parseFloat(fw.fw);
    animal.fleeceWeightDate = fw.date;
    
    if (animal.finalBodyWeight && animal.fleeceWeight) {
      animal.percentShornOff = (animal.fleeceWeight / animal.finalBodyWeight) * 100;
    }
  });

  eventData.wtb?.forEach((wtb) => {
    const animal = getAnimal(wtb);
    if (!animal) return;
    
    animal.woolMicron = parseFloat(wtb.mfd);
    animal.cvDifference = parseFloat(wtb.cvDifference);
    animal.comfortFactor = parseFloat(wtb.comfortFactorPct);
    animal.cleanYield = parseFloat(wtb.yieldPct);
    animal.fiberLength = parseFloat(wtb.manualLength);
  });

  eventData.ofda?.forEach((ofda) => {
    const animal = getAnimal(ofda);
    if (!animal) return;
    
    animal.woolMicron = parseFloat(ofda.micAve);
    animal.cvDifference = parseFloat(ofda.cvDifference);
    animal.comfortFactor = parseFloat(ofda.cfPercent);
    animal.cleanYield = parseFloat(ofda.yieldPercent);
    animal.fiberLength = parseFloat(ofda.slMm);
  });

  eventData.marks?.forEach((mark) => {
    const animal = getAnimal(mark);
    if (!animal) return;
    
    animal.conformationScore = parseFloat(mark.conformation);
    animal.woolScore = parseFloat(mark.woolMark);
    animal.bcs = parseFloat(mark.bcs);
  });

  eventData.bcs?.forEach((bcs) => {
    const animal = getAnimal(bcs);
    if (!animal) return;
    
    if (!animal.bcs) {
      animal.bcs = parseFloat(bcs.bcs);
      animal.bcsDate = bcs.date;
    }
  });

  eventData.motherRepro?.forEach((mr) => {
    const animal = getAnimal(mr);
    if (!animal) return;
    
    animal.dam = mr.damId || animal.dam;
    animal.motherRepro = parseFloat(mr.dssValue);
    animal.motherReproGroup = mr.group || mr.dssGroup;
  });

  return Array.from(animalMap.values());
}

/**
 * Calculate DSS Mark for an animal based on configuration
 */
function calculateDSSMark(animal, configuration) {
  let totalPoints = 0;
  let cullReason = null;
  const breakdown = [];

  configuration.criteria.forEach((criterion) => {
    if (!criterion.enabled) return;

    const value = animal[criterion.id];
    if (value === null || value === undefined) {
      breakdown.push({
        criterion: criterion.name,
        value: 'N/A',
        points: 0,
        status: 'missing',
      });
      return;
    }

    let points = 0;
    let status = 'fail';

    if (criterion.operator === 'between') {
      if (
        criterion.lowerLimit !== null &&
        criterion.upperLimit !== null &&
        value >= criterion.lowerLimit &&
        value <= criterion.upperLimit
      ) {
        points = 1;
        status = 'optimal';
      } else if (
        criterion.lowerLimit2 !== null &&
        criterion.lowerLimit !== null &&
        value >= criterion.lowerLimit2 &&
        value < criterion.lowerLimit
      ) {
        points = 0.5;
        status = 'acceptable';
      } else if (
        criterion.upperLimit !== null &&
        criterion.upperLimit2 !== null &&
        value > criterion.upperLimit &&
        value <= criterion.upperLimit2
      ) {
        points = 0.5;
        status = 'acceptable';
      }
    } else if (criterion.operator === 'greater') {
      if (criterion.lowerLimit !== null && value >= criterion.lowerLimit) {
        points = 1;
        status = 'optimal';
      } else if (criterion.lowerLimit2 !== null && value >= criterion.lowerLimit2) {
        points = 0.5;
        status = 'acceptable';
      }
    } else if (criterion.operator === 'less') {
      if (criterion.upperLimit !== null && value <= criterion.upperLimit) {
        points = 1;
        status = 'optimal';
      } else if (criterion.upperLimit2 !== null && value <= criterion.upperLimit2) {
        points = 0.5;
        status = 'acceptable';
      }
    }

    if (criterion.cullIfFailed && points === 0) {
      cullReason = `Failed cull criterion: ${criterion.name}`;
    }

    totalPoints += points;
    breakdown.push({
      criterion: criterion.name,
      value,
      points,
      status,
    });
  });

  return {
    dssmark: totalPoints,
    cullReason,
    breakdown,
  };
}

/**
 * Get statistics for dashboard
 */
function getStatistics(data) {
  if (!data || data.length === 0) {
    return {
      total: 0,
      byClassification: {},
      averages: {},
      distributions: {},
    };
  }

  const byClassification = data.reduce((acc, animal) => {
    acc[animal.classification] = (acc[animal.classification] || 0) + 1;
    return acc;
  }, {});

  const metrics = ['w1', 'w2', 'adg', 'fleeceWeight', 'woolMicron', 'bcs', 'dssmark'];
  const averages = {};
  
  metrics.forEach((metric) => {
    const values = data
      .map((a) => a[metric])
      .filter((v) => v !== null && v !== undefined && !isNaN(v));
    
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      averages[metric] = sum / values.length;
    } else {
      averages[metric] = 0;
    }
  });

  const dssMarkDistribution = {};
  data.forEach((animal) => {
    const mark = Math.floor(animal.dssmark || 0);
    dssMarkDistribution[mark] = (dssMarkDistribution[mark] || 0) + 1;
  });

  return {
    total: data.length,
    byClassification,
    averages,
    distributions: {
      dssmark: dssMarkDistribution,
    },
  };
}

/**
 * Calculate averages for all criteria from animal data
 */
function calculateCriteriaAverages(data) {
  if (!data || data.length === 0) {
    return {};
  }

  const criteriaFields = [
    'w1', 'w2', 'adg', 'fleeceWeight', 'cleanYield', 'percentShornOff',
    'bcs', 'conformationScore', 'woolScore', 'motherRepro', 'comfortFactor',
    'woolMicron', 'cvDifference', 'fiberLength'
  ];

  const averages = {};
  
  criteriaFields.forEach((field) => {
    const values = data
      .map((a) => a[field])
      .filter((v) => v !== null && v !== undefined && !isNaN(v));
    
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      averages[field] = {
        avg: avg,
        min: min,
        max: max,
        count: values.length,
      };
    }
  });

  return averages;
}

export { aggregateAnimalData, calculateDSSMark, getStatistics, calculateCriteriaAverages };
