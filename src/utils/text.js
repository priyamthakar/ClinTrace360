export function fillTemplate(template, values) {
  return template.replaceAll(/\{([^}]+)\}/g, (_, key) => values[key] ?? "");
}

export function normalizeTerm(term) {
  return String(term ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
