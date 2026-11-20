
Blockly.Blocks["arduino_setup"] = {
  init: function() {
    this.appendDummyInput().appendField("Al iniciar Arduino");
    this.appendStatementInput("DO").appendField("hacer");
    this.setColour("#E5A000");
    this.setDeletable(false);
  }
};

Blockly.Blocks["arduino_loop"] = {
  init: function() {
    this.appendDummyInput().appendField("Por siempre");
    this.appendStatementInput("DO").appendField("hacer");
    this.setColour("#E5A000");
    this.setDeletable(false);
  }
};

Blockly.Blocks["arduino_pinmode"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Configurar pin")
      .appendField(new Blockly.FieldNumber(13, 0, 255, 1), "PIN")
      .appendField("como")
      .appendField(new Blockly.FieldDropdown([
        ["Salida", "OUTPUT"],
        ["Entrada", "INPUT"],
        ["Entrada pullup", "INPUT_PULLUP"]
      ]), "MODE");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#2196F3");
  }
};

Blockly.Blocks["arduino_digitalwrite"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Escribir pin digital")
      .appendField(new Blockly.FieldNumber(13, 0, 255, 1), "PIN")
      .appendField("en")
      .appendField(new Blockly.FieldDropdown([
        ["HIGH", "HIGH"],
        ["LOW", "LOW"]
      ]), "STATE");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#2196F3");
  }
};

Blockly.Blocks["arduino_analogwrite"] = {
  init: function() {
    this.appendValueInput("VALUE")
      .setCheck("Number")
      .appendField("Escribir PWM en pin")
      .appendField(new Blockly.FieldNumber(9, 0, 255, 1), "PIN")
      .appendField("valor");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#2196F3");
  }
};

Blockly.Blocks["arduino_delay"] = {
  init: function() {
    this.appendValueInput("TIME")
      .setCheck("Number")
      .appendField("Esperar")
      .appendField("milisegundos");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#2196F3");
  }
};

Blockly.Blocks["arduino_repeat"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Repetir")
      .appendField(new Blockly.FieldNumber(10, 0), "TIMES")
      .appendField("veces");

    this.appendStatementInput("DO").appendField("hacer");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#9C27B0");
  }
};

Blockly.Blocks["arduino_analogread"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Leer entrada analógica")
      .appendField(new Blockly.FieldDropdown([
        ["A0", "A0"],
        ["A1", "A1"],
        ["A2", "A2"],
        ["A3", "A3"],
        ["A4", "A4"],
        ["A5", "A5"]
      ]), "PIN");

    this.setOutput(true, "Number");
    this.setColour("#2196F3");
  }
};

Blockly.Blocks["arduino_digitalread"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Leer entrada digital")
      .appendField(new Blockly.FieldNumber(2, 0, 255, 1), "PIN");

    this.setOutput(true, "Number");
    this.setColour("#2196F3");
  }
};
