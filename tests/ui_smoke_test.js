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

  assert(Array.isArray(ctx.previewCustomers), 'previewCustomers is not available');
  assert(ctx.previewCustomers.length >= 15, 'Expected seeded customers');

  const newId = '9901';
  get('newCId').value = newId;
  get('newCName').value = 'Smoke Test Customer';
  get('newCUser').value = 'smoke.test';
  get('newCPin').value = '1234';
  get('newCPhone').value = '09120009901';
  get('newCBalance').value = '100000';

  ctx.createPreviewCustomer();
  const created = ctx.previewCustomers.find((c) => c.id === newId);
  assert(created, 'Customer creation flow did not create the customer');
  assert(created.name === 'Smoke Test Customer', 'Created customer has wrong name');

  ctx.openCustomerRecordPreview(newId);
  assert(get('detail').innerHTML.includes('Smoke Test Customer'), 'Created customer profile did not render');

  get('hotkeyCustomerInput').value = '۱۰۴۰';
  ctx.findHotkeyCustomer();
  assert(get('detail').innerHTML.includes('Ali R.'), 'F1 customer search did not open the profile');

  const beforeCharge = Number(created.balance || 0);
  get('inlineAccountAmount').value = '10000';
  ctx.executeInlineAccountOperation('charge', created);
  assert(Number(created.balance) === beforeCharge + 10000, 'Charge operation did not update balance');

  const beforeFree = Number(created.freeCredit || 0);
  get('inlineAccountAmount').value = '10000';
  get('inlineDiscountPercent').value = '10';
  ctx.executeInlineAccountOperation('discount', created);
  assert(Number(created.balance) === beforeCharge + 20000, 'Discount payment did not preserve actual paid amount');
  assert(Number(created.freeCredit) === beforeFree + 1000, 'Discount bonus was not added correctly');

  assert(ctx.getDeviceRate('PC01') === 200000, 'Normal PC tariff derivation is wrong');
  ctx.openDeviceSettings('PC01');
  assert(get('detail').innerHTML.includes('تأیید و ذخیره'), 'Device settings confirmation button is missing');
  ctx.setDeviceTariffClassFromModal('PC01', 'vip');
  assert(ctx.window._pendingDeviceTariff?.cls === 'vip', 'Device VIP selection was not staged');
  assert(ctx.getDeviceTariff('PC01') === 'normal', 'Device class changed before confirmation');
  ctx.saveDeviceSettings();
  assert(ctx.getDeviceTariff('PC01') === 'vip', 'Device VIP setting was not saved');
  assert(get('detail').innerHTML.includes('دستگاه‌ها و کلاس تعرفه'), 'Device save did not return to device manager');
  assert(ctx.getDeviceRate('PC01') === 100000, 'VIP PC tariff derivation is wrong');

  assert(typeof ctx.commitAccountOperation === 'function', 'Financial operation engine missing');
  assert(typeof ctx.openProfile === 'function', 'Profile renderer missing');
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
