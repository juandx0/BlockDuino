
function generateCode() {
  const roots = workspace.getTopBlocks(true);

  const setup = roots.find(b => b.type === "arduino_setup");
  const loop = roots.find(b => b.type === "arduino_loop");

  let code = "";

  code += "// Generado con BlockDuino\n\n";

  code += "void setup() {\n";
  if (setup) {
    code += generateStatements(setup.getInputTargetBlock("DO"), 2);
  }
  code += "}\n\n";

  code += "void loop() {\n";
  if (loop) {
    code += generateStatements(loop.getInputTargetBlock("DO"), 2);
  }
  code += "}\n";

  document.getElementById("output").textContent = code;
}

function generateStatements(block, indent) {
  let code = "";
  const space = " ".repeat(indent);

  while (block) {
    switch (block.type) {

      case "arduino_pinmode":
        code += space +
          `pinMode(${block.getFieldValue("PIN")}, ${block.getFieldValue("MODE")});\n`;
        break;

      case "arduino_digitalwrite":
        code += space +
          `digitalWrite(${block.getFieldValue("PIN")}, ${block.getFieldValue("STATE")});\n`;
        break;

      case "arduino_delay":
        code += space +
          `delay(${block.getFieldValue("TIME")});\n`;
        break;

      case "arduino_repeat":
        code += space +
          `for (int i = 0; i < ${block.getFieldValue("TIMES")}; i++) {\n`;

        code += generateStatements(
          block.getInputTargetBlock("DO"),
          indent + 2
        );

        code += space + "}\n";
        break;

      case "controls_if":
        code += space + "// Bloque condicional pendiente\n";
        break;
    }

    block = block.getNextBlock();
  }

  return code;
}

function copyCode() {
  const code = document.getElementById("output").textContent;

  navigator.clipboard.writeText(code)
    .then(() => alert("¡Código copiado!"));
}
