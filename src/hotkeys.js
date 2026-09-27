function toolbarModal(title,body,width){document.getElementById("detail").innerHTML='<div class="detail" onclick="if(event.target===this)toolbarClose()"><div class="modal" role="dialog" aria-modal="true" style="width:'+Math.min(width||520,Math.max(390,window.innerWidth-30))+'px"><button class="close" aria-label="بستن" onclick="toolbarClose()">×</button><div class="eyebrow">Operator tool</div><h2>'+title+'</h2>'+body+'</div></div>';setTimeout(decorateDialog,0)}
function toolbarClose(){closeDetail()}

const defaultGameNetHotkeys={openCustomer:'F1',chargeCustomer:'F4',deductCustomer:'F6',debtCustomer:'F5',freeCustomer:'F8',payDebtCustomer:'F9',discountCustomer:'F10',vipCustomer:'F11',confirmAction:'Enter'};
const gameNetHotkeyLabels={openCustomer:'جستجوی مشتری',chargeCustomer:'شارژ اعتبار',deductCustomer:'کسر اعتبار',debtCustomer:'ثبت بدهی',freeCustomer:'اعتبار رایگان',payDebtCustomer:'پرداخت بدهی',discountCustomer:'پرداخت + هدیه زمانی',vipCustomer:'خرید / تمدید VIP',confirmAction:'ثبت / تأیید عملیات'};
const gameNetHotkeyOrder=['openCustomer','chargeCustomer','deductCustomer','debtCustomer','freeCustomer','payDebtCustomer','discountCustomer','vipCustomer','confirmAction'];
function getGameNetHotkeys(){try{return Object.assign({},defaultGameNetHotkeys,JSON.parse(localStorage.getItem('gamenet_hotkeys')||'{}'))}catch(e){return Object.assign({},defaultGameNetHotkeys)}}
function saveGameNetHotkeys(next){localStorage.setItem('gamenet_hotkeys',JSON.stringify(next));if(typeof persistAppState==='function')persistAppState('hotkeys')}
function toolbarMoney(n){return Number(n||0).toLocaleString('fa-IR')+' تومان'}
function hotkeyResourceFromCustomer(c){return {id:c.unit&&c.unit!=='—'?c.unit:'CUSTOMER'+c.id,type:'pc',state:c.unit&&c.unit!=='—'?'Active':'Idle',customer:c.name,customerId:c.id,session:c.unit&&c.unit!=='—'?'Session':'—',remaining:'—',amount:toolbarMoney(c.balance||0),remainingValue:0,freeCredit:Number(c.freeCredit||0),debt:Number(c.debt||0)}}
function findPreviewCustomer(query){const q=String(query||'').trim().toLowerCase();return previewCustomers.find(c=>[c.id,c.username,c.name,c.phone].some(v=>String(v||'').toLowerCase()===q))}
function getActiveHotkeyCustomer(){if(window._hotkeyCustomer){const c=previewCustomers.find(x=>x.id===window._hotkeyCustomer.id);if(c)return c}if(window._profileResource?.customer)return findPreviewCustomer(window._profileResource.customer);return null}
function openHotkeyCustomerSearch(){
  window._pendingHotkeyAction=null;
  toolbarModal('جستجوی مشتری','<div class="detail-alert">F1 فقط جستجوست. شناسه، نام کاربری، نام یا شماره را وارد کن و Enter بزن.</div><label style="display:block;margin-top:10px;font-size:9px;color:#66758a">شناسه / نام / نام کاربری / تلفن</label><input id="hotkeyCustomerInput" autocomplete="off" placeholder="مثلاً 1010" style="width:100%;height:40px;margin-top:4px;border:1px solid #cfd9e7;border-radius:6px;padding:0 10px;font-size:11px"><div class="actions"><button onclick="toolbarClose()">بستن</button><button class="primary" onclick="findHotkeyCustomer()">جستجو / Enter</button></div>',520);
  setTimeout(function(){const i=document.getElementById('hotkeyCustomerInput');if(i){i.focus();i.select();i.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();findHotkeyCustomer()}})}},30)
}

function findHotkeyCustomer(){
  const c=findPreviewCustomer(document.getElementById('hotkeyCustomerInput')?.value||'');
  if(!c){showToast('مشتری با این شناسه پیدا نشد');return}
  toolbarClose();
  window._hotkeyCustomer=c;
  window._profileResource=hotkeyResourceFromCustomer(c);
  openProfile(window._profileResource);
  showToast('مشتری '+c.id+' پیدا شد')
}


