/* ===== Sciences Année 10 — shared engine (storage, objectives, quiz, progress) ===== */
const Store={
  read(){try{return JSON.parse(localStorage.getItem('y10sci')||'{}')}catch(e){return {}}},
  write(d){try{localStorage.setItem('y10sci',JSON.stringify(d))}catch(e){}},
  get(k,def){const d=this.read();return (k in d)?d[k]:def},
  set(k,v){const d=this.read();d[k]=v;this.write(d)}
};
const CH={kin:{name:'Cinétique',color:'var(--kin)',page:'kinetics.html',nObj:6,nQuiz:6},
          redox:{name:'Redox',color:'var(--redox)',page:'redox.html',nObj:6,nQuiz:6},
          acid:{name:'Acides & bases',color:'var(--acid)',page:'acids.html',nObj:6,nQuiz:6}};

/* ----- learning objectives (persisted) ----- */
function bindObjectives(){
  document.querySelectorAll('.obj-card').forEach(card=>{
    const ch=card.dataset.chapter,key='obj_'+ch;
    const boxes=[...card.querySelectorAll('input[type=checkbox]')];
    const saved=Store.get(key,[]);
    boxes.forEach((b,i)=>{b.checked=!!saved[i];
      b.addEventListener('change',()=>{
        Store.set(key,boxes.map(x=>x.checked));upd();
      });});
    const prog=card.querySelector('.obj-progress');
    function upd(){const n=boxes.filter(b=>b.checked).length;
      if(prog)prog.textContent=n+' / '+boxes.length+' objectifs cochés'+(n===boxes.length?' — chapitre couvert ! ✅':'');}
    upd();
  });
}

/* ----- quiz engine (immediate feedback, best score persisted) ----- */
function renderQuiz(el,chKey,items){
  const best=Store.get('quiz_'+chKey,null);
  let score=0,answered=0;
  el.innerHTML='';
  const live=document.createElement('div');live.className='quiz-score-live';
  live.textContent='Score : 0 / '+items.length+(best!==null?' · Meilleur score enregistré : '+best+' / '+items.length:'');
  el.appendChild(live);
  items.forEach((it,qi)=>{
    const card=document.createElement('div');card.className='quiz-q';
    card.innerHTML='<div class="qq"><span class="qn">'+(qi+1)+'</span><span>'+it.q+'</span></div>';
    it.o.forEach((opt,oi)=>{
      const b=document.createElement('button');b.className='opt';b.innerHTML=opt;
      b.addEventListener('click',()=>{
        answered++;
        [...card.querySelectorAll('.opt')].forEach((x,xi)=>{
          x.disabled=true;
          if(xi===it.c)x.classList.add('correct');
          else if(xi===oi)x.classList.add('wrong');
          else x.classList.add('dim');
        });
        if(oi===it.c)score++;
        live.textContent='Score : '+score+' / '+items.length;
        if(answered===items.length)finish();
      });
      card.appendChild(b);
    });
    el.appendChild(card);
  });
  function finish(){
    const prevBest=Store.get('quiz_'+chKey,0)||0;
    if(score>prevBest)Store.set('quiz_'+chKey,score);
    const pct=score/items.length;
    const ban=document.createElement('div');
    ban.className='quiz-banner '+(pct>=0.8?'gold':'mid');
    const msg=pct>=0.8?(score===items.length?'🏆 Parfait ! Chapitre maîtrisé !':'🥇 Excellent — badge obtenu !')
             :pct>=0.5?'💪 Bien joué — relis les points manqués et retente !'
             :'📖 Revois la théorie ci-dessus, puis retente le quiz.';
    ban.innerHTML='<span class="big">'+score+' / '+items.length+'</span><span>'+msg+'</span>';
    const again=document.createElement('button');again.className='btn';again.textContent='↺ Recommencer';
    again.addEventListener('click',()=>renderQuiz(el,chKey,items));
    ban.appendChild(again);
    el.appendChild(ban);
    ban.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
}

/* ----- chapter progress = mean(objectives, best quiz, mastered questions) ----- */
function chapterStats(ch){
  const obj=Store.get('obj_'+ch,[]).filter(Boolean).length;
  const quiz=Store.get('quiz_'+ch,0)||0;
  const mast=(Store.get('mastered',[])).filter(id=>id.startsWith(ch+'-')).length;
  const pct=Math.round(100*(obj/CH[ch].nObj + quiz/CH[ch].nQuiz + mast/10)/3);
  return {obj,quiz,mast,pct};
}
function badgeFor(pct){
  if(pct>=80)return '<span class="badge gold">🥇 Maîtrisé</span>';
  if(pct>=50)return '<span class="badge silver">🥈 En bonne voie</span>';
  return '<span class="badge start">🌱 À explorer</span>';
}
function renderDash(elId){
  const el=document.getElementById(elId);if(!el)return;
  el.innerHTML=Object.keys(CH).map(ch=>{
    const s=chapterStats(ch),c=CH[ch];
    return '<div class="dash-card" style="--dc:'+c.color+'">'+
      '<h4>'+c.name+'</h4><div class="pct">'+s.pct+'%</div>'+
      '<div class="mini-track"><div class="mini-fill" style="width:'+s.pct+'%"></div></div>'+
      '<div class="detail">🎯 Objectifs : '+s.obj+'/'+c.nObj+'<br>⚡ Quiz éclair : '+s.quiz+'/'+c.nQuiz+'<br>📝 Questions maîtrisées : '+s.mast+'/10</div>'+
      badgeFor(s.pct)+'<div style="margin-top:12px"><a href="'+c.page+'">Ouvrir le chapitre →</a></div></div>';
  }).join('');
}
document.addEventListener('DOMContentLoaded',()=>{bindObjectives();renderDash('dash');});
