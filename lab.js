// BlockDuino Lab: asistente guiado y simulador educativo (MVP).
(function(){
  const $ = id => document.getElementById(id);
  let parts = [], timer = null, stepIndex = 0, steps = [];

  function modal(id, title, body) {
    let el = $(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.className = "bdLabOverlay";
      el.innerHTML = '<section class="bdLabWindow"><header class="bdLabHead"><div><small>BLOCKDUINO LAB</small><h2>'+title+'</h2></div><button class="secondary bdLabClose" type="button">✕</button></header><div class="bdLabBody">'+body+'</div></section>';
      document.body.appendChild(el);
      el.querySelector(".bdLabClose").onclick = () => closeModal(id);
      el.addEventListener("click", e => { if(e.target===el) closeModal(id); });
    }
    return el;
  }
  function closeModal(id){ const el=$(id); if(el)el.classList.remove("visible"); }
  function openModal(id){ $(id).classList.add("visible"); }

  function initAssistant(){
    modal("bdAssistant","Asistente de bloques",`
      <p>Describe lo que quieres que haga Arduino. El asistente convierte algunas instrucciones comunes en bloques editables.</p>
      <textarea id="bdPrompt" rows="3" placeholder="Ej: Parpadea un LED conectado al pin 13 cada segundo"></textarea>
      <div class="bdLabActions"><button id="bdBuild">✨ Crear bloques</button></div>
      <p id="bdAssistantStatus" class="bdLabHint">Este asistente funciona con instrucciones reconocidas; todavía no es un modelo de IA generativa.</p>`);
    $("bdBuild").onclick = buildFromPrompt;
  }
  function make(type, fields){
    const b=workspace.newBlock(type);
    Object.entries(fields||{}).forEach(([k,v])=>b.setFieldValue(String(v),k));
    b.initSvg();b.render();return b;
  }
  function value(parent,input,child){parent.getInput(input).connection.connect(child.outputConnection);}
  function chain(parent,input,blocks){
    if(!blocks.length)return;
    parent.getInput(input).connection.connect(blocks[0].previousConnection);
    for(let i=0;i<blocks.length-1;i++)blocks[i].nextConnection.connect(blocks[i+1].previousConnection);
  }
  function buildFromPrompt(){
    const raw=$("bdPrompt").value.trim(), p=raw.toLowerCase();
    const pinMatch=p.match(/(?:pin|pino)\s*(\d+)/), pin=pinMatch?Number(pinMatch[1]):13;
    if(!raw){$("bdAssistantStatus").textContent="Escribe primero qué quieres construir.";return;}
    if(pin<0||pin>13){$("bdAssistantStatus").textContent="En Arduino UNO usa un pin digital entre 0 y 13.";return;}
    let setup=[],loop=[];
    if(/parpade|intermit|blink/.test(p)){
      setup=[make("arduino_pinmode",{PIN:pin,MODE:"OUTPUT"})];
      const hi=make("arduino_digitalwrite",{PIN:pin,STATE:"HIGH"}), d1=make("arduino_delay"), lo=make("arduino_digitalwrite",{PIN:pin,STATE:"LOW"}), d2=make("arduino_delay");
      value(d1,"TIME",make("math_number",{NUM:/\d+\s*ms/.test(p)?Number(p.match(/(\d+)\s*ms/)[1]):1000}));
      value(d2,"TIME",make("math_number",{NUM:/\d+\s*ms/.test(p)?Number(p.match(/(\d+)\s*ms/)[1]):1000}));
      loop=[hi,d1,lo,d2];
    } else if(/encien|prend|activar|turn on/.test(p)){
      setup=[make("arduino_pinmode",{PIN:pin,MODE:"OUTPUT"})];
      loop=[make("arduino_digitalwrite",{PIN:pin,STATE:"HIGH"})];
    } else if(/apag|desactiv|turn off/.test(p)){
      setup=[make("arduino_pinmode",{PIN:pin,MODE:"OUTPUT"})];
      loop=[make("arduino_digitalwrite",{PIN:pin,STATE:"LOW"})];
    } else {
      $("bdAssistantStatus").textContent="Todavía no reconozco esa instrucción. Prueba: parpadear, encender o apagar un LED.";
      return;
    }
    workspace.clear();
    const s=make("arduino_setup",{}), l=make("arduino_loop",{});
    chain(s,"DO",setup);chain(l,"DO",loop);
    s.moveBy(60,50);l.moveBy(60,250);
    window.BDManualMode=false;generateCode();
    $("bdAssistantStatus").textContent="✓ Bloques creados. Ya puedes editarlos en el espacio de trabajo.";
    closeModal("bdAssistant");
  }

  function initSimulator(){
    modal("bdSimulator","Simulador electrónico",`
      <p>Simula un Arduino UNO con componentes virtuales. Esta primera versión interpreta operaciones digitales básicas; no sustituye todavía a Tinkercad ni compila todo C++.</p>
      <div class="bdSimToolbar">
        <label>Componente <select id="bdPartType"><option value="led">LED</option><option value="button">Botón</option></select></label>
        <label>Pin <select id="bdPartPin">${Array.from({length:14},(_,i)=>'<option value="'+i+'"'+(i===13?' selected':'')+'>'+i+'</option>').join("")}</select></label>
        <button id="bdAddPart" class="secondary">＋ Añadir</button>
      </div>
      <div class="bdSimBoard"><div class="bdBoardTitle">ARDUINO UNO · VIRTUAL</div><div class="bdBoardChip">ATmega328P</div><div id="bdParts" class="bdParts"><p class="bdLabHint">Añade un LED o botón para empezar.</p></div></div>
      <div class="bdLabActions"><button id="bdRun">▶ Ejecutar</button><button id="bdStep" class="secondary">⏭ Paso</button><button id="bdStop" class="secondary">■ Detener</button></div>
      <div id="bdSimStatus" class="bdSimStatus">En espera.</div>
      <div id="bdSimLog" class="bdSimLog">Diagnóstico: añade componentes y ejecuta el programa.</div>`);
    $("bdAddPart").onclick=addPart;
    $("bdRun").onclick=startSimulation;
    $("bdStep").onclick=()=>{stopSimulation();if(!steps.length||stepIndex>=steps.length)prepareSimulation();runStep();};
    $("bdStop").onclick=()=>stopSimulation();
    renderParts();
  }
  function addPart(){
    const type=$("bdPartType").value,pin=Number($("bdPartPin").value);
    if(parts.some(x=>x.type===type&&x.pin===pin)){setSimStatus("Ese componente ya existe en ese pin.");return;}
    parts.push({id:Date.now()+Math.random(),type,pin,state:false});renderParts();
  }
  function renderParts(){
    const root=$("bdParts");if(!root)return;
    if(!parts.length){root.innerHTML='<p class="bdLabHint">Añade un LED o botón para empezar.</p>';return;}
    root.innerHTML=parts.map(p=>'<div class="bdPart"><span class="bdPartIcon '+(p.type==="led"&&p.state?"lit":"")+'">'+(p.type==="led"?"●":"▣")+'</span><span><b>'+(p.type==="led"?"LED":"Botón")+'</b><small>Pin '+p.pin+(p.type==="led"?" → GND":" → GND")+'</small></span>'+(p.type==="button"?'<button class="secondary" data-press="'+p.id+'">'+(p.state?"PRESIONADO":"PULSAR")+'</button>':'<span class="bdPartState">'+(p.state?"ENCENDIDO":"APAGADO")+'</span>')+'<button class="secondary bdRemove" data-remove="'+p.id+'">×</button></div>').join("");
    root.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{parts=parts.filter(p=>String(p.id)!==b.dataset.remove);renderParts();});
    root.querySelectorAll("[data-press]").forEach(b=>b.onclick=()=>{const p=parts.find(x=>String(x.id)===b.dataset.press);p.state=!p.state;renderParts();});
  }
  function setSimStatus(t){$("bdSimStatus").textContent=t;}
  function stopSimulation(){if(timer)clearInterval(timer);timer=null;setSimStatus("Simulación detenida.");}
  function prepareSimulation(){
    const code=window.BDGetEditorValue?window.BDGetEditorValue():$("output").value;
    const errors=[],warnings=[];
    if(!/void\s+setup\s*\(/.test(code)||!/void\s+loop\s*\(/.test(code))warnings.push("No se encontró setup() o loop(); se intentará leer el código disponible.");
    const stack=[];for(const c of code){if("{([".includes(c))stack.push(c);if("})]".includes(c)){const a=stack.pop(),want={"}":"{",")":"(","]":"["}[c];if(a!==want)errors.push("Hay delimitadores desbalanceados.");}}
    if(stack.length)errors.push("Falta cerrar una llave o paréntesis.");
    const pinMax=13;
    for(const p of parts){if(p.pin>pinMax)errors.push("Pin "+p.pin+" fuera del rango digital del UNO.");if(p.type==="led"&&!new RegExp("pinMode\\s*\\(\\s*"+p.pin+"\\s*,\\s*OUTPUT").test(code))warnings.push("El LED del pin "+p.pin+" no está configurado como OUTPUT.");}
    const commands=[...code.matchAll(/digitalWrite\s*\(\s*(\d+)\s*,\s*(HIGH|LOW)\s*\)\s*;/g)].map(m=>({pin:Number(m[1]),state:m[2]==="HIGH",line:code.slice(0,m.index).split("\n").length}));
    if(!commands.length)warnings.push("No hay llamadas digitalWrite() reconocibles. Esta versión simula salidas digitales básicas.");
    if(/analogWrite\s*\(/.test(code))warnings.push("PWM detectado: todavía no se representa el brillo analógico.");
    if(/Servo|tone\s*\(/.test(code))warnings.push("Servo o buzzer detectado: componente aún no simulado.");
    steps=commands;stepIndex=0;
    $("bdSimLog").textContent=(errors.length?"ERRORES:\n• "+errors.join("\n• ")+"\n":"")+(warnings.length?"AVISOS:\n• "+warnings.join("\n• "):"Diagnóstico básico: sin errores detectados.");
    return errors.length===0;
  }
  function runStep(){
    if(!steps.length){setSimStatus("No hay pasos digitales que ejecutar.");return;}
    const step=steps[stepIndex%steps.length];
    parts.filter(p=>p.type==="led"&&p.pin===step.pin).forEach(p=>p.state=step.state);
    renderParts();setSimStatus("Paso "+(stepIndex+1)+"/"+steps.length+" · digitalWrite("+step.pin+", "+(step.state?"HIGH":"LOW")+").");
    stepIndex++;
  }
  function startSimulation(){
    stopSimulation();
    if(!prepareSimulation()){setSimStatus("Corrige los errores antes de ejecutar.");return;}
    if(!steps.length){setSimStatus("El código no contiene acciones compatibles todavía.");return;}
    runStep();timer=setInterval(runStep,700);
  }
  window.initBlockDuinoLab=function(){initAssistant();initSimulator();};
})();