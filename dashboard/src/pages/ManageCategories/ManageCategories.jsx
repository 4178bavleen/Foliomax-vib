import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table/index";
import Badge from "../../components/ui/badge/Badge";

const initialCategories = [
  { id: 1, name: "ADae", status: "Disabled" },
  { id: 2, name: "Automobile", status: "Enabled" },
  { id: 3, name: "Books", status: "Enabled" },
  { id: 4, name: "cxgsd", status: "Disabled" },
  { id: 5, name: "Health & Beauty", status: "Enabled" },
  { id: 6, name: "Home & Audio", status: "Enabled" },
  { id: 7, name: "Home & Lifestyle", status: "Enabled" },
  { id: 8, name: "Jewelry", status: "Enabled" },
  { id: 9, name: "Mens Fashion", status: "Enabled" },
  { id: 10, name: "Others", status: "Disabled" },
  { id: 11, name: "Sports & Outdoor", status: "Enabled" },
  { id: 12, name: "test", status: "Disabled" },
];

export default function ManageCategories() {
  const [categories, setCategories] = useState(initialCategories);
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const handleToggleStatus = (id) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === "Enabled" ? "Disabled" : "Enabled" } : c
      )
    );
  };

  const handleEdit = (id) => {
    console.log("Edit category", id);
  };

  const filtered = useMemo(() => {
    if (!query) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  }, [categories, query]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  if (page > totalPages) setPage(totalPages);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] overflow-hidden">
      <div style={{ padding: 20 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
            justifyContent: "space-between",
          }}
        >
          <Box>
            <h2 style={{ margin: 0, fontWeight: 700, color: "#1f2937" }}>Categories</h2>
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Search..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton size="small">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: "white",
                borderRadius: 1,
                "& .MuiOutlinedInput-notchedOutline": { border: "1px solid #e6e6f0" },
                width: 300,
              }}
            />

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              sx={{
                textTransform: "none",
                borderColor: "#6B46FF",
                color: "#6B46FF",
                borderWidth: 1.5,
                "&:hover": { backgroundColor: "rgba(107,70,255,0.04)" },
              }}
              onClick={() => {
                // open add modal or route
                console.log("Add new category");
              }}
            >
              Add New
            </Button>
          </Box>
        </Box>

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  S.N
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {paginated.map((cat, idx) => (
                <TableRow key={cat.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <span className="text-sm text-gray-600">
                      {(page - 1) * pageSize + idx + 1}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300">
                    {cat.name}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-start">
                    <Badge
                      size="sm"
                      color={cat.status === "Enabled" ? "success" : "warning"}
                    >
                      {cat.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-start">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(cat.id)}
                        sx={{
                          textTransform: "none",
                          borderColor: "#6B46FF",
                          color: "#6B46FF",
                          "&:hover": { backgroundColor: "rgba(107,70,255,0.04)" },
                        }}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={cat.status === "Enabled" ? <BlockIcon /> : <VisibilityIcon />}
                        color={cat.status === "Enabled" ? "error" : "success"}
                        onClick={() => handleToggleStatus(cat.id)}
                        sx={{
                          textTransform: "none",
                          borderColor: cat.status === "Enabled" ? "#ef4444" : "#16a34a",
                          color: cat.status === "Enabled" ? "#ef4444" : "#16a34a",
                          "&:hover": {
                            backgroundColor:
                              cat.status === "Enabled" ? "rgba(239,68,68,0.04)" : "rgba(16,185,129,0.04)",
                          },
                        }}
                      >
                        {cat.status === "Enabled" ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded px-2 py-1"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>
              {totalRows === 0 ? 0 : (page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, totalRows)} of {totalRows}
            </span>

            <Button size="small" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Prev
            </Button>
            <Button
              size="small"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
