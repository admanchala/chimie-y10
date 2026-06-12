/* ===== Chimie/Chemistry Year 10 — shared engine (i18n, storage, objectives, quizzes, progress) ===== */
const LANG=document.documentElement.lang==='en'?'en':'fr';
const I18N={
 fr:{objProg:n=>n.done+' / '+n.total+' objectifs cochés'+(n.done===n.total?' — chapitre couvert ! ✅':''),
   score:'Score :',best:' · Meilleur score enregistré : ',
   perfect:'🏆 Parfait ! Chapitre maîtrisé !',gold:'🥇 Excellent — badge obtenu !',
   mid:'💪 Bien joué — relis les points manqués et retente !',low:'📖 Revois la théorie ci-dessus, puis retente le quiz.',
   again:'↺ Recommencer',
   chap:{kin:'Cinétique',redox:'Redox',acid:'Acides & bases'},
   dObj:'🎯 Objectifs',dQuiz:'⚡ Quiz éclair',dMast:'📝 Questions maîtrisées',open:'Ouvrir le chapitre →',
   bGold:'🥇 Maîtrisé',bSilver:'🥈 En bonne voie',bStart:'🌱 À explorer',
   diagLow:'Commence par le <a href="kinetics.html"><strong>chapitre 1 · Cinétique</strong></a>, puis avance dans l\'ordre des chapitres.',
   diagMid:'Bonne base ! Révise en priorité ton chapitre le plus fragile :',
   diagHigh:'Excellent niveau ! Passe directement aux <a href="revision.html?lv=3"><strong>questions Niveau 3</strong></a> et aux questions type examen de la page Révision.',
   diagSub:c=>'Sous-scores — Cinétique : '+c.kin+', Redox : '+c.redox+', Acides & bases : '+c.acid},
 en:{objProg:n=>n.done+' / '+n.total+' objectives ticked'+(n.done===n.total?' — chapter covered! ✅':''),
   score:'Score:',best:' · Best saved score: ',
   perfect:'🏆 Perfect! Chapter mastered!',gold:'🥇 Excellent — badge earned!',
   mid:'💪 Well done — review the points you missed and try again!',low:'📖 Review the theory above, then retake the quiz.',
   again:'↺ Try again',
   chap:{kin:'Kinetics',redox:'Redox',acid:'Acids & bases'},
   dObj:'🎯 Objectives',dQuiz:'⚡ Quick quiz',dMast:'📝 Questions mastered',open:'Open chapter →',
   bGold:'🥇 Mastered',bSilver:'🥈 Well on the way',bStart:'🌱 To explore',
   diagLow:'Start with <a href="kinetics.html"><strong>Chapter 1 · Kinetics</strong></a>, then work through the chapters in order.',
   diagMid:'Good foundation! Prioritise your weakest chapter:',
   diagHigh:'Excellent level! Go straight to the <a href="revision.html?lv=3"><strong>Level 3 questions</strong></a> and the exam-style questions on the Revision page.',
   diagSub:c=>'Sub-scores — Kinetics: '+c.kin+', Redox: '+c.redox+', Acids & bases: '+c.acid}
};
const T=I18N[LANG];
const Store={
  read(){try{return JSON.parse(localStorage.getItem('y10sci')||'{}')}catch(e){return {}}},
  write(d){try{localStorage.setItem('y10sci',JSON.stringify(d))}catch(e){}},
  get(k,def){const d=this.read();return (k in d)?d[k]:def},
  set(k,v){const d=this.read();d[k]=v;this.write(d)}
};
const CH={kin:{color:'var(--kin)',page:'kinetics.html',nObj:6,nQuiz:6},
          redox:{color:'var(--redox)',page:'redox.html',nObj:6,nQuiz:6},
          acid:{color:'var(--acid)',page:'acids.html',nObj:6,nQuiz:6}};

/* ----- learning objectives (persisted, shared across languages) ----- */
function bindObjectives(){
  document.querySelectorAll('.obj-card').forEach(card=>{
    const ch=card.dataset.chapter,key='obj_'+ch;
    const boxes=[...card.querySelectorAll('input[type=checkbox]')];
    const saved=Store.get(key,[]);
    boxes.forEach((b,i)=>{b.checked=!!saved[i];
      b.addEventListener('change',()=>{Store.set(key,boxes.map(x=>x.checked));upd();});});
    const prog=card.querySelector('.obj-progress');
    function upd(){if(prog)prog.textContent=T.objProg({done:boxes.filter(b=>b.checked).length,total:boxes.length});}
    upd();
  });
}

