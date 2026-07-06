export function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push("");
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }

  // Filter out completely empty rows
  return lines.filter((line) => line.some((cell) => cell.trim() !== ""));
}

export function detectDomain(headers) {
  const normalized = headers.map((h) => h.toUpperCase().trim());
  
  if (normalized.includes("AGE") || normalized.includes("ARMCD") || normalized.includes("BRTHDTC")) {
    return "dm";
  }
  if (normalized.includes("VISITNUM") || normalized.includes("SVSTDTC")) {
    return "sv";
  }
  if (normalized.includes("LBTESTCD") || normalized.includes("LBORRES")) {
    return "lb";
  }
  if (normalized.includes("AETERM") || normalized.includes("AESER")) {
    return "ae";
  }
  if (normalized.includes("EXDOSE") || normalized.includes("EXTRT")) {
    return "ex";
  }
  if (normalized.includes("SAESSION") || normalized.includes("SAETERM")) {
    return "safety";
  }
  if (normalized.includes("LABSRC") || normalized.includes("LAB_MISSING_IN_EDC")) {
    return "localLabs";
  }
  return null;
}

export function convertRowsToObjects(headers, rows) {
  return rows.map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      let val = row[index] !== undefined ? row[index].trim() : "";
      
      // Parse numeric fields if they are purely digits or decimals
      if (val !== "" && !isNaN(val) && /^-?\d+(\.\d+)?$/.test(val)) {
        val = Number(val);
      }
      
      obj[header.trim()] = val;
    });
    return obj;
  });
}
