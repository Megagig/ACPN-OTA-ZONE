// Fix for the due.controller.ts issues
// Run this to fix the errors with due.populate references

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const controllerPath = path.join(__dirname, '../src/controllers/due.controller.ts');

// Read the file
fs.readFile(controllerPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Fix the first issue with populate
  const fixedData = data.replace(
    /await due\.populate\('dueTypeId pharmacyId'\);/g,
    `// Populate references
    const populatedDue = await Due.findOne({
      pharmacyId,
      dueTypeId,
      year: dueYear,
    }).populate('dueTypeId pharmacyId');`
  );

  // Fix the second issue with due in the response data
  const fixedData2 = fixedData.replace(
    /data: due,/g, 
    `data: populatedDue,`
  );

  // Write the fixed content back to the file
  fs.writeFile(controllerPath, fixedData2, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('Fixed due.controller.ts successfully');
  });
});
