// Conversor del subconjunto C++ de BlockDuino a bloques Blockly.
// No es un parser de C++ completo: solo acepta construcciones que BlockDuino puede representar.
class BDParser {
  constructor(source) {
    this.tokens = source.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?:0x[0-9a-fA-F]+|\\d+(?:\\.\\d+)?)|[A-Za-z_][A-Za-z0-9_]*|\\+\\+|--|==|!=|<=|>=|&&|\\|\\||\\+=|-=|\\*=|\\/=|[{}()\\[\\];,.=+\\-*\\/%<>!&|#]/g) || [];
    this.i = 0;
    this.variables = new Map();
    this.created = [];
  }
  peek(n=0) { return this.tokens[this.i+n]; }
  take() { return this.tokens[this.i++]; }
  eat(v) { if (this.peek()===v) { this.i++; return true; } return false; }
  need(v) { if (!this.eat(v)) throw new Error("Se esperaba '"+v+"' cerca de '"+(this.peek()||"fin")+"'"); }
  id() { const t=this.take(); if (!t || !/^[A-Za-z_]/.test(t)) throw new Error("Identificador no válido: "+t); return t; }
  make(type, fields={}) {
    const b=workspace.newBlock(type);
    Object.entries(fields).forEach(([k,v])=>b.setFieldValue(String(v),k));
    this.created.push(b);
    return b;
  }
  variable(name) {
    if (!this.variables.has(name)) {
      const model=workspace.getVariable(name) || workspace.createVariable(name);
      this.variables.set(name,model.getId());
    }
    return this.variables.get(name);
  }
  connectValue(parent,input,child) {
    if (!child || !child.outputConnection) throw new Error("La expresión no produce un valor.");
    const target=parent.getInput(input);
    if (!target || !target.connection) throw new Error("Entrada no compatible: "+input);
    target.connection.connect(child.outputConnection);
  }
  connectStatement(parent,input,first) {
    if (!first) return;
    const target=parent.getInput(input);
    if (!target || !target.connection || !first.previousConnection) throw new Error("Instrucción no compatible.");
    target.connection.connect(first.previousConnection);
  }
  append(head,tail,next) {
    if (!next) return tail;
    if (!head) return {head:next,tail:next};
    if (tail && tail.nextConnection && next.previousConnection) tail.nextConnection.connect(next.previousConnection);
    return {head,tail:next};
  }
  expression(min=0) {
    let left=this.primary();
    const prec={"||":1,"&&":2,"==":3,"!=":3,"<":3,">":3,"<=":3,">=":3,"+":4,"-":4,"*":5,"/":5,"%":5};
    while (prec[this.peek()]>=min) {
      const op=this.take(), right=this.expression(prec[op]+1);
      const type=({"||":"logic_operation","&&":"logic_operation","==":"logic_compare","!=":"logic_compare","<":"logic_compare",">":"logic_compare","<=":"logic_compare",">=":"logic_compare","+":"math_arithmetic","-":"math_arithmetic","*":"math_arithmetic","/":"math_arithmetic","%":"math_modulo"})[op];
      let b;
      if(type==="logic_operation") b=this.make(type,{OP:op==="&&"?"AND":"OR"});
      else if(type==="logic_compare") b=this.make(type,{OP:({"==":"EQ","!=":"NEQ","<":"LT",">":"GT","<=":"LTE",">=":"GTE"})[op]});
      else if(type==="math_arithmetic") b=this.make(type,{OP:({"+":"ADD","-":"MINUS","*":"MULTIPLY","/":"DIVIDE"})[op]});
      else b=this.make(type);
      if(type==="math_modulo"){this.connectValue(b,"DIVIDEND",left);this.connectValue(b,"DIVISOR",right);}
      else {this.connectValue(b,"A",left);this.connectValue(b,"B",right);}
      left=b;
    }
    return left;
  }
  primary() {
    if(this.eat("(")){const b=this.expression();this.need(")");return b;}
    if(this.eat("-")){const b=this.make("math_single",{OP:"NEG"});this.connectValue(b,"NUM",this.primary());return b;}
    if(this.eat("!")){const b=this.make("logic_negate");this.connectValue(b,"BOOL",this.primary());return b;}
    const t=this.take();
    if(!t) throw new Error("Expresión incompleta.");
    if(/^\\d/.test(t)) return this.make("math_number",{NUM:t});
    if(t.startsWith('"')) return this.make("text",{TEXT:JSON.parse(t)});
    if(t==="true"||t==="false") return this.make("logic_boolean",{BOOL:t.toUpperCase()});
    if(t==="HIGH"||t==="LOW") return this.make("math_number",{NUM:t==="HIGH"?"1":"0"});
    if(/^[A-Za-z_]/.test(t)) {
      if(this.eat("(")) {
        const args=[];
        if(!this.eat(")")) { do { args.push(this.expression()); } while(this.eat(",")); this.need(")"); }
        return this.callValue(t,args);
      }
      if(this.eat(".")) {
        const member=this.id();this.need("(");
        const args=[];
        if(!this.eat(")")) { do { args.push(this.expression()); } while(this.eat(","));this.need(")"); }
        return this.callValue(t+"."+member,args);
      }
      const b=this.make("variables_get");
      b.setFieldValue(this.variable(t),"VAR");
      return b;
    }
    throw new Error("Expresión no compatible: "+t);
  }
  callValue(name,args) {
    const one=args[0];
    if(name==="analogRead"||name==="digitalRead") {
      if(!one || !["math_number","variables_get"].includes(one.type)) throw new Error("Pin no reconocido en "+name);
      const pin=one.type==="math_number"?one.getFieldValue("NUM"):null;
      const b=this.make(name==="analogRead"?"arduino_analogread":"arduino_digitalread",pin!==null?{PIN:pin}:{});
      if(pin===null) throw new Error("El pin debe ser una constante.");
      return b;
    }
    if(name==="Serial.available") return this.make("arduino_serial_available");
    if(name==="Serial.read") return this.make("arduino_serial_read");
    if(name==="map"||name==="constrain"||["sin","cos","tan"].includes(name)) {
      const type=name==="map"?"arduino_map":name==="constrain"?"arduino_constrain":"arduino_trig";
      const fields=name==="arduino_trig"?{FN:name}:{};
      const b=this.make(type,fields);
      const inputs=name==="map"?["VALUE","FROM1","FROM2","TO1","TO2"]:name==="constrain"?["VALUE","LOW","HIGH"]:["VALUE"];
      inputs.forEach((k,i)=>this.connectValue(b,k,args[i]));
      return b;
    }
    if(["sqrt","abs","log","log10","exp","round","ceil","floor"].includes(name)) {
      const op=({sqrt:"ROOT",abs:"ABS",log:"LN",log10:"LOG10",exp:"EXP",round:"ROUND",ceil:"ROUNDUP",floor:"ROUNDDOWN"})[name];
      const type=["round","ceil","floor"].includes(name)?"math_round":"math_single";
      const b=this.make(type,{OP:op});this.connectValue(b,"NUM",one);return b;
    }
    throw new Error("Función C++ no compatible: "+name);
  }
  blockBody() {
    this.need("{");
    let chain={head:null,tail:null};
    while(this.peek() && this.peek()!=="}") {
      const next=this.statement();
      if(next) chain=this.append(chain.head,chain.tail,next);
    }
    this.need("}");
    return chain.head;
  }
  statement() {
    if(this.eat(";")) return null;
    if(this.eat("if")) {
      this.need("(");const cond=this.expression();this.need(")");
      const b=this.make("controls_if");
      this.connectValue(b,"IF0",cond);
      this.connectStatement(b,"DO0",this.blockBody());
      if(this.eat("else")) {
        const elseBlock=this.blockBody();
        // Blockly controls_if needs its ELSE input enabled through its mutation.
        const mutation=b.mutationToDom?.();
        if(mutation){mutation.setAttribute("else","1");b.domToMutation(mutation);this.connectStatement(b,"ELSE",elseBlock);}
        else throw new Error("No se pudo crear el bloque si/no.");
      }
      return b;
    }
    if(this.eat("while")) {
      this.need("(");const cond=this.expression();this.need(")");
      const b=this.make("arduino_while");this.connectValue(b,"COND",cond);this.connectStatement(b,"DO",this.blockBody());return b;
    }
    if(this.eat("break")){this.need(";");return this.make("arduino_break");}
    if(this.eat("for")) {
      this.need("(");this.eat("int");const variable=this.id();this.need("=");this.take();this.need(";");this.id();this.need("<");const times=this.expression();this.need(";");this.id();this.eat("++");this.need(")");
      const b=this.make("arduino_repeat");this.connectValue(b,"TIMES",times);this.connectStatement(b,"DO",this.blockBody());return b;
    }
    if(this.eat("pinMode")) {
      this.need("(");const pin=this.take();this.need(",");const mode=this.take();this.need(")");this.need(";");
      return this.make("arduino_pinmode",{PIN:pin,MODE:mode});
    }
    if(this.eat("digitalWrite")||this.eat("analogWrite")) {
      const name=this.tokens[this.i-1];this.need("(");const pin=this.take();this.need(",");const value=this.expression();this.need(")");this.need(";");
      if(name==="digitalWrite") return this.make("arduino_digitalwrite",{PIN:pin,STATE:value.type==="logic_boolean"?(value.getFieldValue("BOOL")==="TRUE"?"HIGH":"LOW"):"HIGH"});
      const b=this.make("arduino_analogwrite",{PIN:pin});this.connectValue(b,"VALUE",value);return b;
    }
    if(this.eat("delay")) {this.need("(");const v=this.expression();this.need(")");this.need(";");const b=this.make("arduino_delay");this.connectValue(b,"TIME",v);return b;}
    if(this.eat("tone")) {this.need("(");const pin=this.take();this.need(",");const freq=this.expression();this.need(",");const duration=this.expression();this.need(")");this.need(";");const b=this.make("arduino_buzzer",{PIN:pin});this.connectValue(b,"FREQ",freq);this.connectValue(b,"DURATION",duration);return b;}
    if(this.peek()?.startsWith("bd_servo_")) {const servo=this.take();const pin=servo.replace("bd_servo_","");this.need(".");const method=this.id();this.need("(");const value=this.expression();this.need(")");this.need(";");if(method==="attach")return null;if(method==="write"){const b=this.make("arduino_servo",{PIN:pin});this.connectValue(b,"ANGLE",value);return b;}throw new Error("Método Servo no compatible: "+method);}
    if(this.eat("bd_lcd")) {this.need(".");const method=this.id();this.need("(");const args=[];if(!this.eat(")")){do{args.push(this.expression());}while(this.eat(","));this.need(")");}this.need(";");if(method==="init"||method==="backlight"||method==="clear")return method==="clear"?this.make("arduino_lcd_clear"):null;if(method==="setCursor"){this._lcdCursor=args;return null;}if(method==="print"){const b=this.make("arduino_lcd_print");this.connectValue(b,"TEXT",args[0]);const col=this._lcdCursor?.[0]||this.make("math_number",{NUM:"0"});const row=this._lcdCursor?.[1]||this.make("math_number",{NUM:"0"});this.connectValue(b,"COL",col);this.connectValue(b,"ROW",row);return b;}throw new Error("Método LCD no compatible: "+method);}
    if(this.eat("Serial")) {
      this.need(".");const method=this.id();this.need("(");
      if(method==="begin"){const baud=this.take();this.need(")");this.need(";");return this.make("arduino_serial_begin",{BAUD:baud});}
      const v=this.expression();this.need(")");this.need(";");
      const b=this.make("arduino_serial_print",{METHOD:method==="println"?"println":"print"});this.connectValue(b,"VALUE",v);return b;
    }
    if(this.eat("Wire")||this.eat("SPI")) {
      const name=this.tokens[this.i-1];this.need(".");this.need("begin");this.need("(");this.need(")");this.need(";");
      return this.make(name==="Wire"?"arduino_i2c_begin":"arduino_spi_begin");
    }
    // Asignaciones simples: variable = expresión;
    const name=this.id();
    if(this.eat("=")||this.eat("+=")) {
      const op=this.tokens[this.i-1],v=this.expression();this.need(";");
      if(op==="+="){const b=this.make("math_change");b.setFieldValue(this.variable(name),"VAR");this.connectValue(b,"DELTA",v);return b;}
      const b=this.make("variables_set");b.setFieldValue(this.variable(name),"VAR");this.connectValue(b,"VALUE",v);return b;
    }
    throw new Error("Instrucción C++ no compatible cerca de '"+name+"'.");
  }
  parse() {
    const code=this.tokens.join(" ");
    const setupAt=this.tokens.findIndex((t,i)=>t==="setup"&&this.tokens[i+1]==="(");
    const loopAt=this.tokens.findIndex((t,i)=>t==="loop"&&this.tokens[i+1]==="(");
    if(setupAt<0||loopAt<0) throw new Error("Se necesitan las funciones setup() y loop().");
    const extract=(at)=>{
      let p=at;while(p<this.tokens.length&&this.tokens[p]!=="{")p++;
      if(p>=this.tokens.length)throw new Error("Falta el cuerpo de una función.");
      this.i=p;return this.blockBody();
    };
    const setup=extract(setupAt),loop=extract(loopAt);
    return {setup,loop};
  }
}
function importCppToBlocks(source) {
  // Ignora cabeceras, comentarios y funciones auxiliares; solo reconstruye setup/loop.
  const clean=source.replace(/^\\s*#include[^\\n]*$/gm,"").replace(/\\/\\*[\\s\\S]*?\\*\\//g,"").replace(/\\/\\/[^\\n]*/g,"");
  const parser=new BDParser(clean);
  const parsed=parser.parse();
  const old=workspace.getTopBlocks(false);
  Blockly.Events.disable();
  try {
    workspace.clear();
    const setup=workspace.newBlock("arduino_setup"),loop=workspace.newBlock("arduino_loop");
    setup.initSvg();loop.initSvg();
    if(parsed.setup)setup.getInput("DO").connection.connect(parsed.setup.previousConnection);
    if(parsed.loop)loop.getInput("DO").connection.connect(parsed.loop.previousConnection);
    setup.moveBy(70,55);loop.moveBy(70,250);
    workspace.getAllBlocks(false).forEach(b=>{if(!b.rendered)b.initSvg();b.render();});
  } catch(e) {
    workspace.clear();
    old.forEach(b=>{});
    throw e;
  } finally { Blockly.Events.enable(); }
  workspace.clearUndo();
  Blockly.svgResize(workspace);
  generateCode({fromBlocks:true});
}
