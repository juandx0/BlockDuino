
Blockly.Blocks["arduino_setup"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Al iniciar Arduino");

    this.appendStatementInput("DO")
      .appendField("hacer");

    this.setColour("#E5A000");
    this.setDeletable(false);
  }
};

Blockly.Blocks["arduino_loop"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Por siempre");

    this.appendStatementInput("DO")
      .appendField("hacer");

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
      .appendField(
        new Blockly.FieldDropdown([
          ["Salida", "OUTPUT"],
          ["Entrada", "INPUT"],
          ["Entrada pullup", "INPUT_PULLUP"]
        ]),
        "MODE"
      );

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#2196F3");
  }
};

Blockly.Blocks["arduino_digitalwrite"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Poner pin")
      .appendField(new Blockly.FieldNumber(13, 0, 255, 1), "PIN")
      .appendField("en")
      .appendField(
        new Blockly.FieldDropdown([
          ["HIGH", "HIGH"],
          ["LOW", "LOW"]
        ]),
        "STATE"
      );

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#2196F3");
  }
};

Blockly.Blocks["arduino_delay"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Esperar")
      .appendField(new Blockly.FieldNumber(1000, 0), "TIME")
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

    this.appendStatementInput("DO")
      .appendField("hacer");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#9C27B0");
  }
};
