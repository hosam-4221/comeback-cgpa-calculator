(() => {
  const STORAGE_KEY = 'cgpa-buddy-v2-empty-start';
  const gradeOptions = [0,1,1.25,1.5,1.75,2,2.25,2.5,2.75,3,3.25,3.5,3.75,4];
  const creditOptions = [0.25,0.5,0.75,1,1.25,1.5,1.75,2,2.5,3,4,5,6];
  const $ = id => document.getElementById(id);
  let courses = loadCourses();
  const n = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const fmt = v => Number(v).toFixed(2);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function loadCourses(){
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (saved && Array.isArray(saved.courses)) { $('overallCgpa') && ($('overallCgpa').value = saved.overallCgpa || ''); $('totalCredits') && ($('totalCredits').value = saved.totalCredits || ''); return saved.courses; } } catch(e) {}
    return [];
  }
  function makeId(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }
  function optionList(values, selected, labels){ return values.map(v=>`<option value="${v}" ${selected!==''&&selected!==null&&selected!==undefined&&Math.abs(n(selected)-v)<0.0001?'selected':''}>${labels && labels[v] ? labels[v] : fmt(v)}</option>`).join(''); }
  function creditSelect(value, id){
    const common = creditOptions.includes(n(value)) ? '' : `<option value="${n(value)}" selected>${fmt(value)} (custom)</option>`;
    return `<select class="credit" data-id="${id}" data-field="credits" aria-label="Credits">${common}${creditOptions.map(v=>`<option value="${v}" ${Math.abs(n(value)-v)<0.0001?'selected':''}>${fmt(v)}</option>`).join('')}<option value="custom">Custom…</option></select>`;
  }
  function gradeSelect(value,id,field){const blank=value===''||value===null||value===undefined;return `<select class="grade" data-id="${id}" data-field="${field}" aria-label="${field==='current'?'Current grade':'Target grade'}">${blank?'<option value="" selected disabled>Choose grade…</option>':''}${optionList(gradeOptions,value)}</select>`;}
  function render(){
    $('courseTable').innerHTML = courses.length ? courses.map(c=>`<tr class="course" data-row="${c.id}"><td><input class="name" data-id="${c.id}" data-field="name" value="${esc(c.name)}" aria-label="Course name" placeholder="Course name"></td><td>${creditSelect(c.credits,c.id)}</td><td>${gradeSelect(c.current,c.id,'current')}</td><td>${gradeSelect(c.target,c.id,'target')}</td><td class="contribution">${hasGrade(c.current)?fmt(n(c.credits)*n(c.current)):'—'}</td><td class="contribution">${hasGrade(c.target)?fmt(n(c.credits)*n(c.target)):'—'}</td><td><button class="remove" data-remove="${c.id}" aria-label="Remove course" title="Remove course">×</button></td></tr>`).join('') : '<tr><td class="empty" colspan="7">No courses yet. Click <strong>＋ Add course</strong> to get started.</td></tr>';
    $('mobileCourses').innerHTML = courses.length ? courses.map(c=>`<div class="course-card" data-row="${c.id}"><div class="card-top"><input data-id="${c.id}" data-field="name" value="${esc(c.name)}" aria-label="Course name" placeholder="Course name"><button class="remove" data-remove="${c.id}" aria-label="Remove course">×</button></div><div class="card-grid"><div><label>Credits</label>${creditSelect(c.credits,c.id)}</div><div><label>Current grade</label>${gradeSelect(c.current,c.id,'current')}</div><div><label>Target grade</label>${gradeSelect(c.target,c.id,'target')}</div><div><label>Weighted points (current → target)</label><div style="padding:9px 0;font-variant-numeric:tabular-nums;font-size:13px">${hasGrade(c.current)?fmt(n(c.credits)*n(c.current)):'—'} → ${hasGrade(c.target)?fmt(n(c.credits)*n(c.target)):'—'}</div></div></div></div>`).join('') : '<div class="empty">No courses yet. Tap <strong>＋ Add course</strong> to get started.</div>';
    calculate();
  }
  function hasGrade(value){return value!==''&&value!==null&&value!==undefined&&Number.isFinite(Number(value));}
  function calculate(){
    const currentCourses=courses.filter(c=>hasGrade(c.current));
    const targetCourses=courses.filter(c=>hasGrade(c.target));
    const currentCredits=currentCourses.reduce((s,c)=>s+n(c.credits),0);
    const targetCredits=targetCourses.reduce((s,c)=>s+n(c.credits),0);
    const curPoints=currentCourses.reduce((s,c)=>s+n(c.credits)*n(c.current),0);
    const targetPoints=targetCourses.reduce((s,c)=>s+n(c.credits)*n(c.target),0);
    const current=currentCredits?curPoints/currentCredits:0;
    const planned=targetCredits?targetPoints/targetCredits:0;
    const comparable=courses.filter(c=>hasGrade(c.current)&&hasGrade(c.target));
    const gain=comparable.reduce((s,c)=>s+n(c.credits)*(n(c.target)-n(c.current)),0);
    const diff=planned-current;
    $('currentGpa').textContent=currentCredits?fmt(current):'—';
    $('plannedGpa').textContent=targetCredits?fmt(planned):'—';
    $('gpaChange').textContent=currentCredits&&targetCredits?(diff>0?'+':'')+fmt(diff):'—';
    $('gpaChange').className='value '+(diff>0.00001?'positive':diff< -0.00001?'negative':'');
    $('plannedGpa').className='value '+(currentCredits&&targetCredits&&planned>current+0.00001?'positive':'');
    $('changeCaption').textContent=currentCredits&&targetCredits?(diff>0.00001?'Improvement':diff< -0.00001?'Decrease':'No change'):'Enter grades to compare';
    const totalCredits=courses.reduce((s,c)=>s+n(c.credits),0);
    $('totalsSummary').textContent=`${courses.length} course${courses.length===1?'':'s'} · ${fmt(totalCredits)} total credits · ${fmt(curPoints)} current / ${fmt(targetPoints)} planned weighted points`;
    const cgpa=n($('overallCgpa').value), counted=n($('totalCredits').value);
    $('qualityGain').textContent=(gain>0?'+':'')+fmt(gain);
    if($('overallCgpa').value!=='' && $('totalCredits').value!=='' && counted>0 && cgpa>=0 && cgpa<=4){
      $('projectedCgpa').textContent=fmt(Math.max(0,Math.min(4,cgpa+gain/counted)));
      $('projectedCgpa').className='value '+(gain>0.00001?'positive':gain< -0.00001?'negative':'');
    } else { $('projectedCgpa').textContent='—'; $('projectedCgpa').className='value'; }
    save();
    // Update weighted points in desktop table when editing without a full redraw.
    courses.forEach(c=>{
      const tr=document.querySelector(`tr[data-row="${c.id}"]`);
      if(tr){const cells=tr.querySelectorAll('.contribution');if(cells[0])cells[0].textContent=hasGrade(c.current)?fmt(n(c.credits)*n(c.current)):'—';if(cells[1])cells[1].textContent=hasGrade(c.target)?fmt(n(c.credits)*n(c.target)):'—';}
    });
  }
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({courses,overallCgpa:$('overallCgpa').value,totalCredits:$('totalCredits').value}));}catch(e){}}
  function updateCourse(id,field,value){
    const c=courses.find(x=>x.id===id);if(!c)return;
    if(field==='name')c.name=value;
    else if(field==='credits')c.credits=n(value);
    else c[field]=n(value);
    if(field==='credits'||field==='current'||field==='target'){ render(); return; }
    calculate();
  }
  function addCourse(){courses.push({id:makeId(),name:'',credits:3,current:'',target:''});render();const fields=document.querySelectorAll(`[data-id="${courses[courses.length-1].id}"][data-field="name"]`);if(fields[0])fields[0].focus();}
  function removeCourse(id){courses=courses.filter(c=>c.id!==id);render();}
  function reset(){if(!confirm('Clear all courses, grades, and CGPA inputs? This cannot be undone.'))return;courses=[];$('overallCgpa').value='';$('totalCredits').value='';render();}
  function exportCsv(){
    const lines=[['Course','Credits','Current Grade Point','Target Grade Point','Current Weighted Points','Target Weighted Points'],...courses.map(c=>[c.name,c.credits,c.current,c.target,n(c.credits)*n(c.current),n(c.credits)*n(c.target)])];
    const csv=lines.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='cgpa-buddy-courses.csv';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  document.addEventListener('input',e=>{const el=e.target;if(el.dataset.id&&el.dataset.field==='name')updateCourse(el.dataset.id,'name',el.value);if(el.id==='overallCgpa'||el.id==='totalCredits')calculate();});
  document.addEventListener('change',e=>{
    const el=e.target;
    if(el.dataset.id&&el.dataset.field){
      if(el.dataset.field==='credits'&&el.value==='custom'){
        const c=courses.find(x=>x.id===el.dataset.id);const next=prompt('Enter course credits (for example 1.5 or 3):',c?c.credits:'3');if(next!==null&&Number(next)>0&&Number(next)<=12)updateCourse(el.dataset.id,'credits',Number(next));else render();
      } else updateCourse(el.dataset.id,el.dataset.field,el.value);
    }
  });
  document.addEventListener('click',e=>{const remove=e.target.closest('[data-remove]');if(remove)removeCourse(remove.dataset.remove);});
  $('addCourse').addEventListener('click',addCourse);$('resetBtn').addEventListener('click',reset);$('exportCsv').addEventListener('click',exportCsv);
  // Restore CGPA inputs after functions and nodes are ready.
  try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(saved){$('overallCgpa').value=saved.overallCgpa||'';$('totalCredits').value=saved.totalCredits||'';}}catch(e){}
  render();
})();
