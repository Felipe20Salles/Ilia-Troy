(function(){
 'use strict';
 const ENABLED_KEY='ilia-audio-enabled-v1',MUSIC_VOLUME_KEY='ilia-music-volume-v1',SFX_VOLUME_KEY='ilia-sfx-volume-v1';
 const script=document.currentScript;
 const musicURL=new URL('audio/the-fight-juliush.mp3',script.src).href;
 let context=null,master=null,music=null,unlocked=false;
 const read=(key,fallback)=>{try{const value=localStorage.getItem(key);return value===null?fallback:JSON.parse(value);}catch(_){return fallback;}};
 const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}};
 let enabled=read(ENABLED_KEY,true),musicVolume=read(MUSIC_VOLUME_KEY,.22),sfxVolume=read(SFX_VOLUME_KEY,.7);
 const playingMission=()=>document.body.classList.contains('game-active');
 function ensureContext(){
  if(!context){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return null;context=new AudioContext();master=context.createGain();master.gain.value=sfxVolume;master.connect(context.destination);}
  if(context.state==='suspended')context.resume().catch(()=>{});
  return context;
 }
 function ensureMusic(){
  if(!music){music=new Audio(musicURL);music.loop=true;music.preload='auto';music.volume=musicVolume;music.setAttribute('data-track','The Fight — JuliusH');}
  return music;
 }
 function syncButton(){
  document.querySelectorAll('[data-audio-toggle]').forEach(button=>{
   const active=enabled;
   button.classList.toggle('muted',!active);
   button.setAttribute('aria-pressed',String(active));
   button.setAttribute('aria-label',active?'Desativar sons':'Ativar sons');
   button.title=playingMission()?(active?'Efeitos sonoros ligados':'Efeitos sonoros desligados'):(active?'The Fight · JuliusH — música ligada':'Música desligada');
   button.innerHTML=`<span aria-hidden="true">${active?'🔊':'🔇'}</span><b>${playingMission()?'Sons':'Trilha'}</b>`;
  });
 }
 function playMusic(){
  const track=ensureMusic();
  if(!enabled||playingMission()||document.hidden){track.pause();return;}
  track.volume=musicVolume;
  if(unlocked)track.play().catch(()=>{});
 }
 function stopMusic(){if(music)music.pause();}
 function toggle(){enabled=!enabled;write(ENABLED_KEY,enabled);unlocked=true;if(enabled){ensureContext();playMusic();effect('ui');}else{stopMusic();}syncButton();}
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
  if(name==='death'){tone(260,75,.65,.13,'sawtooth');noise(.45,.06,220,.12);}
 }
 function action(actionName,heroId,card){
  if(actionName==='move')return effect('move');
  if(actionName==='attack')return effect(heroId==='odisseu'?'arrow':'attack');
  if(actionName==='interact')return effect('explore');
  if(actionName==='rest'||actionName==='rescue'||actionName==='share')return effect('recover');
  if(!actionName.startsWith('card:'))return effect('ui');
  const type=card?.type||'';
  if(['ranged','precision','multiRanged'].includes(type))return effect('arrow');
  if(type==='attack')return effect(card?.name?.toLocaleLowerCase('pt-BR').includes('escudo')?'shield':'attack');
  if(['charge','sprint','guide'].includes(type))return effect('move');
  if(['heal','healAlly','refresh'].includes(type))return effect('recover');
  if(['guard','protect'].includes(type))return effect('shield');
  return effect('ability');
 }
 function trojan(step){if(!step)return;const intent=(step.intent||'').toLocaleLowerCase('pt-BR');if(intent.includes('atacar'))effect(['arqueiro','paris'].includes(step.type)?'arrow':'attack');else if(intent.includes('dano ao acampamento'))effect('shield');else effect('march');}
 function mount(){
  const header=document.querySelector('header'),host=header||document.body;if(!host.querySelector('[data-audio-toggle]')){const button=document.createElement('button');button.type='button';button.className='audio-control'+(header?'':' audio-control-floating');button.dataset.audioToggle='';button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();toggle();});const rules=header?.querySelector('#rules-button');header?header.insertBefore(button,rules||null):host.appendChild(button);}
  syncButton();
  const observer=new MutationObserver(()=>{syncButton();playingMission()?stopMusic():playMusic();});observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('pointerdown',()=>{unlocked=true;ensureContext();if(!playingMission())playMusic();},{once:true,capture:true});
  document.addEventListener('click',event=>{if(event.target.closest('button,a')&&!event.target.closest('[data-audio-toggle]'))effect('ui');});
  document.addEventListener('visibilitychange',()=>document.hidden?stopMusic():playMusic());
 }
 window.TroyAudio={effect,action,trojan,playMusic,stopMusic,isEnabled:()=>enabled};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
