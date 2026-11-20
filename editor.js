// Editor C++ de BlockDuino: CodeMirror 5 + autocompletado y diagnósticos básicos.
const BD_HINTS=[
  ["void setup() {\n  \n}","setup","Función de inicialización"],
  ["void loop() {\n  \n}","loop","Bucle principal"],
  ["pinMode(pin, OUTPUT);","pinMode","Configurar pin"],
  ["pinMode(pin, INPUT);","pinMode","Configurar entrada"],
  ["digitalWrite(pin, HIGH);","digitalWrite","Escribir HIGH"],
  ["digitalWrite(pin, LOW);","digitalWrite","Escribir LOW"],
  ["analogWrite(pin, value);","analogWrite","Salida PWM"],
  ["digitalRead(pin)","digitalRead","Leer entrada digital"],
  ["analogRead(A0)","analogRead","Leer entrada analógica"],
  ["delay(1000);","delay","Pausa en milisegundos"],
  ["Serial.begin(9600);","Serial.begin","Iniciar comunicación serie"],
  ["Serial.print(value);","Serial.print","Imprimir por Serial"],
  ["Serial.println(value);","Serial.println","Imprimir con salto de línea"],
  ["if (condition) {\n  \n}","if","Condición"],
  ["else {\n  \n}","else","Alternativa"],
  ["for (int i = 0; i < 10; i++) {\n  \n}","for","Bucle for"],
  ["while (condition) {\n  \n}","while","Bucle while"],
  ["HIGH","HIGH","Nivel lógico alto"],["LOW","LOW","Nivel lógico bajo"],
  ["INPUT","INPUT","Pin de entrada"],["OUTPUT","OUTPUT","Pin de salida"],
  ["INPUT_PULLUP","INPUT_PULLUP","Entrada con resistencia pull-up"]
];
function bdCppHints(cm) {
  const cur=cm.getCursor(),token=cm.getTokenAt(cur),start=token.start;
  const word=cm.getLine(cur.line).slice(start,cur.ch);
  const list=BD_HINTS.filter(x=>x[1].toLowerCase().includes(word.toLowerCase())||x[0].toLowerCase().startsWith(word.toLowerCase()));
  return {list:list.map(x=>({text:x[0],displayText:x[1],className:"bd-hint",render(el){el.textContent=x[1];const small=document.createElement("small");small.textContent=x[2];el.appendChild(small);}})),from:CodeMirror.Pos(cur.line,start),to:cur};
}
function bdCppLint(text) {
  const errors=[],stack=[],lines=text.split("\n"),pairs={")":"(","]":"[","}":"{"};
  let quote=null,escaped=false,blockComment=false;
  for(let row=0;row<lines.length;row++){
    const line=lines[row];let clean="",lineComment=false;
    for(let i=0;i<line.length;i++){
      const c=line[i],n=line[i+1];
      if(lineComment)break;
      if(blockComment){if(c==="*"&&n==="/"){blockComment=false;i++;}continue;}
      if(quote){if(escaped){escaped=false;continue;}if(c==="\\"){escaped=true;continue;}if(c===quote)quote=null;continue;}
      if(c==="/"&&n==="/"){lineComment=true;break;}
      if(c==="/"&&n==="*"){blockComment=true;i++;continue;}
      if(c==="\""||c==="'"){quote=c;continue;}
      clean+=c;
      if("([{".includes(c))stack.push({c,row,col:i});
      else if(")]}".includes(c)){const top=stack.pop();if(!top||top.c!==pairs[c])errors.push({from:CodeMirror.Pos(row,i),to:CodeMirror.Pos(row,i+1),message:"Cierre sin apertura correspondiente.",severity:"error"});}
    }
    const t=clean.trim();
    if(t && /^(?:pinMode|digitalWrite|analogWrite|delay|tone|Serial\.|Wire\.|SPI\.|[A-Za-z_]\w*\s*(?:=|\+=))/.test(t) && !/[;{}:]$/.test(t) && !/^\/\//.test(t) && !/^#/.test(t) && !/^(?:if|for|while)\s*\(/.test(t)){
      errors.push({from:CodeMirror.Pos(row,Math.max(0,line.length-1)),to:CodeMirror.Pos(row,line.length),message:"Puede faltar un punto y coma (;).",severity:"warning"});
    }
  }
  stack.forEach(x=>errors.push({from:CodeMirror.Pos(x.row,x.col),to:CodeMirror.Pos(x.row,x.col+1),message:"Falta cerrar este delimitador.",severity:"error"}));
  return errors;
}
function initCodeEditor(){
  const textarea=document.getElementById("output");
  window.codeEditor=CodeMirror.fromTextArea(textarea,{
    mode:"text/x-c++src",theme:"material-darker",lineNumbers:true,indentUnit:2,tabSize:2,
    lineWrapping:false,matchBrackets:true,autoCloseBrackets:true,styleActiveLine:true,
    gutters:["CodeMirror-linenumbers","CodeMirror-lint-markers"],
    lint:{getAnnotations:bdCppLint,async:false},extraKeys:{
      "Ctrl-Space":"autocomplete","Tab":cm=>{if(cm.somethingSelected())cm.indentSelection();else cm.replaceSelection("  ","end");},
      "Ctrl-S":cm=>{cm.save();saveLocal();}
    }
  });
  window.codeEditor.setSize("100%","100%");
  window.codeEditor.on("focus",()=>{window.BDManualMode=true;const d=document.getElementById("diagnostics");d.className="diagnostics warn";d.textContent="✎ Edición manual: sincronización pausada. Pulsa «Sincronizar» para volver a generar desde los bloques.";});
  window.codeEditor.on("inputRead",cm=>{
    const c=cm.getCursor(),t=cm.getTokenAt(c);
    if(t.string&&/[A-Za-z_]/.test(t.string[0]))CodeMirror.showHint(cm,bdCppHints,{completeSingle:false});
  });
  window.codeEditor.on("change",()=>{
    if(!window.BDSettingEditor&&typeof onCppEditorChange==="function")onCppEditorChange(window.codeEditor.getValue());
  });
  window.BDSetEditorValue=value=>{if(window.codeEditor){if(window.codeEditor.getValue()===value)return;window.BDSettingEditor=true;window.codeEditor.setValue(value);window.BDSettingEditor=false;}else textarea.value=value;};
  window.BDGetEditorValue=()=>window.codeEditor?window.codeEditor.getValue():textarea.value;
}
