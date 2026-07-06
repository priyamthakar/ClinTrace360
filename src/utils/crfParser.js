export function parseCrfInput(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, type = "", codelist = ""] = line.split("|").map((part) => part.trim());
      return { label, type, codelist };
    });
}

export function formatCrfFields(fields) {
  return fields.map((field) => [field.label, field.type, field.codelist].filter(Boolean).join(" | ")).join("\n");
}
