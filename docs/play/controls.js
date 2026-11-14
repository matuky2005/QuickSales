/* Zombie Plague Web — puente de controles táctiles, sin recursos propietarios. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  window.ZPControls = function ZPControls(execute) {
    const status = $('status');
    const active = new Set();
    const stick = $('stick'), knob = $('knob'), look = $('aim-pad');
    const buttons = document.querySelectorAll('#buttons .control');
    let stickPointer = null, lookPointer = null, lastLook = null, lookTimeout = null;
    let mode = $('aim-mode').value;
    let lastNotice = '';
    const note = (text) => {
      if (lastNotice === text) return;
      lastNotice = text;
      status.textContent = 'Comando: ' + text;
    };
    function send(cmd) {
      try {
        if (execute(cmd)) note(cmd);
      } catch (error) {
        status.textContent = 'Error de comando: ' + error.message;
      }
    }
    function hold(action, enabled) {
      const isActive = active.has(action);
      if (isActive === enabled) return;
      if (enabled) active.add(action); else active.delete(action);
      send((enabled ? '+' : '-') + action);
    }
    function setAxis(x, y) {
      hold('forward', y < -0.22);
      hold('back', y > 0.22);
      hold('moveleft', x < -0.22);
      hold('moveright', x > 0.22);
    }
    function moveStick(e) {
      const b = stick.getBoundingClientRect();
      const radius = b.width * .35;
      let x = (e.clientX - b.left - b.width / 2) / radius;
      let y = (e.clientY - b.top - b.height / 2) / radius;
      const magnitude = Math.hypot(x,y);
      if (magnitude > 1) { x /= magnitude; y /= magnitude; }
      knob.style.left = (50 + x * 35) + '%';
      knob.style.top = (50 + y * 35) + '%';
      setAxis(x,y);
    }
    function resetStick(e) {
      if (e && e.pointerId !== stickPointer) return;
      stickPointer = null; knob.style.left = '50%'; knob.style.top = '50%';
      setAxis(0,0);
    }
    stick.addEventListener('pointerdown', e => {
      if (stickPointer !== null) return;
      stickPointer = e.pointerId;
      stick.setPointerCapture(e.pointerId);
      moveStick(e);
      e.preventDefault();
    });
    stick.addEventListener('pointermove', e => { if (e.pointerId === stickPointer) moveStick(e); });
    ['pointerup','pointercancel','lostpointercapture'].forEach(type => stick.addEventListener(type,resetStick));
    function stopTurn() {
      hold('left',false); hold('right',false);
      hold('lookup',false); hold('lookdown',false);
      clearTimeout(lookTimeout);
      lookTimeout = null;
    }
    function aimMouse(dx,dy,e) {
      /* Untrusted mouse movement may be ignored by the WebAssembly port on iOS. */
      const ev = new MouseEvent('mousemove',{
        bubbles: true, cancelable: true, clientX:e.clientX, clientY:e.clientY,
        movementX: dx, movementY: dy, view: window
      });
      document.dispatchEvent(ev);
      $('engine').dispatchEvent(new MouseEvent('mousemove',{
        bubbles: true, cancelable:true, clientX:e.clientX, clientY:e.clientY,
        movementX:dx, movementY:dy, view:window
      }));
    }
    look.addEventListener('pointerdown',e=>{
      if (lookPointer !== null) return;
      lookPointer=e.pointerId;
      lastLook={x:e.clientX,y:e.clientY};
      look.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    look.addEventListener('pointermove',e=>{
      if (e.pointerId !== lookPointer || !lastLook) return;
      const dx=e.clientX-lastLook.x,dy=e.clientY-lastLook.y;
      lastLook={x:e.clientX,y:e.clientY};
      if (mode === 'mouse'){aimMouse(dx,dy,e);return;}
      /* GoldSrc directional look commands: movement-rate approximation. */
      hold('left', dx < -1); hold('right',dx > 1);
      hold('lookup',dy < -2); hold('lookdown',dy > 2);
      clearTimeout(lookTimeout);
      lookTimeout=setTimeout(stopTurn,115);
    });
    function endLook(e) {
      if (e.pointerId !== lookPointer) return;
      lookPointer=null;lastLook=null;stopTurn();
    }
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>look.addEventListener(type,endLook));
    buttons.forEach(button=>{
      let pointerId=null;
      const cmd=button.dataset.cmd;
      const tap=button.dataset.tap;
      function press(e) {
        if (pointerId !== null) return;
        pointerId=e.pointerId;
        button.setPointerCapture(pointerId);
        button.classList.add('active');
        if (cmd) hold(cmd.substring(1),true);
        if (tap) send(tap);
        e.preventDefault();
      }
      function release(e) {
        if (e.pointerId !== pointerId) return;
        pointerId=null;
        button.classList.remove('active');
        if(cmd)hold(cmd.substring(1),false);
        e.preventDefault();
      }
      button.addEventListener('pointerdown',press);
      ['pointerup','pointercancel','lostpointercapture'].forEach(t=>button.addEventListener(t,release));
    });
    const menu=$('menu');
    function setMenu(open) {
      menu.classList.toggle('open',open);
      if(open) releaseAll();
    }
    $('gear').onclick=()=>setMenu(true);
    $('menu-open').onclick=()=>setMenu(true);
    $('menu-close').onclick=()=>setMenu(false);
    $('back').onclick=()=>{releaseAll();location.href='../index.html'};
    $('map-load').onclick=()=>{send('map de_dust2');setMenu(false)};
    $('aim-mode').addEventListener('change',e=>{stopTurn();mode=e.target.value; note('Apuntado: '+mode)});
    function releaseAll() {
      resetStick();stopTurn();for(const action of Array.from(active))hold(action,false);
    }
    window.addEventListener('blur',releaseAll);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll()});
    return { releaseAll, send };
  };
})();