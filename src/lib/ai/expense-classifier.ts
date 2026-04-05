// AI-powered expense classification for SPEC-SERI-002
// Uses Claude API to classify transactions into 9 major categories

import { createClient } from "@/lib/supabase/server";
import type { ParsedTransaction, ClassifiedTransaction } from "@/types/bookkeeping";
import { MAJOR_CATEGORIES } from "@/types/bookkeeping";
import { callClaudeObject } from "./claude-client";
import { ExpenseClassificationSchema } from "./schemas";

// @MX:ANCHOR: Main classification entry point - called from API route and classification-preview
// @MX:REASON: Multiple callers; AI API rate limiting requires batching logic

const MAX_BATCH_SIZE = 50;

interface MerchantMapping {
  id: string;
  business_id: string;
  merchant_name_pattern: string; // Pattern or exact name for matching
  major_category: string;
  sub_category: string | null;
  confidence: number;
}

interface AIClassificationResult {
  merchantName: string;
  majorCategory: string;
  subCategory: string | null;
  confidence: number;
}

/**
 * Classify a list of parsed transactions using:
 * 1. Exact match against saved merchant_mappings
 * 2. Pattern match against saved mappings
 * 3. AI classification for unmatched transactions
 */
export async function classifyTransactions(
  transactions: ParsedTransaction[],
  businessId: string
): Promise<ClassifiedTransaction[]> {
  if (transactions.length === 0) return [];

  // Load merchant mappings for this business
  const supabase = await createClient();
  const { data: mappings } = await supabase
    .from("merchant_mappings")
    .select("*")
    .eq("business_id", businessId);

  const merchantMappings = (mappings ?? []) as MerchantMapping[];

  const classified: ClassifiedTransaction[] = [];
  const unmatched: ParsedTransaction[] = [];

  // Step 1 & 2: Try exact and pattern match using merchant_name_pattern
  for (const tx of transactions) {
    const exactMatch = merchantMappings.find(
      (m) =>
        m.merchant_name_pattern.toLowerCase() === tx.merchantName.toLowerCase()
    );

    if (exactMatch) {
      classified.push({
        ...tx,
        majorCategory: exactMatch.major_category,
        subCategory: exactMatch.sub_category,
        confidence: 1.0,
        isDuplicate: false,
        matchedMappingId: exactMatch.id,
      });
      continue;
    }

    // Pattern match: treat merchant_name_pattern as regex if it contains special chars
    const patternMatch = merchantMappings.find((m) => {
      try {
        return new RegExp(m.merchant_name_pattern, "i").test(tx.merchantName);
      } catch (error) {
        console.error("[ExpenseClassifier] Invalid regex pattern:", error);
        return false;
      }
    });

    if (patternMatch) {
      classified.push({
        ...tx,
        majorCategory: patternMatch.major_category,
        subCategory: patternMatch.sub_category,
        confidence: 0.9,
        isDuplicate: false,
        matchedMappingId: patternMatch.id,
      });
      continue;
    }

    unmatched.push(tx);
  }

  // Step 3: Batch AI classification for unmatched transactions
  if (unmatched.length > 0) {
    const batches: ParsedTransaction[][] = [];
    for (let i = 0; i < unmatched.length; i += MAX_BATCH_SIZE) {
      batches.push(unmatched.slice(i, i + MAX_BATCH_SIZE));
    }

    for (const batch of batches) {
      try {
        const aiResults = await classifyWithAI(batch);

        for (let i = 0; i < batch.length; i++) {
          const tx = batch[i];
          const aiResult = aiResults[i];

          classified.push({
            ...tx,
            majorCategory: aiResult?.majorCategory ?? "운영비",
            subCategory: aiResult?.subCategory ?? null,
            confidence: aiResult?.confidence ?? 0.5,
            isDuplicate: false,
            matchedMappingId: null,
          });
        }
      } catch (error) {
        // Fallback to default category on AI error
        for (const tx of batch) {
          classified.push({
            ...tx,
            majorCategory: "운영비",
            subCategory: null,
            confidence: 0.3,
            isDuplicate: false,
            matchedMappingId: null,
          });
        }
      }
    }
  }

  // Mark duplicates (same date, merchant, amount within the batch)
  const seen = new Set<string>();
  for (const tx of classified) {
    const key = `${tx.date}-${tx.merchantName}-${tx.amount}`;
    if (seen.has(key)) {
      tx.isDuplicate = true;
    } else {
      seen.add(key);
    }
  }

  return classified;
}

/**
 * Call Claude API to classify a batch of transactions.
 */
async function classifyWithAI(
  transactions: ParsedTransaction[]
): Promise<AIClassificationResult[]> {
  const merchantList = transactions
    .map((tx, idx) => `${idx + 1}. "${tx.merchantName}"`)
    .join("\n");

  const categoriesStr = MAJOR_CATEGORIES.join(", ");

  const prompt = `You are classifying Korean business expenses into 9 categories:
${categoriesStr}

Category descriptions:
- 고정비용: Rent, utilities, insurance (fixed monthly costs)
- 세금: VAT, income tax, local taxes
- 인건비: Salaries, wages, part-time pay
- 식자재: Food ingredients, raw materials for cooking
- 소모품: Disposables, cleaning supplies, packaging
- 운영비: General operating costs not in other categories
- 마케팅: Advertising, promotion, social media
- 대표교육비: Owner's education, training, books
- 수수료: Payment processing fees, platform fees, bank fees

For each merchant name below, return a JSON array with objects:
{ "merchantName": "...", "majorCategory": "...", "subCategory": "..." or null, "confidence": 0.0-1.0 }

Merchant names to classify:
${merchantList}`;

  try {
    return await callClaudeObject("", prompt, ExpenseClassificationSchema);
  } catch (error) {
    console.error("[ExpenseClassifier] AI classification failed:", error);
    return createDefaultResults(transactions);
  }
}

function createDefaultResults(
  transactions: ParsedTransaction[]
): AIClassificationResult[] {
  return transactions.map((tx) => ({
    merchantName: tx.merchantName,
    majorCategory: "운영비",
    subCategory: null,
    confidence: 0.3,
  }));
}

/**
 * Save confirmed merchant mappings to the database for future use.
 */
export async function saveMerchantMappings(
  businessId: string,
  classifications: ClassifiedTransaction[]
): Promise<void> {
  const supabase = await createClient();

  // Only save classifications with high confidence and no existing mapping
  const toSave = classifications
    .filter((c) => c.confidence >= 0.8 && !c.matchedMappingId && !c.isDuplicate)
    .map((c) => ({
      business_id: businessId,
      merchant_name_pattern: c.merchantName,
      major_category: c.majorCategory,
      sub_category: c.subCategory,
      confidence: c.confidence,
      created_by: "ai" as const,
    }));

  if (toSave.length === 0) return;

  // Upsert to avoid duplicates
  await supabase
    .from("merchant_mappings")
    .upsert(toSave, {
      onConflict: "business_id,merchant_name_pattern",
      ignoreDuplicates: false,
    });
}
