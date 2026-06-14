}
  


(function(){'use strict';
  document.addEventListener('DOMContentLoaded', function(){

    // Utilities
    const R = (arr)=>arr[Math.floor(Math.random()*arr.length)];
    const RI = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
    const pad2 = (n)=>String(n).padStart(2,'0');
    const AtoZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Country list
    const COUNTRY_LIST = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fantasy", "Federated States of Micronesia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Republic of the Congo", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];

    // Country -> language (for name sets)
    const LANG = {
      // English world
      "United States":"english","United Kingdom":"english","Ireland":"english","Canada":"english","Australia":"english","New Zealand":"english",
      // Western Europe
      "France":"french","Belgium":"french","Luxembourg":"french","Switzerland":"german","Germany":"german","Austria":"german",
      "Spain":"spanish","Mexico":"spanish","Argentina":"spanish","Colombia":"spanish","Chile":"spanish","Peru":"spanish","Uruguay":"spanish","Venezuela":"spanish","Ecuador":"spanish","Bolivia":"spanish","Paraguay":"spanish","Panama":"spanish","Costa Rica":"spanish","Guatemala":"spanish","Honduras":"spanish","El Salvador":"spanish","Nicaragua":"spanish","Dominican Republic":"spanish",
      "Portugal":"portuguese","Brazil":"portuguese","Angola":"portuguese","Mozambique":"portuguese",
      "Italy":"italian","San Marino":"italian","Vatican City":"italian","Netherlands":"dutch",
      // Central & Eastern
      "Poland":"polish","Czechia":"czech","Slovakia":"czech","Hungary":"hungarian","Romania":"romanian",
      "Russia":"russian","Belarus":"russian","Ukraine":"ukrainian","Serbia":"serbian","Bosnia and Herzegovina":"serbian","Croatia":"croatian","Slovenia":"croatian","North Macedonia":"serbian","Bulgaria":"bulgarian",
      // Greece/Turkey
      "Greece":"greek","Cyprus":"greek","Turkey":"turkish",
      // Middle East & North Africa
      "Saudi Arabia":"arabic","United Arab Emirates":"arabic","Qatar":"arabic","Bahrain":"arabic","Kuwait":"arabic","Oman":"arabic","Yemen":"arabic",
      "Jordan":"arabic","Lebanon":"arabic","Syria":"arabic","Iraq":"arabic","Egypt":"arabic","Morocco":"arabic","Algeria":"arabic","Tunisia":"arabic","Libya":"arabic",
      "Iran":"persian","Israel":"hebrew",
      // South & Southeast Asia
      "India":"hindi","Pakistan":"hindi","Sri Lanka":"tamil","Bangladesh":"bengali","Nepal":"hindi",
      "Indonesia":"indonesian","Malaysia":"malay","Singapore":"malay","Philippines":"filipino",
      "Vietnam":"vietnamese","Thailand":"thai",
      // East Asia
      "China":"chinese","Taiwan":"chinese","Japan":"japanese","South Korea":"korean","North Korea":"korean",
      // Africa samples
      "Kenya":"swahili","Tanzania":"swahili","Uganda":"swahili","Rwanda":"swahili","Burundi":"swahili",
      "Ethiopia":"amharic","Nigeria":"nigerian","Ghana":"nigerian","Cameroon":"nigerian","Sierra Leone":"nigerian","Liberia":"nigerian"
    };

    // Name datasets (trimmed but realistic)
    const NAMES = {
      english: { male:["James","John","William","Thomas","George","Daniel","David","Michael","Andrew","Christopher","Benjamin","Samuel","Oliver","Jack","Noah","Liam","Ethan","Logan","Lucas","Mason"],
                 female:["Elizabeth","Mary","Catherine","Emma","Olivia","Ava","Sophia","Isabella","Mia","Charlotte","Amelia","Harper","Emily","Ella","Grace","Lily"],
                 last:["Smith","Johnson","Brown","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Walker","King","Wright","Green","Baker","Ward","Turner","Cooper","Hill","Carter","Mitchell"] },
      french:  { male:["Louis","Arthur","Jules","Hugo","Gabriel","Raphaël","Léo","Lucas","Noé","Paul"], female:["Emma","Louise","Chloé","Inès","Camille","Léa","Zoé","Sarah","Jeanne","Anna"], last:["Dubois","Durand","Lefebvre","Martin","Bernard","Petit","Robert","Richard","Moreau","Laurent"] },
      german:  { male:["Maximilian","Felix","Lukas","Leon","Jonas","Paul","Noah","Elias","Finn"], female:["Mia","Emma","Lina","Hannah","Marie","Luisa","Amelie"], last:["Müller","Schmidt","Schneider","Fischer","Weber","Wagner","Becker","Hoffmann"] },
      spanish: { male:["Alejandro","Daniel","Diego","Javier","José","Luis","Manuel","Miguel","Pablo","Sergio","Juan"], female:["Ana","Carmen","Claudia","Daniela","Elena","Isabel","Lucía","María","Marta","Paula","Sofía"], last:["García","Martínez","López","Sánchez","González","Rodríguez","Fernández","Pérez","Gómez","Díaz"] },
      italian: { male:["Alessandro","Lorenzo","Leonardo","Matteo","Francesco","Andrea","Gabriele"], female:["Sofia","Giulia","Aurora","Alice","Giorgia","Martina","Chiara"], last:["Rossi","Russo","Ferrari","Esposito","Bianchi","Romano","Colombo"] },
      dutch:   { male:["Daan","Sem","Lucas","Levi","Finn","Milan"], female:["Emma","Julia","Mila","Tess","Sophie","Lotte"], last:["de Jong","Jansen","de Vries","van den Berg","Bakker","van Dijk"] },
      portuguese:{ male:["João","Miguel","Gabriel","Mateus","Gustavo","Pedro"], female:["Maria","Ana","Beatriz","Carolina","Fernanda"], last:["Silva","Santos","Oliveira","Pereira","Ferreira","Almeida","Costa"] },
      polish:  { male:["Jakub","Kacper","Antoni","Jan","Szymon","Adam"], female:["Zuzanna","Julia","Maja","Zofia","Hanna"], last:["Nowak","Kowalski","Wiśniewski","Wójcik","Kamiński","Lewandowski"] },
      romanian:{ male:["Andrei","Mihai","Alexandru","Cristian","Ştefan"], female:["Maria","Elena","Ioana","Ana","Andreea"], last:["Popescu","Ionescu","Stan","Dumitrescu","Popa"] },
      greek:   { male:["Γεώργιος","Δημήτριος","Νικόλαος","Ιωάννης"], female:["Μαρία","Ελένη","Αναστασία","Γεωργία"], last:["Παπαδόπουλος","Νικολάου","Γεωργίου","Χριστοδούλου"] },
      turkish: { male:["Mehmet","Mustafa","Ahmet","Ali","Hüseyin","Yusuf"], female:["Fatma","Ayşe","Emine","Hatice","Zeynep","Elif"], last:["Yılmaz","Kaya","Demir","Şahin","Çelik","Öztürk"] },
      russian: { male:["Александр","Сергей","Дмитрий","Андрей","Алексей","Иван","Максим"], female:["Анна","Екатерина","Ольга","Наталья","Мария"], last:["Иванов","Петров","Смирнов","Кузнецов","Соколов"] },
      ukrainian:{ male:["Олександр","Андрій","Дмитро","Іван","Максим","Богдан","Сергій"], female:["Софія","Анастасія","Олена","Наталія","Марія","Ірина"], last:["Шевченко","Ковальчук","Бондаренко","Мельник","Кравченко","Бойко"] },
      czech:   { male:["Jakub","Jan","Tomáš","Lukáš","Petr"], female:["Anna","Eliška","Tereza","Adéla","Karolína"], last:["Novák","Svoboda","Novotný","Dvořák","Černý"] },
      hungarian:{ male:["Bence","Máté","Levente","Dániel"], female:["Hanna","Luca","Anna","Zsófia"], last:["Nagy","Kovács","Tóth","Szabó"] },
      arabic:  { male:["محمد","أحمد","علي","عمر","يوسف"], female:["فاطمة","مريم","آية","نور","ليلى"], last:["الخطيب","العتيبي","الزهراني","النجار","الحسيني"] },
      persian: { male:["علی","محمدرضا","حسین","رضا"], female:["فاطمه","زهرا","نگار","مهسا"], last:["کریمی","محمدی","حسینی","رضایی"] },
      hebrew:  { male:["דוד","יוסף","נעם","יואב"], female:["מיה","יעל","נועה","תמר"], last:["כהן","לוי","מזרחי","פרץ"] },
      chinese: "custom", japanese: "custom", korean: "custom",
      vietnamese: "custom",
      thai:    { male:["สมชาย","วีรภัทร","นพดล","อนันต์"], female:["สุภาวดี","กมล","พรทิพย์","นลิน"], last:["ศรีสุข","จันทร์เพ็ญ","บุญช่วย","ทองดี"] },
      hindi:   { male:["आरव","विवान","अर्जुन","आदित्य","राहुल"], female:["अनन्या","रिया","काव्या","नेहा","प्रियंका"], last:["शर्मा","वर्मा","अग्रवाल","गुप्ता","सिंह"] },
      bengali: { male:["আরিফ","রাহাত","সাব্বির"], female:["সুমাইয়া","নুসরাত","মেহজাবিন"], last:["চৌধুরী","হোসেন","ইসলাম","সরকার"] },
      tamil:   { male:["அருண்","விக்னேஷ்","முருகன்"], female:["அஞ்சலி","காயத்ரி","லட்சுமி"], last:["சுப்பிரமணியன்","நாராயணன்","ராமச்சந்திரன்"] },
      indonesian:{ male:["Muhammad","Rizky","Budi","Agus"], female:["Siti","Nurul","Ayu","Dewi"], last:["Saputra","Pratama","Hidayat","Wijaya"] },
      malay:   { male:["Ahmad","Muhammad","Adam","Hakim"], female:["Siti","Aisyah","Nadia","Hannah"], last:["bin Abdullah","bin Ismail","binti Ahmad","binti Ali"] },
      filipino:{ male:["Juan","Jose","Mark","Paolo"], female:["Maria","Angelica","Jessa","Jasmine"], last:["Santos","Reyes","Cruz","Bautista","Garcia","Dela Cruz"] },
      swahili: { male:["Juma","Hassan","Omar","Kelvin"], female:["Aisha","Zainab","Neema","Grace"], last:["Odhiambo","Mwangi","Njoroge","Ochieng","Kimani"] },
      amharic: { male:["አብርሃም","ዳዊት","ከበደ"], female:["ማሪያም","ሀና","ሰላም"], last:["ተስፋዬ","ገብረ","አለም"] },
      nigerian:{ male:["Oluwaseun","Emeka","Chinedu","Tunde","Ibrahim"], female:["Chioma","Amina","Ada","Ngozi"], last:["Okafor","Adeyemi","Balogun","Okoye","Oladipo"] }
    };

    function pickLang(country){ return LANG[country] || "english"; }

    function buildChinese(){ const s=["王","李","张","刘","陈","杨","赵","黄","周","吴","徐","孙","胡","朱","高","林","何","郭","马","罗"]; const g=["伟","芳","娜","敏","静","磊","强","军","杰","涛","艳","超","明","勇"]; return R(s)+R(g)+(Math.random()>0.6?R(g):""); }
    function buildJapanese(){ const s=["佐藤","鈴木","高橋","田中","伊藤","渡辺","山本","中村","小林","加藤"]; const g=["陽斗","蓮","葵","結衣","大和","空","蒼","さくら","楓"]; return R(s)+" "+R(g); }
    function buildKorean(){ const s=["김","이","박","최","정","윤","장","임","한"]; const g=["민준","서준","예준","도윤","하준","서연","지우","지민","윤서","하윤"]; return R(s)+R(g); }
    function buildVietnamese(gender){ const last=["Nguyễn","Trần","Lê","Phạm","Hoàng","Huỳnh","Phan","Vũ","Đặng"]; const midM=["Văn","Hữu","Minh","Quang"]; const midF=["Thị","Ngọc","Thuỳ","Bích","Kim"]; const given = gender==="Male"?["An","Bảo","Dũng","Hùng","Khánh","Long","Nam","Phong","Quân","Thắng"]:["Anh","Chi","Duyên","Giang","Hà","Linh","Mai","Ngân","Vy"]; return `${R(last)} ${gender==="Male"?R(midM):R(midF)} ${R(given)}`; }

    function makeNameByCountry(country,gender){
      if(country==="Fantasy"){ return R(["Aela","Seren","Thorin","Elara","Kael","Rowan","Dorian","Lyra","Gideon","Mira"])+" "+R(["Stormwind","Blackthorn","Ravenwood","Emberfall","Nightbloom","Ironhart","Frostvale"]); }
      const lang = pickLang(country);
      if(lang==="chinese") return buildChinese();
      if(lang==="japanese") return buildJapanese();
      if(lang==="korean") return buildKorean();
      if(lang==="vietnamese") return buildVietnamese(gender);
      const ds = NAMES[lang] || NAMES.english;
      const first = gender==="Male" ? R(ds.male) : R(ds.female);
      const last  = R(ds.last);
      return `${first} ${last}`;
    }

    // Phone formats by country (simplified but realistic)
    const PHONE = {
      "United States": () => `+1 ${RI(201,989)}-${RI(200,999)}-${RI(1000,9999)}`,
      "United Kingdom": () => `+44 7${RI(0,9)} ${RI(1000,9999)} ${RI(1000,9999)}`,
      "Canada": () => `+1 ${RI(200,999)}-${RI(200,999)}-${RI(1000,9999)}`,
      "Australia": () => `+61 4${RI(0,9)} ${RI(100,999)} ${RI(100,999)}`,
      "Germany": () => `+49 1${RI(5,7)} ${RI(1000000,9999999)}`,
      "France": () => `+33 6 ${RI(10000000,99999999)}`,
      "Spain": () => `+34 6${RI(0,9)} ${RI(100,999)} ${RI(100,999)}`,
      "Italy": () => `+39 3${RI(0,9)} ${RI(1000000,9999999)}`,
      "Netherlands": () => `+31 6 ${RI(10000000,99999999)}`,
      "Poland": () => `+48 ${RI(500,799)} ${RI(100,999)} ${RI(100,999)}`,
      "Czechia": () => `+420 ${RI(600,799)} ${RI(100,999)} ${RI(100,999)}`,
      "Hungary": () => `+36 20 ${RI(100,999)} ${RI(1000,9999)}`,
      "Romania": () => `+40 7${RI(0,9)}${RI(0,9)} ${RI(100,999)} ${RI(100,999)}`,
      "Greece": () => `+30 69${RI(0,9)} ${RI(100,999)} ${RI(1000,9999)}`,
      "Turkey": () => `+90 5${RI(0,5)} ${RI(100,999)} ${RI(1000,9999)}`,
      "Russia": () => `+7 9${RI(0,9)}${RI(0,9)} ${RI(100,999)}-${RI(10,99)}-${RI(10,99)}`,
      "Ukraine": () => `+380 ${RI(39,99)} ${RI(100,999)} ${RI(10,99)} ${RI(10,99)}`,
      "Sweden": () => `+46 7${RI(0,9)} ${RI(100,999)} ${RI(100,999)}`,
      "Norway": () => `+47 4${RI(0,9)} ${RI(10,99)} ${RI(10,99)} ${RI(10,99)}`,
      "Denmark": () => `+45 ${RI(20,29)} ${RI(10,99)} ${RI(10,99)} ${RI(10,99)}`,
      "Switzerland": () => `+41 7${RI(0,9)} ${RI(100,999)} ${RI(10,99)} ${RI(10,99)}`,
      "India": () => `+91 ${RI(60000,99999)} ${RI(10000,99999)}`,
      "Pakistan": () => `+92 3${RI(0,9)} ${RI(100,999)} ${RI(1000000,9999999)}`,
      "Bangladesh": () => `+880 1${RI(3,9)} ${RI(100,999)} ${RI(100,999)}`,
      "Sri Lanka": () => `+94 7${RI(0,9)} ${RI(100,999)} ${RI(100,999)}`,
      "Nepal": () => `+977 98${RI(0,9)}-${RI(100,999)}-${RI(1000,9999)}`,
      "China": () => `+86 1${RI(3,9)}${RI(0,9)} ${RI(1000,9999)} ${RI(1000,9999)}`,
      "Japan": () => `+81 0${RI(7,9)}-${RI(1000,9999)}-${RI(1000,9999)}`,
      "South Korea": () => `+82 010-${RI(1000,9999)}-${RI(1000,9999)}`,
      "Vietnam": () => `+84 0${RI(3,9)} ${RI(1000,9999)} ${RI(100,999)}`,
      "Thailand": () => `+66 0${RI(6,9)}-${RI(1000,9999)}-${RI(100,999)}`,
      "Israel": () => `+972 5${RI(0,9)}-${RI(100,999)}-${RI(1000,9999)}`,
      "Iran": () => `+98 9${RI(0,9)}${RI(0,9)} ${RI(100,999)} ${RI(1000,9999)}`,
      "Saudi Arabia": () => `+966 5${RI(0,9)} ${RI(100,999)} ${RI(100,999)}`,
      "United Arab Emirates": () => `+971 5${RI(0,9)} ${RI(100,999)} ${RI(1000,9999)}`,
      "South Africa": () => `+27 0${RI(6,8)} ${RI(100,999)} ${RI(1000,9999)}`,
      "Nigeria": () => `+234 8${RI(0,1)}0 ${RI(100,999)} ${RI(1000,9999)}`,
      "Brazil": () => `+55 ${RI(11,99)} ${RI(90000,99999)}-${RI(1000,9999)}`
    };

    // Currency map
    const CUR = {
      "United States":"USD","United Kingdom":"GBP","Eurozone":"EUR","Germany":"EUR","France":"EUR","Spain":"EUR","Italy":"EUR","Netherlands":"EUR","Portugal":"EUR","Ireland":"EUR","Belgium":"EUR","Austria":"EUR","Finland":"EUR","Greece":"EUR","Croatia":"EUR",
      "Poland":"PLN","Czechia":"CZK","Hungary":"HUF","Romania":"RON","Bulgaria":"BGN","Sweden":"SEK","Norway":"NOK","Denmark":"DKK","Switzerland":"CHF",
      "Russia":"RUB","Ukraine":"UAH","Belarus":"BYN","Turkey":"TRY","Serbia":"RSD","Bosnia and Herzegovina":"BAM","North Macedonia":"MKD",
      "Canada":"CAD","Australia":"AUD","New Zealand":"NZD","Japan":"JPY","China":"CNY","India":"INR","Pakistan":"PKR","Bangladesh":"BDT","Sri Lanka":"LKR","Nepal":"NPR",
      "Indonesia":"IDR","Malaysia":"MYR","Singapore":"SGD","Philippines":"PHP","Vietnam":"VND","Thailand":"THB","Israel":"ILS","Iran":"IRR",
      "Saudi Arabia":"SAR","United Arab Emirates":"AED","Qatar":"QAR","Kuwait":"KWD","Jordan":"JOD","Egypt":"EGP","Morocco":"MAD","Algeria":"DZD","Tunisia":"TND","Libya":"LYD",
      "South Africa":"ZAR","Nigeria":"NGN","Kenya":"KES","Tanzania":"TZS","Uganda":"UGX","Ghana":"GHS","Ethiopia":"ETB","Brazil":"BRL","Mexico":"MXN","Argentina":"ARS","Chile":"CLP","Peru":"PEN","Colombia":"COP","Uruguay":"UYU","Venezuela":"VES"
    };

    // IBAN support and length (subset but broad)
    const IBAN_LEN = {
      AT:20, AZ:28, BA:20, BE:16, BG:22, BH:22, BR:29, BY:28, CH:21, CR:22, CY:28, CZ:24,
      DE:22, DK:18, DO:28, EE:20, ES:24, FI:18, FO:18, FR:27, GB:22, GE:22, GI:23, GL:18, GR:27, GT:28, HR:21,
      HU:28, IE:22, IL:23, IQ:23, IS:26, IT:27, JO:30, KZ:20, KW:30, LB:28, LC:32, LI:21, LT:20, LU:20,
      LV:21, MC:27, MD:24, ME:22, MK:19, MR:27, MT:31, MU:30, NL:18, NO:15, PK:24, PL:28, PS:29, PT:25, QA:29,
      RO:24, RS:22, SA:24, SC:31, SE:24, SI:19, SK:24, SM:27, TL:23, TN:24, TR:26, UA:29, AE:23, VG:24
    };
    function iso2(country){
      const map = {"United Kingdom":"GB","United States":"US","Netherlands":"NL","Czechia":"CZ","South Africa":"ZA","United Arab Emirates":"AE"};
      // Quick heuristic: take first two letters otherwise
      return map[country] || (country.slice(0,2).toUpperCase());
    }
    function makeIBAN(country){
      const cc = iso2(country);
      if(!(cc in IBAN_LEN)) return null;
      const len = IBAN_LEN[cc];
      // Build with country + checksum + BBAN digits/letters
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let bban = "";
      for(let i=0;i<len-4;i++){ bban += chars[Math.floor(Math.random()*chars.length)]; }
      const chk = RI(10,99);
      return `${cc}${chk} ${bban.match(/.{1,4}/g).join(" ")}`;
    }
    function makeBIC(country){
      const cc = iso2(country);
      const bank = Array.from({length:4}, _=>AtoZ[RI(0,25)]).join("");
      const loc  = AtoZ[RI(0,25)] + AtoZ[RI(0,25)];
      const branch = Math.random()>0.5 ? (AtoZ[RI(0,25)] + AtoZ[RI(0,25)] + AtoZ[RI(0,25)]) : "";
      return `${bank}${cc}${loc}${branch}`;
    }

    // Card brands per country
    function cardBrands(country){
      if(country==="China") return ["UnionPay","Visa","Mastercard"];
      if(country==="Japan") return ["JCB","Visa","Mastercard"];
      if(country==="India") return ["RuPay","Visa","Mastercard"];
      if(country==="Russia") return ["MIR","Visa","Mastercard"];
      if(country==="Turkey") return ["Troy","Visa","Mastercard"];
      if(country==="Brazil") return ["Elo","Visa","Mastercard"];
      if(country==="Nigeria") return ["Verve","Visa","Mastercard"];
      return ["Visa","Mastercard"]; // global default
    }
    function luhnGen(prefix,len=16){
      const d = Array(len).fill(0); d[0]=prefix; for(let i=1;i<len-1;i++) d[i]=RI(0,9);
      let sum=0; for(let i=0;i<len-1;i++){ let x=d[i]; if(((len-1-i)%2)===1){ x*=2; if(x>9)x-=9; } sum+=x; }
      d[len-1]=(10-(sum%10))%10; return d.join("");
    }
    function genCard(country){
      const brand = R(cardBrands(country));
      let number;
      if(brand==="Visa") number = luhnGen(4);
      else if(brand==="Mastercard") number = luhnGen(5);
      else if(brand==="UnionPay") number = "62"+Array.from({length:14},()=>RI(0,9)).join("");
      else if(brand==="JCB") number = "35"+Array.from({length:14},()=>RI(0,9)).join("");
      else if(brand==="MIR") number = "220"+Array.from({length:13},()=>RI(0,9)).join("");
      else if(brand==="RuPay") number = "608"+Array.from({length:13},()=>RI(0,9)).join("");
      else if(brand==="Troy") number = "9792"+Array.from({length:12},()=>RI(0,9)).join("");
      else if(brand==="Elo") number = "636368"+Array.from({length:10},()=>RI(0,9)).join("");
      else if(brand==="Verve") number = "5061"+Array.from({length:12},()=>RI(0,9)).join("");
      else number = luhnGen(4);
      const exp = `${pad2(RI(1,12))}/${String(RI(26,35))}`;
      const cvv = String(RI(100,999));
      return {type: brand, num:number, exp, cvv};
    }

    // Government ID per country
    function govProfile(country){
      if(country==="Fantasy") return { label:"Citizen Mark", id:()=>`${R(['SIG','RUNE','GLYPH'])}-${RI(1000,9999)}-${AtoZ[RI(0,25)]}${AtoZ[RI(0,25)]}` };
      const map = {
        "United States": {label:"SSN", id:()=>`${RI(100,899)}-${RI(10,99)}-${RI(1000,9999)}`},
        "United Kingdom": {label:"NINo", id:()=>`${AtoZ[RI(0,25)]}${AtoZ[RI(0,25)]}${RI(10,99)} ${RI(10,99)} ${AtoZ[RI(0,25)]}`},
        "Canada": {label:"SIN", id:()=>`${RI(100,999)} ${RI(100,999)} ${RI(100,999)}`},
        "Australia": {label:"TFN", id:()=>`${RI(100,999)} ${RI(100,999)} ${RI(100,999)}`},
        "Germany": {label:"Steuer-ID", id:()=>`${RI(100,999)} ${RI(100,999)} ${RI(100,999)} ${RI(10,99)}`},
        "France": {label:"INSEE", id:()=>`${RI(1,2)} ${RI(10,99)} ${RI(1,12)} ${RI(1,95)} ${RI(100,999)} ${RI(100,999)} ${RI(10,99)}`},
        "Spain": {label:"DNI", id:()=>`${RI(10000000,99999999)}-${AtoZ[RI(0,25)]}`},
        "Italy": {label:"Codice Fiscale", id:()=>`${AtoZ[RI(0,25)]}${AtoZ[RI(0,25)]}${AtoZ[RI(0,25)]}${RI(10,99)}${AtoZ[RI(0,25)]}${RI(100,999)}${AtoZ[RI(0,25)]}${RI(100,999)}${AtoZ[RI(0,25)]}`},
        "Netherlands": {label:"BSN", id:()=>`${RI(100000000,999999999)}`},
        "Poland": {label:"PESEL", id:()=>`${RI(10,99)}${pad2(RI(1,12))}${pad2(RI(1,28))}${RI(10000,99999)}`},
        "Czechia": {label:"Rodné číslo", id:()=>`${RI(10,99)}${pad2(RI(1,12))}${pad2(RI(1,28))}/${RI(100,999)}`},
        "Hungary": {label:"Személyi szám", id:()=>`${RI(1000000000,9999999999)}`},
        "Romania": {label:"CNP", id:()=>`${RI(1,8)}${RI(10,99)}${pad2(RI(1,12))}${pad2(RI(1,28))}${RI(100,999)}${RI(0,9)}`},
        "Greece": {label:"AMKA", id:()=>`${pad2(RI(1,28))}${pad2(RI(1,12))}${RI(10,99)}${RI(10000,99999)}`},
        "Turkey": {label:"TCKN", id:()=>`${RI(10000000000,99999999999)}`},
        "Russia": {label:"SNILS", id:()=>`${RI(100,999)}-${RI(100,999)}-${RI(100,999)} ${RI(10,99)}`},
        "Ukraine": {label:"RNOKPP", id:()=>`${RI(1000000000,9999999999)}`},
        "Japan": {label:"My Number", id:()=>`${RI(1000,9999)}-${RI(1000,9999)}-${RI(1000,9999)}`},
        "China": {label:"Resident ID", id:()=>`${RI(100000,999999)}${RI(1950,2004)}${pad2(RI(1,12))}${pad2(RI(1,28))}${RI(100,999)}`},
        "India": {label:"Aadhaar", id:()=>`${RI(1000,9999)} ${RI(1000,9999)} ${RI(1000,9999)}`},
        "Israel": {label:"Teudat Zehut", id:()=>`${RI(10000000,99999999)}`},
        "Iran": {label:"National Code", id:()=>`${RI(1000000000,9999999999)}`},
        "South Africa": {label:"ID Number", id:()=>`${RI(50,99)}${pad2(RI(1,12))}${pad2(RI(1,28))}${RI(1000,9999)}${RI(100,999)}`},
        "Brazil": {label:"CPF", id:()=>`${RI(100,999)}.${RI(100,999)}.${RI(100,999)}-${RI(10,99)}`},
        "Mexico": {label:"CURP", id:()=>`${AtoZ[RI(0,25)]}${AtoZ[RI(0,25)]}${AtoZ[RI(0,25)]}${AtoZ[RI(0,25)]}${RI(1950,2004)}${pad2(RI(1,12))}${pad2(RI(1,28))}${AtoZ[RI(0,25)]}${AtoZ[RI(0,25)]}${RI(0,9)}${RI(0,9)}`}
      };
      return map[country] || {label:"National ID", id:()=>`ID-${RI(100000,999999)}`};
    }

    // Address / city generators (some localized bases)
    const CITY_BASE = {
      "United States":["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Diego","Dallas","San Jose","Austin","Boston","Seattle","Denver","Washington"],
      "United Kingdom":["London","Birmingham","Manchester","Leeds","Glasgow","Sheffield","Liverpool","Bristol","Edinburgh","Cardiff","Belfast"],
      "Canada":["Toronto","Montreal","Vancouver","Calgary","Edmonton","Ottawa","Winnipeg","Hamilton","Kitchener","Quebec City"],
      "Australia":["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast","Canberra","Wollongong","Geelong"],
      "Germany":["Berlin","Hamburg","Munich","Cologne","Frankfurt","Stuttgart","Düsseldorf","Dortmund","Leipzig"],
      "France":["Paris","Marseille","Lyon","Toulouse","Nice","Nantes","Strasbourg","Bordeaux","Lille"],
      "Spain":["Madrid","Barcelona","Valencia","Seville","Zaragoza","Málaga","Palma","Bilbao","Alicante"],
      "Italy":["Rome","Milan","Naples","Turin","Palermo","Genoa","Bologna","Florence","Bari","Catania"],
      "Netherlands":["Amsterdam","Rotterdam","The Hague","Utrecht","Eindhoven","Tilburg","Groningen","Almere","Breda","Nijmegen"],
      "Poland":["Warsaw","Kraków","Łódź","Wrocław","Poznań","Gdańsk"],
      "Ukraine":["Kyiv","Kharkiv","Odesa","Dnipro","Lviv","Mariupol","Zaporizhzhia"],
      "Russia":["Moscow","Saint Petersburg","Novosibirsk","Yekaterinburg","Kazan"]
    };
    const CITY_SUFFIX=["ville","ford","ton","mouth","bury","chester","borough","dale","view","field","bridge","side","stead","worth","port","vale","ridge"];
    const CITY_PREFIX=["Green","Clear","Spring","Fair","River","Ash","Kings","Queens","Mill","Oak","Pine","Stone","Rock","New","Old","North","South","East","West"];
    const STREET_PREFIX=["Oak","Pine","Maple","Cedar","Elm","Willow","Birch","Cherry","Walnut","Hickory","Aspen","Sycamore","Poplar","Chestnut","Spruce","Laurel","Magnolia","Juniper","Holly","Ivy","Silver","Golden","Kings","Queens","Victoria","Prince","Duke","Mill","River","Sunset","Meadow","Hill","Valley","Lake","Forest","Garden","Harbor","Bayside","Park","Station","Church","Union","Liberty","Grand","High","Low","Bridge","Stone","Rock","Fox","Deer","Eagle","Crown"];
    const STREET_TYPE=["St","Street","Ave","Avenue","Rd","Road","Ln","Lane","Blvd","Boulevard","Dr","Drive","Ct","Court","Pl","Place","Ter","Terrace","Way","Close"];
    function makeCity(country){ const base=CITY_BASE[country]; if(base) return R(base); return `${R(CITY_PREFIX)}${R(CITY_SUFFIX)}`; }
    function postcode(country){ if(country==="United Kingdom") return String.fromCharCode(65+RI(0,25))+String.fromCharCode(65+RI(0,25))+RI(1,9)+' '+RI(1,9)+String.fromCharCode(65+RI(0,25))+String.fromCharCode(65+RI(0,25)); if(country==="Ukraine") return String(RI(1000,98999)); return String(RI(10000,99999)); }
    function makeStreet(){ return `${R(STREET_PREFIX)} ${R(STREET_TYPE)}`; }
    function makeAddress(country){
      if(country==="Fantasy"){ const door=RI(1,9999); const streets=["Moonshadow Lane","Dragonspire Way","Aetherial Road","Whispering Grove","Ember Path","Rune Circle","Starlight Avenue","Frostfall Street"]; const cities=["Whiterun","Balmora","Solitude","Riften","Winterhold","Daggerfall","Raven Rock","Mournhold","Ald’ruhn","Cheydinhal","Skingrad","Bruma","Anvil","Vivec"]; const code=R(['IV-42','MK-7','DR-13','EL-88','DW-21']); return `${door} ${R(streets)}, ${R(cities)}, ${code}, Fantasy`; }
      const num=RI(1,9999); return `${num} ${makeStreet()}, ${makeCity(country)}, ${postcode(country)}, ${country}`;
    }

    // Contact helpers
    function phoneByCountry(country){ return (PHONE[country]||(()=>`+${RI(1,99)} ${RI(100,999)} ${RI(1000,9999)}`))(); }

    function build(country){
      const chosen = (country==='any') ? R(COUNTRY_LIST.filter(x=>x!=='Fantasy')) : country;
      const gender = (chosen==='Fantasy') ? R(['Male','Female','Elf','Orc','Khajiit','Argonian']) : (Math.random()>0.5?'Male':'Female');
      const name = makeNameByCountry(chosen, gender);
      const dobY=RI(1950,2004), dobM=RI(1,12), dobD=RI(1,28);
      const dob = `${pad2(dobD)}/${pad2(dobM)}/${dobY}`;
      const now=new Date(), age=now.getFullYear()-dobY - (((now.getMonth()+1)<dobM || ((now.getMonth()+1)===dobM && now.getDate()<dobD))?1:0);

      const idProf = govProfile(chosen);
      const currency = CUR[chosen] || (["France","Germany","Spain","Italy","Netherlands","Portugal","Ireland","Belgium","Austria","Finland","Greece","Croatia"].includes(chosen) ? "EUR" : "USD");

      // Finance
      const card = (chosen==='Fantasy') ? {type:'Guild Credit Token', num:`${RI(1000,9999)}-${RI(1000,9999)}-${RI(1000,9999)}`, exp:`Era ${RI(1,9)}`, cvv:RI(100,999)} : genCard(chosen);
      const iban = makeIBAN(chosen);
      const bic = (iban? makeBIC(chosen) : null);

      // Non-IBAN local details
      let localBank = null;
      if(!iban && chosen!=="Fantasy"){
        if(chosen==="United States"){ localBank = {label:"Routing / Account", value:`${RI(100000000,999999999)} / ${RI(10000000,99999999)}`}; }
        else if(chosen==="Canada"){ localBank = {label:"Transit/Institution/Account", value:`${pad2(RI(1,99))}${RI(0,9)}${RI(0,9)}-${RI(100,999)} / ${RI(1000000,9999999)}`}; }
        else if(chosen==="Australia"){ localBank = {label:"BSB / Account", value:`${RI(100,999)}-${RI(100,999)} / ${RI(100000,999999)}`}; }
        else if(chosen==="India"){ localBank = {label:"IFSC / Account", value:`${AtoZ[RI(0,25)]}${AtoZ[RI(0,25)]}${AtoZ[RI(0,25)]}${AtoZ[RI(0,25)]}${RI(0,9)}${RI(0,9)}${RI(0,9)}${RI(0,9)} / ${RI(10000000000,99999999999)}`}; }
        else { localBank = {label:"Account No", value:`${RI(10000000,999999999)}`}; }
      }

      return {
        chosen, gender, name, dob, age, currency, idProf,
        address: makeAddress(chosen),
        phone: phoneByCountry(chosen),
        card, iban, bic, localBank
      };
    }

    // Render
    function section(title, rows){
      const sec=document.createElement('section'); sec.className='section';
      const h=document.createElement('h3'); h.textContent=title; sec.appendChild(h);
      const grid=document.createElement('div'); grid.className='grid';
      rows.forEach(([k,v,isHtml])=>{
        const lk=document.createElement('div'); lk.className='label'; lk.textContent=k;
        const lv=document.createElement('div'); lv.className='value'; if(isHtml) lv.innerHTML=v; else lv.textContent=v;
        grid.appendChild(lk); grid.appendChild(lv);
      });
      sec.appendChild(grid); return sec;
    }

    async function render(data){
      const recordEl=document.getElementById('record');
      recordEl.classList.remove('hidden');
      recordEl.innerHTML='';

      const wrap=document.createElement('div'); wrap.className='sections';

      wrap.appendChild(section('Identity', [['Name', data.name],['Gender', data.gender],['DOB', data.dob],['Age', String(data.age)]]));
      wrap.appendChild(section('Location', [['Address', data.address],['Country', data.chosen]]));
      wrap.appendChild(section('Contact', [['Phone', data.phone],['Email', '<a class="link-btn" href="#">Click here to get a real email</a>', true]]));

      const govTitle = (data.chosen==='Fantasy')?'Guild & Papers':'Government IDs';
      wrap.appendChild(section(govTitle, [[data.idProf.label, data.idProf.id()],['Passport', (data.chosen==='Fantasy'?`Travel Writ ${RI(100000,999999)}` : `${AtoZ[RI(0,25)]}${AtoZ[RI(0,25)]}${RI(1000000,9999999)}`)],[(data.chosen==='Fantasy'?'Rider Permit':'Driving Licence'), `${AtoZ[RI(0,25)]}${AtoZ[RI(0,25)]}-${RI(100000,999999)}`]]));

      const finRows = [];
      finRows.push([(data.chosen==='Fantasy'?'Guild Token':'Card'), `${data.card.type} ${data.card.num} (Exp: ${data.card.exp}${data.chosen==='Fantasy'?'':(' CVV:'+data.card.cvv)})`]);
      if(data.iban){ finRows.push(['IBAN', data.iban]); finRows.push(['BIC/SWIFT', data.bic]); }
      if(data.localBank){ finRows.push([data.localBank.label, data.localBank.value]); }
      finRows.push(['Currency', data.currency]);
      wrap.appendChild(section('Finance', finRows));

      wrap.appendChild(section('Misc', [['Timezone', R(["UTC-08:00","UTC-05:00","UTC+00:00","UTC+01:00","UTC+02:00","UTC+03:00","UTC+05:30","UTC+08:00","UTC+10:00"])]]));

      recordEl.appendChild(wrap);
      }

    async function generate(){
      try{
        const c = document.getElementById('country').value;
        const data = build(c);
        await render(data);
        const e=document.getElementById('error'); e.classList.add('hidden'); e.textContent='';
      }catch(err){
        console.error(err);
        const e=document.getElementById('error'); e.classList.remove('hidden'); e.textContent='Error: '+err.message;
      }
    }

    window._gen = generate;
    document.getElementById('generate').addEventListener('click', generate);
  });
})();
