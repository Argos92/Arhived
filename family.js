'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const STORAGE_KEY = 'arhived-family-v1';
  const colors = ['#a65d39', '#63765d', '#9d7841', '#717e91', '#986e76', '#6f8881'];
  const statusLabels = { documented: 'По документу', hypothesis: 'Гипотеза', demo: 'Вымышленный пример' };
  const typeLabels = { birth: 'Рождение', residence: 'Проживание', move: 'Переезд', historical: 'Историческое событие' };
  const demoPeople = [
    { id: 'ivan', name: 'Иван Соколов', birth: 1878, death: 1957, parentIds: [] },
    { id: 'maria', name: 'Мария Соколова', birth: 1881, death: 1964, parentIds: [] },
    { id: 'pavel', name: 'Павел Соколов', birth: 1905, death: 1980, parentIds: ['ivan', 'maria'] },
    { id: 'elena', name: 'Елена Соколова', birth: 1910, death: 1992, parentIds: [] },
    { id: 'anna', name: 'Анна Соколова', birth: 1935, death: 2018, parentIds: ['pavel', 'elena'] },
    { id: 'mikhail', name: 'Михаил Соколов', birth: 1962, death: null, parentIds: ['anna'] }
  ];
  const places = { smolensk: ['Смоленск', 54.7826, 32.0453], minsk: ['Минск', 53.9006, 27.559], moscow: ['Москва', 55.7558, 37.6173], kazan: ['Казань', 55.7961, 49.1064], tomsk: ['Томск', 56.4846, 84.9476] };
  const demoRows = [
    ['ivan',1878,'smolensk','birth','Первая страница этой истории открывается в Смоленске: здесь в демонстрационной метрической записи появляется имя Ивана Соколова.'],
    ['maria',1881,'smolensk','birth','В том же городе начинается история Марии. Позднее её имя окажется рядом с именем Ивана в семейных записях.'],
    ['ivan',1903,'minsk','move','Запись о переезде связывает Смоленск с Минском. Так на карте семьи появляется первый маршрут.'],
    ['maria',1903,'minsk','move','Мария также упоминается в Минске. Две отдельные линии семейной истории теперь сходятся в одном городе.'],
    ['pavel',1905,'minsk','birth','В семейной записи указан сын Ивана и Марии — Павел. Его рождение открывает следующую главу летописи.'],
    ['elena',1910,'moscow','birth','Москва становится первой точкой на карте Елены. Сведения о её родителях в этом примере пока не внесены.'],
    ['pavel',1928,'moscow','move','Новая запись приводит Павла в Москву. Между двумя городами остаются годы, о которых документы этой демонстрационной семьи пока молчат.'],
    ['anna',1935,'moscow','birth','В Москве рождается Анна, дочь Павла и Елены. Древо семьи продолжается ещё одним именем.'],
    ['ivan',1941,'kazan','move','В демонстрационном эвакуационном списке местом прибытия Ивана указана Казань. Запись добавляет к семейному маршруту ещё один город.'],
    ['maria',1941,'kazan','move','Мария отмечена в Казани в том же году. Даты совпадают, но каждая запись сохраняет собственный источник.'],
    ['elena',1941,'tomsk','move','Эвакуационная запись переносит линию Елены в Томск. На карте появляется самая восточная точка семейной истории.'],
    ['anna',1941,'tomsk','move','Анна также указана в Томске. Её детские годы в летописи теперь связаны с двумя далёкими друг от друга городами.'],
    ['pavel',1945,'moscow','historical','В условном наградном документе упомянут Павел. Эта запись рассказывает о событии его жизни, но сама по себе не подтверждает проживание в Москве в этот год.'],
    ['elena',1946,'moscow','move','Послевоенная запись вновь указывает Москву. Семейный маршрут Елены замыкает длинную дугу между столицей и Сибирью.'],
    ['anna',1946,'moscow','move','Анна возвращается в московскую часть семейной истории. В демонстрационных данных это последняя запись о её перемещении.'],
    ['ivan',1948,'moscow','move','Документ о проживании отмечает Ивана в Москве. Минск и Казань остаются на его пройденном маршруте.'],
    ['maria',1948,'moscow','move','В Москве появляется и запись о Марии. У семьи вновь есть общий город, отмеченный в нескольких документах.'],
    ['mikhail',1962,'moscow','birth','С рождением Михаила начинается четвёртое представленное поколение. Известна одна родительская связь — с Анной; остальные сведения ещё предстоит добавить.'],
    ['mikhail',1987,'kazan','move','Михаил переезжает в Казань. Для него это новая глава, а для семейной карты — возвращение к городу, уже знакомому по старшим поколениям.'],
    ['mikhail',2025,'kazan','residence','Последняя внесённая запись оставляет Михаила в Казани. Летопись открыта: её можно продолжить новыми событиями и документами.']
  ];
  const demo = { version: 1, family: { title: 'История семьи Соколовых', intro: 'Одна семья, несколько поколений и дороги, соединяющие города. Эта вымышленная летопись показывает, как отдельные записи складываются в общую историю — с именами, датами и местами, которые можно проследить на карте.', demo: true }, people: demoPeople, events: demoRows.map((r, i) => ({ id: `event-${i + 1}`, personId: r[0], year: r[1], place: places[r[2]][0], lat: places[r[2]][1], lon: places[r[2]][2], type: r[3], note: r[4], source: `Демонстрационная запись № ${String(i + 1).padStart(2, '0')} (вымышленный источник)`, url: '', status: 'demo' })) };
  const clone = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const id = () => crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const safeURL = value => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
  const textField = (value, field, max, required = true) => { if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw Error(`Проверьте поле «${field}» (до ${max} символов).`); return value.trim(); };
  const validYear = value => Number.isInteger(value) && value >= 1000 && value <= 2100;
  function validate(raw) {
    if (!raw || raw.version !== 1 || !raw.family || !Array.isArray(raw.people) || !Array.isArray(raw.events)) throw Error('Нужен JSON формата Архивед, версия 1. Используйте экспорт демонстрации как образец.');
    if (raw.people.length > 50 || raw.events.length > 500) throw Error('Допустимо до 50 родственников и 500 событий.');
    if (typeof raw.family.demo !== 'boolean') throw Error('Поле family.demo должно быть true или false.');
    const family = { title: textField(raw.family.title, 'Заголовок', 120), intro: textField(raw.family.intro, 'Вступление', 3000, false), demo: raw.family.demo };
    const people = raw.people.map(p => {
      if (!p || !validYear(p.birth) || (p.death !== null && (!validYear(p.death) || p.death < p.birth))) throw Error('Проверьте годы жизни родственника. Для неизвестного года смерти используйте null.');
      if (!Array.isArray(p.parentIds) || p.parentIds.length > 2 || p.parentIds.some(x => typeof x !== 'string') || new Set(p.parentIds).size !== p.parentIds.length) throw Error('Укажите до двух разных родителей в parentIds.');
      return { id: textField(p.id, 'ID человека', 100), name: textField(p.name, 'Имя', 120), birth: p.birth, death: p.death, parentIds: [...p.parentIds] };
    });
    const personMap = new Map(people.map(p => [p.id, p]));
    if (personMap.size !== people.length) throw Error('ID родственников должны быть уникальными.');
    people.forEach(p => p.parentIds.forEach(parent => { if (!personMap.has(parent) || parent === p.id) throw Error('Связь ссылается на отсутствующего родственника или на самого себя.'); if (personMap.get(parent).birth >= p.birth) throw Error('Год рождения родителя должен предшествовать году рождения ребёнка.'); }));
    const visiting = new Set(), visited = new Set();
    function visit(p) { if (visiting.has(p.id)) throw Error('В древе обнаружен цикл родственных связей.'); if (visited.has(p.id)) return; visiting.add(p.id); p.parentIds.forEach(parent => visit(personMap.get(parent))); visiting.delete(p.id); visited.add(p.id); }
    people.forEach(visit);
    const events = raw.events.map(e => {
      if (!e || !personMap.has(e.personId)) throw Error('Событие ссылается на отсутствующего родственника.');
      const p = personMap.get(e.personId);
      if (!validYear(e.year) || e.year < p.birth || (p.death !== null && e.year > p.death)) throw Error(`Год события должен входить в годы жизни: ${p.name}.`);
      if (!Number.isFinite(e.lat) || !Number.isFinite(e.lon) || Math.abs(e.lat) > 90 || Math.abs(e.lon) > 180) throw Error('Проверьте координаты: широта −90…90, долгота −180…180.');
      if (!Object.hasOwn(typeLabels, e.type) || !Object.hasOwn(statusLabels, e.status)) throw Error('Неизвестный тип или статус события.');
      const url = textField(e.url ?? '', 'URL источника', 2000, false); if (url && !safeURL(url)) throw Error('Для источников допустимы только http:// и https:// ссылки.');
      return { id: textField(e.id, 'ID события', 100), personId: e.personId, year: e.year, lat: e.lat, lon: e.lon, type: e.type, status: e.status, place: textField(e.place, 'Место', 120), note: textField(e.note, 'Описание', 3000), source: textField(e.source, 'Источник', 500), url };
    });
    if (new Set(events.map(e => e.id)).size !== events.length) throw Error('ID событий должны быть уникальными.');
    return { version: 1, family, people, events };
  }
  let data = clone(demo), storageAvailable = true, initialWarning = '';
  try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) data = validate(JSON.parse(stored)); } catch { initialWarning = 'Не удалось прочитать сохранённые данные. Показана демонстрация; сохранённая копия не перезаписана.'; }
  let year = 1946, selected = 'all', activeTab = 'map', playback = null, pendingImport = null, toastTimer;
  let view = { x: 750, y: 95, w: 430, h: 250 };
  const person = personId => data.people.find(p => p.id === personId);
  const color = personId => colors[Math.max(0, data.people.findIndex(p => p.id === personId)) % colors.length];
  const eventsFor = personId => data.events.filter(e => e.personId === personId).sort((a, b) => a.year - b.year);
  const initials = name => name.split(/\s+/).slice(0, 2).map(x => [...x][0] || '').join('');
  const lifespan = p => `${p.birth} — ${p.death ?? 'год смерти не указан'}`;
  function bounds() { const years = [...data.people.flatMap(p => [p.birth, ...(p.death === null ? [] : [p.death])]), ...data.events.map(e => e.year)]; return years.length ? [Math.min(...years), Math.max(...years)] : [1900, new Date().getFullYear()]; }
  function toast(message) { $('#toast').textContent = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').textContent = ''; }, 4500); }
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); storageAvailable = true; $('#save-state').textContent = 'Сохранено в этом браузере'; } catch { storageAvailable = false; $('#save-state').textContent = 'Локальное сохранение недоступно — экспортируйте JSON'; toast('Изменения работают в текущей вкладке. Для сохранения скачайте JSON.'); } }
  function sourceHTML(e) { return `<span class="status-chip ${e.status === 'hypothesis' ? 'hypothesis' : ''}">${statusLabels[e.status]}</span><div class="record-source">${esc(e.source)}${e.url ? `<br><a href="${esc(safeURL(e.url))}" target="_blank" rel="noopener noreferrer">Открыть источник ↗</a>` : ''}</div>`; }
  function locationAt(p) { if (year < p.birth || (p.death !== null && year > p.death)) return null; return eventsFor(p.id).filter(e => e.type !== 'historical' && e.year <= year).at(-1) || null; }
  function renderHeader() {
    document.title = `${data.family.title} — Архивед`; $('#family-title').textContent = data.family.title; $('#monogram').textContent = [...data.family.title.replace(/^История семьи\s*/i, '').trim()][0] || 'А';
    const [min, max] = bounds(); $('#family-subtitle').textContent = `${data.people.length} человек · ${data.events.length} записей · ${min}–${max}`;
    $('#data-notice p').textContent = data.family.demo ? 'Демонстрационная семья. Имена, события и архивные ссылки вымышлены.' : 'Индивидуальная семейная история. Сведения и источники внесены пользователем; независимая проверка не выполнялась.';
    $('#person-filter').innerHTML = '<option value="all">Вся семья</option>' + data.people.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join(''); $('#person-filter').value = selected;
    for (const selector of ['#year-range', '#year-input']) { $(selector).min = min; $(selector).max = max; }
    $('#min-year').textContent = min; $('#max-year').textContent = max; $('#mid-year').textContent = Math.round((min + max) / 2);
  }
  function renderPeople() {
    $('#people-count').textContent = `${data.people.length} человек`;
    $('#people-list').innerHTML = data.people.map(p => { const at = locationAt(p); let location = at ? at.place : year < p.birth ? 'Ещё не родился / не родилась' : p.death !== null && year > p.death ? 'Жизненный путь завершён' : 'Место пока неизвестно'; return `<button class="person-card ${selected === p.id ? 'is-selected' : ''}" data-person="${esc(p.id)}" aria-pressed="${selected === p.id}"><span class="avatar" aria-hidden="true">${esc(initials(p.name))}</span><span class="person-info"><strong>${esc(p.name)}</strong><small>${esc(lifespan(p))}</small><span class="person-location"><i style="background:${color(p.id)}"></i>${esc(location)}</span></span></button>`; }).join('') || '<p class="empty-state">Добавьте первого родственника в редакторе.</p>';
    if (selected === 'all') { $('#selected-record').innerHTML = '<p class="eyebrow">ВЗГЛЯД НА ВСЮ СЕМЬЮ</p><p>Выберите имя в списке или метку на карте, чтобы увидеть запись о человеке.</p>'; return; }
    const p = person(selected), at = locationAt(p);
    $('#selected-record').innerHTML = `<h3>${esc(p.name)}</h3>${at ? `<p>${esc(at.place)} · последняя запись: ${at.year}</p><p>${esc(at.note)}</p>${sourceHTML(at)}<p class="field-note">Это последняя известная точка, а не подтверждение непрерывного проживания до выбранного года.</p>` : '<p>На выбранный год нет подходящей записи о месте проживания. Попробуйте изменить год.</p>'}`;
  }
  function renderEvents() {
    const events = data.events.filter(e => e.year <= year && (selected === 'all' || e.personId === selected)).sort((a,b) => b.year - a.year);
    $('#event-count').textContent = `${events.length} записей`;
    $('#event-list').innerHTML = events.map(e => `<article class="event-card"><div class="event-date">${e.year}<span class="status-chip">${typeLabels[e.type]}</span></div><h3>${esc(person(e.personId).name)}</h3><p class="event-place">${esc(e.place)}</p><p class="event-note">${esc(e.note)}</p>${sourceHTML(e)}</article>`).join('') || '<p class="empty-state">К этому году записей пока нет. Передвиньте ползунок или добавьте событие.</p>';
  }
  const project = (lon, lat) => [(lon + 180) * 4, (90 - lat) * 4];
  function fitMap() {
    const events = data.events.filter(e => selected === 'all' || e.personId === selected);
    if (!events.length) { view = { x: 750, y: 95, w: 430, h: 250 }; drawMap(); return; }
    const points = events.map(e => project(e.lon, e.lat));
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const aspect = ($('#family-map').clientWidth || 800) / ($('#family-map').clientHeight || 470);
    let w = Math.max(100, (Math.max(...xs) - Math.min(...xs)) * 1.5 + 50), h = Math.max(70, (Math.max(...ys) - Math.min(...ys)) * 1.5 + 50);
    if (w / h < aspect) w = h * aspect; else h = w / aspect;
    view = { x: cx - w / 2, y: cy - h / 2, w, h }; drawMap();
  }
  function drawMap() {
    const map = $('#family-map'); map.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
    const unit = Math.max(view.w / (map.clientWidth || 800), view.h / (map.clientHeight || 470));
    const visible = data.people.filter(p => selected === 'all' || p.id === selected);
    const routes = [];
    for (const p of visible) { const es = eventsFor(p.id).filter(e => e.type !== 'historical' && e.year <= year); const pts = es.map(e => project(e.lon, e.lat)); if (pts.length > 1) routes.push(`<polyline class="route" stroke="${color(p.id)}" points="${pts.map(a => a.join(',')).join(' ')}"/>`); }
    $('#routes-layer').innerHTML = routes.join('');
    const seenPlaces = new Map();
    for (const p of visible) for (const e of eventsFor(p.id).filter(e => e.type !== 'historical' && e.year <= year)) seenPlaces.set(`${e.lat},${e.lon}`, e);
    $('#places-layer').innerHTML = [...seenPlaces.values()].map(e => { const [x,y] = project(e.lon,e.lat); return `<g class="visited-place"><circle cx="${x}" cy="${y}" r="${2.5*unit}"/><text x="${x}" y="${y+16*unit}" font-size="${8.5*unit}" text-anchor="middle">${esc(e.place.length>30?e.place.slice(0,28)+'…':e.place)}</text></g>`; }).join('');
    const clusters = new Map(), markers = [];
    visible.forEach(p => { const e = locationAt(p); if (!e) return; const [x,y] = project(e.lon,e.lat); const key = `${e.lat.toFixed(3)},${e.lon.toFixed(3)}`; if (!clusters.has(key)) clusters.set(key, []); clusters.get(key).push({p,e,x,y}); });
    clusters.forEach(group => group.forEach(({p,e,x,y}, i) => {
      const labelX = x + 12 * unit, labelY = y + (i * 43 - (group.length - 1) * 21.5) * unit;
      const fullName = p.name.length > 30 ? `${p.name.slice(0, 28)}…` : p.name;
      const placeName = e.place.length > 27 ? `${e.place.slice(0,25)}…` : e.place;
      const width = Math.min(220, Math.max(115, fullName.length * 6.5 + 18)) * unit;
      markers.push(`<g class="person-marker ${p.id === selected ? 'selected' : ''}" role="button" tabindex="0" aria-label="${esc(p.name)}, ${esc(e.place)}, запись ${e.year}" data-person="${esc(p.id)}"><title>${esc(p.name)} · ${esc(e.place)} · ${e.year}</title><line x1="${x}" y1="${y}" x2="${labelX}" y2="${labelY + 16*unit}" stroke="${color(p.id)}" stroke-width="1" vector-effect="non-scaling-stroke"/><circle class="pin-halo" cx="${x}" cy="${y}" r="${10*unit}" stroke="${color(p.id)}"/><circle class="pin" cx="${x}" cy="${y}" r="${5*unit}" fill="${color(p.id)}"/><rect x="${labelX}" y="${labelY}" width="${width}" height="${36*unit}" rx="${4*unit}"/><text x="${labelX+9*unit}" y="${labelY+14*unit}" font-size="${10.5*unit}">${esc(fullName)}</text><text x="${labelX+9*unit}" y="${labelY+28*unit}" font-size="${8.5*unit}" opacity=".65">${esc(placeName)} · ${e.year}</text></g>`);
    }));
    $('#markers-layer').innerHTML = markers.join('');
  }
  function renderTree() {
    const levels = new Map();
    const descendants = new Map();
    function below(p) { if (descendants.has(p.id)) return descendants.get(p.id); const children = data.people.filter(child => child.parentIds.includes(p.id)); const d = children.length ? Math.max(...children.map(below)) + 1 : 0; descendants.set(p.id, d); return d; }
    const maxDepth = Math.max(0, ...data.people.map(below));
    data.people.forEach(p => levels.set(p.id, maxDepth - below(p)));
    const rows = []; data.people.forEach(p => { const d = levels.get(p.id); (rows[d] ||= []).push(p); });
    for (let d = 0; d <= maxDepth; d++) rows[d] ||= [];
    const width = Math.max(680, ...rows.map(row => row.length * 200 + 20));
    const height = Math.max(150, rows.length * 155 - 25); const positions = new Map();
    rows.forEach((row,d) => row.forEach((p,i) => positions.set(p.id, { x: width / (row.length + 1) * (i+1)-88, y: d*155 })));
    const lines = data.people.flatMap(p => p.parentIds.map(parent => { const a=positions.get(parent), b=positions.get(p.id); return `<path d="M${a.x+88} ${a.y+108} V${a.y+130} H${b.x+88} V${b.y}"/>`; })).join('');
    const tree = $('#family-tree'); tree.style.width = `${width}px`; tree.style.height = `${height}px`;
    tree.innerHTML = `<svg class="tree-edges" viewBox="0 0 ${width} ${height}" aria-hidden="true">${lines}</svg>` + data.people.map(p => { const pos=positions.get(p.id); return `<button class="tree-person ${selected===p.id?'is-selected':''}" title="${esc(p.name)}" data-person="${esc(p.id)}" style="left:${pos.x}px;top:${pos.y}px" aria-pressed="${selected===p.id}"><span class="avatar" aria-hidden="true">${esc(initials(p.name))}</span><strong>${esc(p.name)}</strong><small>${esc(lifespan(p))}</small></button>`; }).join('');
    if (!data.people.length) tree.innerHTML = '<p class="empty-state">Древо появится после добавления родственников.</p>';
    $('#book-title').textContent = data.family.title.replace(/^История семьи\s*/i,'Семья ');
  }
  function renderStory() {
    $('#chronicle-title').textContent = selected === 'all' ? 'Семейная летопись' : `История: ${person(selected).name}`;
    $('#story-intro').textContent = data.family.intro;
    const events = data.events.filter(e => selected === 'all' || e.personId === selected).sort((a,b) => a.year - b.year);
    $('#chronicle').innerHTML = events.map(e => `<article class="chapter"><div class="chapter-year">${e.year}</div><div class="chapter-body"><p class="chapter-person">${esc(person(e.personId).name)} · ${typeLabels[e.type]}</p><h3>${esc(e.place)}. Новая страница.</h3><p class="prose">${esc(e.note)}</p>${sourceHTML(e)}</div></article>`).join('') || '<p class="empty-state">Здесь начнётся летопись после добавления событий.</p>';
    renderTree();
  }
  function renderYear() { $('#year-range').value = year; $('#year-input').value = year; $('#year-label').textContent = year; $('#map-year').textContent = year; renderPeople(); renderEvents(); drawMap(); }
  function renderAll({ fit = false } = {}) { const [min,max]=bounds(); year=Math.min(max,Math.max(min,year)); if(selected !== 'all' && !person(selected)) selected='all'; renderHeader(); renderYear(); renderStory(); fillEditor(); if(fit) fitMap(); }
  function choosePerson(personId) {
    const focusedContainer = document.activeElement?.closest('#people-list, #family-tree, #markers-layer');
    selected = personId; $('#person-filter').value=selected; renderYear(); renderStory();
    if (focusedContainer) [...focusedContainer.querySelectorAll('[data-person]')].find(el => el.dataset.person === personId)?.focus({ preventScroll: true });
  }
  function stopPlayback() { clearInterval(playback); playback=null; $('#play').textContent='▶'; $('#play').setAttribute('aria-label','Воспроизвести временную шкалу'); }
  function setYear(value) { const [min,max]=bounds(); if(!Number.isInteger(value)) return; year=Math.min(max,Math.max(min,value)); renderYear(); }
  function switchTab(tab) {
    stopPlayback(); activeTab=tab;
    for(const key of ['map','story']) { const active=key===tab; $(`#tab-${key}`).setAttribute('aria-selected',active); $(`#tab-${key}`).tabIndex=active?0:-1; $(`#${key}-panel`).hidden=!active; }
    if(tab==='map') requestAnimationFrame(drawMap);
  }
  $('#year-range').addEventListener('input',e=>{stopPlayback();setYear(Number(e.target.value));});
  $('#year-input').addEventListener('change',e=>{stopPlayback();setYear(Number(e.target.value));});
  $('#play').addEventListener('click',()=>{ if(playback){stopPlayback();return;} const [min,max]=bounds(); if(year>=max) setYear(min); $('#play').textContent='Ⅱ';$('#play').setAttribute('aria-label','Остановить временную шкалу');playback=setInterval(()=>{if(year>=max){stopPlayback();return;}setYear(year+1);},500); });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlayback();});
  $('#person-filter').addEventListener('change',e=>choosePerson(e.target.value));
  for(const key of ['map','story']) $(`#tab-${key}`).addEventListener('click',()=>switchTab(key));
  $('.tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tab=e.key==='Home'?'map':e.key==='End'?'story':activeTab==='map'?'story':'map';switchTab(tab);$(`#tab-${tab}`).focus();});
  for(const selector of ['#people-list','#family-tree','#markers-layer']) $(selector).addEventListener('click',e=>{const target=e.target.closest('[data-person]');if(target)choosePerson(target.dataset.person);});
  $('#markers-layer').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const target=e.target.closest('[data-person]');if(target){e.preventDefault();choosePerson(target.dataset.person);}}});
  function zoom(factor) { const w=Math.max(25,Math.min(1700,view.w*factor)),h=w*view.h/view.w;view={x:view.x+(view.w-w)/2,y:view.y+(view.h-h)/2,w,h};drawMap(); }
  $('#zoom-in').addEventListener('click',()=>zoom(.75));$('#zoom-out').addEventListener('click',()=>zoom(1.33));$('#fit-map').addEventListener('click',fitMap);
  let drag=null;
  $('#family-map').addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('[data-person]'))return;drag={x:e.clientX,y:e.clientY,view:{...view}};e.currentTarget.setPointerCapture(e.pointerId);});
  $('#family-map').addEventListener('pointermove',e=>{if(!drag)return;const rect=e.currentTarget.getBoundingClientRect(),scale=Math.max(drag.view.w/rect.width,drag.view.h/rect.height);view={...drag.view,x:drag.view.x-(e.clientX-drag.x)*scale,y:drag.view.y-(e.clientY-drag.y)*scale};drawMap();});
  for(const event of ['pointerup','pointercancel','lostpointercapture']) $('#family-map').addEventListener(event,()=>{drag=null;});
  $('#family-map').addEventListener('keydown',e=>{if(e.target!==e.currentTarget)return;const delta=view.w*.08;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')view.x-=delta;if(e.key==='ArrowRight')view.x+=delta;if(e.key==='ArrowUp')view.y-=delta;if(e.key==='ArrowDown')view.y+=delta;if(e.key==='+'||e.key==='=')zoom(.75);else if(e.key==='-')zoom(1.33);else drawMap();}});
  $('#family-map').addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();zoom(e.deltaY>0?1.12:.89);},{passive:false});
  window.addEventListener('resize',()=>{if(activeTab==='map')drawMap();});
  function initializeGrid() {
    const grid=[];for(let lon=-180;lon<=180;lon+=15){const[x]=project(lon,0);grid.push(`M${x} 0V720`);}for(let lat=-90;lat<=90;lat+=15){const[,y]=project(0,lat);grid.push(`M0 ${y}H1440`);}$('#grid-layer').innerHTML=`<path d="${grid.join('')}"/>`;
  }
  function fillEditor() {
    const form=$('#family-form');form.elements.title.value=data.family.title;form.elements.intro.value=data.family.intro;form.elements.demo.checked=data.family.demo;
    const options=data.people.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
    for(const name of ['parent1','parent2']) $('#person-form').elements[name].innerHTML='<option value="">Не указан</option>'+options;
    const eventForm=$('#event-form');eventForm.elements.personId.innerHTML=options;eventForm.querySelector('button').disabled=!data.people.length;
    if(selected!=='all')eventForm.elements.personId.value=selected;
    eventForm.elements.status.value=data.family.demo?'demo':'documented';
  }
  function editorMessage(message,error=false){$('#editor-message').textContent=message;$('#editor-message').classList.toggle('error',error);}
  function openEditor(){stopPlayback();fillEditor();editorMessage('');$('#editor').showModal();}
  $('#open-editor').addEventListener('click',openEditor);$('#close-editor').addEventListener('click',()=>$('#editor').close());$('#add-story-event').addEventListener('click',()=>{openEditor();$('#event-form').scrollIntoView({block:'start'});});
  function commit(next,message,fit=false) { try {data=validate(next);save();renderAll({fit});editorMessage(message);return true;}catch(e){editorMessage(e.message,true);return false;} }
  $('#family-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),next=clone(data);next.family={title:String(f.get('title')).trim(),intro:String(f.get('intro')).trim(),demo:f.get('demo')==='on'};commit(next,'Сведения о семье сохранены.');});
  $('#person-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),next=clone(data);next.people.push({id:id(),name:String(f.get('name')).trim(),birth:Number(f.get('birth')),death:f.get('death')===''?null:Number(f.get('death')),parentIds:[f.get('parent1'),f.get('parent2')].filter(Boolean)});if(commit(next,'Родственник добавлен. Теперь внесите запись о его месте проживания.'))e.target.reset();});
  $('#event-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),next=clone(data);const event={id:id(),personId:f.get('personId'),year:Number(f.get('year')),type:f.get('type'),place:String(f.get('place')).trim(),lat:Number(f.get('lat')),lon:Number(f.get('lon')),note:String(f.get('note')).trim(),source:String(f.get('source')).trim(),url:String(f.get('url')).trim(),status:f.get('status')};next.events.push(event);const oldYear=year;year=event.year;if(!commit(next,'Событие добавлено в карту и летопись.',true))year=oldYear;else{e.target.reset();fillEditor();}});
  function download() {const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='arhived-family.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('JSON подготовлен для скачивания.');}
  $('#export-data').addEventListener('click',download);$('#download-editor').addEventListener('click',download);
  $('#import-file').addEventListener('change',async e=>{pendingImport=null;$('#import-preview').hidden=true;const file=e.target.files[0];if(!file)return;try{if(file.size>1024*1024)throw Error('Файл превышает 1 МБ.');const raw=JSON.parse(await file.text());pendingImport=validate(raw);$('#import-summary').textContent=`Загрузить «${pendingImport.family.title}»? ${pendingImport.people.length} человек, ${pendingImport.events.length} событий. Текущие данные будут заменены.`;$('#import-preview').hidden=false;editorMessage('Файл проверен. Подтвердите замену данных ниже.');}catch(error){editorMessage(error instanceof SyntaxError?'Не удалось прочитать JSON. Проверьте формат файла.':error.message,true);}});
  $('#cancel-import').addEventListener('click',()=>{pendingImport=null;$('#import-preview').hidden=true;$('#import-file').value='';editorMessage('Импорт отменён.');});
  $('#confirm-import').addEventListener('click',()=>{if(!pendingImport)return;stopPlayback();selected='all';if(commit(pendingImport,'Данные семьи загружены.',true)){pendingImport=null;$('#import-preview').hidden=true;$('#import-file').value='';}});
  function replaceFamily(next){if(!window.confirm('Заменить текущую семью? Несохранённые в JSON сведения будут удалены из этого браузера.'))return;stopPlayback();selected='all';pendingImport=null;$('#import-preview').hidden=true;$('#import-file').value='';commit(next,'Семья заменена.',true);}
  $('#new-family').addEventListener('click',()=>replaceFamily({version:1,family:{title:'История моей семьи',intro:'',demo:false},people:[],events:[]}));
  $('#restore-demo').addEventListener('click',()=>replaceFamily(clone(demo)));
  renderAll({fit:true});initializeGrid();
  if(initialWarning){$('#save-state').textContent=initialWarning;toast(initialWarning);}else if(!storageAvailable)$('#save-state').textContent='Используйте экспорт JSON для сохранения';
})();
