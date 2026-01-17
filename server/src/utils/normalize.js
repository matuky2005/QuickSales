export const normalizeText = (value = "") => value.trim();

export const buildExactMatch = (value) => new RegExp(`^${value}$`, "i");

export const buildContainsMatch = (value) => new RegExp(value, "i");

export const startOfDay = (dateString) => new Date(`${dateString}T00:00:00.000Z`);

export const endOfDay = (dateString) => new Date(`${dateString}T23:59:59.999Z`);
