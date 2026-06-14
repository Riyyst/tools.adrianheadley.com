}
  


const $ = sel => document.querySelector(sel);
const fromDatetimeLocalValue = (val) => {
  if(!val) return null;
  const [date, time] = val.split('T');
  const [y,m,da] = date.split('-').map(Number);
  let h=0, mi=0;
  if(time){ [h,mi] = time.split(':').map(Number); }
  return new Date(y, m-1, da, h, mi, 0, 0);
};

function calendarDiff(a, b){
  let start = new Date(a), end = new Date(b);
  const sign = (end - start) >= 0 ? 1 : -1;
  if(sign < 0){ [start, end] = [end, start]; }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  let hours = end.getHours() - start.getHours();
  let minutes = end.getMinutes() - start.getMinutes();
  let seconds = end.getSeconds() - start.getSeconds();

  if(seconds < 0){ seconds += 60; minutes--; }
  if(minutes < 0){ minutes += 60; hours--; }
  if(hours < 0){ hours += 24; days--; }
  if(days < 0){
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  if(months < 0){ months += 12; years--; }

  return { years, months, days, hours, minutes, seconds };
}

function calcDifference(){
  const a = fromDatetimeLocalValue($('#diffStart').value);
  const b = fromDatetimeLocalValue($('#diffEnd').value);
  if(!a || !b){ return; }
  const ms = b - a;
  const abs = Math.abs(ms);
  $('#sTotal').textContent = Math.floor(abs/1000).toLocaleString();
  $('#mTotal').textContent = Math.floor(abs/60000).toLocaleString();
  $('#hTotal').textContent = Math.floor(abs/3600000).toLocaleString();
  $('#dTotal').textContent = (abs/86400000).toLocaleString(undefined, { maximumFractionDigits: 6 });

  const cal = calendarDiff(a, b);
  const parts = [];
  if(cal.years) parts.push(cal.years + ' year' + (cal.years!==1?'s':''));
  if(cal.months) parts.push(cal.months + ' month' + (cal.months!==1?'s':''));
  if(cal.days) parts.push(cal.days + ' day' + (cal.days!==1?'s':''));
  if(cal.hours) parts.push(cal.hours + ' hour' + (cal.hours!==1?'s':''));
  if(cal.minutes) parts.push(cal.minutes + ' minute' + (cal.minutes!==1?'s':''));
  if(cal.seconds || parts.length===0) parts.push(cal.seconds + ' second' + (cal.seconds!==1?'s':''));
  $('#elapsedText').textContent = parts.join(', ');
}

$('#calcDiff').addEventListener('click', calcDifference);
$('#resetDiff').addEventListener('click', ()=>{
  $('#diffStart').value = ''; $('#diffEnd').value = '';
  ['elapsedText','sTotal','mTotal','hTotal','dTotal'].forEach(id=>{ $('#'+id).textContent='—'; });
});
document.querySelector('#yearNow').textContent = new Date().getFullYear();
