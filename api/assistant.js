// Vercel serverless endpoint. Keep OPENAI_API_KEY in server environment variables.
const PLAN_SCHEMA = {
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "summary": {
      "type": "string"
    },
    "explanation": {
      "type": "string"
    },
    "setup": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/command"
      }
    },
    "loop": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/command"
      }
    },
    "notes": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "summary",
    "explanation",
    "setup",
    "loop",
    "notes"
  ],
  "$defs": {
    "command": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "op": {
          "type": "string",
          "enum": [
            "pinMode",
            "digitalWrite",
            "delay",
            "serialBegin",
            "serialPrint"
          ]
        },
        "pin": {
          "type": "integer"
        },
        "mode": {
          "type": "string",
          "enum": [
            "OUTPUT",
            "INPUT",
            "INPUT_PULLUP"
          ]
        },
        "state": {
          "type": "string",
          "enum": [
            "HIGH",
            "LOW"
          ]
        },
        "ms": {
          "type": "number"
        },
        "baud": {
          "type": "string",
          "enum": [
            "9600",
            "19200",
            "38400",
            "57600",
            "115200"
          ]
        },
        "text": {
          "type": "string"
        },
        "newline": {
          "type": "boolean"
        }
      },
      "required": [
        "op",
        "pin",
        "mode",
        "state",
        "ms",
        "baud",
        "text",
        "newline"
      ]
    }
  }
};

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, provider: "OpenAI Responses API", configured: Boolean(process.env.OPENAI_API_KEY) });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método no permitido." });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "Falta configurar OPENAI_API_KEY en las variables de entorno del servidor." });
  }
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const board = ["uno", "nano", "mega"].includes(req.body?.board) ? req.body.board : "uno";
  if (!prompt || prompt.length > 1800) {
    return res.status(400).json({ error: "La descripción debe tener entre 1 y 1800 caracteres." });
  }

  const instructions = [
    "Eres el asistente generativo de BlockDuino, un entorno educativo de Arduino.",
    "Convierte la petición en un plan de bloques ejecutable y fácil de entender.",
    "Devuelve únicamente datos que cumplan el JSON Schema.",
    "Solo puedes usar estas operaciones: pinMode, digitalWrite, delay, serialBegin y serialPrint.",
    "Cada comando debe incluir todas las propiedades del esquema. Usa valores neutros por defecto para propiedades que no correspondan: pin=0, mode=OUTPUT, state=LOW, ms=0, baud=9600, text=\"\" y newline=false.",
    "Pon configuración y Serial.begin en setup; coloca las acciones repetitivas en loop.",
    "Para parpadear, configura OUTPUT en setup y alterna HIGH, delay, LOW, delay dentro de loop.",
    "Respeta el pinout de la placa indicada. Arduino UNO y Nano tienen pines digitales 0-13; Mega tiene 0-53.",
    "No inventes sensores o componentes que no estén soportados por los bloques disponibles.",
    "Si la petición no puede expresarse con las operaciones disponibles, explica la limitación en notes y genera el mejor plan seguro posible sin inventar bloques.",
    "Escribe summary y explanation en español, breves y claros. No afirmes que se ha compilado ni probado físicamente."
  ].join(" ");

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions,
        input: "Placa seleccionada: Arduino " + board.toUpperCase() + ". Petición del usuario: " + prompt,
        text: {
          format: {
            type: "json_schema",
            name: "blockduino_program",
            strict: true,
            schema: PLAN_SCHEMA
          }
        },
        max_output_tokens: 1800
      })
    });
    const payload = await upstream.json();
    if (!upstream.ok) {
      const message = payload?.error?.message || "El proveedor de IA rechazó la solicitud.";
      return res.status(upstream.status >= 500 ? 502 : 400).json({ error: message });
    }
    const outputText = (payload.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text" && item.text)
      .map(item => item.text)
      .join("\n");
    if (!outputText) return res.status(502).json({ error: "La IA no devolvió un plan completo." });
    const plan = JSON.parse(outputText);
    const commands = [...plan.setup, ...plan.loop];
    if (commands.length > 50) return res.status(422).json({ error: "El plan generado es demasiado grande. Pide algo más sencillo." });
    for (const command of commands) {
      if (!["pinMode","digitalWrite","delay","serialBegin","serialPrint"].includes(command.op)) {
        return res.status(422).json({ error: "El plan contiene una operación no compatible." });
      }
      if ((command.op === "pinMode" || command.op === "digitalWrite") && (command.pin < 0 || command.pin > (board === "mega" ? 53 : 13))) {
        return res.status(422).json({ error: "La IA seleccionó un pin fuera del rango de la placa." });
      }
      if (command.op === "delay" && (!Number.isFinite(command.ms) || command.ms < 0 || command.ms > 60000)) {
        return res.status(422).json({ error: "La duración generada está fuera del rango permitido." });
      }
    }
    return res.status(200).json({ plan });
  } catch (error) {
    console.error("BlockDuino AI error:", error);
    return res.status(502).json({ error: "No se pudo procesar la respuesta de IA. Inténtalo de nuevo." });
  }
};
