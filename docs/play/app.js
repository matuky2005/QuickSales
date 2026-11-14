/* Zombie Plague Web — arranque experimental con archivos del usuario.
   Adaptado del ejemplo raw-html-cs16 de webxash3d-fwgs-cstrike.
   No transmite el archivo ZIP ni instala contenido de Valve en GitHub. */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const archive = $('archive'), start = $('start'), bar = $('bar'), debug = $('debug');
  const zipInfo = $('zip-info'), intro=$('intro'), canvas=$('engine'), hud=$('hud');
  let started=false;
  let em=null;
  const engineUrls={
    'xash.wasm':'https://cdn.jsdelivr.net/npm/xash3d-fwgs@latest/dist/xash.wasm',
    'filesystem_stdio.wasm':'https://cdn.jsdelivr.net/npm/xash3d-fwgs@latest/dist/filesystem_stdio.wasm',
    '/rodir/filesystem_stdio.wasm':'https://cdn.jsdelivr.net/npm/xash3d-fwgs@latest/dist/filesystem_stdio.wasm',
    'libref_webgl2.wasm':'https://cdn.jsdelivr.net/npm/xash3d-fwgs@latest/dist/libref_webgl2.wasm',
    'cl_dlls/menu_emscripten_wasm32.wasm':'https://cdn.jsdelivr.net/npm/cs16-client@latest/dist/cstrike/cl_dlls/menu_emscripten_wasm32.wasm',
    'dlls/cs_emscripten_wasm32.wasm':'https://cdn.jsdelivr.net/npm/cs16-client@latest/dist/cstrike/dlls/cs_emscripten_wasm32.wasm',
    'cl_dlls/client_emscripten_wasm32.wasm':'https://cdn.jsdelivr.net/npm/cs16-client@latest/dist/cstrike/cl_dlls/client_emscripten_wasm32.wasm'
  };
  const extrasUrl='https://cdn.jsdelivr.net/npm/cs16-client@latest/dist/cstrike/extras.pk3';
  function log(s){
    const line='['+new Date().toLocaleTimeString()+'] '+String(s);
    console.log('[ZP Web]',s);
    debug.textContent=(debug.textContent+line+'\n').slice(-6500);
    debug.scrollTop=debug.scrollHeight;
  }
  function progress(value,message) {
    $('phase').textContent=message;
    bar.style.display='block';
    bar.value=Math.min(100,value);
    log(message);
  }
  function fail(err) {
    start.disabled=false;started=false;
    const msg=err && err.message ? err.message : String(err);
    $('phase').textContent='Error: '+msg;
    log('ERROR: '+msg);
    console.error(err);
  }
  function cmd(command){
    if(!em)return false;
    try {
      if(typeof em.ccall==='function'){em.ccall('Cmd_ExecuteString',null,['string'],[command]);return true;}
      if(em.Module && typeof em.Module.ccall==='function'){em.Module.ccall('Cmd_ExecuteString',null,['string'],[command]);return true;}
      if(typeof em._Cmd_ExecuteString==='function' && typeof em.stringToNewUTF8==='function'){
        const ptr=em.stringToNewUTF8(command);
        try{em._Cmd_ExecuteString(ptr);}finally{em._free(ptr);}
        return true;
      }
      log('La compilación no expone Cmd_ExecuteString. Requiere parche del motor.');
      return false;
    } catch(error) {log('Comando '+command+': '+error.message);return false;}
  }
  window.ZPWeb={cmd, get engine(){return em}};
  archive.addEventListener('change',()=>{
    const file=archive.files && archive.files[0];
    const size=file ? (file.size/1048576).toFixed(1) : '?';
    zipInfo.textContent=file ? file.name+' · '+size+' MB · Sólo se lee en este dispositivo':'Todavía no seleccionaste un ZIP.';
    start.disabled=!file||!file.name.toLowerCase().endsWith('.zip')||started;
  });
  async function ensureRuntime(){
    if(typeof window.JSZip==='undefined')throw new Error('No cargó JSZip. Revisá la conexión o los bloqueadores de contenido.');
    if(typeof window.Xash3D!=='function')throw new Error('No cargó Xash3D raw.js desde el CDN. Revisá conexión o bloqueadores.');
    if(typeof WebAssembly!=='object')throw new Error('WebAssembly no está disponible.');
    if(!document.createElement('canvas').getContext('webgl2'))throw new Error('WebGL2 no está disponible en este navegador.');
  }
  function safePath(name) {
    if(typeof name!=='string')return null;
    const p=name.replace(/\\/g,'/');
    if(p.startsWith('/')||p.includes('\0')||p.split('/').includes('..')||!(/^(valve|cstrike)\//.test(p)))return null;
    if(/\.(?:dll|so|exe|dylib|bat)$/i.test(p))return null;
    return '/rodir/'+p;
  }
  async function unpack(file) {
    progress(4,'Leyendo ZIP local...');
    const zip=await window.JSZip.loadAsync(file,{checkCRC32:false});
    const raw=Object.entries(zip.files).filter(([name,entry])=>!entry.dir && safePath(name));
    const paths=new Set(raw.map(([name])=>name.replace(/\\/g,'/').toLowerCase()));
    if(!raw.some(([n])=>n.startsWith('valve/'))||
       !raw.some(([n])=>n.startsWith('cstrike/')))
      throw new Error('El ZIP debe contener las carpetas valve/ y cstrike/ en su raíz.');
    if(!raw.some(([n])=>/^cstrike\/maps\/.*\.bsp$/i.test(n)))
      throw new Error('Faltan mapas de CS 1.6: cstrike/maps/*.bsp.');
    if(!paths.has('cstrike/liblist.gam'))
      log('Aviso: falta cstrike/liblist.gam. El arranque puede fallar.');
    log('Archivos compatibles detectados: '+raw.length);
    const files=[];
    let count=0;
    for(const [name,entry] of raw) {
      try{
        const data=await entry.async('uint8array');
        files.push([safePath(name),data]);
      }catch(e){throw new Error('No se pudo extraer '+name+': '+e.message)}
      count++;
      if(count%20===0||count===raw.length) {
        const pct=9+Math.floor(65*count/raw.length);
        bar.value=pct;
        $('phase').textContent='Descomprimiendo en el dispositivo: '+count+'/'+raw.length;
        await new Promise(resolve=>setTimeout(resolve,0));
      }
    }
    log('ZIP descomprimido en memoria. '+files.length+' archivos');
    return files;
  }
  async function downloadExtras(){
    progress(76,'Descargando módulos libres necesarios...');
    const res=await fetch(extrasUrl,{mode:'cors'});
    if(!res.ok)throw new Error('extras.pk3: HTTP '+res.status);
    return new Uint8Array(await res.arrayBuffer());
  }
  async function run(){
    if(started)return;
    const file=archive.files && archive.files[0];
    if(!file)return;
    started=true;start.disabled=true;
    try {
      await ensureRuntime();
      const files=await unpack(file);
      const extras=await downloadExtras();
      progress(84,'Iniciando Xash3D WebAssembly. Esto puede tardar...');
      const options={
        arguments:['-windowed','-game','cstrike','+_vgui_menus','0','-ref','webgl2','+map','de_dust2'],
        canvas,
        dynamicLibraries:[
          'filesystem_stdio.wasm','libref_webgl2.wasm',
          'cl_dlls/menu_emscripten_wasm32.wasm',
          'dlls/cs_emscripten_wasm32.wasm',
          'cl_dlls/client_emscripten_wasm32.wasm',
          '/rodir/filesystem_stdio.wasm'
        ],
        onRuntimeInitialized:function(){
          try{
            em=this;
            this.FS.mkdirTree('/rodir');
            for(const [path,data] of files){
              const folder=path.slice(0,path.lastIndexOf('/'));
              this.FS.mkdirTree(folder);
              this.FS.writeFile(path,data);
            }
            this.FS.mkdirTree('/rodir/cstrike');
            this.FS.writeFile('/rodir/cstrike/extras.pk3',extras);
            try{this.FS.mkdir('/rwdir')}catch(e){/* already exists */ }
            this.FS.chdir('/rodir');
            bar.value=94;
            $('phase').textContent='Motor inicializado, esperando renderizado 3D...';
            log('Runtime WebAssembly inicializado. Lanzando juego.');
          }catch(e){fail(e);throw e}
        },
        locateFile:function(name){return engineUrls[name]||name},
        print:function(text){log('[engine] '+text)},
        printErr:function(text){log('[engine!] '+text)}
      };
      /* Llamada idéntica en esencia al ejemplo oficial raw-html-cs16. */
      const created=window.Xash3D(options);
      if(created&&typeof created.then==='function')await created;
      if(!em)throw new Error('El motor no ejecutó onRuntimeInitialized.');
      canvas.style.display='block';
      hud.style.display='block';
      intro.style.display='none';
      window.ZPControls(cmd);
      log('Interfaz visible. Probá mover, disparar y abrir AJUSTES.');
      $('status').textContent='Motor iniciado · comprobá que aparezca el mapa';
      /* La ejecución +map está en los argumentos; este reintento ayuda a
         builds que no ejecutan comandos + al inicio. */
      setTimeout(()=>{cmd('_vgui_menus 0');cmd('touch_enable 0');cmd('map de_dust2')},1350);
    } catch(err){fail(err);}
  }
  start.addEventListener('click',run);
  window.addEventListener('unhandledrejection',e=>{log('Error asíncrono: '+(e.reason?.message||e.reason))});
  window.addEventListener('error',e=>{if(e.message)log('Error de navegador: '+e.message)});
  log('Cliente experimental cargado; esperando ZIP propio.');
})();