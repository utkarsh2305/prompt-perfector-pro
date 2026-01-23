import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Check, 
  X, 
  History, 
  GitBranch, 
  Edit2,
  GripVertical,
  Loader2,
  AlertCircle,
  RefreshCw,
  Upload,
  Download,
} from "lucide-react";
import { RulesImportModal } from "@/components/admin/RulesImportModal";
import { toast } from "sonner";
import {
  useRuleCategories,
  useCreateCategory,
  useUpdateCategory,
  useFrameworkRules,
  useCreateRule,
  useUpdateRule,
  useRuleSuggestions,
  useUpdateSuggestion,
  useConvertSuggestionToRule,
  useRuleChangelog,
  type RuleCategory,
  type FrameworkRule,
  type RuleSuggestion,
} from "@/hooks/use-framework";

/* -------------------------------------------------------------------------- */
/*                          Categories Tab                                    */
/* -------------------------------------------------------------------------- */

function CategoriesTab() {
  const { data: categories = [], isLoading, refetch } = useRuleCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RuleCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    icon: "target",
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", color: "#3B82F6", icon: "target" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat: RuleCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description ?? "",
      color: cat.color ?? "#3B82F6",
      icon: cat.icon ?? "target",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, ...formData });
        toast.success("Category updated");
      } else {
        const maxOrder = Math.max(0, ...categories.map((c) => c.sort_order));
        await createCategory.mutateAsync({ ...formData, sort_order: maxOrder + 1 });
        toast.success("Category created");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error("Failed to save category");
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Rule Categories</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Color</TableHead>
            <TableHead className="text-right">Rules</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell>
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              </TableCell>
              <TableCell className="font-medium">{cat.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                {cat.description}
              </TableCell>
              <TableCell>
                <div 
                  className="h-5 w-5 rounded-full border"
                  style={{ backgroundColor: cat.color ?? "#888" }}
                />
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">{cat.rules_count} rules</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(cat)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {categories.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No categories yet. Add one to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
            <DialogDescription>
              Categories help organize your framework rules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Clarity"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What this category covers..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-14 h-10 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="target, brain, etc."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name || createCategory.isPending || updateCategory.isPending}
            >
              {(createCategory.isPending || updateCategory.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Rules Tab                                      */
/* -------------------------------------------------------------------------- */

function RulesTab() {
  const { data: categories = [], refetch: refetchCategories } = useRuleCategories();
  const [filters, setFilters] = useState({
    category: "all",
    tier: "all",
    active: "all",
    source: "all",
    search: "",
  });

  const { data: rules = [], isLoading, refetch } = useFrameworkRules(filters);
  const updateRule = useUpdateRule();

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleOpenHistory = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    setHistoryDialogOpen(true);
  };

  const handleToggleActive = async (rule: FrameworkRule & { effectiveness_rate: number | null }) => {
    try {
      await updateRule.mutateAsync({ id: rule.id, is_active: !rule.is_active });
      toast.success(`Rule ${rule.is_active ? "deactivated" : "activated"}`);
    } catch (err) {
      toast.error("Failed to update rule");
    }
  };

  const handleExport = () => {
    // Build CSV from current rules
    const headers = [
      "rule_number",
      "rule_name",
      "rule_description",
      "category",
      "weight",
      "detection_keywords",
      "detection_patterns",
      "positive_examples",
      "negative_examples",
      "improvement_template",
      "tier_required",
    ];

    const csvRows = [headers.join(",")];
    
    for (const rule of rules) {
      const row = [
        rule.rule_number,
        `"${(rule.rule_name || "").replace(/"/g, '""')}"`,
        `"${(rule.rule_description || "").replace(/"/g, '""')}"`,
        `"${rule.category_name || ""}"`,
        rule.weight,
        `"${(rule.detection_keywords || []).join(",")}"`,
        `"${(rule.detection_patterns || []).join(",")}"`,
        `"${(rule.positive_examples || []).join("|")}"`,
        `"${(rule.negative_examples || []).join("|")}"`,
        `"${(rule.improvement_template || "").replace(/"/g, '""')}"`,
        rule.tier_required,
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `framework_rules_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Exported ${rules.length} rules`);
  };

  const handleImportComplete = () => {
    refetch();
    refetchCategories();
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with count and actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{rules.length}</span> rules
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setImportModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search rules..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.source} onValueChange={(v) => setFilters({ ...filters, source: v })}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="original">Original</SelectItem>
            <SelectItem value="user_feedback">User Feedback</SelectItem>
            <SelectItem value="ai_discovered">AI Discovered</SelectItem>
            <SelectItem value="community">Community</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.active} onValueChange={(v) => setFilters({ ...filters, active: v })}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Rules Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Weight</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-center">Effectiveness</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-mono text-muted-foreground">{rule.rule_number}</TableCell>
                <TableCell>
                  <div className="font-medium">{rule.rule_name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-xs">
                    {rule.rule_description}
                  </div>
                </TableCell>
                <TableCell>
                  {rule.category_name ? (
                    <Badge 
                      variant="outline"
                      style={{ borderColor: rule.category_color ?? undefined }}
                    >
                      {rule.category_name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{rule.weight}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {rule.source.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {rule.effectiveness_rate !== null ? (
                    <span className={`font-medium ${
                      rule.effectiveness_rate >= 80 ? "text-green-600" :
                      rule.effectiveness_rate >= 50 ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      {rule.effectiveness_rate}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(rule)}
                    disabled={updateRule.isPending}
                  >
                    {rule.is_active ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title="History"
                      onClick={() => handleOpenHistory(rule.id)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Split Rule">
                      <GitBranch className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rules.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No rules found. Create categories first, then add rules.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* History Dialog */}
      <RuleHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        ruleId={selectedRuleId}
      />

      {/* Import Modal */}
      <RulesImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        categories={categories}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Rule History Dialog                               */
/* -------------------------------------------------------------------------- */

function RuleHistoryDialog({ 
  open, 
  onOpenChange, 
  ruleId 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  ruleId: string | null;
}) {
  const { data: changelog = [], isLoading } = useRuleChangelog(ruleId ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Rule Change History</DialogTitle>
          <DialogDescription>
            Track all modifications to this rule over time.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : changelog.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No changes recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {changelog.map((entry) => (
              <div key={entry.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{entry.change_type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
                {entry.reason && (
                  <p className="mt-2 text-sm text-muted-foreground">{entry.reason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Suggestions Tab                                   */
/* -------------------------------------------------------------------------- */

function SuggestionsTab() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const { data: suggestions = [], isLoading, refetch } = useRuleSuggestions(statusFilter);
  const updateSuggestion = useUpdateSuggestion();
  const convertToRule = useConvertSuggestionToRule();

  const handleApprove = async (suggestion: RuleSuggestion) => {
    try {
      await convertToRule.mutateAsync(suggestion);
      toast.success("Suggestion approved and converted to rule!");
    } catch (err) {
      toast.error("Failed to convert suggestion");
      console.error(err);
    }
  };

  const handleReject = async (suggestion: RuleSuggestion) => {
    try {
      await updateSuggestion.mutateAsync({ id: suggestion.id, status: "rejected" });
      toast.success("Suggestion rejected");
    } catch (err) {
      toast.error("Failed to reject suggestion");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium">Rule Suggestions</h3>
          {pendingCount > 0 && (
            <Badge variant="secondary">{pendingCount} pending</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="merged">Merged</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertCircle className="mx-auto h-8 w-8 mb-3 opacity-50" />
          <p>No {statusFilter !== "all" ? statusFilter : ""} suggestions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{suggestion.rule_name}</h4>
                    <Badge variant={
                      suggestion.status === "pending" ? "secondary" :
                      suggestion.status === "approved" ? "default" :
                      suggestion.status === "rejected" ? "destructive" :
                      "outline"
                    }>
                      {suggestion.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{suggestion.rule_description}</p>
                  {suggestion.example_prompt && (
                    <div className="mt-2 rounded bg-muted p-2 text-xs font-mono">
                      {suggestion.example_prompt}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Suggested {new Date(suggestion.created_at).toLocaleDateString()}
                    {suggestion.category_name && ` · Category: ${suggestion.category_name}`}
                  </p>
                </div>

                {suggestion.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(suggestion)}
                      disabled={convertToRule.isPending}
                    >
                      {convertToRule.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(suggestion)}
                      disabled={updateSuggestion.isPending}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Main Component                                    */
/* -------------------------------------------------------------------------- */

export default function AdminFramework() {
  return (
    <section aria-label="Admin framework rules">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Framework Rules</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage prompt engineering rules, categories, and user suggestions.
        </p>
      </div>

      <Card className="mt-6 rounded-xl border p-5">
        <Tabs defaultValue="rules" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="rules">
            <RulesTab />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>

          <TabsContent value="suggestions">
            <SuggestionsTab />
          </TabsContent>
        </Tabs>
      </Card>
    </section>
  );
}