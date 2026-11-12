"use strict";

// ── Rule-based thought classification ──
// V1 uses keyword matching only. No LLM, no external service.
// Priority: question > todo > idea > note (default)

const RULES = {
  question: [
    "为什么", "怎么", "如何", "是否", "报错", "问题",
    "bug", "原因", "403", "404", "失败",
  ],
  todo: [
    "要", "记得", "待办", "明天", "下周", "之后",
    "完成", "修改", "优化", "修复", "提交", "检查", "提醒",
  ],
  idea: [
    "灵感", "想法", "可以做成", "也许", "试试",
    "方案", "脑洞", "功能", "设计",
  ],
};

const CATEGORY_ORDER = ["question", "todo", "idea", "note"];

/**
 * Classify content into one of: todo, idea, question, note.
 * Returns the highest-priority matching category, or "note" if none match.
 */
function classify(content) {
  if (!content || typeof content !== "string") return "note";
  const text = content.toLowerCase();

  for (const category of CATEGORY_ORDER) {
    if (category === "note") break;
    const keywords = RULES[category];
    if (keywords && keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      return category;
    }
  }

  return "note";
}

/**
 * Extract simple keywords from content.
 * Splits on common delimiters, filters short/common words.
 * Returns at most 5 keywords.
 */
const STOP_WORDS = new Set([
  "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一",
  "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着",
  "没有", "看", "好", "自己", "这", "他", "她", "它", "们", "那", "些",
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "shall", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "and", "but", "or",
  "nor", "not", "so", "yet", "both", "either", "neither", "each", "every",
  "all", "any", "few", "more", "most", "other", "some", "such", "only",
  "own", "same", "than", "too", "very", "just", "because", "about",
]);

function extractKeywords(content) {
  if (!content || typeof content !== "string") return [];
  // Split on Chinese/English punctuation and whitespace
  const tokens = content
    .split(/[\s，。！？、；：""''（）【】《》\-,.!?;:()\[\]{}""'']+/)
    .filter(Boolean);

  const keywords = [];
  const seen = new Set();

  for (const token of tokens) {
    if (keywords.length >= 5) break;
    const lower = token.toLowerCase().trim();
    if (lower.length < 2) continue;
    if (STOP_WORDS.has(lower)) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    keywords.push(token.trim());
  }

  return keywords;
}

module.exports = { classify, extractKeywords, RULES, CATEGORY_ORDER };
