import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RuleCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  rules_count?: number;
}

export interface FrameworkRule {
  id: string;
  rule_number: number;
  rule_name: string;
  rule_description: string | null;
  category_id: string | null;
  category_name?: string | null;
  category_color?: string | null;
  weight: number;
  detection_keywords: string[];
  detection_patterns: string[];
  positive_examples: string[];
  negative_examples: string[];
  improvement_template: string | null;
  tier_required: string;
  is_active: boolean;
  source: string;
  version: number;
  parent_rule_id: string | null;
  effectiveness_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface RuleSuggestion {
  id: string;
  suggested_by: string | null;
  suggested_by_email?: string | null;
  rule_name: string;
  rule_description: string;
  category_id: string | null;
  category_name?: string | null;
  example_prompt: string | null;
  status: "pending" | "approved" | "rejected" | "merged";
  admin_notes: string | null;
  converted_to_rule_id: string | null;
  created_at: string;
}

export interface RuleEffectiveness {
  id: string;
  rule_id: string;
  times_triggered: number;
  times_followed: number;
  avg_score_improvement: number;
  user_satisfaction_avg: number | null;
  last_calculated_at: string;
}

export interface RuleChangelog {
  id: string;
  rule_id: string;
  changed_by: string | null;
  change_type: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown>;
  reason: string | null;
  created_at: string;
}

/* -------------------------------------------------------------------------- */
/*                              Category Hooks                                */
/* -------------------------------------------------------------------------- */

export function useRuleCategories() {
  return useQuery({
    queryKey: ["rule-categories"],
    queryFn: async () => {
      // Get categories with rule counts
      const { data: categories, error: catError } = await supabase
        .from("rule_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (catError) throw catError;

      // Get rule counts per category
      const { data: rules, error: rulesError } = await supabase
        .from("framework_rules")
        .select("category_id")
        .eq("is_active", true);

      if (rulesError) throw rulesError;

      const counts: Record<string, number> = {};
      rules?.forEach((r) => {
        if (r.category_id) {
          counts[r.category_id] = (counts[r.category_id] || 0) + 1;
        }
      });

      return (categories ?? []).map((cat) => ({
        ...cat,
        rules_count: counts[cat.id] || 0,
      })) as RuleCategory[];
    },
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: { name: string; description?: string; color?: string; icon?: string; sort_order?: number }) => {
      const { data, error } = await supabase
        .from("rule_categories")
        .insert([category])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rule-categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RuleCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("rule_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rule-categories"] });
    },
  });
}

/* -------------------------------------------------------------------------- */
/*                               Rule Hooks                                   */
/* -------------------------------------------------------------------------- */

