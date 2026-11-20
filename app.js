let workspace;
const STORAGE_KEY="blockduino.project.v2";
const $=id=>document.getElementById(id);
function setStatus(text){$("saveStatus").textContent="● "+text;}
function injectWorkspace(){
 const theme=Blockly.Theme.defineTheme("blockduino",{base:Blockly.Themes.Classic,categoryStyles:{arduino_category:{colour:"#d99b26"},output_category:{colour:"#249fce"},input_category:{colour:"#2997dc"},variable_category:{colour:"#8bba46"},function_category:{colour:"#8b5cf6"},logic_category:{colour:"#617fa5"},loop_category:{colour:"#a855f7"},math_category:{colour:"#6474d9"},communication_category:{colour:"#17a88d"},display_category:{colour:"#bd73c9"},text_category:{colour:"#b77954"}},componentStyles:{workspaceBackgroundColour:"#101827",toolboxBackgroundColour:"#111c2d",toolboxForegroundColour:"#e8f0fa",flyoutBackgroundColour:"#1a2940",flyoutForegroundColour:"#e8f0fa",flyoutOpacity:1,scrollbarColour:"#52657d",scrollbarOpacity:.65,insertionMarkerColour:"#35d6b0",insertionMarkerOpacity:.35,markerColour:"#fff",cursorColour:"#fff"},fontStyle:{family:"Inter,Arial,sans-serif",weight:"600",size:12}});
 workspace=Blockly.inject("blocklyDiv",{toolbox:$("toolbox"),theme:theme,renderer:"zelos",trashcan:true,move:{scrollbars:true,drag:true,wheel:true},zoom:{controls:false,wheel:true,startScale:.9,maxScale:1.6,minScale:.45,scaleSpeed:1.15},grid:{spacing:22,length:3,colour:"#40516a",snap:true}});
 workspace.addChangeListener(e=>{if(e.isUiEvent)return;setStatus("Cambios sin guardar");window.clearTimeout(window.__bdSave);window.__bdSave=window.setTimeout(saveLocal,700);});
 const roots=workspace.getTopBlocks(false);
 if(!roots.length){const a=workspace.newBlock("arduino_setup"),b=workspace.newBlock("arduino_loop");a.initSvg();a.render();b.initSvg();b.render();a.moveBy(70,55);b.moveBy(70,250);}
}
function saveLocal(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({state:Blockly.serialization.workspaces.save(workspace),board:$("boardSelect").value,name:$("projectLabel").textContent}));setStatus("Guardado local");}catch(e){setStatus("No se pudo guardar");}}
function loadLocal(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return false;const data=JSON.parse(raw);workspace.clear();Blockly.serialization.workspaces.load(data.state,workspace);$("boardSelect").value=data.board||"uno";$("projectLabel").textContent=data.name||"Sin título";setStatus("Proyecto recuperado");return true;}catch(e){console.warn(e);return false;}}
function saveProject(){saveLocal();const name=prompt("Nombre del proyecto:",$("projectLabel").textContent);if(name!==null&&name.trim()){$("projectLabel").textContent=name.trim();saveLocal();}}
function exportProject(){const data={format:"BlockDuino",version:2,name:$("projectLabel").textContent,board:$("boardSelect").value,state:Blockly.serialization.workspaces.save(workspace)};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=(data.name.replace(/[^a-z0-9_-]/gi,"_")||"proyecto")+".blockduino";a.click();URL.revokeObjectURL(url);}
function importProject(file){const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);workspace.clear();if(data.state)Blockly.serialization.workspaces.load(data.state,workspace);else if(data.blocks)Blockly.serialization.workspaces.load(data,workspace);else throw new Error("Archivo no reconocido");$("boardSelect").value=data.board||"uno";$("projectLabel").textContent=data.name||file.name;saveLocal();generateCode();}catch(e){alert("No se pudo importar el proyecto: "+e.message);}};reader.readAsText(file);}
function newProject(){if(!confirm("¿Crear un proyecto nuevo? Los cambios guardados localmente serán reemplazados."))return;workspace.clear();$("projectLabel").textContent="Sin título";const a=workspace.newBlock("arduino_setup"),b=workspace.newBlock("arduino_loop");a.initSvg();a.render();b.initSvg();b.render();a.moveBy(70,55);b.moveBy(70,250);saveLocal();}
function showGuide(show){$("guideOverlay").classList.toggle("visible",show);}
function searchBlocks(q){
 const toolbox=$("toolbox");if(!q){workspace.updateToolbox(toolbox);return;}
 const doc=document.implementation.createHTMLDocument("toolbox"),root=doc.createElement("xml");
 const cats=toolbox.querySelectorAll(":scope > category");
 cats.forEach(cat=>{const copy=cat.cloneNode(false);let matched=cat.getAttribute("name").toLowerCase().includes(q);cat.querySelectorAll(":scope > block").forEach(block=>{const type=block.getAttribute("type");if(type.toLowerCase().includes(q)||matched)copy.appendChild(block.cloneNode(true));});if(copy.children.length)root.appendChild(copy);});
 if(!root.children.length){const c=doc.createElement("category");c.setAttribute("name","Sin resultados");c.setAttribute("colour","#64748b");root.appendChild(c);}
 workspace.updateToolbox(root);
}
function initUI(){
 $("helpButton").onclick=()=>showGuide(true);$("closeGuide").onclick=()=>showGuide(false);$("guideOverlay").onclick=e=>{if(e.target===$("guideOverlay"))showGuide(false);};
 $("generateButton").onclick=generateCode;$("copyButton").onclick=copyCode;$("saveButton").onclick=saveProject;$("loadButton").onclick=()=>{if(loadLocal())generateCode();else alert("No hay un proyecto guardado en este navegador.");};
 $("exportButton").onclick=exportProject;$("importButton").onclick=()=>$("fileInput").click();$("fileInput").onchange=e=>{if(e.target.files[0])importProject(e.target.files[0]);e.target.value="";};
 $("newButton").onclick=newProject;$("undoButton").onclick=()=>workspace.undo(false);$("redoButton").onclick=()=>workspace.undo(true);
 $("themeButton").onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("blockduino.theme",document.body.classList.contains("light")?"light":"dark");};
 if(localStorage.getItem("blockduino.theme")==="light")document.body.classList.add("light");
 $("zoomIn").onclick=()=>workspace.zoomCenter(1);$("zoomOut").onclick=()=>workspace.zoomCenter(-1);$("zoomReset").onclick=()=>workspace.setScale(.9);
 $("searchButton").onclick=()=>{$("blockSearch").classList.toggle("visible");$("blockSearch").focus();};
 $("blockSearch").oninput=e=>searchBlocks(e.target.value.trim().toLowerCase());
 $("boardSelect").onchange=()=>{saveLocal();generateCode();};
 const splitter=$("splitter"),main=$("workspace");let drag=false;
 splitter.addEventListener("pointerdown",e=>{drag=true;splitter.setPointerCapture(e.pointerId);document.body.classList.add("resizing");});
 splitter.addEventListener("pointermove",e=>{if(!drag)return;const r=main.getBoundingClientRect();if(innerWidth>950){const p=Math.max(22,Math.min(78,(e.clientX-r.left)/r.width*100));main.style.gridTemplateColumns=p+"fr 8px "+(100-p)+"fr";}else{const p=Math.max(22,Math.min(78,(e.clientY-r.top)/r.height*100));main.style.gridTemplateRows=p+"fr 8px "+(100-p)+"fr";}Blockly.svgResize(workspace);});
 const stop=()=>{drag=false;document.body.classList.remove("resizing");};splitter.addEventListener("pointerup",stop);splitter.addEventListener("pointercancel",stop);
 window.addEventListener("resize",()=>Blockly.svgResize(workspace));
}
window.addEventListener("load",()=>{injectWorkspace();initUI();if(!loadLocal())saveLocal();generateCode();});
