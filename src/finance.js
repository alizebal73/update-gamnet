const vipPlans=[{key:'silver',label:'Silver',price:1800000,note:'دسترسی VIP پایه'},{key:'gold',label:'Gold',price:2800000,note:'VIP + مزایای بیشتر'},{key:'platinum',label:'Platinum',price:4200000,note:'دسترسی کامل VIP'}],vipDurations=[1,3,6,12];
function openVipDialog(x){
  window._profileResource=x;
  const planKey=x.vipPlanKey|| (x.customer==='Armin'?'gold':x.customer==='Kian'?'silver':'silver');
  const plan=vipPlans.find(a=>a.key===planKey)||vipPlans[0];
  window._selectedVipPlan=plan.key;
  document.getElementById('detail').innerHTML=`<div class="detail" onclick="if(event.target===this)closeDetail()"><div class="account-page vip-modal"><button class="close" onclick="openProfile(window._profileResource)">×</button><div class="eyebrow">VIP Membership</div><h2>اشتراک VIP مشتری</h2><p class="vip-subtitle">${x.customer||'Customer'} • حساب ${(profileFor(x)||[])[1]||'—'}</p><div class="vip-plan-tabs">${vipPlans.map(v=>`<button class="ghost ${v.key===plan.key?'selected':''}" onclick="selectVipPlan('${v.key}')"><strong>${v.label}</strong><small>${v.price.toLocaleString()} تومان / ماه</small></button>`).join('')}</div><div class="tariffGrid"><label>مدت اشتراک<select id="vipMonths" class="operation-select" onchange="updateVipPrice()">${vipDurations.map(m=>`<option value="${m}">${m} ماه</option>`).join('')}</select></label><label>قیمت نهایی<input id="vipPrice" value="${plan.price.toLocaleString()}" readonly></label></div><div class="vip-benefits"><div><span>سطح</span><strong id="vipPlanName">${plan.label}</strong></div><div><span>مدت</span><strong id="vipDurationText">1 ماه</strong></div><div><span>پرداخت حین اشتراک</span><strong>۰ تومان برای Sessionهای مشمول</strong></div></div><div class="detail-alert">مشتری اشتراک را یک‌بار خریداری می‌کند؛ در مدت اعتبار، با یوزر و پسورد خود در Sessionهای مشمول بدون پرداخت روزانه وارد می‌شود. محدوده دسترسی و قوانین مصرف در Production باید توسط Server کنترل شوند.</div><div class="modal-actions"><button class="ghost" onclick="openProfile(window._profileResource)">انصراف</button><button class="primary" onclick="activateVip(window._selectedVipPlan)">خرید و فعال‌سازی</button></div></div></div>`;
}
function selectVipPlan(key){
  const x=vipPlans.find(v=>v.key===key)||vipPlans[0];
  window._selectedVipPlan=x.key;
  document.querySelectorAll('.vip-plan-tabs button').forEach(b=>b.classList.remove('selected'));
  document.querySelectorAll('.vip-plan-tabs button').forEach(b=>{if(b.textContent.trim().startsWith(x.label))b.classList.add('selected')});
  if(document.getElementById('vipPrice'))document.getElementById('vipPrice').value=x.price.toLocaleString();
  if(document.getElementById('vipPlanName'))document.getElementById('vipPlanName').textContent=x.label;
  updateVipPrice();
}
function updateVipPrice(){
  const key=window._selectedVipPlan||'silver',plan=vipPlans.find(v=>v.key===key)||vipPlans[0],months=Number(document.getElementById('vipMonths')?.value||1);
  if(document.getElementById('vipPrice'))document.getElementById('vipPrice').value=(plan.price*months).toLocaleString();
  if(document.getElementById('vipDurationText'))document.getElementById('vipDurationText').textContent=months+' ماه';
}
function activateVip(key){
  const x=window._profileResource,cc=previewCustomers.find(function(v){return v.id===x?.customerId||v.name===x?.customer}),plan=vipPlans.find(v=>v.key===key)||vipPlans[0],months=Math.max(1,Number(document.getElementById('vipMonths')?.value||1)),price=plan.price*months;
  if(!cc){showToast('مشتری برای فعال‌سازی VIP پیدا نشد');return}
  const expiry=new Date(Date.now()+months*30*86400000).toLocaleDateString('fa-IR');
  if(!commitAccountOperation({action:'vip',customerId:cc.id,amount:price,planKey:plan.key,planLabel:plan.label,months:months,expiry:expiry})){return}
  x.vipActive=true;x.vipPlan=plan.label;x.vipPlanKey=plan.key;x.vipExpiry=expiry;x.vipMonths=months;
  showToast('اشتراک '+plan.label+' برای '+months+' ماه ثبت و پرداخت آن در سوابق ذخیره شد');openProfile({id:x.id,customer:x.customer,customerId:cc.id,type:x.type,state:x.state,session:x.session,amount:x.amount});
}
const previewCustomers=[
  {id:'1040',name:'Ali R.',username:'ali.r',phone:'0912***21',balance:120000,debt:0,vip:'Gold',vipActive:true,vipExpiry:'1405/08/27',unit:'PC01',lastVisit:'Today'},
  {id:'1041',name:'Sina M.',username:'sina.m',phone:'0919***14',balance:240000,debt:25000,vip:'—',vipActive:false,vipExpiry:'—',unit:'PC03',lastVisit:'Today'},
  {id:'1042',name:'Reza K.',username:'reza.k',phone:'0935***08',balance:0,debt:0,vip:'—',vipActive:false,vipExpiry:'—',unit:'PC04',lastVisit:'Yesterday'},
  {id:'1043',name:'Armin',username:'armin',phone:'0910***42',balance:580000,debt:0,vip:'Gold',vipActive:true,vipExpiry:'1405/08/27',unit:'PC07',lastVisit:'2 days ago'}
];
const previewStaff=[
  {username:'admin',name:'مالک اصلی',role:'Owner',branch:'Main',permissions:'همه',customerProfile:'Full'},
  {username:'operator1',name:'اپراتور ۱',role:'Operator',branch:'Main',permissions:'جلسه + مشتری',customerProfile:'Wallet + Session'},
  {username:'operator2',name:'اپراتور ۲',role:'Operator',branch:'Main',permissions:'جلسه',customerProfile:'View only'}
];
const previewPermissions=[
 ['dashboard','داشبورد و مشاهده دستگاه‌ها'],['sessions','شروع / توقف / تمدید Session'],['customers.view','مشاهده مشتریان'],['customers.create','ساخت مشتری جدید'],
 ['customers.wallet','شارژ / کسر اعتبار'],['customers.debt','ثبت / پرداخت بدهی'],['customers.discount','اعمال تخفیف'],['customers.vip','خرید / تمدید VIP'],
 ['customers.history','تاریخچه مشتری'],['pcs.control','کنترل PC و قفل / خروج'],['commercial','تعرفه، پکیج و پرومو'],['security','امنیت و Recovery'],
 ['reports','گزارش‌ها'],['settings','تنظیمات سیستم'],['branches','ادمین‌ها و مدیریت دسترسی']
];
const previewCustomerPermissions=[
 ['identity','مشخصات و PIN'],['wallet','اعتبار'],['freeCredit','اعتبار رایگان'],['debt','بدهی و پرداخت بدهی'],['deduct','کسر اعتبار'],
 ['discount','درصد تخفیف'],['vip','اشتراک VIP'],['transfer','انتقال بین دستگاه‌ها'],['history','تاریخچه اعتبار / پرداخت / Session']
];
const previewPricing={normal:{pc:200000,ps:300000,fs:180000},vip:{pc:100000,ps:150000,fs:90000}},tariffRates=previewPricing.normal;
let tariffType='pc',selectedTariffClass='normal';
let previewOperations=[];
const deviceTariffClass={},previewPayments=[{id:'PAY-1001',customerId:'1040',customer:'Ali R.',amount:120000,type:'نقدی',time:'12:04',note:'شارژ اعتبار'},{id:'PAY-1002',customerId:'1043',customer:'Armin',amount:300000,type:'کارت',time:'11:46',note:'شارژ + هدیه'},{id:'PAY-1003',customerId:'1041',customer:'Sina M.',amount:25000,type:'نقدی',time:'11:32',note:'پرداخت بدهی'}],previewGames=[{id:'G01',name:'Counter-Strike 2',category:'Steam',active:true},{id:'G02',name:'Valorant',category:'Riot',active:true},{id:'G03',name:'EA FC 26',category:'EA',active:true},{id:'G04',name:'Call of Duty',category:'Battle.net',active:true}],previewAppState={version:'0.9.8-preview',license:'DEMO-LOCAL',lastBackup:null};
previewCustomers.forEach(function(c){if(typeof c.freeCredit!=='number')c.freeCredit=0;if(typeof c.maxConcurrent!=='number')c.maxConcurrent=1;if(c.sharedTimePool===undefined)c.sharedTimePool=true;if(!Array.isArray(c.activeSessions))c.activeSessions=[];});
[...pcs,...ps,...fs].forEach(function(d){if(!deviceTariffClass[d.id])deviceTariffClass[d.id]=(d.id==='PC07'||d.id==='PC08'||d.id==='PS01')?'vip':'normal';});
previewStaff.forEach(function(x){if(!Array.isArray(x.permissions)){if(x.role==='Owner'||x.permissions==='همه')x.permissions=previewPermissions.map(function(p){return p[0]});else if(x.permissions==='جلسه + مشتری')x.permissions=['sessions','customers.view','customers.wallet'];else x.permissions=['sessions']}if(!Array.isArray(x.customerPermissions)){if(x.customerProfile==='Full')x.customerPermissions=previewCustomerPermissions.map(function(p){return p[0]});else if(x.customerProfile==='Wallet + Session')x.customerPermissions=['wallet','freeCredit','debt','deduct','history','transfer'];else x.customerPermissions=['identity']}});
const GAMENET_STATE_KEY='gamenet_preview_state_v2';
const GAMENET_JOURNAL_KEY='gamenet_financial_journal_v1';
let _persistTick=0,_appliedOperationIds=[];
function serializableAppState(){
  return {schema:4,version:previewAppState.version,savedAt:Date.now(),license:previewAppState.license,lastBackup:previewAppState.lastBackup,appliedOperationIds:_appliedOperationIds.slice(-300),customers:previewCustomers,pcs:pcs,ps:ps,fs:fs,pricing:previewPricing,devices:deviceTariffClass,payments:previewPayments,operations:previewOperations,games:previewGames,staff:previewStaff,hotkeys:getGameNetHotkeys()};
}
function persistAppState(reason){
  try{localStorage.setItem(GAMENET_STATE_KEY,JSON.stringify(serializableAppState()));window._lastPersistReason=reason||'auto';return true}
  catch(e){showToast('ذخیره پایدار انجام نشد؛ عملیات متوقف شد');return false}
}
function getOperationJournal(){try{return JSON.parse(localStorage.getItem(GAMENET_JOURNAL_KEY)||'[]')}catch(e){return []}}
function writeOperationJournal(items){localStorage.setItem(GAMENET_JOURNAL_KEY,JSON.stringify(items))}
function appendOperationJournal(op){
  const j=getOperationJournal();if(j.some(function(x){return x.id===op.id}))return true;
  j.push(op);writeOperationJournal(j);return true;
}
function markOperationApplied(id){
  if(!_appliedOperationIds.includes(id))_appliedOperationIds.push(id);
  _appliedOperationIds=_appliedOperationIds.slice(-300);
}
function compactOperationJournal(){
  const applied=new Set(_appliedOperationIds),j=getOperationJournal(),left=j.filter(function(op){return !applied.has(op.id)});
  if(left.length!==j.length)writeOperationJournal(left);
}
function applyAccountOperation(op,recordPayment){
  const cc=previewCustomers.find(function(v){return v.id===op.customerId});if(!cc)return false;
  const amount=Math.max(0,Number(op.amount||0));
  if(op.action==='charge'){cc.balance=Number(cc.balance||0)+amount;if(recordPayment!==false)addPayment(cc,amount,'نقدی','شارژ اعتبار')}
  else if(op.action==='free'){cc.freeCredit=Number(cc.freeCredit||0)+amount}
  else if(op.action==='debt'){cc.debt=Number(cc.debt||0)+amount}
  else if(op.action==='pay-debt'){const pay=Math.min(amount,Number(cc.debt||0));cc.debt=Math.max(0,Number(cc.debt||0)-pay);if(pay&&recordPayment!==false)addPayment(cc,pay,'نقدی','پرداخت بدهی')}
  else if(op.action==='deduct'){let rem=amount,a=Math.min(Number(cc.balance||0),rem);cc.balance-=a;rem-=a;const f=Math.min(Number(cc.freeCredit||0),rem);cc.freeCredit-=f;rem-=f;if(rem>0)cc.debt=Number(cc.debt||0)+rem}
  else if(op.action==='discount'){const base=Math.max(0,Number(op.base||0)),bonus=Math.max(0,Number(op.bonus||0));cc.balance=Number(cc.balance||0)+base;cc.freeCredit=Number(cc.freeCredit||0)+bonus;if(recordPayment!==false)addPayment(cc,base,'نقدی / کارت','پرداخت + '+Number(op.percent||0)+'٪ هدیه')}
  else if(op.action==='vip'){const price=Math.max(0,Number(op.amount||0));cc.vipActive=true;cc.vipPlan=op.planLabel||'VIP';cc.vipPlanKey=op.planKey||'silver';cc.vipMonths=Number(op.months||1);cc.vipExpiry=op.expiry||new Date(Date.now()+cc.vipMonths*30*86400000).toLocaleDateString('fa-IR');if(recordPayment!==false)addPayment(cc,price,'نقدی','خرید '+cc.vipPlan+' • '+cc.vipMonths+' ماه')}
  else return false;
  return true;
}
function commitAccountOperation(op){
  op.id=op.id||('OP-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));
  op.ts=op.ts||Date.now();
  appendOperationJournal(op);
  if(!applyAccountOperation(op,true)){showToast('عملیات حساب ثبت نشد');return false}
  markOperationApplied(op.id);
  recordCustomerEvent({sourceOperationId:op.id,customerId:op.customerId,type:'financial',action:op.action,label:operationLabel(op.action),amount:op.amount||op.base||0,bonus:op.bonus||0,percent:op.percent||0,method:op.method||'نقدی',meta:op});
  if(!persistAppState('account:'+op.action)){return false}
  compactOperationJournal();
  return true;
}
function replayUnappliedOperations(){
  const j=getOperationJournal(),applied=new Set(_appliedOperationIds),remaining=[];
  j.forEach(function(op){
    if(applied.has(op.id))return;
    if(applyAccountOperation(op,true)){markOperationApplied(op.id);recordCustomerEvent({sourceOperationId:op.id,customerId:op.customerId,type:'financial',action:op.action,label:operationLabel(op.action),amount:op.amount||op.base||0,bonus:op.bonus||0,percent:op.percent||0,method:op.method||'نقدی',meta:op})}else remaining.push(op);
  });
  if(j.length)persistAppState('journal-replay');
  const latest=getOperationJournal(),left=latest.filter(function(op){return !_appliedOperationIds.includes(op.id)});
  if(left.length!==latest.length)writeOperationJournal(left);
  return left.length===0;
}
function consumeElapsedUsage(seconds){const elapsed=Math.max(0,Number(seconds||0));if(!elapsed)return;previewCustomers.forEach(function(cc){const u=calculateSharedUsage(cc);if(!u.active.length||!u.totalRate)return;let rem=u.totalRate*elapsed/3600;const free=Math.min(Number(cc.freeCredit||0),rem);cc.freeCredit=Math.max(0,Number(cc.freeCredit||0)-free);rem-=free;if(rem>0)cc.balance=Math.max(0,Number(cc.balance||0)-rem);const after=calculateSharedUsage(cc);const expired=[];cc.activeSessions.forEach(function(s){const d=getDeviceById(s.deviceId);if(d){d.remainingSeconds=after.remainingSeconds;d.remaining=formatSharedTime(after.remainingSeconds);d.timerLabel=after.remainingSeconds<=0?'00:00':Math.ceil(after.remainingSeconds/60)+' min';d.timeWarning=after.remainingSeconds<=600&&after.remainingSeconds>0;d.timeUp=after.remainingSeconds<=0;d.notice=d.timeUp?'TIME UP':d.timeWarning?'Ending soon':'Running';if(d.timeUp&&!s.paused)expired.push(s)}});expired.forEach(function(s){recordCustomerEvent({customerId:cc.id,type:'session-expired',label:'پایان زمان Session بعد از بازیابی',deviceId:s.deviceId});removeCustomerSession(cc.id,s.deviceId)})})}
function hydratePersistentState(){
  try{
    const raw=localStorage.getItem(GAMENET_STATE_KEY);if(!raw)return false;
    const obj=JSON.parse(raw);if(!obj||(![2,3,4].includes(obj.schema)))return false;
    if(Array.isArray(obj.appliedOperationIds))_appliedOperationIds=obj.appliedOperationIds.slice(-300);
    if(Array.isArray(obj.customers))previewCustomers.splice(0,previewCustomers.length,...obj.customers);
    if(Array.isArray(obj.pcs))pcs.splice(0,pcs.length,...obj.pcs);
    if(Array.isArray(obj.ps))ps.splice(0,ps.length,...obj.ps);
    if(Array.isArray(obj.fs))fs.splice(0,fs.length,...obj.fs);
    if(obj.pricing){Object.assign(previewPricing.normal,obj.pricing.normal||{});Object.assign(previewPricing.vip,obj.pricing.vip||{})}
    if(obj.devices){Object.keys(deviceTariffClass).forEach(function(k){delete deviceTariffClass[k]});Object.assign(deviceTariffClass,obj.devices)}
    if(Array.isArray(obj.payments))previewPayments.splice(0,previewPayments.length,...obj.payments);
    if(Array.isArray(obj.operations))previewOperations.splice(0,previewOperations.length,...obj.operations);
    if(Array.isArray(obj.games))previewGames.splice(0,previewGames.length,...obj.games);
    if(Array.isArray(obj.staff))previewStaff.splice(0,previewStaff.length,...obj.staff);
    if(obj.hotkeys)saveGameNetHotkeys(obj.hotkeys);
    if(obj.license)previewAppState.license=obj.license;
    if(obj.lastBackup)previewAppState.lastBackup=obj.lastBackup;
    previewCustomers.forEach(function(cc){if(typeof cc.freeCredit!=='number')cc.freeCredit=0;if(typeof cc.maxConcurrent!=='number')cc.maxConcurrent=1;if(!Array.isArray(cc.activeSessions))cc.activeSessions=[]});
    replayUnappliedOperations();
    const elapsed=Math.min(Math.max(0,Math.floor((Date.now()-Number(obj.savedAt||Date.now()))/1000)),2592000);
    if(elapsed)consumeElapsedUsage(elapsed);
    persistAppState('hydrate');
    return true
  }catch(e){showToast('اطلاعات ذخیره‌شده خوانده نشد');return false}
}
window.addEventListener('beforeunload',function(){persistAppState('beforeunload')});
function getDeviceById(id){return [...pcs,...ps,...fs].find(function(d){return d.id===id})||null}
function getDeviceTariff(id){return deviceTariffClass[id]||'normal'}
function getDeviceRate(id){const d=getDeviceById(id),cls=getDeviceTariff(id);return Number(previewPricing[cls]?.[d?.type]||previewPricing.normal[d?.type]||0)}
function formatSharedTime(sec){const s=Math.max(0,Math.floor(Number(sec||0))),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),x=s%60;return h?h+':'+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0'):String(m).padStart(2,'0')+':'+String(x).padStart(2,'0')}
function calculateSharedUsage(c){const active=(c?.activeSessions||[]).filter(function(s){return getDeviceById(s.deviceId)&&!s.paused}),totalRate=active.reduce(function(sum,s){return sum+getDeviceRate(s.deviceId)},0),available=Math.max(0,Number(c?.balance||0)+Number(c?.freeCredit||0));return {active:active,totalRate:totalRate,available:available,remainingSeconds:totalRate?Math.floor(available/totalRate*3600):0}}
function getCustomerEffectiveRate(x){const cc=previewCustomers.find(function(v){return v.id===x?.customerId||v.name===x?.customer||v.id===x?.customer});if(cc){const u=calculateSharedUsage(cc);if(u.active.length&&u.totalRate)return u.totalRate}const d=x?.id?getDeviceById(x.id):null;return d?getDeviceRate(d.id):previewPricing.normal[x?.type||'pc']}
function getSharedTimeSummary(x){const cc=previewCustomers.find(function(v){return v.id===x?.customerId||v.name===x?.customer||v.id===x?.customer});if(!cc)return 'بدون مشتری';const u=calculateSharedUsage(cc);if(!u.active.length)return 'بدون Session فعال';return u.active.map(function(s){return s.deviceId+' ('+(getDeviceTariff(s.deviceId)==='vip'?'VIP':'عادی')+' '+getDeviceRate(s.deviceId).toLocaleString()+' تومان/ساعت)'}).join(' + ')+' • جمع نرخ '+u.totalRate.toLocaleString()+' تومان/ساعت • زمان مشترک '+formatSharedTime(u.remainingSeconds)}
function addPayment(customer,amount,type,note){previewPayments.unshift({id:'PAY-'+Date.now().toString().slice(-6),customerId:customer?.id||'—',customer:customer?.name||'—',amount:Number(amount||0),type:type||'نقدی',time:new Date().toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'}),note:note||'افزایش اعتبار'})}
function consumeSharedWallets(){previewCustomers.forEach(function(cc){const u=calculateSharedUsage(cc);if(!u.active.length||!u.totalRate)return;const cost=u.totalRate/3600;let rem=cost,free=Math.min(Number(cc.freeCredit||0),rem);cc.freeCredit=Math.max(0,Number(cc.freeCredit||0)-free);rem-=free;if(rem>0)cc.balance=Math.max(0,Number(cc.balance||0)-rem);const after=calculateSharedUsage(cc);const expired=[];cc.activeSessions.forEach(function(s){const d=getDeviceById(s.deviceId);if(d){d.remainingSeconds=after.remainingSeconds;d.remaining=formatSharedTime(after.remainingSeconds);d.timerLabel=after.remainingSeconds<=0?'00:00':Math.ceil(after.remainingSeconds/60)+' min';d.timeWarning=after.remainingSeconds<=600&&after.remainingSeconds>0;d.timeUp=after.remainingSeconds<=0;d.notice=s.paused?'Paused':(d.timeUp?'TIME UP':d.timeWarning?'Ending soon':'Running');if(d.timeUp&&!s.paused){expired.push(s);d.state='Time Up'}}});expired.forEach(function(s){const d=getDeviceById(s.deviceId);recordCustomerEvent({customerId:cc.id,type:'session-expired',label:'پایان زمان Session',deviceId:s.deviceId});removeCustomerSession(cc.id,s.deviceId);if(d)d.state=d.type==='pc'?'Idle':'Ready'});if(expired.length)persistAppState('session-expired')})}
function removeCustomerSession(customerId,deviceId){const cc=previewCustomers.find(function(v){return v.id===customerId});if(!cc)return;cc.activeSessions=(cc.activeSessions||[]).filter(function(s){return s.deviceId!==deviceId});const d=getDeviceById(deviceId);if(d){d.customer='';d.state=d.type==='pc'?'Idle':'Ready';d.locked=false;d.session=d.type==='pc'?'—':d.type==='ps'?'PS5':'Table';d.remaining='—';d.remainingSeconds=0;d.timeWarning=false;d.timeUp=false;d.notice='Ready'}}
function startPreviewSession(customerId,deviceId){const cc=previewCustomers.find(function(v){return v.id===customerId}),d=getDeviceById(deviceId);if(!cc||!d)return false;if(d.locked){showToast('این دستگاه قفل است');return false}if(cc.activeSessions.some(function(s){return s.deviceId===deviceId}) )return true;const occupied=previewCustomers.find(function(v){return v.activeSessions.some(function(s){return s.deviceId===deviceId})});if(occupied&&occupied.id!==cc.id){showToast('این دستگاه در اختیار '+occupied.name+' است');return false}if(cc.activeSessions.length>=Number(cc.maxConcurrent||1)){showToast('سقف ورود همزمان پر است');return false}if(Number(cc.balance||0)+Number(cc.freeCredit||0)<=0){showToast('موجودی و اعتبار رایگان مشتری صفر است');return false}cc.activeSessions.push({deviceId:deviceId,startedAt:new Date().toISOString(),paused:false,locked:false});recordCustomerEvent({customerId:cc.id,type:'session-start',label:'شروع Session',deviceId:deviceId});d.customer=cc.name;d.locked=false;d.state=d.type==='pc'?'Active':'In Use';d.session=d.type==='pc'?'Session':d.type==='ps'?'PS5 • Session':'Table • Session';d.client=d.type==='pc'?'Running':'N/A';d.security=d.type==='pc'?'Normal':'N/A';const u=calculateSharedUsage(cc);d.remainingSeconds=u.remainingSeconds;d.remaining=formatSharedTime(u.remainingSeconds);d.timerLabel=Math.ceil(u.remainingSeconds/60)+' min';d.notice='Running';persistAppState('session-start');return true}
function savePricingConfig(){['normal','vip'].forEach(function(cls){['pc','ps','fs'].forEach(function(type){const el=document.getElementById('rate_'+cls+'_'+type);if(el)previewPricing[cls][type]=Math.max(0,Number(el.value||0))})});showToast('تعرفه‌ها ذخیره شدند');persistAppState('pricing');openSettings()}
