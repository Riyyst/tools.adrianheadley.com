}
  


  (function(){
    var $ = function(s, root){ return (root||document).querySelector(s); };
    var $$ = function(s, root){ return Array.prototype.slice.call((root||document).querySelectorAll(s)); };

    var fromValue = $('#fromValue');
    var fromSub   = $('#fromSub');
    var compoundWrap = $('#compoundWrap');
    var subLabel  = $('#subLabel');
    var subHint   = $('#subHint');

    var fromCompoundWrap = $('#fromCompoundWrap');
    var fromCompound = $('#fromCompound');
    var fromCompoundText = $('#fromCompoundText');

    var toValue = $('#toValue');
    var toUnit   = $('#toUnit');
    var toCompoundWrap = $('#toCompoundWrap');
    var toCompound = $('#toCompound');
    var toCompoundText = $('#toCompoundText');

    var fromUnit = $('#fromUnit');
    var meta     = $('#meta');
    var btnSwap  = $('#swap');
    var btnCopy  = $('#copy');
    var btnReset = $('#reset');
    var yearEl   = $('#year');

    if(yearEl) yearEl.textContent = new Date().getFullYear();

    var UNIT_LABELS = {
      'mm': 'millimetres', 'cm': 'centimetres', 'm': 'metres', 'km': 'kilometres',
      'in': 'inches', 'ft': 'feet', 'yd': 'yards', 'mi': 'miles',
      'mm²': 'square millimetres', 'cm²': 'square centimetres', 'm²': 'square metres',
      'km²': 'square kilometres', 'in²': 'square inches', 'ft²': 'square feet',
      'yd²': 'square yards', 'acre': 'acres', 'hectare': 'hectares',
      'mL': 'millilitres', 'L': 'litres', 'm³': 'cubic metres', 'in³': 'cubic inches',
      'ft³': 'cubic feet', 'gal (US)': 'US gallons', 'gal (UK)': 'UK gallons',
      'mg': 'milligrams', 'g': 'grams', 'kg': 'kilograms', 'tonne': 'tonnes',
      'oz': 'ounces', 'lb': 'pounds', 'st': 'stone',
      'm/s': 'metres per second', 'km/h': 'kilometres per hour', 'mph': 'miles per hour', 'knot': 'knots',
      '°C': 'Celsius', '°F': 'Fahrenheit', 'K': 'Kelvin'
    };

    var UNITS = {
      length: { name: 'Length', base: 'm', map: {'mm':0.001,'cm':0.01,'m':1,'km':1000,'in':0.0254,'ft':0.3048,'yd':0.9144,'mi':1609.344} },
      area:   { name: 'Area', base: 'm²', map: {'mm²':1e-6,'cm²':1e-4,'m²':1,'km²':1e6,'in²':0.00064516,'ft²':0.09290304,'yd²':0.83612736,'acre':4046.8564224,'hectare':10000} },
      volume: { name: 'Volume', base: 'L', map: {'mL':0.001,'L':1,'m³':1000,'in³':0.016387064,'ft³':28.316846592,'gal (US)':3.785411784,'gal (UK)':4.54609} },
      mass:   { name: 'Mass', base: 'kg', map: {'mg':1e-6,'g':1e-3,'kg':1,'tonne':1000,'oz':0.028349523125,'lb':0.45359237,'st':6.35029318} },
      speed:  { name: 'Speed', base: 'm/s', map: {'m/s':1,'km/h':(1000/3600),'mph':0.44704,'knot':0.514444} },
      temperature: { name: 'Temperature', map: {'°C':'C','°F':'F','K':'K'} }
    };

    var COMPOUNDS = {
      // Length
      'km': { subUnit: 'm',  factorToPrimary: 1000,    hint: 'Optional: metres',        label: 'Add metres' },
      'm' : { subUnit: 'cm', factorToPrimary: 100,     hint: 'Optional: centimetres',   label: 'Add centimetres' },
      'cm': { subUnit: 'mm', factorToPrimary: 10,      hint: 'Optional: millimetres',   label: 'Add millimetres' },
      'yd': { subUnit: 'ft', factorToPrimary: 3,       hint: 'Optional: feet',          label: 'Add feet' },
      'ft': { subUnit: 'in', factorToPrimary: 12,   hint: 'Optional: inches', label: 'Add inches' },
      'st': { subUnit: 'lb', factorToPrimary: 14,   hint: 'Optional: pounds', label: 'Add pounds' },
      'lb': { subUnit: 'oz', factorToPrimary: 16,   hint: 'Optional: ounces', label: 'Add ounces' },
      'kg': { subUnit: 'g',  factorToPrimary: 1000, hint: 'Optional: grams',        label: 'Add grams' },
      'g' : { subUnit: 'mg', factorToPrimary: 1000, hint: 'Optional: milligrams',   label: 'Add milligrams' },
      // Volume
      'L' : { subUnit: 'mL', factorToPrimary: 1000, hint: 'Optional: millilitres',  label: 'Add millilitres' }

    };

    var DISPLAY_COMPOUNDS = {
      // Length
      'km': { subUnit: 'm',  perPrimary: 1000, label: 'Show kilometres + metres' },
      'm':  { subUnit: 'cm', perPrimary: 100,  label: 'Show metres + centimetres' },
      'cm': { subUnit: 'mm', perPrimary: 10,   label: 'Show centimetres + millimetres' },
      'yd': { subUnit: 'ft', perPrimary: 3,    label: 'Show yards + feet' },
      'm': { subUnit: 'cm', perPrimary: 100, label: 'Show metres + centimetres' },
      'ft': { subUnit: 'in', perPrimary: 12, label: 'Show feet + inches' },
      'yd': { subUnit: 'ft', perPrimary: 3, label: 'Show yards + feet' },
      'st': { subUnit: 'lb', perPrimary: 14, label: 'Show stone + pounds' },
      'lb': { subUnit: 'oz', perPrimary: 16, label: 'Show pounds + ounces' }
    };

    var UNIT_TO_GROUP = {};
    Object.keys(UNITS).forEach(function(group){
      var item = UNITS[group];
      Object.keys(item.map).forEach(function(u){ UNIT_TO_GROUP[u] = group; });
    });
    Object.keys(UNITS.temperature.map).forEach(function(u){ UNIT_TO_GROUP[u] = 'temperature'; });

    function labelFor(unit){ return (UNIT_LABELS[unit] || unit) + ' (' + unit + ')'; }

    function buildFromOptions(){
      var frag = document.createDocumentFragment();
      Object.keys(UNITS).forEach(function(groupKey){
        var group = UNITS[groupKey];
        var og = document.createElement('optgroup');
        og.label = group.name;
        var units = Object.keys(group.map);
        units.forEach(function(u){
          var opt = document.createElement('option');
          opt.value = u;
          opt.textContent = labelFor(u);
          og.appendChild(opt);
        });
        frag.appendChild(og);
      });
      fromUnit.innerHTML = '';
      fromUnit.appendChild(frag);
    }

    function buildToOptions(){
      var f = fromUnit.value;
      var groupKey = UNIT_TO_GROUP[f];
      var group = UNITS[groupKey];
      var units = Object.keys(group.map);
      var frag = document.createDocumentFragment();
      units.forEach(function(u){
        if(u === f) return;
        var opt = document.createElement('option');
        opt.value = u;
        opt.textContent = labelFor(u);
        frag.appendChild(opt);
      });
      toUnit.innerHTML = '';
      toUnit.appendChild(frag);
      updateToCompoundUI();
    }

    function fmt(n){
      if(!isFinite(n)) return '';
      var abs = Math.abs(n);
      if(abs === 0) return '0';
      if(abs < 1e-4 || abs >= 1e7) return n.toExponential(6).replace(/(?:\.?0+)(e|$)/,'$1');
      var s = n.toFixed(10);
      s = s.replace(/\.?0+$/,''); 
      return s;
    }

    function getCompoundAdjusted(value, unit){
      var cfg = COMPOUNDS[unit];
      if(!cfg || !fromCompound.checked) return value;
      var sub = parseFloat(fromSub.value);
      if(!isFinite(sub)) sub = 0;
      return (parseFloat(value)||0) + sub * cfg.factorToPrimary;
    }

    function formatDisplayCompound(value, unit){
      var cfg = DISPLAY_COMPOUNDS[unit];
      if(!cfg) return fmt(value) + ' ' + unit;
      var sign = value < 0 ? '-' : '';
      var v = Math.abs(value);
      var main = Math.floor(v);
      var rem = (v - main) * cfg.perPrimary;
      var remRounded = Math.round(rem * 1000) / 1000; 
      if(remRounded >= cfg.perPrimary){ main += 1; remRounded = 0; }
      var remStr = remRounded.toFixed(3).replace(/\.?0+$/,'');
      return sign + main + ' ' + unit + (remRounded ? (' ' + remStr + ' ' + cfg.subUnit) : '');
    }

    function convertValue(value, from, to){
      var group = UNIT_TO_GROUP[from];
      if(UNIT_TO_GROUP[to] !== group) return null;
      if(group === 'temperature'){
        var v = parseFloat(value);
        if(!isFinite(v)) return '';
        var out;
        if(from === '°C'){
          if(to === '°F') out = (v * 9/5) + 32;
          else if(to === 'K') out = v + 273.15;
        }else if(from === '°F'){
          if(to === '°C') out = (v - 32) * 5/9;
          else if(to === 'K') out = (v - 32) * 5/9 + 273.15;
        }else if(from === 'K'){
          if(to === '°C') out = v - 273.15;
          else if(to === '°F') out = (v - 273.15) * 9/5 + 32;
        }
        return out;
      }else{
        var meta = UNITS[group];
        var base = value * meta.map[from];
        return base / meta.map[to];
      }
    }

    function updateMeta(){
      var g = UNIT_TO_GROUP[fromUnit.value];
      var groupName = UNITS[g].name;
      var extra = (COMPOUNDS[fromUnit.value] && fromCompound.checked) ? (' (+ ' + (COMPOUNDS[fromUnit.value].subUnit) + ')') : '';
      var toExtra = (DISPLAY_COMPOUNDS[toUnit.value] && toCompound.checked) ? (' (+'+DISPLAY_COMPOUNDS[toUnit.value].subUnit+')') : '';
      meta.textContent = groupName + ' • ' + fromUnit.options[fromUnit.selectedIndex].text + extra + ' → ' + toUnit.options[toUnit.selectedIndex].text + toExtra;
    }

    function updateCompoundUI(){
      var cfg = COMPOUNDS[fromUnit.value];
      if(cfg){
        fromCompoundWrap.style.display = '';
        fromCompoundText.textContent = cfg.label || 'Add subunit';
        compoundWrap.style.display = fromCompound.checked ? '' : 'none';
        subLabel.textContent = cfg.subUnit;
        fromSub.placeholder = cfg.subUnit;
        subHint.textContent = cfg.hint || '';
      }else{
        fromCompoundWrap.style.display = 'none';
        compoundWrap.style.display = 'none';
        fromCompound.checked = false;
        fromSub.value = '';
      }
    }

    function updateToCompoundUI(){
      var cfg = DISPLAY_COMPOUNDS[toUnit.value];
      if(cfg){
        toCompoundWrap.style.display = '';
        toCompoundText.textContent = cfg.label || 'Show subunit';
      }else{
        toCompoundWrap.style.display = 'none';
        toCompound.checked = false;
      }
    }

    function doConvert(){
      var vRaw = parseFloat(fromValue.value);
      if(!isFinite(vRaw) && !(COMPOUNDS[fromUnit.value] && fromCompound.checked)){
        toValue.value = '';
        btnCopy.disabled = true;
        return;
      }
      var v = getCompoundAdjusted(vRaw, fromUnit.value);
      if(!isFinite(v)){
        toValue.value = '';
        btnCopy.disabled = true;
        return;
      }
      var res = convertValue(v, fromUnit.value, toUnit.value);
      if(res == null){
        toValue.value = '';
        btnCopy.disabled = true;
        meta.textContent = 'Those units are not compatible.';
        return;
      }
      if(DISPLAY_COMPOUNDS[toUnit.value] && toCompound.checked){
        toValue.value = formatDisplayCompound(res, toUnit.value);
      }else{
        toValue.value = fmt(res);
      }
      btnCopy.disabled = (toValue.value === '');
      updateMeta();
    }

    fromUnit.addEventListener('change', function(){
      buildToOptions();
      fromCompound.checked = false;
      updateCompoundUI();
      doConvert();
    });
    toUnit.addEventListener('change', function(){
      updateToCompoundUI();
      doConvert();
    });
    fromValue.addEventListener('input', doConvert);
    fromSub.addEventListener('input', doConvert);
    toCompound.addEventListener('change', doConvert);
    fromCompound.addEventListener('change', function(){ updateCompoundUI(); doConvert(); });

    btnSwap.addEventListener('click', function(){
      var from = fromUnit.value, to = toUnit.value;
      if(UNIT_TO_GROUP[from] !== UNIT_TO_GROUP[to]) return;
      var tmp = fromUnit.value;
      fromUnit.value = to;
      buildToOptions();
      toUnit.value = tmp;
      fromCompound.checked = false;
      updateCompoundUI();
      updateToCompoundUI();
      if(toValue.value !== ''){
        var num = parseFloat(toValue.value);
        fromValue.value = isFinite(num) ? num : '';
        fromSub.value = '';
      }
      doConvert();
    });

    btnCopy.addEventListener('click', function(){
      toValue.select();
      try{ document.execCommand('copy'); }catch(e){}
      window.getSelection().removeAllRanges();
    });

    btnReset.addEventListener('click', function(){
      // Clear values
      fromValue.value = '';
      fromSub.value = '';

      // Reset selects to placeholder (index 0 assumes placeholder added by init)
      fromUnit.selectedIndex = 0;
      toUnit.selectedIndex = 0;

      // Reset compound toggles and UI
      fromCompound.checked = false;
      toCompound.checked = false;

      // Hide compound UI blocks and clear subunit field
      if (fromCompoundWrap) fromCompoundWrap.style.display = 'none';
      if (compoundWrap) compoundWrap.style.display = 'none';
      if (toCompoundWrap) toCompoundWrap.style.display = 'none';

      // Rebuild dependent options and refresh UI
      buildToOptions();
      updateCompoundUI();
      updateToCompoundUI();

      // Clear output
      toValue.value = '';
      if (btnCopy) btnCopy.disabled = true;

      // Clear meta/status text
      if (meta) meta.textContent = '';

      // Focus back to main input
      fromValue.focus();
    });

    buildFromOptions();
    buildToOptions();
    updateCompoundUI();
    updateToCompoundUI();
    updateMeta();
  })();
  


