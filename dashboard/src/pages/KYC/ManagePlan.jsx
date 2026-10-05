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

import Badge from "../../components/ui/badge/Badge"; // your badge component (used for status)

const initialRows = [
  {
    id: 1,
    name: "Basic",
    price: "$50.00 USD",
    bv: 5000,
    referralCommission: "$4,500.00 USD",
    treeCommission: "$4,200.00 USD",
    status: "Enabled",
  },
  {
    id: 2,
    name: "Standard",
    price: "$100.00 USD",
    bv: 221,
    referralCommission: "$21.00 USD",
    treeCommission: "$45.00 USD",
    status: "Enabled",
  },
  {
    id: 3,
    name: "Silver",
    price: "$199.00 USD",
    bv: 60,
    referralCommission: "$10.00 USD",
    treeCommission: "$10.00 USD",
    status: "Enabled",
  },
  {
    id: 4,
    name: "Gold",
    price: "$250.00 USD",
    bv: 80,
    referralCommission: "$2.00 USD",
    treeCommission: "$5.00 USD",
    status: "Enabled",
  },
  {
    id: 5,
    name: "Platinum",
    price: "$300.00 USD",
    bv: 150,
    referralCommission: "$5.00 USD",
    treeCommission: "$2.00 USD",
    status: "Enabled",
  },
  {
    id: 6,
    name: "Premium",
    price: "$1,000.00 USD",
    bv: 1,
    referralCommission: "$1.00 USD",
    treeCommission: "$1.00 USD",
    status: "Disabled",
  },
];

export default function ManagePlanTable() {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const handleToggleStatus = (id) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === "Enabled" ? "Disabled" : "Enabled" } : r
      )
    );
  };

  const handleEdit = (id) => {
    console.log("Edit plan", id);
  };

  const filteredRows = useMemo(() => {
    if (!query) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));
  }, [rows, query]);

  // pagination calculations
  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  // keep page valid if pageSize or filteredRows changes
  if (page > totalPages) setPage(totalPages);

  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] overflow-hidden">
      <div style={{ padding: 20 }}>
        {/* Header - Title, Search and Add New */}
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
            <h2 style={{ margin: 0, fontWeight: 700, color: "#1f2937" }}>Manage Plans</h2>
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Search..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1); // reset to first page on search
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
                console.log("Add new clicked");
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
                  Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Price
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Business Volume (BV)
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Referral Commission
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Tree Commission
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
              {paginatedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-2">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {row.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {row.price}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {row.bv}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {row.referralCommission}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {row.treeCommission}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {/* Use your Badge component to maintain consistent UI */}
                    <Badge
                      size="sm"
                      color={row.status === "Enabled" ? "success" : "warning"}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(row.id)}
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
                        startIcon={row.status === "Enabled" ? <BlockIcon /> : <VisibilityIcon />}
                        color={row.status === "Enabled" ? "error" : "success"}
                        onClick={() => handleToggleStatus(row.id)}
                        sx={{
                          textTransform: "none",
                          borderColor: row.status === "Enabled" ? "#ef4444" : "#16a34a",
                          color: row.status === "Enabled" ? "#ef4444" : "#16a34a",
                          "&:hover": {
                            backgroundColor:
                              row.status === "Enabled" ? "rgba(239,68,68,0.04)" : "rgba(16,185,129,0.04)",
                          },
                        }}
                      >
                        {row.status === "Enabled" ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {/* show empty state if no rows */}
              {paginatedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No plans found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination controls */}
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

            <Button
              size="small"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
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
