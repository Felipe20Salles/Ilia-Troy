(function(){
 'use strict';
 const ENABLED_KEY='ilia-audio-enabled-v1',POSITION_BASE='ilia-music-position-v1',MUSIC_VOLUME_KEY='ilia-music-volume-v1',SFX_VOLUME_KEY='ilia-sfx-volume-v1';
 const script=document.currentScript;
 // Cada página pode trazer a sua trilha (data-music e data-music-title no <script>); sem isso, toca The Fight, a trilha da campanha de Troia.
 const musicFile=script.dataset.music||'audio/the-fight-juliush.mp3',musicTitle=script.dataset.musicTitle||'The Fight · JuliusH';
 const musicURL=new URL(musicFile,script.src).href,POSITION_KEY=POSITION_BASE+':'+musicFile;
 let context=null,master=null,music=null,unlocked=false;
 const read=(key,fallback)=>{try{const value=localStorage.getItem(key);return value===null?fallback:JSON.parse(value);}catch(_){return fallback;}};
 const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}};
 let enabled=read(ENABLED_KEY,true),musicVolume=read(MUSIC_VOLUME_KEY,.22),sfxVolume=read(SFX_VOLUME_KEY,.7);
 // data-music-gain nivela trilhas gravadas mais altas ou mais baixas que The Fight.
 const musicGain=Number(script.dataset.musicGain)||1;
 const playingMission=()=>document.body.classList.contains('game-active');
 function ensureContext(){
  if(!context){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return null;context=new AudioContext();master=context.createGain();master.gain.value=sfxVolume;master.connect(context.destination);}
  if(context.state==='suspended')context.resume().catch(()=>{});
  return context;
 }
 function ensureMusic(){
  if(!music){music=new Audio(musicURL);music.loop=true;music.preload='auto';music.volume=musicVolume*musicGain;music.setAttribute('data-track',musicTitle);
   let saved=0;try{saved=Number(sessionStorage.getItem(POSITION_KEY))||0;}catch(_){}
   if(saved>0)music.addEventListener('loadedmetadata',()=>{if(saved<music.duration)music.currentTime=saved;},{once:true});}
  return music;
 }
 function syncButton(){
  document.querySelectorAll('[data-audio-toggle]').forEach(button=>{
   const active=enabled;
   button.classList.toggle('muted',!active);
   button.setAttribute('aria-pressed',String(active));
   button.setAttribute('aria-label',active?'Desativar sons':'Ativar sons');
   button.title=playingMission()?(active?'Efeitos sonoros ligados':'Efeitos sonoros desligados'):(active?musicTitle+' — música ligada':'Música desligada');
   const waves=active?'<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>':'<path d="m16.5 9.5 5 5m0-5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
   button.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/>${waves}</svg><b>${playingMission()?'Sons':'Trilha'}</b>`;
  });
 }
 function playMusic(){
  const track=ensureMusic();
  if(!enabled||playingMission()||document.hidden){track.pause();return;}
  if(track.paused){track.volume=0;clearInterval(track._fadeIn);track._fadeIn=setInterval(()=>{track.volume=Math.min(musicVolume*musicGain,track.volume+musicVolume*musicGain/40);if(track.volume>=musicVolume*musicGain)clearInterval(track._fadeIn);},75);}else track.volume=musicVolume*musicGain;
  track.play().then(()=>{unlocked=true;}).catch(()=>{});
 }
 function stopMusic(){if(music)music.pause();}
 function savePosition(){if(music&&music.currentTime>0)try{sessionStorage.setItem(POSITION_KEY,String(music.currentTime));}catch(_){}}
 function toggleAmbience(){enabled?resumeAmbience():pauseAmbience();}
 function toggle(){if(enabled&&!playingMission()&&(!music||music.paused)){unlocked=true;ensureContext();playMusic();syncButton();return;}enabled=!enabled;write(ENABLED_KEY,enabled);unlocked=true;if(enabled){ensureContext();playMusic();effect('ui');}else{stopMusic();}toggleAmbience();syncButton();}
 function tone(start,end,duration,volume,type='sine',delay=0){
  const ctx=ensureContext();if(!ctx)return;const at=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(start,at);osc.frequency.exponentialRampToValueAtTime(Math.max(25,end),at+duration);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(gain);gain.connect(master);osc.start(at);osc.stop(at+duration+.02);
 }
 function noise(duration,volume,filterFrequency,delay=0){
  const ctx=ensureContext();if(!ctx)return;const at=ctx.currentTime+delay,length=Math.max(1,Math.floor(ctx.sampleRate*duration)),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=filterFrequency;filter.Q.value=.7;gain.gain.setValueAtTime(volume,at);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);source.connect(filter);filter.connect(gain);gain.connect(master);source.start(at);source.stop(at+duration+.02);
 }
 function effect(name){
  if(!enabled)return;unlocked=true;ensureContext();
  if(name==='ui'){tone(520,420,.08,.035,'sine');return;}
  if(name==='move'){for(let i=0;i<3;i++){tone(95,48,.12,.12,'triangle',i*.13);noise(.08,.035,260,i*.13);}return;}
  if(name==='march'){for(let i=0;i<4;i++){tone(82,38,.16,.16,'triangle',i*.17);noise(.1,.05,190,i*.17);}return;}
  if(name==='attack'){noise(.19,.18,2500);tone(1050,210,.24,.12,'square');tone(1900,780,.16,.055,'triangle',.025);return;}
  if(name==='shield'){tone(190,52,.3,.19,'triangle');noise(.22,.12,650);return;}
  if(name==='arrow'){noise(.33,.1,3800);tone(1250,210,.38,.065,'sine');return;}
  if(name==='explore'){tone(390,620,.18,.08,'sine');tone(620,930,.24,.07,'sine',.14);return;}
  if(name==='recover'){tone(260,390,.2,.065,'sine');tone(390,585,.28,.07,'sine',.16);return;}
  if(name==='ability'){tone(155,310,.3,.1,'sawtooth');tone(310,465,.28,.065,'triangle',.15);return;}
  if(name==='reveal'){tone(330,660,.28,.08,'triangle');tone(494,988,.32,.065,'sine',.12);return;}
  if(name==='death'){tone(260,75,.65,.13,'sawtooth');noise(.45,.06,220,.12);return;}
  if(name==='fall'){noise(.18,.14,900);tone(180,60,.35,.12,'triangle',.05);return;}
  if(name==='hurt'){tone(140,70,.22,.13,'sawtooth');noise(.12,.08,400);return;}
  if(name==='chime'){tone(784,784,.6,.05,'sine');tone(1175,1175,.7,.04,'sine',.12);tone(1568,1568,.8,.03,'sine',.24);return;}
  if(name==='fanfare'){[392,494,587,784].forEach((f,i)=>tone(f,f,.35,.07,'triangle',i*.14));return;}
  if(name==='retreat'){tone(220,150,1.2,.08,'sawtooth');tone(165,110,1.2,.05,'triangle',.3);return;}
  if(name==='plague'){noise(1.1,.07,300);tone(110,70,1.2,.06,'sine');}
 }
 // Cada herói golpeia com a sua arma; mover é a marcha do contingente.
 const WEAPON={aquiles:'espada',agamemnon:'espada',menelau:'lanca',ajax:'escudo',odisseu:'flecha'};
 function action(actionName,heroId,card){
  const play=name=>window.TroyAudio?.cue?cue(name):effect(CUE_FALLBACK[name]||'ui');
  if(actionName==='move')return play('marcha');
  if(actionName==='attack')return play(WEAPON[heroId]||'espada');
  if(actionName==='interact')return effect('explore');
  if(actionName==='rest'||actionName==='rescue'||actionName==='share')return effect('recover');
  if(!actionName.startsWith('card:'))return effect('ui');
  const type=card?.type||'';
  if(['ranged','precision','multiRanged'].includes(type))return play('flecha');
  if(type==='attack')return play(card?.name?.toLocaleLowerCase('pt-BR').includes('escudo')?'escudo':WEAPON[heroId]||'espada');
  if(type==='charge')return play(WEAPON[heroId]||'espada');
  if(['sprint','guide'].includes(type))return play('marcha');
  // A vida que volta toca em changes(), quando o estado muda.
  if(['heal','healAlly'].includes(type))return;
  if(type==='refresh')return effect('recover');
  if(type==='intimidate')return play('comando');
  if(type==='taunt')return play('provocacao');
  if(['guard','protect'].includes(type))return play('escudo');
  return effect('ability');
 }
 function trojan(step){if(!step)return;const intent=(step.intent||'').toLocaleLowerCase('pt-BR');if(intent.includes('atirar')||(intent.includes('atacar')&&['arqueiro','paris'].includes(step.type)))cue('flecha');else if(intent.includes('atacar'))cue('espada');else if(intent.includes('sabotar'))cue('escudo');else cue('marcha');}
 function mount(){
  const header=document.querySelector('header'),host=header||document.body;if(!host.querySelector('[data-audio-toggle]')){const button=document.createElement('button');button.type='button';button.className='audio-control'+(header?'':' audio-control-floating');button.dataset.audioToggle='';button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();toggle();});const rules=header?.querySelector('#rules-button');header?header.insertBefore(button,rules||null):host.appendChild(button);}
  syncButton();
  const observer=new MutationObserver(()=>{syncButton();playingMission()?stopMusic():playMusic();});observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  const unlockEvents=['pointerdown','keydown','touchstart'];
  const unlock=event=>{if(event.target.closest?.('[data-audio-toggle]'))return;unlockEvents.forEach(type=>document.removeEventListener(type,unlock,true));unlocked=true;ensureContext();if(!playingMission())playMusic();};
  unlockEvents.forEach(type=>document.addEventListener(type,unlock,true));
  document.addEventListener('click',event=>{if(event.target.closest('button,a')&&!event.target.closest('[data-audio-toggle]'))effect('ui');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){savePosition();stopMusic();pauseAmbience();}else{playMusic();resumeAmbience();}});
  window.addEventListener('pagehide',savePosition);
  playMusic();
 }
 // Sons em arquivo (assets/audio/sfx/<nome>.mp3). Sem o arquivo, toca o efeito gerado pelo app.
 // Equilíbrio medido em 02/10/2026 pelo volume médio de cada arquivo: o ganho nivela os sons entre si
 // (acima de 1 amplifica) e "max" corta com fade os sons longos demais para um momento.
 const LEVELS={mar:{gain:1.3},'tambores-longe':{gain:.3},'tambores-guerra':{gain:.32},batimento:{gain:.2},
  caixa:{gain:1,max:1.5},marcha:{gain:1,max:1.5},espada:{gain:.9,max:1.5},lanca:{gain:1,max:1.5},escudo:{gain:1.2,max:1.5},flecha:{gain:1.3,max:2},troianos:{gain:.58,max:4},acampamento:{gain:.8,max:3},revelar:{gain:.52,max:5},descoberta:{gain:2.5},encontro:{gain:.7},cronica:{gain:1.8},feito:{gain:1.45},queda:{gain:.8,max:8},
  corneta:{gain:.3,max:5.5},// Secundários (05/10/2026): nivelados um pouco abaixo dos sons principais, por serem consequência deles.
  'tropa-cai':{gain:1.16,max:2.5},ferido:{gain:.76},cura:{gain:2,max:3},favor:{gain:2.85,max:4.5},retirada:{gain:10,max:6},peste:{gain:.8,max:5},comando:{gain:.95},vitoria:{gain:.52,max:8},
  'transicao-missao':{gain:.76},provocacao:{gain:.69,max:3},'deus-atena':{gain:3.4},'deus-poseidon':{gain:2.1},'deus-zeus':{gain:1.7,max:6}};
 const CUE_FALLBACK={caixa:'explore',marcha:'move',espada:'attack',lanca:'attack',escudo:'shield',flecha:'arrow',troianos:'march',acampamento:'ui',revelar:'reveal',descoberta:'explore',encontro:'ability',cronica:'reveal',feito:'ability',queda:'death','deus-atena':'reveal','deus-poseidon':'move','deus-zeus':'attack','transicao-missao':'fanfare',provocacao:'shield','tropa-cai':'fall',ferido:'hurt',cura:'recover',favor:'chime',vitoria:'fanfare',derrota:'death',retirada:'retreat',peste:'plague',comando:'attack'};
 const sfxURL=name=>new URL('audio/sfx/'+name+'.mp3',script.src).href,clips={};
 function clip(name,loop=false){
  if(clips[name])return clips[name];
  const el=new Audio(sfxURL(name));el.preload='auto';el.loop=loop;
  const entry={el,gain:null,ok:true,timer:0,onError:null};clips[name]=entry;
  el.addEventListener('error',()=>{entry.ok=false;entry.onError?.();},{once:true});
  const ctx=ensureContext();
  if(ctx){try{const source=ctx.createMediaElementSource(el);entry.gain=ctx.createGain();entry.gain.gain.value=0;source.connect(entry.gain);entry.gain.connect(master);}catch(_){entry.gain=null;}}
  return entry;
 }
 function setLevel(entry,value,seconds=0){
  if(entry.gain){const g=entry.gain.gain,now=context.currentTime;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);if(seconds)g.linearRampToValueAtTime(value,now+seconds);else g.setValueAtTime(value,now);}
  else entry.el.volume=Math.max(0,Math.min(1,value));
 }
 function cue(name){
  if(!enabled)return;unlocked=true;
  // A trombeta dos alertas: sem o arquivo, tocam os tambores de guerra dos troianos.
  const fallback=()=>name==='corneta'?cue('troianos'):effect(CUE_FALLBACK[name]||'ui');
  const entry=clip(name);if(!entry.ok){fallback();return;}
  const level=LEVELS[name]||{gain:1};entry.onError=fallback;clearTimeout(entry.timer);
  setLevel(entry,level.gain);try{entry.el.currentTime=0;}catch(_){}entry.el.play().catch(()=>{});
  if(level.max)entry.timer=setTimeout(()=>{setLevel(entry,0,.8);entry.timer=setTimeout(()=>entry.el.pause(),900);},level.max*1000);
 }
 // Sons secundários: comparam o estado antes e depois de uma ação ou da fase de Troia e tocam o mais marcante.
 // Entram um pouco depois do som principal (o golpe, a marcha), como consequência dele.
 function changes(b,a,delay=400){
  if(!enabled||!b||!a)return;let name=null;
  // A vitória abre a transição para a missão seguinte. Com duelo em cena (A ira de Aquiles), ela espera o fim da cena.
  // A derrota usa o violoncelo da queda.
  if(a.result&&!b.result){if(a.result==='victory'){if(!a.duel)setTimeout(victory,delay);return;}name='queda';}
  else if(a.commanderDown&&!b.commanderDown)name='retirada';
  else if(a.plagueActive&&!b.plagueActive)name='peste';
  else{const ids=new Set((a.enemies||[]).map(e=>e.id)),hp=id=>a.heroes.find(h=>h.id===id)?.hp??0;
   const killed=(b.enemies||[]).some(e=>!ids.has(e.id)),healed=b.heroes.some(h=>hp(h.id)>h.hp),hurt=b.heroes.some(h=>hp(h.id)<h.hp&&hp(h.id)>0);
   // Fugir de uma luta: um herói sai de uma peça onde havia inimigos.
   const fled=b.heroes.some(h=>{const n=a.heroes.find(x=>x.id===h.id);return n&&n.hp>0&&n.zone!==h.zone&&(b.enemies||[]).some(e=>e.zone===h.zone);});
   name=fled?'retirada':killed?'tropa-cai':(a.favor??0)>(b.favor??0)?'favor':healed?'cura':hurt?'ferido':null;}
  if(name)setTimeout(()=>cue(name),delay);
 }
 // Vitória: a fanfarra e, enquanto ela se apaga, a transição para a missão seguinte.
 function victory(){cue('vitoria');setTimeout(()=>cue('transicao-missao'),7500);}
 // Ambiente da missão: mar sempre; tambores entram conforme a tensão (o Alarme); batimento com herói em perigo.
 const LAYERS=['mar','tambores-longe','tambores-guerra'];let tension=-1,heartbeatOn=false;
 function ambient(name,want){
  const entry=clip(name,true);if(!entry.ok)return;clearTimeout(entry.timer);
  if(want){if(entry.el.paused)entry.el.play().catch(()=>{});setLevel(entry,LEVELS[name]?.gain??.5,2.5);}
  else{setLevel(entry,0,1.5);entry.timer=setTimeout(()=>entry.el.pause(),1600);}
 }
 function setTension(level){tension=level;LAYERS.forEach((name,i)=>{const want=enabled&&!document.hidden&&level>=0&&i<=level;if(want||clips[name])ambient(name,want);});}
 function setHeartbeat(on){heartbeatOn=on;const want=on&&enabled&&!document.hidden;if(want||clips.batimento)ambient('batimento',want);}
 function pauseAmbience(){for(const name of [...LAYERS,'batimento'])if(clips[name])ambient(name,false);}
 function resumeAmbience(){if(tension>=0)setTension(tension);if(heartbeatOn)setHeartbeat(true);}
 window.TroyAudio={effect,action,trojan,cue,changes,victory,setTension,setHeartbeat,playMusic,stopMusic,isEnabled:()=>enabled};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
