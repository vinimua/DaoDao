"use strict";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function clampSize(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return undefined;
  return Math.max(24, Math.min(720, Math.round(num)));
}

function parseReviewTimesText(value) {
  if (Array.isArray(value)) {
    return normalizeReviewTimes(value);
  }
  if (typeof value !== "string") return undefined;
  return normalizeReviewTimes(value.split(/[,\s，、]+/));
}

function normalizeReviewTimes(values) {
  if (!Array.isArray(values)) return undefined;
  const result = [];
  for (const raw of values) {
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (!TIME_RE.test(value)) continue;
    if (!result.includes(value)) result.push(value);
  }
  return result;
}

function formatReviewTimes(values) {
  const normalized = normalizeReviewTimes(values);
  return normalized ? normalized.join(", ") : "";
}

function normalizeShortcut(value) {
  if (typeof value !== "string") return undefined;
  const shortcut = value.trim();
  return shortcut ? shortcut : undefined;
}

function normalizeSettingsPatch(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const patch = {};

  if ("shortcut" in input) {
    const shortcut = normalizeShortcut(input.shortcut);
    if (shortcut) patch.shortcut = shortcut;
  }

  if ("size" in input) {
    const size = clampSize(input.size);
    if (size !== undefined) patch.size = size;
  }

  if ("reviewTimes" in input) {
    const reviewTimes = Array.isArray(input.reviewTimes)
      ? normalizeReviewTimes(input.reviewTimes)
      : parseReviewTimesText(input.reviewTimes);
    if (reviewTimes && reviewTimes.length > 0) {
      patch.reviewTimes = reviewTimes;
    }
  }

  if ("openAtLogin" in input) {
    patch.openAtLogin = Boolean(input.openAtLogin);
  }

  if ("hoverPreview" in input) {
    patch.hoverPreview = Boolean(input.hoverPreview);
  }

  return patch;
}

module.exports = {
  clampSize,
  formatReviewTimes,
  normalizeReviewTimes,
  normalizeSettingsPatch,
  normalizeShortcut,
  parseReviewTimesText,
};
