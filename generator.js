// Generador C++ modular: expresiones, instrucciones y validaciones.
const BD={
 headers:new Set(),warnings:[],errors:[],board:"uno",
 ind:n=>"  ".repeat(n),
 val(b,k){const x=b.getInputTargetBlock(k);return x?this.expr(x):"0";},
 safe(s){let x=String(s||"variable").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9_]/g,"_");if(!/^[a-zA-Z_]/.test(x))x="_"+x;return x;},
 variable(id){const v=workspace.getVariableById(id);return v?this.safe(v.name):"variable";},
 expr(b){
  if(!b)return "0";const f=k=>b.getFieldValue(k),v=k=>this.val(b,k);
  switch(b.type){
   case "math_number":return f("NUM");
   case "text":return JSON.stringify(f("TEXT"));
   case "logic_boolean":return f("BOOL")==="TRUE"?"true":"false";
   case "variables_get":return this.variable(f("VAR"));
   case "arduino_analogread":case "arduino_potentiometer":return "analogRead("+f("PIN")+")";
   case "arduino_digitalread":return "digitalRead("+f("PIN")+")";
   case "arduino_button":return "(digitalRead("+f("PIN")+") == "+(f("MODE")==="INPUT_PULLUP"?"LOW":"HIGH")+")";
   case "arduino_ultrasonic":return "bd_readDistance("+f("TRIG")+", "+f("ECHO")+")";
   case "arduino_temperature":return f("KIND")==="TMP36"?"((analogRead("+f("PIN")+") * (5.0 / 1023.0) - 0.5) * 100.0)":"(analogRead("+f("PIN")+") * (5.0 / 1023.0) * 100.0)";
   case "arduino_serial_available":return "(Serial.available() > 0)";
   case "arduino_serial_read":return "Serial.read()";
   case "arduino_map":return "map("+v("VALUE")+", "+v("FROM1")+", "+v("FROM2")+", "+v("TO1")+", "+v("TO2")+")";
   case "arduino_constrain":return "constrain("+v("VALUE")+", "+v("LOW")+", "+v("HIGH")+")";
   case "arduino_trig":return f("FN")+"("+v("VALUE")+")";
   case "math_arithmetic":{const op={ADD:"+",MINUS:"-",MULTIPLY:"*",DIVIDE:"/",POWER:"^"}[f("OP")]||"+";return op==="^"?"pow("+v("A")+", "+v("B")+")":"("+v("A")+" "+op+" "+v("B")+")";}
   case "math_modulo":return "("+v("DIVIDEND")+" % "+v("DIVISOR")+")";
   case "math_single":{const fn={ROOT:"sqrt",ABS:"abs",NEG:"-",LN:"log",LOG10:"log10",EXP:"exp",POW10:"pow"}[f("OP")]||"abs";return fn==="-"?"(-"+v("NUM")+")":fn==="pow"?"pow(10, "+v("NUM")+")":fn+"("+v("NUM")+")";}
   case "math_round":return ({ROUND:"round",ROUNDUP:"ceil",ROUNDDOWN:"floor"}[f("OP")]||"round")+"("+v("NUM")+")";
   case "math_random_int":return "random("+v("FROM")+", ("+v("TO")+" + 1))";
   case "logic_compare":return "("+v("A")+" "+({EQ:"==",NEQ:"!=",LT:"<",LTE:"<=",GT:">",GTE:">="}[f("OP")]||"==")+" "+v("B")+")";
   case "logic_operation":return "("+v("A")+" "+(f("OP")==="AND"?"&&":"||")+" "+v("B")+")";
   case "logic_negate":return "(!"+v("BOOL")+")";
   case "text_join":{let a=[];for(let i=0;i<20&&b.getInput("ADD"+i);i++)a.push(v("ADD"+i));return a.length?a.join(" + "):'""';}
   case "text_length":return "("+v("VALUE")+".length())";
   case "procedures_callreturn":case "procedures_callnoreturn":return this.call(b);
   default:this.warnings.push("Valor no compatible: "+b.type);return "0";
  }
 },
 call(b){let a=[];for(let i=0;i<20&&b.getInput("ARG"+i);i++)a.push(this.val(b,"ARG"+i));return this.safe(b.getFieldValue("NAME")||"funcion")+"("+a.join(", ")+")";},
 stmts(b,n){let out="";while(b){out+=this.stmt(b,n);b=b.getNextBlock();}return out;},
 stmt(b,n){
  const s=this.ind(n),f=k=>b.getFieldValue(k),v=k=>this.val(b,k);
  switch(b.type){
   case "arduino_pinmode":return s+"pinMode("+f("PIN")+", "+f("MODE")+");\n";
   case "arduino_digitalwrite":return s+"digitalWrite("+f("PIN")+", "+f("STATE")+");\n";
   case "arduino_analogwrite":return s+"analogWrite("+f("PIN")+", constrain("+v("VALUE")+", 0, 255));\n";
   case "arduino_delay":return s+"delay("+v("TIME")+");\n";
   case "arduino_repeat":case "controls_repeat_ext":return s+"for (int bd_i = 0; bd_i < "+v("TIMES")+"; bd_i++) {\n"+this.stmts(b.getInputTargetBlock("DO"),n+1)+s+"}\n";
   case "arduino_while":return s+"while ("+v("COND")+") {\n"+this.stmts(b.getInputTargetBlock("DO"),n+1)+s+"}\n";
   case "arduino_repeat_until":return s+"while (!("+v("COND")+")) {\n"+this.stmts(b.getInputTargetBlock("DO"),n+1)+s+"}\n";
   case "arduino_break":return s+"break;\n";
   case "arduino_servo":this.headers.add("Servo.h");return s+"bd_servo_"+f("PIN")+".write(constrain("+v("ANGLE")+", 0, 180));\n";
   case "arduino_buzzer":return s+"tone("+f("PIN")+", "+v("FREQ")+", "+v("DURATION")+");\n";
   case "arduino_serial_begin":return s+"Serial.begin("+f("BAUD")+");\n";\n   case "arduino_i2c_begin":this.headers.add("Wire.h");return s+"Wire.begin();\n";\n   case "arduino_spi_begin":this.headers.add("SPI.h");return s+"SPI.begin();\n";\n   case "arduino_variable":case "arduino_constant":return "";
   case "arduino_serial_print":return s+"Serial."+f("METHOD")+"("+v("VALUE")+");\n";
   case "arduino_lcd_init":this.headers.add("Wire.h");this.headers.add("LiquidCrystal_I2C.h");return s+"// LCD I2C: revisa dirección y tamaño en la declaración de bd_lcd.\nbd_lcd.init();\nbd_lcd.backlight();\n";
   case "arduino_lcd_print":this.headers.add("Wire.h");this.headers.add("LiquidCrystal_I2C.h");return s+"bd_lcd.setCursor("+v("COL")+", "+v("ROW")+");\nbd_lcd.print("+v("TEXT")+");\n";
   case "arduino_lcd_clear":this.headers.add("Wire.h");this.headers.add("LiquidCrystal_I2C.h");return s+"bd_lcd.clear();\n";
   case "controls_if":return this.ifStmt(b,n);
   case "variables_set":return s+this.variable(f("VAR"))+" = "+v("VALUE")+";\n";
   case "math_change":return s+this.variable(f("VAR"))+" += "+v("DELTA")+";\n";
   case "procedures_callnoreturn":return s+this.call(b)+";\n";
   default:if(b.type.startsWith("procedures_")&&b.type.includes("call"))return s+this.call(b)+";\n";this.warnings.push("Bloque no generado: "+b.type);return s+"// Bloque no generado: "+b.type+"\n";
  }
 },
 ifStmt(b,n){const s=this.ind(n);let out="",i=0;while(b.getInput("IF"+i)){out+=s+(i?"else if":"if")+" ("+this.val(b,"IF"+i)+") {\n"+this.stmts(b.getInputTargetBlock("DO"+i),n+1)+s+"}";i++;if(b.getInput("IF"+i)||b.getInput("ELSE"))out+=" ";}if(b.getInput("ELSE"))out+="else {\n"+this.stmts(b.getInputTargetBlock("ELSE"),n+1)+s+"}";return out+"\n";},
 validate(roots){
  if(!roots.some(b=>b.type==="arduino_setup"))this.errors.push("Falta «Al iniciar Arduino».");
  if(!roots.some(b=>b.type==="arduino_loop"))this.errors.push("Falta «Por siempre».");
  const pwm={uno:[3,5,6,9,10,11],nano:[3,5,6,9,10,11],mega:[2,3,4,5,6,7,8,9,10,11,12,13,44,45,46]};
  workspace.getAllBlocks(false).forEach(b=>{
   if(b.type==="arduino_analogwrite"&&!pwm[this.board].includes(Number(b.getFieldValue("PIN"))))this.warnings.push("El pin "+b.getFieldValue("PIN")+" no es PWM en "+this.board.toUpperCase()+".");
   const required={arduino_analogwrite:"VALUE",arduino_delay:"TIME",arduino_servo:"ANGLE",arduino_buzzer:"FREQ"};
   if(required[b.type]&&!b.getInputTargetBlock(required[b.type]))this.errors.push("Falta conectar un valor en "+b.type+".");
  });
 },
 generate(){
  this.headers=new Set();this.warnings=[];this.errors=[];this.board=document.getElementById("boardSelect").value;
  const roots=workspace.getTopBlocks(true);this.validate(roots);if(this.errors.length)return {code:"",errors:this.errors,warnings:this.warnings};
  const setup=roots.find(b=>b.type==="arduino_setup"),loop=roots.find(b=>b.type==="arduino_loop");
  const all=workspace.getAllBlocks(false);
  if(all.some(b=>b.type==="arduino_servo"))this.headers.add("Servo.h");
  if(all.some(b=>["math_single","math_round","math_arithmetic"].includes(b.type)))this.headers.add("math.h");
  let pre="";
  if(all.some(b=>b.type==="arduino_ultrasonic"))pre+="long bd_readDistance(int trig, int echo) { pinMode(trig, OUTPUT); digitalWrite(trig, LOW); delayMicroseconds(2); digitalWrite(trig, HIGH); delayMicroseconds(10); digitalWrite(trig, LOW); pinMode(echo, INPUT); long us = pulseIn(echo, HIGH, 30000); return us == 0 ? -1 : us * 0.0343 / 2; }\n\n";
  if(all.some(b=>["arduino_lcd_init","arduino_lcd_print","arduino_lcd_clear"].includes(b.type))){this.headers.add("Wire.h");this.headers.add("LiquidCrystal_I2C.h");pre+="// Ajusta dirección, columnas y filas según tu pantalla.\nLiquidCrystal_I2C bd_lcd(0x27, 16, 2);\n\n";}
  let code=Array.from(this.headers).map(h=>"#include <"+h+">\n").join("")+(this.headers.size?"\n":"")+"// Generado con BlockDuino\n\n";
  const vars=workspace.getAllVariables().map(v=>"auto "+this.safe(v.name)+" = 0; // Cambia el tipo si necesitas decimales o texto").join("\n");
  if(vars)code+=vars+"\n\n";code+=pre+"void setup() {\n"+this.stmts(setup.getInputTargetBlock("DO"),1)+"}\n\nvoid loop() {\n"+this.stmts(loop.getInputTargetBlock("DO"),1)+"}\n";
  if(roots.some(b=>!["arduino_setup","arduino_loop"].includes(b.type)))this.warnings.push("Hay bloques sueltos fuera de setup() y loop(); no se incluyeron.");
  return {code:code,errors:this.errors,warnings:this.warnings};
 }
};
function generateCode(){const r=BD.generate(),out=document.getElementById("output"),d=document.getElementById("diagnostics");if(r.errors.length){out.textContent="// Corrige los errores para generar.";d.className="diagnostics error";d.textContent="✖ "+r.errors.join(" ");return;}out.textContent=r.code;d.className=r.warnings.length?"diagnostics warn":"diagnostics";d.textContent=r.warnings.length?"⚠ "+r.warnings.join(" "):"✓ Código generado. Revisa el cableado y las librerías de tu circuito.";document.getElementById("codeInfo").textContent=document.getElementById("boardSelect").selectedOptions[0].text+" · C++";}
function copyCode(){const t=document.getElementById("output").textContent;navigator.clipboard.writeText(t).then(()=>{document.getElementById("diagnostics").textContent="✓ Código copiado."}).catch(()=>{const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();document.execCommand("copy");a.remove();});}
