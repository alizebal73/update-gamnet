const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_FILES = [
  'src/core.js',
  'src/accounts.js',
  'src/sessions.js',
  'src/finance.js',
  'src/people.js',
  'src/hotkeys.js',
  'src/system.js',
  'src/bootstrap.js',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.dataset = {};
    this.hidden = false;
    this.disabled = false;
    this.style = {};
    this.tagName = 'DIV';
    this.type = '';
    this.checked = false;
    this.files = [];
  }
  focus() {}
  select() {}
  click() {}
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
  getAttribute() { return null; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest() { return null; }
  contains() { return false; }
}

function createDocument() {
  const elements = new Map();
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, new FakeElement(id));
    return elements.get(id);
  };

  const document = {
    getElementById: get,
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: (tag) => {
      const el = new FakeElement();
      el.tagName = String(tag || 'div').toUpperCase();
      return el;
    },
    body: get('__body__'),
    documentElement: get('__html__'),
  };

  return { document, get };
}

function createContext() {
  const { document, get } = createDocument();
  const store = new Map();
  const localStorage = {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
  };

  const window = {
    document,
    localStorage,
    innerWidth: 1280,
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  class FakeMutationObserver {
    constructor() {}
    observe() {}
    disconnect() {}
  }

  const context = {
    console,
    document,
    window,
    localStorage,
    MutationObserver: FakeMutationObserver,
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: (fn) => {
      try { fn(); } catch (error) { console.warn('deferred callback:', error.message); }
      return 0;
    },
    clearTimeout: () => {},
    Date,
    Math,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
    Intl,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
  };

  context.globalThis = context;
  context.__getElement = get;
  return context;
}

function loadScripts(context) {
  const ctx = vm.createContext(context);
  for (const rel of SOURCE_FILES) {
    const file = path.join(ROOT, rel);
    const source = fs.readFileSync(file, 'utf8');
    try {
      new vm.Script(source, { filename: rel });
      vm.runInContext(source, ctx, { filename: rel });
    } catch (error) {
      throw new Error('Script load failed: ' + rel + ' — ' + error.message);
    }
  }
  const bridge = new vm.Script(`
    globalThis.__ui = {
      previewCustomers,
      deviceTariffClass,
      createPreviewCustomer,
      openCustomerRecordPreview,
      findHotkeyCustomer,
      executeInlineAccountOperation,
      getDeviceRate,
      getDeviceTariff,
      openDeviceSettings,
      setDeviceTariffClassFromModal,
      saveDeviceSettings,
      commitAccountOperation,
      openProfile,
      window,
      vipPlans,
      openVipPlanSettings,
      saveVipPlanSettings,
      openVipDialog,
      openCustomerEdit,
      saveCustomerEdit,
      openHotkeyCustomerSearch,
      startPreviewSession,
      consumeSharedWallets,
      getVipDailyRemainingSeconds
    };
  `);
  bridge.runInContext(ctx);
  return ctx;
}

function staticChecks(ctx) {
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const onclicks = [...index.matchAll(/onclick=["']([^"']+)["']/g)]
    .map((m) => m[1])
    .flatMap((code) => {
      const names = [];
      for (const m of code.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) names.push(m[1]);
      return names;
    });

  const ignored = new Set(['if', 'render', 'showToast']);
  const missing = [...new Set(onclicks.filter((name) => !ignored.has(name) && typeof ctx[name] !== 'function'))];
  assert(missing.length === 0, 'index.html references missing functions: ' + missing.join(', '));

  for (const rel of SOURCE_FILES) {
    const source = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    try {
      new Function(source);
    } catch (error) {
      throw new Error('Syntax check failed: ' + rel + ' — ' + error.message);
    }
  }
}

function runtimeFlowChecks(ctx) {
  const get = ctx.__getElement;

  const ui = ctx.__ui;
  assert(ui && Array.isArray(ui.previewCustomers), 'previewCustomers is not available');
  assert(ui.previewCustomers.length >= 15, 'Expected seeded customers');

  const newId = '9901';
  get('newCId').value = newId;
  get('newCName').value = 'Smoke Test Customer';
  get('newCUser').value = 'smoke.test';
  get('newCPin').value = '1234';
  get('newCPhone').value = '09120009901';
  get('newCBalance').value = '100000';

  ui.createPreviewCustomer();
  const created = ui.previewCustomers.find((c) => c.id === newId);
  assert(created, 'Customer creation flow did not create the customer');
  assert(created.name === 'Smoke Test Customer', 'Created customer has wrong name');

  ui.openCustomerRecordPreview(newId);
  assert(get('detail').innerHTML.includes('Smoke Test Customer'), 'Created customer profile did not render');

  get('hotkeyCustomerInput').value = '۱۰۴۰';
  ui.findHotkeyCustomer();
  assert(get('detail').innerHTML.includes('Ali R.'), 'F1 customer search did not open the profile');

  const beforeCharge = Number(created.balance || 0);
  get('inlineAccountAmount').value = '10000';
  ui.executeInlineAccountOperation('charge', created);
  assert(Number(created.balance) === beforeCharge + 10000, 'Charge operation did not update balance');

  const debtBeforeBalance = Number(created.balance || 0);
  created.debt = 40000;
  get('inlineAccountAmount').value = '50000';
  ui.window._profileResource = { id: 'CUSTOMER' + created.id, customer: created.name, customerId: created.id, type: 'pc', state: 'Idle', session: '—' };
  ui.executeInlineAccountOperation('pay-debt', created);
  assert(Number(created.debt) === 0, 'Debt payment did not clear the debt first');
  assert(Number(created.balance) === debtBeforeBalance + 10000, 'Debt payment remainder was not added to customer credit/time');

  ui.openCustomerEdit({ customerId: newId, customer: created.name });
  get('editCName').value = 'Edited Smoke Customer';
  get('editCUser').value = 'smoke.edited';
  get('editCPhone').value = '09120009999';
  get('editCPin').value = '5678';
  ui.saveCustomerEdit(newId);
  assert(created.name === 'Edited Smoke Customer', 'Customer edit did not update name');
  assert(created.username === 'smoke.edited', 'Customer edit did not update username');
  assert(created.pin === '5678', 'Customer edit did not update PIN');

  ui.openHotkeyCustomerSearch();
  assert(get('detail').innerHTML.includes('compact-search-modal'), 'F1 search dialog did not use compact layout');

  const vipCustomer = created;
  vipCustomer.balance = 0;
  vipCustomer.freeCredit = 0;
  vipCustomer.vipActive = true;
  vipCustomer.vipPlanKey = 'silver';
  vipCustomer.vipExpiryTs = Date.now() + 86400000;
  vipCustomer.vipDailyUsageKey = '';
  vipCustomer.vipDailyUsedSeconds = 0;
  const vipPlan = ui.vipPlans.find((p) => p.key === 'silver');
  assert(vipPlan, 'Silver VIP plan is missing');
  vipPlan.afterLimit = 'block';
  assert(ui.getVipDailyRemainingSeconds(vipCustomer) > 0, 'VIP daily quota is not available');
  assert(ui.startPreviewSession(newId, 'PC01') === true, 'VIP customer could not start a zero-balance session');
  vipCustomer.vipDailyUsedSeconds = Number(vipPlan.dailyHours) * 3600;
  ui.consumeSharedWallets();
  assert(vipCustomer.activeSessions.length === 0, 'VIP daily limit did not stop the Session');
  vipPlan.afterLimit = 'charge';
  vipCustomer.balance = 20000;
  vipCustomer.vipDailyUsedSeconds = Number(vipPlan.dailyHours) * 3600;
  assert(ui.startPreviewSession(newId, 'PC01') === true, 'VIP charge-after-limit plan could not start with balance');
  const beforeVipBalance = Number(vipCustomer.balance);
  ui.consumeSharedWallets();
  assert(Number(vipCustomer.balance) < beforeVipBalance, 'VIP charge-after-limit did not consume wallet after quota');

  const beforeDiscountBalance = Number(created.balance || 0);
  const beforeFree = Number(created.freeCredit || 0);
  get('inlineAccountAmount').value = '10000';
  get('inlineDiscountPercent').value = '10';
  ui.executeInlineAccountOperation('discount', created);
  assert(Number(created.balance) === beforeDiscountBalance + 10000, 'Discount payment did not preserve actual paid amount');
  assert(Number(created.freeCredit) === beforeFree + 1000, 'Discount bonus was not added correctly');

  assert(ui.getDeviceRate('PC01') === 200000, 'Normal PC tariff derivation is wrong');
  ui.openDeviceSettings('PC01');
  assert(get('detail').innerHTML.includes('تأیید و ذخیره'), 'Device settings confirmation button is missing');
  ui.setDeviceTariffClassFromModal('PC01', 'vip');
  assert(ui.window._pendingDeviceTariff?.cls === 'vip', 'Device VIP selection was not staged');
  assert(ui.getDeviceTariff('PC01') === 'normal', 'Device class changed before confirmation');
  ui.saveDeviceSettings();
  assert(ui.getDeviceTariff('PC01') === 'vip', 'Device VIP setting was not saved');
  assert(get('detail').innerHTML.includes('دستگاه‌ها و کلاس تعرفه'), 'Device save did not return to device manager');
  assert(ui.getDeviceRate('PC01') === 100000, 'VIP PC tariff derivation is wrong');

  assert(Array.isArray(ui.vipPlans) && ui.vipPlans.length === 3, 'VIP plans are missing');
  const silver = ui.vipPlans.find((p) => p.key === 'silver');
  const platinum = ui.vipPlans.find((p) => p.key === 'platinum');
  assert(silver && Number(silver.dailyHours) === 2, 'Silver daily VIP quota is wrong');
  assert(platinum && Number(platinum.dailyHours) === 24, 'Platinum daily VIP quota is wrong');
  ui.openVipPlanSettings();
  get('vipPlanLabel_silver').value = 'Silver Daily';
  get('vipPlanPrice_silver').value = '1900000';
  get('vipPlanDays_silver').value = '15';
  get('vipPlanHours_silver').value = '3';
  get('vipPlanNote_silver').value = 'روزانه ۳ ساعت';
  ui.saveVipPlanSettings();
  assert(Number(silver.dailyHours) === 3, 'VIP plan settings did not save daily hours');
  assert(Number(silver.price) === 1900000, 'VIP plan settings did not save price');
  assert(Number(silver.days) === 15, 'VIP plan settings did not save default days');
  ui.openVipDialog(ui.window._profileResource);
  assert(get('detail').innerHTML.includes('3 ساعت'), 'VIP dialog did not show configured daily quota');

  assert(typeof ui.commitAccountOperation === 'function', 'Financial operation engine missing');
  assert(typeof ui.openProfile === 'function', 'Profile renderer missing');
}

function main() {
  const context = createContext();
  const ctx = loadScripts(context);
  staticChecks(ctx);
  runtimeFlowChecks(ctx);
  console.log('UI SMOKE TEST PASSED');
  console.log('  ✓ syntax for all UI modules');
  console.log('  ✓ index.html inline handlers resolve');
  console.log('  ✓ create customer → profile');
  console.log('  ✓ F1 search → profile');
  console.log('  ✓ charge operation');
  console.log('  ✓ payment + 10% bonus accounting');
  console.log('  ✓ normal/VIP tariff derivation');
}

main();
