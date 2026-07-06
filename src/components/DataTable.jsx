import React, { useState, useMemo } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";

export function DataTable({
  columns,
  data = [],
  searchable = true,
  searchPlaceholder = "Search table...",
  defaultSortKey = "",
  defaultSortDirection = "asc",
  onRowClick = null,
  renderExpandedRow = null,
  expandedRowKey = "", // Key of row ID to check expansion
  expandedRowId = null, // Currently expanded row ID
  rowKeyField = "id",
}) {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSort = (key, sortable = true) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val !== undefined && String(val).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, columns]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortKey, sortDirection]);

  return (
    <div className="data-table-container">
      {searchable && (
        <div className="table-search-bar" style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--border)", gap: 8 }}>
          <Search size={14} style={{ color: "var(--muted)" }} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--fg)",
              outline: "none",
              fontSize: "0.8rem",
              width: "100%",
            }}
          />
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const isSortable = col.sortable !== false;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key, isSortable)}
                    style={{
                      cursor: isSortable ? "pointer" : "default",
                      width: col.width || undefined,
                      textAlign: col.align || "left",
                      userSelect: "none"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: col.align === "right" ? "flex-end" : "flex-start" }}>
                      <span>{col.label}</span>
                      {isSortable && isSorted && (
                        sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>
                  No records found
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => {
                const rowId = row[rowKeyField] ?? index;
                const isExpanded = expandedRowId === rowId;
                return (
                  <React.Fragment key={rowId}>
                    <tr
                      className={isExpanded ? "expanded" : ""}
                      onClick={() => onRowClick && onRowClick(row)}
                      style={{ cursor: onRowClick ? "pointer" : "default" }}
                    >
                      {columns.map((col) => {
                        const cellVal = row[col.key];
                        return (
                          <td key={col.key} style={{ textAlign: col.align || "left" }}>
                            {col.render ? col.render(cellVal, row) : (cellVal ?? "—")}
                          </td>
                        );
                      })}
                    </tr>
                    {isExpanded && renderExpandedRow && (
                      <tr className="detail-row">
                        <td colSpan={columns.length}>
                          {renderExpandedRow(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
