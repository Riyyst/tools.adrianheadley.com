}
  


(function () {
  const imgEl = document.getElementById('random404');
  const base = '../media/404/';
  const manifest = [
    "404_robot1.png",
    "404_robot2.png",
    "404_robot3.png",
    "404_robot4.png",
    "404_robot5.png",
    "404_robot6.png",
    "404_robot7.png"
  ];
  function pick(list){ return list[Math.floor(Math.random() * list.length)]; }
  function setSrc(src){ imgEl.src = base + src + '?v=' + Math.random().toString(36).slice(2); }
  if (manifest.length){ setSrc(pick(manifest)); }
  document.getElementById('y').textContent = new Date().getFullYear();
})();
