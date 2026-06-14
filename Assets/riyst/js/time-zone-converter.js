}
  


  (function(){
    var $ = function(s, root){ return (root||document).querySelector(s); };

    var fromDate = $('#fromDate');
    var fromTime = $('#fromTime');
    var fromZone = $('#fromZone');
    var toZone   = $('#toZone');
    var toDate   = $('#toDate');
    var toTime   = $('#toTime');
    var btnReset = $('#reset');

    /* --- Simplified, common time zones (ascending from -08:00 to +12:00) --- */
    var ZONES = [
      {name:'US Pacific',               offset:-8*60},
      {name:'US Mountain',              offset:-7*60},
      {name:'US Central',               offset:-6*60},
      {name:'US Eastern',               offset:-5*60},
      {name:'Canada Atlantic',          offset:-4*60},
      {name:'Argentina / Brazil',       offset:-3*60},
      {name:'UTC / GMT',                offset: 0},
      {name:'Central European (CET)',   offset: 1*60},
      {name:'Eastern European (EET)',   offset: 2*60},
      {name:'Moscow',                   offset: 3*60},
      {name:'Gulf',                     offset: 4*60},
      {name:'Pakistan',                 offset: 5*60},
      {name:'India (IST)',              offset: 5*60+30},
      {name:'Indochina',                offset: 7*60},
      {name:'China / Singapore',        offset: 8*60},
      {name:'Japan / Korea',            offset: 9*60},
      {name:'Australia Eastern (AEST)', offset:10*60},
      {name:'New Zealand',              offset:12*60}
    ];

    function fmtOffsetLabel(mins){
      var sign = mins>=0 ? '+' : '−';
      var abs = Math.abs(mins);
      var h = Math.floor(abs/60);
      var m = abs%60;
      return '(UTC ' + sign + String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ')';
    }
    function buildZoneSelect(sel){
      sel.innerHTML = '';
      var opt0 = document.createElement('option');
      opt0.value = '__placeholder__';
      opt0.textContent = 'Timezone';
      opt0.disabled = true; opt0.selected = true;
      sel.appendChild(opt0);
      ZONES.forEach(function(z){
        var opt = document.createElement('option');
        opt.value = z.offset; // minutes
        opt.textContent = z.name + ' ' + fmtOffsetLabel(z.offset);
        sel.appendChild(opt);
      });
    }

    function parseDate(s){
      if(!s) return null;
      var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if(!m) return null;
      return {y:+m[1], mo:+m[2]-1, d:+m[3]};
    }
    function parseTime(s){
      if(!s) return null;
      var m = s.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
      if(!m) return null;
      return {H:+m[1], M:+m[2], S: m[3]?+m[3]:0};
    }

    function instantFromWallClock(dateParts, timeParts, offsetMins){
      if(!dateParts || !timeParts || typeof offsetMins!=='number') return null;
      var tsUTC = Date.UTC(dateParts.y, dateParts.mo, dateParts.d, timeParts.H, timeParts.M, timeParts.S || 0);
      return tsUTC - offsetMins*60*1000;
    }

    function convert(){
      var d = parseDate(fromDate.value);
      var t = parseTime(fromTime.value);
      var fromOff = parseInt(fromZone.value, 10);
      var toOff   = parseInt(toZone.value, 10);

      if(!d || !t || isNaN(fromOff) || isNaN(toOff)){
        toDate.value = ''; toTime.value = '';
        return;
      }

      var utcMs = instantFromWallClock(d, t, fromOff);
      if(utcMs == null || isNaN(utcMs)){
        toDate.value = ''; toTime.value = '';
        return;
      }

      // Shift by target offset and use UTC getters to avoid local TZ interference
      var shifted = new Date(utcMs + toOff*60*1000);
      var yyyy = shifted.getUTCFullYear();
      var mm   = String(shifted.getUTCMonth()+1).padStart(2,'0');
      var dd   = String(shifted.getUTCDate()).padStart(2,'0');
      var H    = String(shifted.getUTCHours()).padStart(2,'0');
      var M    = String(shifted.getUTCMinutes()).padStart(2,'0');
      var S    = String(shifted.getUTCSeconds()).padStart(2,'0');

      // Output date as DD/MM/YYYY (matches your request)
      toDate.value = dd + '/' + mm + '/' + String(yyyy);
      toTime.value = H + ':' + M + ':' + S;
    }

    function setBlank(){
      buildZoneSelect(fromZone);
      buildZoneSelect(toZone);
      fromDate.value = ''; fromTime.value = '';
      toDate.value = ''; toTime.value = '';
    }

    ['change','input'].forEach(function(ev){
      fromDate.addEventListener(ev, convert);
      fromTime.addEventListener(ev, convert);
      fromZone.addEventListener(ev, convert);
      toZone.addEventListener(ev, convert);
    });

    var btnReset = document.getElementById('reset');
    if(btnReset) btnReset.addEventListener('click', setBlank);

    setBlank();
  })();
