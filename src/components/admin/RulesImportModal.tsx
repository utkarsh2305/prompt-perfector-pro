import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { RuleCategory } from "@/hooks/use-framework";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface ParsedRow {
  rule_number?: string | number;
  rule_name?: string;
  rule_description?: string;
  category?: string;
  weight?: string | number;
  detection_keywords?: string;
  detection_patterns?: string;
  positive_examples?: string;
  negative_examples?: string;
  improvement_template?: string;
  tier_required?: string;
  [key: string]: unknown;
}

interface ColumnMapping {
  rule_number: string;
  rule_name: string;
  rule_description: string;
  category: string;
  weight: string;
  detection_keywords: string;
  detection_patterns: string;
  positive_examples: string;
  negative_examples: string;
  improvement_template: string;
  tier_required: string;
}

interface ImportWarning {
  row: number;
  message: string;
}

interface ImportOptions {
  skipDuplicates: boolean;
  updateExisting: boolean;
  autoCreateCategories: boolean;
}

interface RulesImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: RuleCategory[];
  onImportComplete: () => void;
}

const REQUIRED_FIELDS = ["rule_number", "rule_name"] as const;

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  rule_number: "Rule Number",
  rule_name: "Rule Name",
  rule_description: "Description",
  category: "Category",
  weight: "Weight",
  detection_keywords: "Detection Keywords",
  detection_patterns: "Detection Patterns",
  positive_examples: "Positive Examples",
  negative_examples: "Negative Examples",
  improvement_template: "Improvement Template",
  tier_required: "Tier Required",
};

const DEFAULT_MAPPING: ColumnMapping = {
  rule_number: "",
  rule_name: "",
  rule_description: "",
  category: "",
  weight: "",
  detection_keywords: "",
  detection_patterns: "",
  positive_examples: "",
  negative_examples: "",
  improvement_template: "",
  tier_required: "",
};

/* -------------------------------------------------------------------------- */
/*                               Template CSV                                 */
/* -------------------------------------------------------------------------- */

