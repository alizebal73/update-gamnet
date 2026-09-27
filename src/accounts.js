function parseToman(v){return Number(String(v||'0').replace(/[^0-9]/g,''))||0}
function discountFreeTime(base,percent,rate=120000){const amount=Math.max(0,Number(base||0)*Number(percent||0)/100);const sec=Math.floor(amount/rate*3600),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;if(!sec)return'00:00';return h?String(h)+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'):String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
function formatDiscountBaseTime(base,rate){const sec=Math.floor(Math.max(0,Number(base||0))/Math.max(1,Number(rate||1))*3600);return formatSharedTime(sec)}
function formatDiscountTotalTime(base,pct,rate){const total=Math.max(0,Number(base||0))*(1+Number(pct||0)/100);return formatDiscountBaseTime(total,rate)}
function showAccountAction(action,x){
  const p=profileFor(x)||[x.customer||'Customer','0000','—','0 تومان','ندارد',x.id,x.session||'—'],live=previewCustomers.find(function(cc){return cc.id===x.customerId||cc.name===x.customer}),balance=live?Number(live.balance||0):parseToman(p[3]),free=live?Number(live.freeCredit||0):Number(x.freeCredit||0),base=100000,discount=Number(x.discountPercent||10),rate=getCustomerEffectiveRate(x),title={charge:'شارژ اعتبار',free:'اعتبار رایگان',debt:'ثبت بدهی','pay-debt':'پرداخت بدهی',deduct:'کسر اعتبار / کسری',discount:'پرداخت + هدیه زمانی'}[action]||'عملیات حساب';
  let html='<div class="detail" onclick="if(event.target===this)closeDetail()"><div class="account-page"><button class="close" onclick="openProfile(window._profileResource)">×</button><div class="operation-head"><div><div class="eyebrow">Account operation</div><h3>'+title+'</h3></div><button class="ghost" onclick="openProfile(window._profileResource)">بازگشت</button></div>';
  if(action!=='discount'){const def=action==='pay-debt'?Math.min(50000,Number(live?.debt||x.debt||0)):50000;html+='<div class="operation-grid"><label>مبلغ (تومان)<input id="accountAmount" type="number" min="0" step="1000" value="'+def+'"></label><div class="operation-preview"><span>حساب فعلی</span><strong>اعتبار '+balance.toLocaleString()+' تومان • رایگان '+free.toLocaleString()+' تومان • بدهی '+Number(live?.debt||x.debt||0).toLocaleString()+' تومان</strong></div></div><div class="detail-alert">نرخ مؤثر: '+rate.toLocaleString()+' تومان/ساعت؛ Sessionهای همزمان نرخ‌ها را جمع می‌کنند.</div>'}
  else{html+='<div class="operation-grid discount-operation-grid"><label>مبلغ پرداختی مشتری<input id="paymentBase" type="number" min="0" step="1000" value="'+base+'" oninput="updateDiscountPreview()"></label><label>درصد هدیه<select id="discountPercent" class="operation-select" onchange="updateDiscountPreview()">'+[0,10,20,30,40,50,60,70,80,90,100].map(function(n){return '<option value="'+n+'" '+(n===discount?'selected':'')+'>'+n+'٪</option>'}).join('')+'</select></label></div><div class="discount-summary"><div><span>پرداخت واقعی</span><strong id="paidAmount">'+base.toLocaleString()+' تومان</strong></div><div><span>رایگان</span><strong id="discountAmount">'+Math.round(base*discount/100).toLocaleString()+' تومان</strong></div><div><span>ارزش کل</span><strong id="totalValue">'+Math.round(base*(1+discount/100)).toLocaleString()+' تومان</strong></div></div><div class="discount-summary"><div><span>زمان خرید</span><strong id="paidTime">'+formatDiscountBaseTime(base,rate)+'</strong></div><div><span>وقت رایگان</span><strong id="freeTime">'+discountFreeTime(base,discount,rate)+'</strong></div><div><span>زمان کل</span><strong id="totalTime">'+formatDiscountTotalTime(base,discount,rate)+'</strong></div></div><div class="detail-alert">۱۰۰٬۰۰۰ تومان پرداخت + ۱۰٪ هدیه = ۱۰٬۰۰۰ تومان رایگان؛ پرداختی همان ۱۰۰٬۰۰۰ تومان می‌ماند و ارزش کل ۱۱۰٬۰۰۰ تومان است.</div>'}
  html+='<div class="operation-footer"><button class="ghost" onclick="openProfile(window._profileResource)">انصراف</button><button class="primary" onclick="confirmAccountAction(\''+action+'\',\''+x.id+'\')">ثبت عملیات</button></div></div></div>';document.getElementById('detail').innerHTML=html;
}

function confirmAccountAction(action,id){
  const x=data().find(function(a){return a.id===id})||window._profileResource;
  const live=previewCustomers.find(function(cc){return cc.id===x.customerId||cc.name===x.customer});if(!live){showToast('حساب مشتری پیدا نشد');return}
  const amount=Math.max(0,Number(document.getElementById('accountAmount')?.value||0));
  let op={action:action,customerId:live.id,amount:amount};
  if(action==='discount'){
    const base=Math.max(0,Number(document.getElementById('paymentBase')?.value||0)),pct=Math.max(0,Math.min(100,Number(document.getElementById('discountPercent')?.value||0)));
    op={action:'discount',customerId:live.id,base:base,percent:pct,bonus:Math.round(base*pct/100)};
  }
  if(!commitAccountOperation(op))return;
  openProfile({id:'CUSTOMER'+live.id,customer:live.name,customerId:live.id,type:'pc',state:'Idle',session:'—'});
  showToast(action==='charge'?'شارژ ثبت و پایدار شد':'عملیات حساب ثبت و پایدار شد');
}

function updateDiscountPreview(){const base=Number(document.getElementById('paymentBase')?.value||0),pct=Number(document.getElementById('discountPercent')?.value||0),d=Math.round(base*pct/100),total=base+d,rate=getCustomerEffectiveRate(window._profileResource||{});if(document.getElementById('paidAmount'))document.getElementById('paidAmount').textContent=base.toLocaleString()+' تومان';if(document.getElementById('discountAmount'))document.getElementById('discountAmount').textContent=d.toLocaleString()+' تومان';if(document.getElementById('totalValue'))document.getElementById('totalValue').textContent=total.toLocaleString()+' تومان';if(document.getElementById('paidTime'))document.getElementById('paidTime').textContent=formatDiscountBaseTime(base,rate);if(document.getElementById('freeTime'))document.getElementById('freeTime').textContent=discountFreeTime(base,pct,rate);if(document.getElementById('totalTime'))document.getElementById('totalTime').textContent=formatDiscountTotalTime(base,pct,rate)}
function openProfile(x){
  const p=profileFor(x);if(!p){showToast('پروفایل مشتری پیدا نشد');return}
  window._profileResource=x;
  const cc=previewCustomers.find(function(v){return v.id===x.customerId||v.id===x.customer||v.name===x.customer});
  const username=cc?.username||((x.customer||'customer').toLowerCase().replace(/[^a-z0-9]+/g,'.')),pin=cc?.pin||'••••',vipActive=!!(cc?.vipActive||x.vipActive),vipPlan=cc?.vipPlan||cc?.vip||'',vipExpiry=cc?.vipExpiry||'—',active=cc?.activeSessions||[],u=cc?calculateSharedUsage(cc):{totalRate:0,remainingSeconds:0},maxConcurrent=Number(cc?.maxConcurrent||1);
  document.getElementById('detail').innerHTML='<div class="detail account-backdrop" onclick="if(event.target===this)closeDetail()"><div class="account-page"><button class="close" onclick="closeDetail()">×</button><div class="account-header"><div class="account-identity"><div class="avatarBig">'+String(p[0]).slice(0,1)+'</div><div><div class="eyebrow">Customer account</div><h2>'+p[0]+'</h2><p>شناسه '+p[1]+' • '+p[2]+' • '+x.id+'</p></div></div><div class="account-header-actions"><button class="ghost" onclick="openCustomerEdit(window._profileResource)">✎ ویرایش</button><button class="ghost" onclick="openCustomerHistory(window._profileResource)">◷ سوابق</button></div></div><div class="account-meta-list"><div><span>نام</span><strong>'+p[0]+'</strong></div><div><span>شناسه</span><strong>#'+p[1]+'</strong></div><div><span>نام کاربری</span><strong>'+username+'</strong></div><div><span>PIN</span><strong>'+pin+'</strong></div><div><span>تلفن</span><strong>'+p[2]+'</strong></div><div><span>VIP</span><strong>'+(vipActive?vipPlan+' • تا '+vipExpiry:'فعال نیست')+'</strong></div><div><span>اتصالات</span><strong>'+active.length+' / '+maxConcurrent+'</strong></div><div><span>نرخ فعلی</span><strong>'+Number(u.totalRate||0).toLocaleString()+' تومان/ساعت</strong></div></div><div class="account-list-section"><div class="account-section-title"><div><div class="eyebrow">Account summary</div><h3>خلاصه حساب</h3></div><span>عملیات مالی فقط از یک مرکز واحد</span></div><div class="account-list"><div class="account-row"><div class="account-row-label"><strong>اعتبار نقدی</strong><small>موجودی قابل مصرف</small></div><div class="account-value positive">'+Number(cc?.balance||parseToman(p[3])).toLocaleString()+' تومان</div><span></span></div><div class="account-row"><div class="account-row-label"><strong>اعتبار رایگان</strong><small>وقت هدیه</small></div><div class="account-value positive">'+Number(cc?.freeCredit||0).toLocaleString()+' تومان</div><span></span></div><div class="account-row"><div class="account-row-label"><strong>بدهی</strong><small>طرف حساب غیرنقدی</small></div><div class="account-value danger">'+Number(cc?.debt||0).toLocaleString()+' تومان</div><span></span></div><div class="account-row vip-account-row"><div class="account-row-label"><strong>VIP</strong><small>اشتراک مشتری</small></div><div class="account-value vip-membership-value">'+(vipActive?(vipPlan+' • تا '+vipExpiry):'فعال نیست')+'</div><span></span></div><div class="account-row"><div class="account-row-label"><strong>Time Pool مشترک</strong><small>نرخ Sessionهای فعال جمع می‌شود</small></div><div class="account-value">'+formatSharedTime(u.remainingSeconds)+'</div><span></span></div></div></div><div class="account-operation-panel" style="margin-top:11px"><div class="operation-head"><div><div class="eyebrow">Single account control</div><h3>مرکز عملیات حساب</h3></div><span class="rate-badge">F1</span></div><div class="detail-alert">شارژ، کسر اعتبار، بدهی، پرداخت بدهی، اعتبار رایگان، هدیه زمانی و VIP از همین یک بخش انجام می‌شوند.</div><div class="actions"><button class="primary" onclick="openAccountCenter(window._profileResource)">ورود به مرکز عملیات حساب</button></div></div><div class="account-row" style="margin-top:10px"><div class="account-row-label"><strong>Sessionهای فعال</strong><small>دستگاه‌های متصل</small></div><div class="account-value">'+(active.map(function(s){return s.deviceId}).join(' • ')||'بدون Session')+'</div><span></span></div><div class="modal-actions"><button class="ghost" onclick="closeDetail()">بستن پروفایل</button></div></div></div>';
}
function openAccountCenter(x){
  const cc=previewCustomers.find(function(v){return v.id===x?.customerId||v.id===x?.customer||v.name===x?.customer})||previewCustomers.find(function(v){return v.id===x?.id});
  if(!cc){showToast('ابتدا مشتری را انتخاب کن');return}
  window._profileResource={id:'CUSTOMER'+cc.id,customer:cc.name,customerId:cc.id,type:'pc',state:'Idle',session:'—'};
  const hk=typeof getGameNetHotkeys==='function'?getGameNetHotkeys():{};
  const ops=[
    ['charge','شارژ اعتبار','➕','chargeCustomer'],
    ['deduct','کسر اعتبار','➖','deductCustomer'],
    ['debt','ثبت بدهی','🧾','debtCustomer'],
    ['pay-debt','پرداخت بدهی','💳','payDebtCustomer'],
    ['free','اعتبار رایگان','🎁','freeCustomer'],
    ['discount','پرداخت + هدیه','⏱','discountCustomer'],
    ['vip','خرید / تمدید VIP','⭐','vipCustomer']
  ];
  const buttons=ops.map(function(o){
    const shortcut=o[3]==='vipCustomer'?(hk.vipCustomer||''):hk[o[3]]||'';
    const action=o[0];
    return '<button type="button" class="account-op-button" onclick="'+(action==='vip'?'openVipDialog(window._profileResource)':'showAccountAction(\''+action+'\',window._profileResource)')+'"><span class="account-op-icon">'+o[2]+'</span><span class="account-op-label">'+o[1]+'</span>'+(shortcut?'<span class="account-op-hotkey">'+escapeHtml(shortcut)+'</span>':'')+'</button>';
  }).join('');
  document.getElementById('detail').innerHTML='<div class="detail"><div class="account-page account-center-page"><button class="close" onclick="openProfile(window._profileResource)">×</button><div class="eyebrow">Operator account center</div><div class="account-center-heading"><div><h2>مرکز عملیات حساب • '+escapeHtml(cc.name)+'</h2><p>عملیات را مستقیم از دکمه‌ها انتخاب کن؛ هیچ منوی کرکره‌ای وجود ندارد.</p></div><span class="hotkey-search-badge">جستجو: '+escapeHtml(hk.openCustomer||'F1')+'</span></div><div class="toolbar-kpi" style="margin-top:10px"><div><span>اعتبار</span><strong>'+Number(cc.balance||0).toLocaleString()+' تومان</strong></div><div><span>رایگان</span><strong>'+Number(cc.freeCredit||0).toLocaleString()+' تومان</strong></div><div><span>بدهی</span><strong>'+Number(cc.debt||0).toLocaleString()+' تومان</strong></div><div><span>اتصال</span><strong>'+(cc.activeSessions?.length||0)+'</strong></div></div><div class="account-quick-actions">'+buttons+'</div><div class="detail-alert account-center-hint">هات‌کی‌های عملیات از «تنظیمات → میانبرهای اپراتور» قابل تغییر هستند. F1 فقط برای جستجوی مشتری است.</div><div class="actions"><button class="ghost" onclick="openProfile(window._profileResource)">پروفایل مشتری</button><button onclick="openCustomerHistory(window._profileResource)">سوابق</button><button class="primary" onclick="openHotkeySettings()">تنظیم هات‌کی‌ها</button></div></div></div>';
}

function runAccountCenterAction(){
  const a=document.getElementById('accountCenterAction')?.value,x=window._profileResource;if(!a||!x)return;if(a==='vip'){openVipDialog(x);return}showAccountAction(a,x);
}
function openCustomerEdit(x){
  const cc=previewCustomers.find(function(v){return v.id===x?.customerId||v.name===x?.customer});if(!cc)return;
  toolbarModal('ویرایش مشتری','<div class="grid2"><div><small>نام</small><input id="editCName" class="toolbar-input" value="'+(cc.name||'')+'"></div><div><small>نام کاربری</small><input id="editCUser" class="toolbar-input" value="'+(cc.username||'')+'"></div><div><small>موبایل</small><input id="editCPhone" class="toolbar-input" value="'+(cc.phone||'')+'"></div><div><small>PIN</small><input id="editCPin" class="toolbar-input" value="'+(cc.pin||'1234')+'"></div></div><div class="actions"><button onclick="openProfile(window._profileResource)">انصراف</button><button class="primary" onclick="saveCustomerEdit(\''+cc.id+'\')">ذخیره</button></div>',560);
}
function saveCustomerEdit(id){
  const cc=previewCustomers.find(function(v){return v.id===id});if(!cc)return;
  const nu=String(document.getElementById('editCUser')?.value||'').trim();
  if(!nu){showToast('نام کاربری الزامی است');return}
  if(previewCustomers.some(function(v){return v.id!==id&&String(v.username||'').toLowerCase()===nu.toLowerCase()})){showToast('این نام کاربری قبلاً استفاده شده است');return}
  cc.name=String(document.getElementById('editCName')?.value||cc.name).trim();cc.username=nu;cc.phone=String(document.getElementById('editCPhone')?.value||cc.phone).trim();cc.pin=String(document.getElementById('editCPin')?.value||cc.pin).trim();
  profileMap[cc.name]={name:cc.name,code:cc.id,phone:cc.phone,balance:Number(cc.balance||0).toLocaleString()+' تومان',vip:cc.vipActive?(cc.vip||'VIP'):'ندارد',unit:cc.activeSessions?.[0]?.deviceId||'—',session:'—'};window._profileResource.customer=cc.name;persistAppState('customer-edit');openProfile(window._profileResource);
}
function openCustomerHistory(x){
  const cc=previewCustomers.find(function(v){return v.id===x?.customerId||v.name===x?.customer});if(!cc)return;
  const timeline=getCustomerTimeline(cc.id);
  const rows=timeline.map(function(e){const dt=new Date(Number(e.ts||Date.now())).toLocaleString('fa-IR');return '<div class="toolbar-row" style="grid-template-columns:150px 120px 1fr 140px"><span>'+escapeHtml(dt)+'</span><span>'+escapeHtml(e.label||e.type||'عملیات')+'</span><span>'+escapeHtml(e.deviceId||e.fromDeviceId||e.method||'—')+'</span><span>'+Number(e.amount||0).toLocaleString()+' تومان</span></div>'}).join('')||'<div class="detail-alert">سابقه‌ای ثبت نشده است.</div>';
  toolbarModal('سوابق کامل مشتری','<div class="toolbar-kpi"><div><span>اعتبار</span><strong>'+Number(cc.balance||0).toLocaleString()+' تومان</strong></div><div><span>رایگان</span><strong>'+Number(cc.freeCredit||0).toLocaleString()+' تومان</strong></div><div><span>بدهی</span><strong>'+Number(cc.debt||0).toLocaleString()+' تومان</strong></div><div><span>Session فعال</span><strong>'+(cc.activeSessions?.length||0)+'</strong></div></div><div class="detail-alert">تاریخچه شامل عملیات مالی، Session و پرداخت‌های ثبت‌شده است.</div><div class="toolbar-table"><div class="toolbar-row toolbar-head" style="grid-template-columns:150px 120px 1fr 140px"><span>زمان</span><span>نوع</span><span>دستگاه / روش</span><span>مبلغ</span></div>'+rows+'</div><div class="actions"><button onclick="openProfile(window._profileResource)">بازگشت</button></div>',760);
}

function openContextMenu(ev,id){
  const x=data().find(function(a){return a.id===id});if(!x)return;
  selected=id;window._contextResourceId=id;document.getElementById('selected').textContent=id;
  const menu=document.getElementById('context');menu.innerHTML='';
  const box=document.createElement('div');box.className='ctxmenu';box.setAttribute('role','menu');box.setAttribute('aria-label','عملیات دستگاه');box.style.left=Math.min(ev.clientX,window.innerWidth-260)+'px';box.style.top=Math.min(ev.clientY,window.innerHeight-280)+'px';
  const title=document.createElement('b');title.textContent=x.id+(x.customer?' • '+x.customer:'');box.appendChild(title);
  const add=function(label,fn){const b=document.createElement('button');b.type='button';b.setAttribute('role','menuitem');b.textContent=label;b.onclick=fn;box.appendChild(b)};
  add('👤 پروفایل مشتری',function(){openProfileOrSettings(window._contextResourceId)});
  add('⚙ تنظیم دستگاه',function(){openDeviceSettings(window._contextResourceId)});
  add('▶ Session / مشتری',function(){openAssignCustomer(window._contextResourceId)});
  add('▣ مدیریت دستگاه‌ها',function(){openDeviceManager()});
  add('✕ بستن',function(){menu.innerHTML=''});
  menu.appendChild(box);
  const first=box.querySelector('[role="menuitem"]');if(first)first.focus();
}
function openProfileOrSettings(id){const x=data().find(a=>a.id===id);document.getElementById('context').innerHTML='';if(x&&x.customer)openProfile(x);else if(x)openDeviceSettings(id)}
function showToast(msg){document.getElementById('toast').innerHTML='<div class="toast">'+msg+'</div>';clearTimeout(window._toast);window._toast=setTimeout(()=>document.getElementById('toast').innerHTML='',3200)}
document.addEventListener('click',function(e){if(!e.target.closest('#context'))document.getElementById('context').innerHTML=''})