(function(){
  function stackUnder(selectId, toggleId){
    var sel = document.getElementById(selectId);
    var tog = document.getElementById(toggleId);
    if(!sel || !tog) return;
    // If we already wrapped, ensure only select+toggle are inside
    var parent = sel.parentElement;
    if(parent && parent.classList && parent.classList.contains('unit-stack')){
      if(tog.parentElement !== parent){ parent.appendChild(tog); }
      return;
    }
    // Make a wrapper that won't inherit "card/box" visuals
    var wrap = document.createElement('span');
    wrap.className = 'unit-stack';
    // Insert wrapper at the select's location
    sel.parentNode.insertBefore(wrap, sel);
    // Move select and toggle into wrapper as siblings (vertical)
    wrap.appendChild(sel);
    wrap.appendChild(tog);
  }
  function init(){
    stackUnder('fromUnit','fromCompoundWrap');
    stackUnder('toUnit','toCompoundWrap');
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();



(function(){
  function $(id){ return document.getElementById(id); }
  var fromWrap = $('fromCompoundWrap');
  var fromChk  = fromWrap ? fromWrap.querySelector('input[type="checkbox"]') : null;
  var fromSub  = $('fromSub');
  function apply(){
    if(!fromWrap || !fromSub) return;
    var visibleToggle = fromWrap.style.display !== 'none';
    if(visibleToggle && fromChk && fromChk.checked){
      fromSub.style.display = '';
    }else{
      fromSub.style.display = 'none';
      fromSub.value = '';
    }
  }
  if(fromChk) fromChk.addEventListener('change', apply);
  document.addEventListener('DOMContentLoaded', apply);
  setTimeout(apply, 0);
})();



(function(){
  function $(id){ return document.getElementById(id); }
  var fromUnit = $('fromUnit');
  var toUnit   = $('toUnit');
  var fromWrap = $('fromCompoundWrap');
  var toWrap   = $('toCompoundWrap');
  var resetBtn = document.getElementById('resetBtn');

  // Ensure Reset says Clear
  if(resetBtn) resetBtn.textContent = 'Clear';

  // Insert "Select unit" placeholder option at top if not present
  function ensurePlaceholder(sel){
    if(!sel) return;
    var first = sel.options[0];
    if(!first || first.value !== "__placeholder__"){
      var opt = document.createElement('option');
      opt.value = "__placeholder__";
      opt.textContent = "Select unit";
      opt.disabled = true;
      opt.selected = true;
      sel.insertBefore(opt, sel.firstChild);
    } else {
      first.selected = true;
    }
    sel.selectedIndex = 0;
  }
  ensurePlaceholder(fromUnit);
  ensurePlaceholder(toUnit);

  // Hide toggle wrappers initially
  if(fromWrap) fromWrap.style.display = 'none';
  if(toWrap)   toWrap.style.display = 'none';

  // Supported compound pairs
  var COMPOUND_MAP = {
    'km':'m','m':'cm','cm':'mm','yd':'ft','ft':'in',
    'st':'lb','lb':'oz','kg':'g','g':'mg',
    'l':'ml','L':'mL','kl':'l'
  };

  function isRealUnit(v){
    return v && v !== '__placeholder__' && v.toLowerCase() !== 'select unit';
  }

  function refreshToggles(){
    if(fromWrap){
      var showFrom = isRealUnit(fromUnit && fromUnit.value) && COMPOUND_MAP[fromUnit.value];
      fromWrap.style.display = showFrom ? 'inline-flex' : 'none';
    }
    if(toWrap){
      var showTo = isRealUnit(toUnit && toUnit.value) && COMPOUND_MAP[toUnit.value];
      toWrap.style.display = showTo ? 'inline-flex' : 'none';
    }
  }

  if(fromUnit) fromUnit.addEventListener('change', refreshToggles);
  if(toUnit)   toUnit.addEventListener('change', refreshToggles);
})();



// Strong reset for the TO side as well (without page reload)
(function(){
  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  var btn = document.getElementById('reset');
  if(!btn || btn.__toResetBound) return;
  btn.__toResetBound = true;
  btn.addEventListener('click', function(){
    // Clear any known result fields
    var resultInputs = qsa('#toValue, .to .box input, .result input, input[data-role="result"]');
    resultInputs.forEach(function(el){ try{ el.value = ''; }catch(e){} });
    // Also clear any text-only outputs
    var resultDisplays = qsa('.to .box, #toBox, .result, [data-role="resultDisplay"]');
    resultDisplays.forEach(function(el){ if(el && el.textContent && el.tagName!=='INPUT') el.textContent = ''; });

    // Reset the "to" unit select to its placeholder if present
    var toSel = document.getElementById('toUnit') || qs('.to select') || qs('select#to');
    if(toSel){
      // Prefer any placeholder option (disabled)
      var i = 0;
      for (var idx=0; idx<toSel.options.length; idx++){
        var o = toSel.options[idx];
        if (o.disabled || (''+o.value).toLowerCase().includes('select unit') or o.value==='__placeholder__'){
          i = idx; break;
        }
      }
      toSel.selectedIndex = i;
    }
  });
})();



(function(){
  var btn = document.getElementById('reset');
  if(!btn || btn.__totalResetBound) return;
  btn.__totalResetBound = true;
  btn.addEventListener('click', function(e){
    e.preventDefault();

    var scope = document.querySelector('#converterRow') || document;

    // 1) Clear all text/number inputs inside the converter row
    scope.querySelectorAll('input[type="text"], input[type="number"], input:not([type])').forEach(function(el){
      // don't clear buttons/checkboxes
      if (el.type === 'checkbox' || el.type === 'button' || el.type === 'submit') return;
      try { el.value = ''; } catch(e){}
    });

    // 2) Reset all selects to first option (assumed placeholder)
    scope.querySelectorAll('select').forEach(function(sel){
      sel.selectedIndex = 0;
      sel.dispatchEvent(new Event('change', {bubbles:true}));
    });

    // 3) Uncheck all checkboxes
    scope.querySelectorAll('input[type="checkbox"]').forEach(function(cb){
      cb.checked = false;
      cb.dispatchEvent(new Event('change', {bubbles:true}));
    });

    // 4) Hide any compound/toggle wrappers if present
    ['fromCompoundWrap','toCompoundWrap','compoundWrap'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    // 5) Clear "To" box display even if it's a text node inside a container
    var toBox = scope.querySelector('.to .box');
    if (toBox){
      var input = toBox.querySelector('input');
      if (input) input.value = '';
      else toBox.textContent = '';
    }

    // 6) Clear meta/status
    var meta = document.getElementById('meta');
    if (meta) meta.textContent = '';

    // 7) Call known UI rebuild hooks if they exist
    ['buildToOptions','updateCompoundUI','updateToCompoundUI'].forEach(function(fn){
      if (typeof window[fn] === 'function') {
        try { window[fn](); } catch(e){}
      }
    });

    // 8) Put focus back to the primary input if available
    var fromValue = document.getElementById('fromValue') || scope.querySelector('.from input[type="text"], .from input:not([type])');
    if (fromValue) fromValue.focus();
  });
})();



// Ensure CLEAR also forces the 'To' unit to a clean placeholder state
(function(){
  var btn = document.getElementById('reset');
  if(!btn || btn.__placeholderFix) return;
  btn.__placeholderFix = true;
  btn.addEventListener('click', function(){
    var toSel = document.getElementById('toUnit') || document.querySelector('.to select');
    if (!toSel) return;

    // Wipe current options and inject a disabled "Select unit" placeholder
    while (toSel.options.length) toSel.remove(0);
    var opt = document.createElement('option');
    opt.value = "__placeholder__";
    opt.textContent = "Select unit";
    opt.disabled = true;
    opt.selected = true;
    toSel.add(opt);
    toSel.selectedIndex = 0;
    toSel.dispatchEvent(new Event('change', { bubbles: true }));
  });
})();