const TEMPLATE_CSV = `rule_number,rule_name,rule_description,category,weight,detection_keywords,detection_patterns,positive_examples,negative_examples,improvement_template,tier_required
1,Specify the task clearly,Always state exactly what you want the AI to do,Clarity,5,"vague,unclear,ambiguous","^(help|do something)","Write a 500-word blog post about climate change|Create a Python function that sorts a list","Help me with my project|Do something with this data","Be specific about what you want: [SPECIFIC_TASK]",free
2,Provide relevant context,Include background information the AI needs,Context,4,"context,background,info","","I'm a marketing manager launching a new product. Write copy for...|As a software developer working on a React app, help me...","Write something good|Make this better","Add context: Who you are, what you're working on, and why",free
3,Define the output format,Specify how you want the response structured,Format,4,"format,structure,output","","Return the data as a JSON object with keys: name, age, email|Write your response as a bulleted list with 5 items","Give me information|Tell me about X","Specify the format: [FORMAT_TYPE] with [STRUCTURE_DETAILS]",free`;

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export function RulesImportModal({
  open,
  onOpenChange,
  categories,
  onImportComplete,
}: RulesImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(DEFAULT_MAPPING);
  const [warnings, setWarnings] = useState<ImportWarning[]>([]);
  const [options, setOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    updateExisting: false,
    autoCreateCategories: true,
  });
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Reset state when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFile(null);
      setParsedData([]);
      setHeaders([]);
      setMapping(DEFAULT_MAPPING);
      setWarnings([]);
      setOptions({
        skipDuplicates: true,
        updateExisting: false,
        autoCreateCategories: true,
      });
    }
    onOpenChange(newOpen);
  };

  // Auto-detect column mapping based on header names
  const autoDetectMapping = useCallback((headerRow: string[]) => {
    const newMapping = { ...DEFAULT_MAPPING };
    const lowerHeaders = headerRow.map((h) => h.toLowerCase().trim());

    const mappingPatterns: Record<keyof ColumnMapping, string[]> = {
      rule_number: ["rule_number", "rule #", "number", "#", "id", "rule_id"],
      rule_name: ["rule_name", "name", "title", "rule"],
      rule_description: ["rule_description", "description", "desc", "details"],
      category: ["category", "cat", "section", "group"],
      weight: ["weight", "priority", "importance", "severity"],
      detection_keywords: ["detection_keywords", "keywords", "tags"],
      detection_patterns: ["detection_patterns", "patterns", "regex"],
      positive_examples: ["positive_examples", "good_examples", "examples_good"],
      negative_examples: ["negative_examples", "bad_examples", "examples_bad"],
      improvement_template: ["improvement_template", "template", "suggestion"],
      tier_required: ["tier_required", "tier", "plan", "level"],
    };

    for (const [field, patterns] of Object.entries(mappingPatterns)) {
      const matchIndex = lowerHeaders.findIndex((h) =>
        patterns.some((p) => h.includes(p) || p.includes(h))
      );
      if (matchIndex !== -1) {
        (newMapping as Record<string, string>)[field] = headerRow[matchIndex];
      }
    }

    return newMapping;
  }, []);

  // Validate parsed data and generate warnings
  const validateData = useCallback(
    (data: ParsedRow[], columnMapping: ColumnMapping) => {
      const newWarnings: ImportWarning[] = [];
      const categoryNames = categories.map((c) => c.name.toLowerCase());

      data.forEach((row, idx) => {
        const rowNum = idx + 2; // +2 for 1-indexed and header row

        // Check weight range
        const weightKey = columnMapping.weight;
        if (weightKey && row[weightKey]) {
          const weight = parseFloat(String(row[weightKey]));
          if (weight > 5) {
            newWarnings.push({
              row: rowNum,
              message: `Weight "${weight}" exceeds max, will cap at 5`,
            });
          } else if (weight < 1) {
            newWarnings.push({
              row: rowNum,
              message: `Weight "${weight}" below min, will set to 1`,
            });
          }
        }

        // Check category existence
        const categoryKey = columnMapping.category;
        if (categoryKey && row[categoryKey]) {
          const catName = String(row[categoryKey]).toLowerCase().trim();
          if (catName && !categoryNames.includes(catName)) {
            newWarnings.push({
              row: rowNum,
              message: `Category "${row[categoryKey]}" doesn't exist (will create)`,
            });
          }
        }

        // Check tier value
        const tierKey = columnMapping.tier_required;
        if (tierKey && row[tierKey]) {
          const tier = String(row[tierKey]).toLowerCase().trim();
          if (tier && !["free", "pro", "enterprise"].includes(tier)) {
            newWarnings.push({
              row: rowNum,
              message: `Invalid tier "${row[tierKey]}", will default to "free"`,
            });
          }
        }
      });

      return newWarnings;
    },
    [categories]
  );

  // Parse file content
  const parseFile = useCallback(
    async (selectedFile: File) => {
      const extension = selectedFile.name.split(".").pop()?.toLowerCase();

      try {
        let data: ParsedRow[] = [];
        let headerRow: string[] = [];

        if (extension === "csv") {
          // Parse CSV with Papa Parse
          const result = await new Promise<Papa.ParseResult<ParsedRow>>(
            (resolve, reject) => {
              Papa.parse<ParsedRow>(selectedFile, {
                header: true,
                skipEmptyLines: true,
                complete: resolve,
                error: reject,
              });
            }
          );
          data = result.data;
          headerRow = result.meta.fields || [];
        } else if (extension === "xlsx" || extension === "xls") {
          // Parse Excel with SheetJS
          const buffer = await selectedFile.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, {
            defval: "",
          });
          data = jsonData;
          if (data.length > 0) {
            headerRow = Object.keys(data[0]);
          }
        } else {
          toast.error("Unsupported file format. Please use CSV or Excel.");
          return;
        }

        // Filter out empty rows
        data = data.filter((row) =>
          Object.values(row).some((v) => v !== "" && v !== null && v !== undefined)
        );

        setHeaders(headerRow);
        setParsedData(data);

        const detectedMapping = autoDetectMapping(headerRow);
        setMapping(detectedMapping);

        const newWarnings = validateData(data, detectedMapping);
        setWarnings(newWarnings);

        setFile(selectedFile);
      } catch (error) {
        console.error("Parse error:", error);
        toast.error("Failed to parse file. Please check the format.");
      }
    },
    [autoDetectMapping, validateData]
  );

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        parseFile(droppedFile);
      }
    },
    [parseFile]
  );

  // Handle file select
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        parseFile(selectedFile);
      }
    },
    [parseFile]
  );

  // Update mapping and revalidate
  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    const newMapping = { ...mapping, [field]: value };
    setMapping(newMapping);
    setWarnings(validateData(parsedData, newMapping));
  };

  // Download template
  const handleDownloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "framework_rules_template.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Transform row data based on mapping
  const transformRow = (row: ParsedRow) => {
    const getValue = (field: keyof ColumnMapping) => {
      const key = mapping[field];
      return key ? row[key] : undefined;
    };

    const parseCommaSeparated = (value: unknown): string[] => {
      if (!value) return [];
      return String(value)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const parsePipeSeparated = (value: unknown): string[] => {
      if (!value) return [];
      return String(value)
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const weight = parseFloat(String(getValue("weight") || 3));

    return {
      rule_number: parseInt(String(getValue("rule_number")), 10),
      rule_name: String(getValue("rule_name") || ""),
      rule_description: String(getValue("rule_description") || ""),
      category: String(getValue("category") || ""),
      weight: Math.min(5, Math.max(1, isNaN(weight) ? 3 : weight)),
      detection_keywords: parseCommaSeparated(getValue("detection_keywords")),
      detection_patterns: parseCommaSeparated(getValue("detection_patterns")),
      positive_examples: parsePipeSeparated(getValue("positive_examples")),
      negative_examples: parsePipeSeparated(getValue("negative_examples")),
      improvement_template: String(getValue("improvement_template") || ""),
      tier_required: ["free", "pro", "enterprise"].includes(
        String(getValue("tier_required") || "").toLowerCase()
      )
        ? String(getValue("tier_required")).toLowerCase()
        : "free",
    };
  };

  // Import rules
  const handleImport = async () => {
    // Validate required mappings
    const missingRequired = REQUIRED_FIELDS.filter((f) => !mapping[f]);
    if (missingRequired.length > 0) {
      toast.error(
        `Please map required columns: ${missingRequired
          .map((f) => FIELD_LABELS[f])
          .join(", ")}`
      );
      return;
    }

    setIsImporting(true);

    try {
      const transformedRows = parsedData.map(transformRow);

      const { data, error } = await supabase.functions.invoke("import-rules", {
        body: {
          rows: transformedRows,
          options,
        },
      });

      if (error) throw error;

      const result = data as {
        imported: number;
        skipped: number;
        errors: { row: number; message: string }[];
        warnings: { row: number; message: string }[];
        categories_created: string[];
      };

      if (result.errors?.length > 0) {
        result.errors.slice(0, 3).forEach((err) => {
          toast.error(`Row ${err.row}: ${err.message}`);
        });
        if (result.errors.length > 3) {
          toast.error(`...and ${result.errors.length - 3} more errors`);
        }
      }

      const parts: string[] = [`✓ Imported ${result.imported} rules`];
      if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
      if (result.categories_created?.length > 0) {
        parts.push(`${result.categories_created.length} categories created`);
      }

      toast.success(parts.join(" · "));
      onImportComplete();
      handleOpenChange(false);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import rules. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  // Get preview data (first 5 rows, mapped)
  const previewData = parsedData.slice(0, 5).map((row) => {
    const getValue = (field: keyof ColumnMapping): string => {
      const key = mapping[field];
      const val = key ? row[key] : "";
      return val !== null && val !== undefined ? String(val) : "";
    };
    return {
      rule_number: getValue("rule_number"),
      rule_name: getValue("rule_name"),
      category: getValue("category"),
      weight: getValue("weight"),
    };
  });

  // Count valid rows
  const validRowCount = parsedData.filter((row) => {
    const numKey = mapping.rule_number;
    const nameKey = mapping.rule_name;
    return numKey && nameKey && row[numKey] && row[nameKey];
  }).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Framework Rules</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with your rules. Map columns and preview
            before importing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Upload Zone */}
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">
                Drag & drop your CSV or Excel file here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Supported: .csv, .xlsx, .xls
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {parsedData.length} rows detected
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setParsedData([]);
                  setHeaders([]);
                  setMapping(DEFAULT_MAPPING);
                  setWarnings([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Download Template */}
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto"
            onClick={handleDownloadTemplate}
          >
            <Download className="mr-2 h-4 w-4" />
            Download template CSV
          </Button>

          {/* Column Mapping */}
          {file && headers.length > 0 && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Column Mapping</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(FIELD_LABELS) as (keyof ColumnMapping)[]).map(
                    (field) => (
                      <div key={field} className="flex items-center gap-2">
                        <Select
                          value={mapping[field] || "_none_"}
                          onValueChange={(v) =>
                            handleMappingChange(field, v === "_none_" ? "" : v)
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none_">— None —</SelectItem>
                            {headers.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-sm">
                          {FIELD_LABELS[field]}
                          {REQUIRED_FIELDS.includes(field as "rule_number" | "rule_name") && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Preview Table */}
              {previewData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">
                    Preview (first 5 rows)
                  </h4>
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Weight</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">
                              {row.rule_number || "—"}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {row.rule_name || "—"}
                            </TableCell>
                            <TableCell>{row.category || "—"}</TableCell>
                            <TableCell>{row.weight || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/30">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <span className="font-medium">
                      {warnings.length} warning{warnings.length !== 1 && "s"}:
                    </span>
                    <ul className="mt-1 list-disc list-inside text-sm">
                      {warnings.slice(0, 5).map((w, i) => (
                        <li key={i}>
                          Row {w.row}: {w.message}
                        </li>
                      ))}
                      {warnings.length > 5 && (
                        <li>...and {warnings.length - 5} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Import Options */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Import Options</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="skipDuplicates"
                      checked={options.skipDuplicates}
                      onCheckedChange={(checked) =>
                        setOptions({
                          ...options,
                          skipDuplicates: !!checked,
                          updateExisting: checked ? false : options.updateExisting,
                        })
                      }
                    />
                    <Label htmlFor="skipDuplicates" className="text-sm">
                      Skip duplicate rule_numbers
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="updateExisting"
                      checked={options.updateExisting}
                      onCheckedChange={(checked) =>
                        setOptions({
                          ...options,
                          updateExisting: !!checked,
                          skipDuplicates: checked ? false : options.skipDuplicates,
                        })
                      }
                    />
                    <Label htmlFor="updateExisting" className="text-sm">
                      Update existing rules if rule_number matches
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="autoCreateCategories"
                      checked={options.autoCreateCategories}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, autoCreateCategories: !!checked })
                      }
                    />
                    <Label htmlFor="autoCreateCategories" className="text-sm">
                      Auto-create missing categories
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || validRowCount === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import {validRowCount} rules
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