function openHotkeyCharge(){openHotkeyAccountAction('charge')}
function openHotkeyAccountAction(action){
  const c=getActiveHotkeyCustomer();
  if(!c){openHotkeyCustomerSearch();return}
  window._hotkeyCustomer=c;
  window._profileResource=hotkeyResourceFromCustomer(c);
  if(action==='vip'){openVipDialog(window._profileResource);return}
  showAccountAction(action,window._profileResource);
}


function confirmActiveHotkeyOperation(){const p=document.getElementById('detail')?.querySelector('.operation-footer .primary');if(p){p.click();return true}return false}
function openHotkeySettings(){
  const hk=getGameNetHotkeys(),ops=['openCustomer','chargeCustomer','deductCustomer','debtCustomer','freeCustomer','payDebtCustomer','discountCustomer','vipCustomer'],keys=['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'],sel=function(id,v){return '<select id="'+id+'" style="width:100%;height:32px">'+keys.map(function(k){return '<option value="'+k+'" '+(k===v?'selected':'')+'>'+k+'</option>'}).join('')+'</select>'};
  const rows=ops.map(function(k){return '<div class="account-row"><div class="account-row-label"><strong>'+gameNetHotkeyLabels[k]+'</strong><small>کلید اجرای مستقیم این عملیات</small></div><div></div>'+sel('hk_'+k,hk[k])+'</div>'}).join('');
  toolbarModal('میانبرهای اپراتور','<div class="detail-alert">F1 همیشه برای جستجوی مشتری است. بعد از پیدا کردن مشتری، دکمه‌های واقعی عملیات نمایش داده می‌شوند و هرکدام هات‌کی مستقل دارند.</div><div class="account-list" style="margin-top:10px">'+rows+'</div><div class="actions"><button onclick="resetGameNetHotkeys()">بازگردانی</button><button onclick="toolbarClose()">انصراف</button><button class="primary" onclick="saveHotkeySettings()">ذخیره</button></div>',700)
}

function resetGameNetHotkeys(){saveGameNetHotkeys(Object.assign({},defaultGameNetHotkeys));openHotkeySettings();showToast('میانبرهای پیش‌فرض بازگردانی شد')}
function saveHotkeySettings(){const next=Object.assign({},defaultGameNetHotkeys);gameNetHotkeyOrder.forEach(function(k){if(k!=='confirmAction')next[k]=document.getElementById('hk_'+k)?.value||defaultGameNetHotkeys[k]});const keys=gameNetHotkeyOrder.filter(k=>k!=='confirmAction').map(k=>next[k]);if(new Set(keys).size!==keys.length){showToast('دو عملیات نمی‌توانند یک F-key مشترک داشته باشند');return}saveGameNetHotkeys(next);toolbarClose();showToast('میانبرهای اپراتور ذخیره شدند')}
function installGameNetOperatorHotkeys(){
  document.addEventListener('keydown',function(e){
    if(e.ctrlKey||e.altKey||e.metaKey)return;
    const hk=getGameNetHotkeys(),key=e.key;
    if(key==='Enter'&&document.getElementById('hotkeyCustomerInput'))return;
    if(key===hk.openCustomer){e.preventDefault();openHotkeyCustomerSearch();return}
    if(key===hk.chargeCustomer){e.preventDefault();openHotkeyAccountAction('charge');return}
    if(key===hk.deductCustomer){e.preventDefault();openHotkeyAccountAction('deduct');return}
    if(key===hk.debtCustomer){e.preventDefault();openHotkeyAccountAction('debt');return}
    if(key===hk.freeCustomer){e.preventDefault();openHotkeyAccountAction('free');return}
    if(key===hk.payDebtCustomer){e.preventDefault();openHotkeyAccountAction('pay-debt');return}
    if(key===hk.discountCustomer){e.preventDefault();openHotkeyAccountAction('discount');return}
    if(key===hk.vipCustomer){e.preventDefault();openHotkeyAccountAction('vip');return}
    if(key==='Enter'){const t=e.target;if(t&&((t.tagName==='TEXTAREA')||(t.tagName==='SELECT')||(t.tagName==='BUTTON')||(t.tagName==='INPUT'&&['text','search'].includes((t.type||'').toLowerCase()))))return;if(confirmActiveHotkeyOperation())e.preventDefault()}
  })
}

function addHotkeyDemoCustomer(){if(!previewCustomers.some(function(c){return c.id==='1010'})){previewCustomers.push({id:'1010',name:'مشتری 1010',username:'customer1010',phone:'0912***10',pin:'1234',balance:100000,debt:0,vip:'—',vipActive:false,vipExpiry:'—',unit:'—',lastVisit:'امروز',freeCredit:0,maxConcurrent:2,sharedTimePool:true,activeSessions:[]});persistAppState('demo-customer')}} 
addHotkeyDemoCustomer();
installGameNetOperatorHotkeys();
