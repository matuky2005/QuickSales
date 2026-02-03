import Setting from "../models/Setting.js";

const SETTINGS_KEY = "dolar";
const TICKET_KEY = "ticket";

const parseRate = (value) => {
  const number = Number(value);
  return Number.isNaN(number) || number <= 0 ? null : Math.round(number * 100) / 100;
};

export const getDollarSettings = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: SETTINGS_KEY }).lean();
    res.json(setting?.value || null);
  } catch (error) {
    next(error);
  }
};

export const updateDollarSettings = async (req, res, next) => {
  try {
    const oficial = parseRate(req.body.oficial);
    const blue = parseRate(req.body.blue);
    if (!oficial || !blue) {
      return res.status(400).json({ message: "oficial and blue rates are required" });
    }
    const value = { oficial, blue, updatedAt: new Date().toISOString() };
    const setting = await Setting.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { value },
      { new: true, upsert: true }
    );
    res.json(setting.value);
  } catch (error) {
    next(error);
  }
};

export const getTicketSettings = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: TICKET_KEY }).lean();
    res.json(setting?.value || null);
  } catch (error) {
    next(error);
  }
};

export const updateTicketSettings = async (req, res, next) => {
  try {
    const value = {
      header: String(req.body.header || "").trim(),
      footer: String(req.body.footer || "").trim(),
      width: Number(req.body.width || 0) || 58,
      showDate: Boolean(req.body.showDate),
      showTime: Boolean(req.body.showTime)
    };
    const setting = await Setting.findOneAndUpdate(
      { key: TICKET_KEY },
      { value },
      { new: true, upsert: true }
    );
    res.json(setting.value);
  } catch (error) {
    next(error);
  }
};
