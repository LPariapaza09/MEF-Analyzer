import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";

const app = express();
const PORT = 3000;

app.use(express.json());

// Disable SSL verification as in the Python code
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function scrapeMefData(url: string) {
  try {
    const response = await axios.get(url, { httpsAgent, responseType: 'arraybuffer' });
    const html = new TextDecoder('utf-8').decode(response.data);
    const $ = cheerio.load(html);
    
    const table = $("table.Data").first();
    if (!table.length) {
      throw new Error(`No se encontró la tabla de datos en la URL proporcionada. Verifique que el enlace sea de Consulta Amigable.`);
    }

    const data: Record<string, number> = {};
    let hasData = false;

    table.find("tr").each((i, row) => {
      const cols = $(row).find("td");
      if (cols.length >= 8) {
        const conceptoRaw = $(cols[1]).text().trim();
        const montoRaw = $(cols[7]).text().trim().replace(/,/g, '');
        const monto = parseFloat(montoRaw);
        if (!isNaN(monto)) {
          const concepto = removeAccents(conceptoRaw);
          data[concepto] = monto;
          hasData = true;
        }
      }
    });

    if (!hasData) {
      throw new Error(`La tabla se encontró pero no contiene datos numéricos válidos en las columnas esperadas.`);
    }

    return data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Error al acceder a la URL: El servidor respondió con estado ${error.response.status}.`);
    } else if (error.request && !error.message.includes('No se encontró')) {
      throw new Error(`Error de red: No se pudo conectar a la URL proporcionada.`);
    } else {
      throw error;
    }
  }
}

app.post("/api/comparar", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "La URL es requerida." });
    }

    const yearMatch = url.match(/y=(\d{4})/);
    if (!yearMatch) {
      return res.status(400).json({ error: "La URL no contiene el parámetro de año 'y='. Asegúrese de copiar el enlace correcto." });
    }

    const yearActual = parseInt(yearMatch[1], 10);
    const yearAnterior = yearActual - 1;
    const urlAnterior = url.replace(/y=\d{4}/, `y=${yearAnterior}`);

    const [dataActual, dataAnterior] = await Promise.all([
      scrapeMefData(url).catch(e => { throw new Error(`Error en datos de ${yearActual}: ${e.message}`); }),
      scrapeMefData(urlAnterior).catch(e => { throw new Error(`Error en datos de ${yearAnterior}: ${e.message}`); })
    ]);

    const conceptos = new Set([...Object.keys(dataActual), ...Object.keys(dataAnterior)]);
    
    const result = Array.from(conceptos).map(concepto => {
      const montoAnteriorRaw = dataAnterior[concepto] || 0;
      const montoActualRaw = dataActual[concepto] || 0;

      // Escalar a millones y convertir a entero (truncar)
      const montoAnterior = Math.trunc(montoAnteriorRaw / 1000000);
      const montoActual = Math.trunc(montoActualRaw / 1000000);

      const variacionS = montoActual - montoAnterior;
      let variacionPorcentaje = 0;
      
      if (montoAnterior !== 0) {
        variacionPorcentaje = Number((((montoActual / montoAnterior) * 100) - 100).toFixed(1));
      }

      return {
        concepto,
        montoAnterior,
        montoActual,
        variacionS,
        variacionPorcentaje
      };
    });

    // Sort by variacionS descending
    result.sort((a, b) => b.variacionS - a.variacionS);

    res.json({
      yearActual,
      yearAnterior,
      data: result
    });

  } catch (error: any) {
    console.error("Error en /api/comparar:", error.message);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