export function useFrameworkRules(params?: { 
  category?: string; 
  tier?: string; 
  active?: string;
  source?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["framework-rules", params],
    queryFn: async () => {
      let query = supabase
        .from("framework_rules")
        .select(`
          *,
          rule_categories (name, color),
          rule_effectiveness (times_triggered, times_followed, avg_score_improvement)
        `)
        .order("rule_number", { ascending: true });

      if (params?.category && params.category !== "all") {
        query = query.eq("category_id", params.category);
      }
      if (params?.tier && params.tier !== "all") {
        query = query.eq("tier_required", params.tier);
      }
      if (params?.active === "true") {
        query = query.eq("is_active", true);
      } else if (params?.active === "false") {
        query = query.eq("is_active", false);
      }
      if (params?.source && params.source !== "all") {
        query = query.eq("source", params.source);
      }
      if (params?.search) {
        query = query.ilike("rule_name", `%${params.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((rule) => ({
        ...rule,
        category_name: rule.rule_categories?.name ?? null,
        category_color: rule.rule_categories?.color ?? null,
        effectiveness_rate: rule.rule_effectiveness?.[0]?.times_triggered
          ? Math.round((rule.rule_effectiveness[0].times_followed / rule.rule_effectiveness[0].times_triggered) * 100)
          : null,
      })) as (FrameworkRule & { effectiveness_rate: number | null })[];
    },
    staleTime: 30_000,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: { 
      rule_name: string; 
      rule_description?: string | null; 
      category_id?: string | null;
      weight?: number;
      tier_required?: string;
      source?: string;
      is_active?: boolean;
      detection_keywords?: string[];
      detection_patterns?: string[];
      positive_examples?: string[];
      negative_examples?: string[];
      improvement_template?: string | null;
    }) => {
      // Get next rule number
      const { data: nextNum } = await supabase.rpc("get_next_rule_number");
      
      const ruleData = {
        rule_name: rule.rule_name,
        rule_description: rule.rule_description || null,
        category_id: rule.category_id || null,
        weight: rule.weight ?? 3,
        tier_required: rule.tier_required || "free",
        source: rule.source || "original",
        is_active: rule.is_active ?? true,
        detection_keywords: rule.detection_keywords || [],
        detection_patterns: rule.detection_patterns || [],
        positive_examples: rule.positive_examples || [],
        negative_examples: rule.negative_examples || [],
        improvement_template: rule.improvement_template || null,
        rule_number: nextNum ?? 1,
        version: 1,
      };

      const { data, error } = await supabase
        .from("framework_rules")
        .insert([ruleData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["framework-rules"] });
      queryClient.invalidateQueries({ queryKey: ["rule-categories"] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, incrementVersion = true, ...updates }: Partial<FrameworkRule> & { id: string; incrementVersion?: boolean }) => {
      // First get the current version
      const { data: current } = await supabase
        .from("framework_rules")
        .select("version")
        .eq("id", id)
        .single();

      const newVersion = incrementVersion ? (current?.version ?? 1) + 1 : (updates.version ?? current?.version ?? 1);

      const { data, error } = await supabase
        .from("framework_rules")
        .update({ ...updates, version: newVersion, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["framework-rules"] });
      queryClient.invalidateQueries({ queryKey: ["rule-changelog"] });
    },
  });
}

export function useSplitRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      parentRule, 
      childRules 
    }: { 
      parentRule: FrameworkRule; 
      childRules: Array<{ rule_name: string; rule_description: string }> 
    }) => {
      // Get next rule number
      const { data: startNum } = await supabase.rpc("get_next_rule_number");
      let nextNum = startNum ?? 1;

      // Create child rules
      const childRulesWithParent = childRules.map((child, idx) => ({
        rule_name: child.rule_name,
        rule_description: child.rule_description,
        category_id: parentRule.category_id,
        weight: parentRule.weight,
        tier_required: parentRule.tier_required,
        source: parentRule.source,
        detection_keywords: parentRule.detection_keywords,
        detection_patterns: parentRule.detection_patterns,
        positive_examples: [],
        negative_examples: [],
        improvement_template: parentRule.improvement_template,
        parent_rule_id: parentRule.id,
        rule_number: nextNum + idx,
        is_active: true,
        version: 1,
      }));

      const { data: newRules, error: insertError } = await supabase
        .from("framework_rules")
        .insert(childRulesWithParent)
        .select();

      if (insertError) throw insertError;

      // Deactivate the parent rule
      const { error: updateError } = await supabase
        .from("framework_rules")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", parentRule.id);

      if (updateError) throw updateError;

      return newRules;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["framework-rules"] });
      queryClient.invalidateQueries({ queryKey: ["rule-categories"] });
      queryClient.invalidateQueries({ queryKey: ["rule-changelog"] });
    },
  });
}

/* -------------------------------------------------------------------------- */
/*                            Suggestion Hooks                                */
/* -------------------------------------------------------------------------- */

export function useRuleSuggestions(status?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["rule-suggestions", status],
    queryFn: async () => {
      let query = supabase
        .from("rule_suggestions")
        .select(`
          *,
          rule_categories (name)
        `)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((s) => ({
        ...s,
        category_name: s.rule_categories?.name ?? null,
      })) as RuleSuggestion[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useUpdateSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RuleSuggestion> & { id: string }) => {
      const { data, error } = await supabase
        .from("rule_suggestions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rule-suggestions"] });
    },
  });
}

export function useConvertSuggestionToRule() {
  const queryClient = useQueryClient();
  const createRule = useCreateRule();
  const updateSuggestion = useUpdateSuggestion();

  return useMutation({
    mutationFn: async (suggestion: RuleSuggestion) => {
      // Create the rule
      const rule = await createRule.mutateAsync({
        rule_name: suggestion.rule_name,
        rule_description: suggestion.rule_description,
        category_id: suggestion.category_id,
        source: "user_feedback",
        tier_required: "free",
        is_active: true,
      });

      // Update suggestion status
      await updateSuggestion.mutateAsync({
        id: suggestion.id,
        status: "approved",
        converted_to_rule_id: rule.id,
      });

      return rule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["framework-rules"] });
      queryClient.invalidateQueries({ queryKey: ["rule-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["rule-categories"] });
    },
  });
}

/* -------------------------------------------------------------------------- */
/*                            Changelog Hooks                                 */
/* -------------------------------------------------------------------------- */

export function useRuleChangelog(ruleId: string) {
  return useQuery({
    queryKey: ["rule-changelog", ruleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rule_changelog")
        .select("*")
        .eq("rule_id", ruleId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as RuleChangelog[];
    },
    enabled: !!ruleId,
    staleTime: 60_000,
  });
}