# Activar la IA generativa de BlockDuino

El asistente ahora usa un modelo generativo a través de un endpoint del servidor. La web estática por sí sola (por ejemplo, GitHub Pages) no puede guardar una clave privada ni ejecutar `api/assistant.js`.

## Despliegue recomendado

1. Importa este repositorio en Vercel.
2. En **Project → Settings → Environment Variables**, crea:
   - `OPENAI_API_KEY`: tu clave de API.
   - `OPENAI_MODEL`: opcional; por defecto usa `gpt-4.1-mini`.
3. Despliega el proyecto.
4. Abre BlockDuino desde el dominio desplegado. El asistente consulta `/api/assistant`.

La clave debe existir únicamente como variable de entorno del servidor. **No la pegues en `lab.js`, `index.html` ni en ningún archivo público.**

## Qué puede generar ahora

El modelo devuelve un plan JSON estructurado. El navegador valida y convierte el plan en bloques reales de Blockly, genera el C++ con el generador de BlockDuino y presenta un resumen del resultado.

Operaciones compatibles en esta primera etapa:
- Configurar pines como entrada o salida.
- Escribir HIGH o LOW en pines digitales.
- Esperas en milisegundos.
- Iniciar Serial.
- Imprimir texto por Serial.

El asistente limita el tamaño del plan y valida los pines según UNO, Nano o Mega. No puede inventar bloques que el proyecto aún no soporte. Revisa siempre el código y el circuito antes de cargarlo a una placa.

## Desarrollo local

Necesitas Node.js 18 o superior y un entorno que ejecute funciones serverless compatibles con Vercel. GitHub Pages solo sirve archivos estáticos y no ejecuta la carpeta `api`.

Para probar el endpoint localmente, usa Vercel CLI desde la raíz del repositorio después de configurar las variables de entorno. El endpoint responde a GET con el estado de configuración y a POST con `{ "prompt": "...", "board": "uno" }`.

## Privacidad y costos

Cada generación envía el texto escrito por el usuario al proveedor de IA. Las llamadas a la API pueden tener costo según la cuenta y el modelo. Configura límites de gasto y protege el endpoint con autenticación o límites de uso antes de publicarlo ampliamente.
