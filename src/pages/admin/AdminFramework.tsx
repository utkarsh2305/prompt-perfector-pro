import { useMemo, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAdminFramework } from "@/hooks/use-admin-data";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Upload, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CSVRow = {
  section_number: number;
  principle: string;
  severity_level: string;
  default_penalty: number;
  tier_required: string;
  is_active: boolean;
};

type ImportError = {
  row: number;
  message: string;
};

function parseCSV(text: string): { rows: CSVRow[]; errors: ImportError[] } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) {
    return { rows: [], errors: [{ row: 0, message: "File is empty or missing data rows" }] };
  }

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""));
  const requiredCols = ["section_number", "principle", "severity_level", "default_penalty", "tier_required", "is_active"];
  const missing = requiredCols.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    return { rows: [], errors: [{ row: 0, message: `Missing columns: ${missing.join(", ")}` }] };
  }

  const colIndex = Object.fromEntries(requiredCols.map((c) => [c, header.indexOf(c)]));
  const rows: CSVRow[] = [];
  const errors: ImportError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (handles quoted values)
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const sectionNum = parseInt(values[colIndex.section_number], 10);
    const principle = values[colIndex.principle]?.replace(/^"|"$/g, "");
    const severity = values[colIndex.severity_level]?.toLowerCase();
    const penalty = parseInt(values[colIndex.default_penalty], 10);
    const tier = values[colIndex.tier_required]?.toLowerCase();
    const active = values[colIndex.is_active]?.toLowerCase() === "true";

    // Validation
    const rowErrors: string[] = [];
    if (isNaN(sectionNum) || sectionNum < 1 || sectionNum > 5) {
      rowErrors.push("section_number must be 1-5");
    }
    if (!principle || principle.length < 3) {
      rowErrors.push("principle is required (min 3 chars)");
    }
    if (!["critical", "major", "minor"].includes(severity)) {
      rowErrors.push("severity_level must be critical/major/minor");
    }
    if (isNaN(penalty) || penalty < 1 || penalty > 5) {
      rowErrors.push("default_penalty must be 1-5");
    }
    if (!["free", "pro", "enterprise"].includes(tier)) {
      rowErrors.push("tier_required must be free/pro/enterprise");
    }

    if (rowErrors.length > 0) {
      errors.push({ row: i + 1, message: rowErrors.join("; ") });
    } else {
      rows.push({
        section_number: sectionNum,
        principle,
        severity_level: severity,
        default_penalty: penalty,
        tier_required: tier,
        is_active: active,
      });
    }
  }

  return { rows, errors };
}

export default function AdminFramework() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("all");
  const [active, setActive] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importPreview, setImportPreview] = useState<CSVRow[]>([]);

  const query = useAdminFramework({ q, tier, active, page, pageSize });

  const totalPages = useMemo(() => {
    const total = query.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [query.data?.total]);

  const importMutation = useMutation({
    mutationFn: async (rows: CSVRow[]) => {
      const { data, error } = await supabase.functions.invoke("admin-framework-import", {
        body: { rows },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: `Imported ${data.inserted} rules successfully.` });
      setImportDialogOpen(false);
      setImportPreview([]);
      setImportErrors([]);
      queryClient.invalidateQueries({ queryKey: ["admin", "framework"] });
    },
    onError: (err) => {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { rows, errors } = parseCSV(text);
      setImportErrors(errors);
      setImportPreview(rows);
      setImportDialogOpen(true);
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    const rows = query.data?.rows ?? [];
    if (rows.length === 0) {
      toast({ title: "No data to export" });
      return;
    }

    const header = "section_number,principle,severity_level,default_penalty,tier_required,is_active";
    const csvRows = rows.map((r) =>
      `${r.section_number},"${r.principle.replace(/"/g, '""')}",${r.severity_level},${r.default_penalty},${r.tier_required},${r.is_active}`
    );
    const csv = [header, ...csvRows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "framework_rules.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-label="Admin framework rules">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Framework Rules</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage prompt principles and tier gating.
        </p>
      </div>

      <Card className="pp-surface mt-6 rounded-xl border p-5">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            className="h-11"
            placeholder="Search principles…"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => setTier((t) => (t === "all" ? "pro" : "all"))}
            >
              Tier: {tier}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => setActive((a) => (a === "all" ? "true" : "all"))}
            >
              Active: {active}
            </Button>
            <Button variant="outline" size="sm" className="min-h-11 gap-1.5" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="outline" size="sm" className="min-h-11" onClick={() => query.refetch()}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Rules List */}
        <div className="mt-5">
          {query.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : query.isError ? (
            <Alert className="border-border bg-background">
              <AlertTitle>Couldn't load framework rules.</AlertTitle>
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                  Try again
                </Button>
              </div>
            </Alert>
          ) : query.data?.rows.length ? (
            <div className="space-y-2">
              {query.data.rows.map((r) => (
                <div key={r.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-medium">
                        <span className="text-muted-foreground">S{r.section_number}:</span>{" "}
                        {r.principle}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{r.section_name}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{r.severity_level}</Badge>
                      <Badge variant="outline">-{r.default_penalty}</Badge>
                      <Badge variant="secondary">{r.tier_required}</Badge>
                      <Badge variant={r.is_active ? "secondary" : "outline"}>
                        {r.is_active ? "active" : "inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">No rules found.</div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <div className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </Card>

      {/* Import Preview Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Import CSV Preview</DialogTitle>
            <DialogDescription>
              Review the parsed data before importing.
            </DialogDescription>
          </DialogHeader>

          {importErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Errors</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-inside list-disc text-sm">
                  {importErrors.slice(0, 10).map((err, i) => (
                    <li key={i}>
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                  {importErrors.length > 10 && (
                    <li>…and {importErrors.length - 10} more errors</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {importPreview.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium">{importPreview.length} valid rows to import:</p>
              <div className="mt-2 max-h-48 overflow-auto rounded border text-xs">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Section</th>
                      <th className="p-2 text-left">Principle</th>
                      <th className="p-2 text-left">Severity</th>
                      <th className="p-2 text-left">Penalty</th>
                      <th className="p-2 text-left">Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{row.section_number}</td>
                        <td className="p-2">{row.principle.slice(0, 40)}…</td>
                        <td className="p-2">{row.severity_level}</td>
                        <td className="p-2">{row.default_penalty}</td>
                        <td className="p-2">{row.tier_required}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importPreview.length > 20 && (
                  <p className="p-2 text-muted-foreground">
                    …and {importPreview.length - 20} more rows
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={importPreview.length === 0 || importMutation.isPending}
              onClick={() => importMutation.mutate(importPreview)}
            >
              {importMutation.isPending ? "Importing…" : `Import ${importPreview.length} Rules`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
