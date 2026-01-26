const DOLAR_URL = "https://www.ambito.com/contenidos/dolar.html";

const parseNumber = (value) => {
  if (!value) return null;
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
};

const extractRates = (html, label) => {
  const sectionRegex = new RegExp(`${label}[\\s\\S]*?variation-max-min__values-wrapper`, "i");
  const sectionMatch = html.match(sectionRegex);
  if (!sectionMatch) return null;
  const sectionStartIndex = sectionMatch.index || 0;
  const sectionSlice = html.slice(sectionStartIndex, sectionStartIndex + 2000);
  const compraMatch = sectionSlice.match(/data-compra\">\\s*([\\d.,]+)/i);
  const ventaMatch = sectionSlice.match(/data-venta\">\\s*([\\d.,]+)/i);
  const compra = parseNumber(compraMatch?.[1]);
  const venta = parseNumber(ventaMatch?.[1]);
  if (compra === null || venta === null) return null;
  return { compra, venta };
};

export const getDolarRates = async (req, res, next) => {
  try {
    const response = await fetch(DOLAR_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      return res.status(502).json({ message: "unable to fetch dolar rates" });
    }

    const html = await response.text();
    const oficial = extractRates(html, "Dólar Oficial") || extractRates(html, "Dolar Oficial");
    const blue = extractRates(html, "Dólar Blue") || extractRates(html, "Dolar Blue");

    if (!oficial || !blue) {
      return res.status(502).json({ message: "unable to parse dolar rates" });
    }

    res.json({
      oficial,
      blue,
      source: DOLAR_URL,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
