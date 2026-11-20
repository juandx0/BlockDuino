
function generateCode() {
  const roots = workspace.getTopBlocks(true);

  const setup = roots.find(b => b.type === "arduino_setup");
  const loop = roots.find(b => b.type === "arduino_loop");

  let code = "// Generado con BlockDuino\n\n";

  code += "void setup() {\n";

  if (setup) {
    code += generateStatements(
      setup.getInputTargetBlock("DO"), 2
    );
  }

  code += "}\n\nvoid loop() {\n";

  if (loop) {
    code += generateStatements(
      loop.getInputTargetBlock("DO"), 2
    );
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

      case "arduino_analogwrite":
        code += space +
          `analogWrite(${block.getFieldValue("PIN")}, ${generateValue(block.getInputTargetBlock("VALUE"))});\n`;
        break;

      case "arduino_delay":
        code += space +
          `delay(${generateValue(block.getInputTargetBlock("TIME"))});\n`;
        break;

      case "arduino_repeat":
        code += space +
          `for (int i = 0; i < ${block.getFieldValue("TIMES")}; i++) {\n`;

        code += generateStatements(
          block.getInputTargetBlock("DO"), indent + 2
        );

        code += space + "}\n";
        break;

      case "controls_if":
        code += generateIf(block, indent);
        break;
    }

    block = block.getNextBlock();
  }

  return code;
}

function generateIf(block, indent) {
  const space = " ".repeat(indent);
  let code = "";
  let index = 0;

  while (block.getInput("IF" + index)) {
    const condition = generateValue(
      block.getInputTargetBlock("IF" + index)
    );

    code += space +
      (index === 0 ? "if" : "else if") +
      ` (${condition}) {\n`;

    code += generateStatements(
      block.getInputTargetBlock("DO" + index),
      indent + 2
    );

    code += space + "}\n";
    index++;
  }

  if (block.getInput("ELSE")) {
    code += space + "else {\n";

    code += generateStatements(
      block.getInputTargetBlock("ELSE"),
      indent + 2
    );

    code += space + "}\n";
  }

  return code;
}

function generateValue(block) {
  if (!block) return "0";

  switch (block.type) {

    case "math_number":
      return block.getFieldValue("NUM");

    case "arduino_analogread":
      return `analogRead(${block.getFieldValue("PIN")})`;

    case "arduino_digitalread":
      return `digitalRead(${block.getFieldValue("PIN")})`;

    case "math_arithmetic": {
      const a = generateValue(block.getInputTargetBlock("A"));
      const b = generateValue(block.getInputTargetBlock("B"));

      const operators = {
        ADD: "+",
        MINUS: "-",
        MULTIPLY: "*",
        DIVIDE: "/",
        POWER: "^"
      };

      const op = operators[block.getFieldValue("OP")] || "+";

      if (op === "^") {
        return `pow(${a}, ${b})`;
      }

      return `(${a} ${op} ${b})`;
    }

    case "logic_compare": {
      const a = generateValue(block.getInputTargetBlock("A"));
      const b = generateValue(block.getInputTargetBlock("B"));

      const operators = {
        EQ: "==",
        NEQ: "!=",
        LT: "<",
        LTE: "<=",
        GT: ">",
        GTE: ">="
      };

      const op = operators[block.getFieldValue("OP")] || "==";

      return `(${a} ${op} ${b})`;
    }

    case "logic_operation": {
      const a = generateValue(block.getInputTargetBlock("A"));
      const b = generateValue(block.getInputTargetBlock("B"));

      const op = block.getFieldValue("OP") === "AND" ? "&&" : "||";

      return `(${a} ${op} ${b})`;
    }

    case "logic_boolean":
      return block.getFieldValue("BOOL") === "TRUE" ? "true" : "false";

    case "logic_negate":
      return `(!${generateValue(block.getInputTargetBlock("BOOL"))})`;

    default:
      return "0";
  }
}

function copyCode() {
  const code = document.getElementById("output").textContent;

  navigator.clipboard.writeText(code)
    .then(() => alert("¡Código copiado!"))
    .catch(() => alert("No se pudo copiar. Comprueba los permisos del navegador."));
}