/* ----- quick quiz engine ----- */
function renderQuiz(el,chKey,items){
  const best=Store.get('quiz_'+chKey,null);
  let score=0,answered=0;
  el.innerHTML='';
  const live=document.createElement('div');live.className='quiz-score-live';
  live.textContent=T.score+' 0 / '+items.length+(best!==null?T.best+best+' / '+items.length:'');
  el.appendChild(live);
  items.forEach((it,qi)=>{
    const card=document.createElement('div');card.className='quiz-q';
    card.innerHTML='<div class="qq"><span class="qn">'+(qi+1)+'</span><span>'+it.q+'</span></div>';
    it.o.forEach((opt,oi)=>{
      const b=document.createElement('button');b.className='opt';b.innerHTML=opt;
      b.addEventListener('click',()=>{
        answered++;
        [...card.querySelectorAll('.opt')].forEach((x,xi)=>{x.disabled=true;
          if(xi===it.c)x.classList.add('correct');
          else if(xi===oi)x.classList.add('wrong');
          else x.classList.add('dim');});
        if(oi===it.c)score++;
        live.textContent=T.score+' '+score+' / '+items.length;
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
    const msg=pct>=0.8?(score===items.length?T.perfect:T.gold):pct>=0.5?T.mid:T.low;
    ban.innerHTML='<span class="big">'+score+' / '+items.length+'</span><span>'+msg+'</span>';
    const again=document.createElement('button');again.className='btn';again.textContent=T.again;
    again.addEventListener('click',()=>renderQuiz(el,chKey,items));
    ban.appendChild(again);el.appendChild(ban);
    ban.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
}

/* ----- diagnostic test (home page) — items tagged with .ch ----- */
function renderDiag(el,items){
  let score=0,answered=0;const sub={kin:[0,0],redox:[0,0],acid:[0,0]};
  el.innerHTML='';
  const live=document.createElement('div');live.className='quiz-score-live';
  live.textContent=T.score+' 0 / '+items.length;
  el.appendChild(live);
  items.forEach((it,qi)=>{
    sub[it.ch][1]++;
    const card=document.createElement('div');card.className='quiz-q';
    card.innerHTML='<div class="qq"><span class="qn" style="background:'+CH[it.ch].color+'">'+(qi+1)+'</span><span>'+it.q+'</span></div>';
    it.o.forEach((opt,oi)=>{
      const b=document.createElement('button');b.className='opt';b.innerHTML=opt;
      b.addEventListener('click',()=>{
        answered++;
        [...card.querySelectorAll('.opt')].forEach((x,xi)=>{x.disabled=true;
          if(xi===it.c)x.classList.add('correct');
          else if(xi===oi)x.classList.add('wrong');
          else x.classList.add('dim');});
        if(oi===it.c){score++;sub[it.ch][0]++;}
        live.textContent=T.score+' '+score+' / '+items.length;
        if(answered===items.length)finish();
      });
      card.appendChild(b);
    });
    el.appendChild(card);
  });
  function finish(){
    Store.set('diag',score);
    const ban=document.createElement('div');
    ban.className='quiz-banner '+(score>=8?'gold':'mid');
    let advice;
    if(score<=3)advice=T.diagLow;
    else if(score<=7){
      let weakest='kin',wr=2;
      for(const c of ['kin','redox','acid']){const r=sub[c][1]?sub[c][0]/sub[c][1]:1;if(r<wr){wr=r;weakest=c;}}
      advice=T.diagMid+' <a href="'+CH[weakest].page+'"><strong>'+T.chap[weakest]+'</strong></a>.';
    }else advice=T.diagHigh;
    const subs={kin:sub.kin[0]+'/'+sub.kin[1],redox:sub.redox[0]+'/'+sub.redox[1],acid:sub.acid[0]+'/'+sub.acid[1]};
    ban.innerHTML='<span class="big">'+score+' / '+items.length+'</span><span>'+advice+
      '<br><span style="font-family:var(--font-mono);font-size:12.5px;color:var(--ink-soft)">'+T.diagSub(subs)+'</span></span>';
    const again=document.createElement('button');again.className='btn';again.textContent=T.again;
    again.addEventListener('click',()=>{renderDiag(el,items);el.scrollIntoView({behavior:'smooth'});});
    ban.appendChild(again);el.appendChild(ban);
    ban.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
}

/* ----- chapter progress & dashboard ----- */
function chapterStats(ch){
  const obj=Store.get('obj_'+ch,[]).filter(Boolean).length;
  const quiz=Store.get('quiz_'+ch,0)||0;
  const mast=(Store.get('mastered',[])).filter(id=>id.startsWith(ch+'-')).length;
  const pct=Math.round(100*(obj/CH[ch].nObj+quiz/CH[ch].nQuiz+mast/10)/3);
  return {obj,quiz,mast,pct};
}
function badgeFor(pct){
  if(pct>=80)return '<span class="badge gold">'+T.bGold+'</span>';
  if(pct>=50)return '<span class="badge silver">'+T.bSilver+'</span>';
  return '<span class="badge start">'+T.bStart+'</span>';
}
function renderDash(elId){
  const el=document.getElementById(elId);if(!el)return;
  el.innerHTML=Object.keys(CH).map(ch=>{
    const s=chapterStats(ch),c=CH[ch];
    return '<div class="dash-card" style="--dc:'+c.color+'">'+
      '<h4>'+T.chap[ch]+'</h4><div class="pct">'+s.pct+'%</div>'+
      '<div class="mini-track"><div class="mini-fill" style="width:'+s.pct+'%"></div></div>'+
      '<div class="detail">'+T.dObj+' : '+s.obj+'/'+c.nObj+'<br>'+T.dQuiz+' : '+s.quiz+'/'+c.nQuiz+'<br>'+T.dMast+' : '+s.mast+'/10</div>'+
      badgeFor(s.pct)+'<div style="margin-top:12px"><a href="'+c.page+'">'+T.open+'</a></div></div>';
  }).join('');
}
document.addEventListener('DOMContentLoaded',()=>{bindObjectives();renderDash('dash');});
