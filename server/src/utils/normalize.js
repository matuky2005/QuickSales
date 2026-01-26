export const normalizeText = (value = "") => value.trim();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildExactMatch = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");

export const buildContainsMatch = (value) => new RegExp(escapeRegex(value), "i");

export const startOfDay = (dateString) => new Date(`${dateString}T00:00:00.000Z`);

export const endOfDay = (dateString) => new Date(`${dateString}T23:59:59.999Z`);
