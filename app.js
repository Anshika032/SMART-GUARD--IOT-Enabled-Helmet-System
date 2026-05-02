let currentUser = null;
const speeds = [10,18,25,32,42,58,72,85,78,38,42];
let miniMap = null;
let fullMap = null;
let miniMarker = null;
let fullMarker = null;
let mapRoute = null;
let fullPoiMarkers = [];
let miniPoiMarkers = [];
let usingExternalGps = false;
let usingBrowserGps = false;
let activeContactId = null;
let alertFiltersBound = false;
let lastAlertSyncTs = 0;
const sensorStates = {
  helmet: null,
  alcohol: null,
  accident: null
};
let ignitionOn = true;
const mapState = {
  lat: 26.9124,
  lng: 75.7873
};
const gpsConfig = {
  endpoint: window.SAFERIDE_GPS_ENDPOINT || '',
  pollMs: 2000
};
const nearbyPlaces = [
  {
    type: 'hospital',
    short: 'H',
    name: 'SMS Hospital Jaipur',
    lat: 26.9041,
    lng: 75.8190,
    color: '#00e676'
  },
  {
    type: 'hospital',
    short: 'H',
    name: 'Jaipur Golden Hospital',
    lat: 26.9515,
    lng: 75.7708,
    color: '#00e676'
  },
  {
    type: 'police',
    short: 'P',
    name: 'Lal Kothi Police Station',
    lat: 26.8942,
    lng: 75.8038,
    color: '#00d4ff'
  },
  {
    type: 'police',
    short: 'P',
    name: 'Jaipur Police Control Room',
    lat: 26.9178,
    lng: 75.8087,
    color: '#00d4ff'
  }
];
const STORAGE_KEYS = {
  accounts: 'saferide_accounts_v1',
  contacts: 'saferide_contacts_v1'
};
const defaultAccounts = [
  {name:'Admin',email:'admin@saferide.com',password:'admin123',role:'admin'}
];
const defaultEmergencyContacts = [
  {
    id:'mom',
    icon:'\uD83D\uDE91',
    color:'var(--red)',
    bg:'rgba(255,59,59,0.15)',
    name:'Emergency Contact - Mom',
    phone:'+91 8957631665',
    subtitle:'Primary emergency contact',
    messages:[
      {dir:'out',text:'SAFERIDE ALERT: Accident detected at 26.9124, 75.7873. https://maps.google.com/?q=26.9124,75.7873',time:'22:15 - Sent via SIM800L'},
      {dir:'in',text:'Are you okay? I am calling you now.',time:'22:16 - Received'}
    ]
  },
  {
    id:'police-1',
    icon:'\uD83D\uDC6E',
    color:'var(--cyan)',
    bg:'rgba(0,212,255,0.12)',
    name:'Jaipur Police Control Room',
    phone:'112',
    subtitle:'Nearest police emergency',
    messages:[
      {dir:'out',text:'Emergency rider alert. Location pinned: 26.9124, 75.7873.',time:'22:15 - Sent via GSM'}
    ]
  },
  {
    id:'hospital-1',
    icon:'\uD83C\uDFE5',
    color:'var(--green)',
    bg:'rgba(0,230,118,0.12)',
    name:'SMS Hospital Jaipur',
    phone:'+91 141 251 8387',
    subtitle:'Nearby trauma hospital',
    messages:[
      {dir:'out',text:'Possible accident case. Sharing live coordinates now.',time:'22:16 - Sent via GSM'}
    ]
  },
  {
    id:'hospital-2',
    icon:'\uD83E\uDE7A',
    color:'var(--green)',
    bg:'rgba(0,230,118,0.12)',
    name:'Jaipur Golden Hospital',
    phone:'+91 141 518 8888',
    subtitle:'Nearby emergency hospital',
    messages:[
      {dir:'out',text:'Emergency transport may be required. Stand by.',time:'22:17 - Sent via GSM'}
    ]
  },
  {
    id:'ambulance',
    icon:'\uD83D\uDEA8',
    color:'var(--yellow)',
    bg:'rgba(255,170,0,0.12)',
    name:'National Ambulance Helpline',
    phone:'108',
    subtitle:'24x7 medical emergency',
    messages:[
      {dir:'out',text:'Automatic helmet trigger sent with rider location.',time:'22:16 - Sent via GSM'}
    ]
  }
];

initDataStores();

function readDb(key,fallback){
  try{
    const raw=localStorage.getItem(key);
    if(!raw) return fallback;
    const parsed=JSON.parse(raw);
    return Array.isArray(parsed)?parsed:fallback;
  }catch(_err){
    return fallback;
  }
}

function writeDb(key,value){
  localStorage.setItem(key,JSON.stringify(value));
}

function initDataStores(){
  if(!localStorage.getItem(STORAGE_KEYS.accounts)) writeDb(STORAGE_KEYS.accounts,defaultAccounts);
  if(!localStorage.getItem(STORAGE_KEYS.contacts)) writeDb(STORAGE_KEYS.contacts,defaultEmergencyContacts);
}

function getAccounts(){
  return readDb(STORAGE_KEYS.accounts,defaultAccounts);
}

function saveAccount(acc){
  const all=getAccounts();
  all.push(acc);
  writeDb(STORAGE_KEYS.accounts,all);
}

function getContacts(){
  return readDb(STORAGE_KEYS.contacts,defaultEmergencyContacts);
}

function saveContacts(contacts){
  writeDb(STORAGE_KEYS.contacts,contacts);
}
}

function doLogin(){
  const e=document.getElementById('l-email').value.trim().toLowerCase();
  const p=document.getElementById('l-pass').value;
  if(!e||!p){document.getElementById('err-msg').style.display='block';document.getElementById('err-msg').textContent='Please fill all fields.';return;}
  const match=getAccounts().find(acc=>acc.email.toLowerCase()===e && acc.password===p);
  if(!match){
    document.getElementById('err-msg').style.display='block';
    document.getElementById('err-msg').textContent='Invalid email or password. Please sign up first.';
    return;
  }
  currentUser={name:match.name,email:match.email,role:match.role||'user'};
  enterApp();
}

function doSignup(){
  const n=document.getElementById('s-name').value.trim();
  const e=document.getElementById('s-email').value.trim().toLowerCase();
  const p=document.getElementById('s-pass').value;
  const r=document.getElementById('s-role').value;
  if(!n||!e||!p){document.getElementById('err-msg').style.display='block';document.getElementById('err-msg').textContent='Please fill all fields.';return;}
  if(getAccounts().some(acc=>acc.email.toLowerCase()===e)){
    document.getElementById('err-msg').style.display='block';
    document.getElementById('err-msg').textContent='Account already exists. Please login.';
    return;
  }
  saveAccount({name:n,email:e,password:p,role:r});
  currentUser={name:n,email:e,role:r};
  toast('Account created! Welcome '+n,'green');
  enterApp();
}

function enterApp(){
  document.getElementById('login-page').style.display='none';
  document.getElementById('app').style.display='block';
  const name=currentUser.name;
  lastBackendSignature=null;
  lastTelemetryAt=Date.now();
  syncIgnitionUi(ignitionOn);
  toast('Welcome back, '+name+'!','cyan');
  initLeafletMaps();
  initEmergencyContacts();
  initSpeedBars();
  startGpsIngestion();
  startLiveUpdates();
  startBackendPolling();
}

function logout(){
  document.getElementById('login-page').style.display='flex';
  document.getElementById('app').style.display='none';
  document.getElementById('l-email').value='';
  document.getElementById('l-pass').value='';
  stopBackendPolling();
}

async function fetchBackendData(){
  try{
    const res = await fetch('http://127.0.0.1:5000/status');
    const data = await res.json();

    const statusIndicator = document.getElementById('status-badge');
    if(statusIndicator){
      const telemetryFresh = Date.now() - lastTelemetryAt < 10000;
      const isLive = data.status === 'LIVE' || telemetryFresh;
      if(isLive){
        statusIndicator.innerHTML = '<div class="live-dot"></div>LIVE';
        statusIndicator.style.borderColor = 'rgba(0,230,118,0.25)';
        statusIndicator.style.color = 'var(--green)';
      } else {
        statusIndicator.innerHTML = '<div style="width:6px;height:6px;border-radius:50%;background:var(--red);"></div>OFF';
        statusIndicator.style.borderColor = 'rgba(255,59,59,0.25)';
        statusIndicator.style.color = 'var(--red)';
      }
    }

    const alertCount = document.getElementById('stat-alerts');
    if(alertCount) alertCount.textContent = String(data.alerts ?? 0);

    const smsCount = document.getElementById('stat-sms');
    if(smsCount) smsCount.textContent = String(data.sms ?? 0);

    const callCount = document.getElementById('stat-calls');
    if(callCount) callCount.textContent = String(data.calls ?? 0);

    if(data.accident !== undefined){
      updateSensor('accident', String(data.accident).toUpperCase().includes('ACCIDENT'));
    }

    if(Array.isArray(data.recent_alerts)){
      renderRecentAlerts(data.recent_alerts);
      syncAlertMessages(data.recent_alerts);
    }

    if(data.alert_stats){
      renderAnalytics(data.recent_alerts || [], data.alert_stats);
    }

    const alertCountBadge = document.getElementById('alert-count-badge');
    if(alertCountBadge) alertCountBadge.textContent = `${String(data.alerts ?? 0)} total alerts`;
  }catch(_err){
    // Keep silent when backend is down to avoid noisy UI.
  }
}

function startBackendPolling(){
  if(backendPollTimer) return;
  fetchBackendData();
  backendPollTimer = setInterval(fetchBackendData,2000);
}

function stopBackendPolling(){
  if(!backendPollTimer) return;
  clearInterval(backendPollTimer);
  backendPollTimer = null;
}

function showPage(id, navEl){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(navEl) navEl.classList.add('active');
  else{
    document.querySelectorAll('.nav-item').forEach(n=>{if(n.textContent.toLowerCase().includes(id.slice(0,3)))n.classList.add('active');});
  }
  if(id==='map' && fullMap){
    setTimeout(()=>fullMap.invalidateSize(),120);
  }
}

function initLeafletMaps(){
  if(miniMap && fullMap) return;

  miniMap = L.map('mini-map',{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,tap:false,touchZoom:false});
  fullMap = L.map('full-map',{zoomControl:true,attributionControl:false});

  const tileUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  L.tileLayer(tileUrl,{maxZoom:19}).addTo(miniMap);
  L.tileLayer(tileUrl,{maxZoom:19}).addTo(fullMap);

  miniMap.setView([mapState.lat,mapState.lng],14);
  fullMap.setView([mapState.lat,mapState.lng],14);

  miniMarker=L.circleMarker([mapState.lat,mapState.lng],{radius:6,color:'#00d4ff',weight:2,fillColor:'#00d4ff',fillOpacity:0.8}).addTo(miniMap);
  fullMarker=L.circleMarker([mapState.lat,mapState.lng],{radius:8,color:'#00d4ff',weight:2,fillColor:'#00d4ff',fillOpacity:0.9}).addTo(fullMap);

  mapRoute=L.polyline([[26.9035,75.7612],[26.9084,75.7705],[26.9124,75.7873]],{color:'#00d4ff',weight:3,opacity:0.6,dashArray:'6 6'}).addTo(fullMap);

  const makePoiIcon=(short,color,size='regular')=>L.divIcon({
    className:'',
    html:`<div style="width:${size==='mini'?'20px':'24px'};height:${size==='mini'?'20px':'24px'};border-radius:50%;display:flex;align-items:center;justify-content:center;background:${color};color:#08080f;font-family:Orbitron,monospace;font-size:${size==='mini'?'10px':'11px'};font-weight:700;border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 12px ${color}99;">${short}</div>`,
    iconSize:size==='mini'?[20,20]:[24,24],
    iconAnchor:size==='mini'?[10,10]:[12,12]
  });
  / SMART-GUARD Helmet System
/Developed by Anshika Shukla
}

function updateMapLocation(lat,lng){
  mapState.lat=lat;
  mapState.lng=lng;
  if(miniMarker) miniMarker.setLatLng([lat,lng]);
  if(fullMarker) fullMarker.setLatLng([lat,lng]);
  if(miniMap) miniMap.panTo([lat,lng],{animate:true,duration:0.6});
  if(fullMap) fullMap.panTo([lat,lng],{animate:true,duration:0.6});
  if(mapRoute) mapRoute.addLatLng([lat,lng]);
}

function setSpeed(sp){
  const speedValue=document.getElementById('cv-speed');
  const mapSpeed=document.getElementById('map-speed');
  const mapSpeed2=document.getElementById('map-speed2');
  const speedLabel=typeof sp==='number' && !Number.isNaN(sp) ? String(sp) : 'SENSOR REQ';
  if(speedValue) speedValue.textContent=speedLabel;
  if(mapSpeed) mapSpeed.textContent=typeof sp==='number' && !Number.isNaN(sp) ? sp+' km/h' : 'SENSOR REQ';
  if(mapSpeed2) mapSpeed2.textContent=typeof sp==='number' && !Number.isNaN(sp) ? sp+' km/h' : 'SENSOR REQ';

  const speedCard=document.getElementById('card-speed');
  if(speedCard){
    speedCard.className='scard '+(typeof sp==='number' && !Number.isNaN(sp) ? 'c-cyan' : 'c-yellow');
  }
}

function setCoords(lat,lng){
  const latLabel=(lat>=0?lat.toFixed(4):Math.abs(lat).toFixed(4))+' deg '+(lat>=0?'N':'S');
  const lngLabel=(lng>=0?lng.toFixed(4):Math.abs(lng).toFixed(4))+' deg '+(lng>=0?'E':'W');
  const miniCoords=document.querySelector('.map-coords');
  if(miniCoords) miniCoords.textContent=latLabel+'  '+lngLabel;

  const mapBanner=document.getElementById('map-location-banner');
  if(mapBanner) mapBanner.textContent='Location: '+latLabel+', '+lngLabel;

  const latField=document.getElementById('map-lat');
  const lngField=document.getElementById('map-lng');
  if(latField) latField.textContent=lat.toFixed(4)+' deg';
  if(lngField) lngField.textContent=lng.toFixed(4)+' deg';
}

function applyTelemetry(next){
  lastTelemetryAt=Date.now();
  const statusIndicator = document.getElementById('status-badge');
  if(statusIndicator){
    statusIndicator.innerHTML = '<div class="live-dot"></div>LIVE';
    statusIndicator.style.borderColor = 'rgba(0,230,118,0.25)';
    statusIndicator.style.color = 'var(--green)';
  }
  if(typeof next.speed==='number' && !Number.isNaN(next.speed)){
    setSpeed(Math.round(next.speed));
  } else {
    setSpeed(undefined);
  }
  if(typeof next.lat==='number' && typeof next.lng==='number' && !Number.isNaN(next.lat) && !Number.isNaN(next.lng)){
    updateMapLocation(next.lat,next.lng);
    setCoords(next.lat,next.lng);
  }
  const now=new Date();
  document.getElementById('stat-uptime').textContent=now.getHours()%3+'h '+now.getMinutes()+'m';
  document.getElementById('last-seen').textContent='Just now';
}

function handleExternalGps(payload){
  const parsed=normalizeGpsPayload(payload);
  if(!parsed) return;
  usingExternalGps=true;
  applyTelemetry(parsed);
}

function startGpsPolling(url){
  if(!url) return;
  if(gpsPollTimer) clearInterval(gpsPollTimer);
  gpsPollTimer=setInterval(async()=>{
    try{
      const res=await fetch(url,{cache:'no-store'});
      if(!res.ok) return;
      const data=await res.json();
      handleExternalGps(data);
    }catch(_err){
      // Keep simulation running if polling endpoint is not reachable.
    }
  },gpsConfig.pollMs);
}

function startBrowserGeolocation(){
  if(!navigator.geolocation || geoWatchId!==null) return;

  geoWatchId=navigator.geolocation.watchPosition(
    pos=>{
      if(usingExternalGps) return;
      const lat=pos.coords.latitude;
      const lng=pos.coords.longitude;
      const speedMps=typeof pos.coords.speed==='number'?pos.coords.speed:NaN;
      const speedKmh=Number.isNaN(speedMps)?undefined:speedMps*3.6;
      usingBrowserGps=true;
      applyTelemetry({lat,lng,speed:speedKmh});
    },
    _err=>{
      usingBrowserGps=false;
    },
    {
      enableHighAccuracy:true,
      maximumAge:2000,
      timeout:10000
    }
  );
}
    }
    handleExternalGps({lat:payloadOrLat,lng,speed});
  };

  const qp=new URLSearchParams(window.location.search);
  const endpointFromQuery=qp.get('gps');
  const endpoint=endpointFromQuery || gpsConfig.endpoint;
  if(endpoint){
    startGpsPolling(endpoint);
    toast('GPS feed connected','green');
  }else{
    startBrowserGeolocation();
    toast('Using browser GPS when available. Set ?gps=/api/gps/latest for external feed.','yellow');
  }
}

function initSpeedBars(){
  const c=document.getElementById('speed-bars');
  c.innerHTML='';
  speeds.forEach(s=>{
    const b=document.createElement('div');
    b.className='bar';
    b.style.height=(s/150*100)+'%';
    b.style.background=s>=80?'rgba(255,59,59,0.7)':s>=60?'rgba(255,170,0,0.7)':'rgba(0,212,255,0.5)';
    b.title=s+' km/h';
    c.appendChild(b);
  });
}

function renderAlertRow(alertItem){
  const row=document.createElement('div');
  row.className='at-row';

  const typeClass=alertItem.kind==='ACCIDENT'?'badge-red':alertItem.kind==='ALCOHOL'?'badge-red':alertItem.kind==='HELMET OFF'?'badge-cyan':alertItem.kind==='LOW BATTERY'?'badge-yellow':'badge-cyan';
  const severityClass=alertItem.severity==='CRITICAL'?'badge-red':alertItem.severity==='HIGH'?'badge-yellow':'badge-cyan';
  const smsClass=(alertItem.sms||'').toUpperCase()==='SENT'?'badge-green':alertItem.sms==='-'?'badge-cyan':'badge-yellow';
  const statusClass=(alertItem.status||'').toUpperCase()==='RESOLVED'?'badge-green':alertItem.status==='ACTIVE'?'badge-yellow':'badge-cyan';

  row.innerHTML=`
    <span style="color:var(--muted);font-size:10px;">${alertItem.time || ''}</span>
    <span><div class="badge ${typeClass}">${alertItem.kind || ''}</div></span>
    <span><div class="badge ${severityClass}">${alertItem.severity || ''}</div></span>
    <span style="font-size:10px;">${alertItem.message || ''}</span>
    <span><div class="badge ${smsClass}">${alertItem.sms || '-'}</div></span>
    <span><div class="badge ${statusClass}">${alertItem.status || '-'}</div></span>
  `;
  return row;
}

function renderRecentAlerts(alerts){
  const dashboardList=document.getElementById('recent-alert-list');
  const centerList=document.getElementById('alert-center-list');
  const emptyMarkup='<div style="padding:12px 10px;color:var(--muted);font-size:10px;">No alerts yet.</div>';
    } else {
      dashboardList.innerHTML=emptyMarkup;
    }
  }

  if(centerList){
    centerList.innerHTML='';
    if(alerts.length){
      alerts.forEach(alertItem=>centerList.appendChild(renderAlertRow(alertItem)));
    } else {
      centerList.innerHTML=emptyMarkup;
    }
  }
}

function renderAnalytics(alerts, stats){
  renderAlertTrend(alerts);
  renderAlertFrequency(alerts);
  renderHelmetUsage(stats.helmet_usage || {worn:0, off:100});
}

function renderAlertTrend(alerts){
  const svg=document.getElementById('analytics-alert-trend');
  if(!svg) return;
  const width=700;
  const height=120;
  const counts=[0,0,0,0,0,0,0];
  const labels=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  alerts.forEach(item=>{
    const index=item.ts ? new Date(item.ts * 1000).getDay() : new Date().getDay();
    counts[index]+=1;
  });

  const max=Math.max(1,...counts);
  const step=width/(counts.length-1);
  const points=counts.map((count,index)=>{
    const x=index*step;
    const y=height-20-(count/max)*60;
    return `${x},${y}`;
  }).join(' ');

  svg.innerHTML=`
    <defs>
      <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#00d4ff" stop-opacity=".28"/>
        <stop offset="100%" stop-color="#00d4ff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polyline fill="none" stroke="#00d4ff" stroke-width="2.5" points="${points}"/>
    <polygon fill="url(#ag)" points="0,${height} ${points} ${width},${height}"/>
  `;

  const labelWrap=document.getElementById('analytics-trend-labels');
  if(labelWrap){
    labelWrap.innerHTML=labels.map((label,index)=>`<span>${label}</span>`).join('');
  }
}

function renderAlertFrequency(alerts){
  const wrap=document.getElementById('analytics-frequency-bars');
  if(!wrap) return;
  const labels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const counts=[0,0,0,0,0,0,0];

  alerts.forEach(item=>{
    const index=item.ts ? new Date(item.ts * 1000).getDay() : new Date().getDay();
    counts[index]+=1;
  }).join('');
}

function renderHelmetUsage(helmetUsage){
  const percent=Math.max(0,Math.min(100,Math.round(helmetUsage.worn || 0)));
  const off=Math.max(0,100-percent);
  const percentNode=document.getElementById('analytics-helmet-percent');
  const wornNode=document.getElementById('analytics-helmet-worn');
  const offNode=document.getElementById('analytics-helmet-off');
  const ringNode=document.getElementById('analytics-helmet-ring');

  if(percentNode) percentNode.textContent=`${percent}%`;
  if(wornNode) wornNode.textContent=`Worn: ${percent}%`;
  if(offNode) offNode.textContent=`Off: ${off}%`;
  if(ringNode){
    const dash=Math.round(188 * (percent / 100));
    ringNode.setAttribute('stroke-dasharray', `${dash} 220`);
    ringNode.setAttribute('stroke-dashoffset', '-27');
  }
}

function startLiveUpdates(){
  if(liveTimer) clearInterval(liveTimer);
  liveTimer=setInterval(()=>{
    if(usingExternalGps || usingBrowserGps) return;
    const nextLat=mapState.lat+(Math.random()-0.5)*0.0012;
    const nextLng=mapState.lng+(Math.random()-0.5)*0.0012;
    applyTelemetry({lat:nextLat,lng:nextLng});
  
  }
}

function updateIgnition(val){
  ignitionOn=!!val;
  syncIgnitionUi(ignitionOn);
  if(!ignitionOn){
    toast('Ignition turned off. System status updated.','yellow');
  }
}

function syncIgnitionUi(isOn){
  const ignitionToggle=document.getElementById('ignition-toggle');
  if(ignitionToggle) ignitionToggle.checked=!!isOn;

  const ignitionLabel=document.getElementById('ignition-state');
  if(ignitionLabel) ignitionLabel.textContent=isOn ? 'ON' : 'OFF';
}

function syncDeviceSensorUi(type, val){
  if(type==='helmet'){
    const toggle=document.getElementById('helmet-toggle');
    if(toggle) toggle.checked=!!val;
  }
  if(type==='alcohol'){
    const toggle=document.getElementById('alcohol-toggle');
    if(toggle) toggle.checked=!!val;
  }
  if(type==='accident'){
    const toggle=document.getElementById('accident-toggle');
    if(toggle) toggle.checked=!!val;
  }
}

function sendSimData(){
  toast('Success: Sensor data sent to dashboard!','green');
}

function sendMsg(){
  const inp=document.getElementById('chat-input');
  const text=inp.value.trim();
  if(!text || !activeContactId) return;
  const contacts=getContacts();
  const target=contacts.find(c=>c.id===activeContactId);
  if(!target) return;
  const msg={dir:'out',text, time:'Now - Sent via GSM'};
  target.messages.push(msg);
  saveContacts(contacts);
  renderChatMessages(target.messages);
  renderEmergencyContacts();
  inp.value='';
  toast('Message sent via SIM800L','cyan');
}

function renderChatMessages(messages){
  const c=document.getElementById('chat-msgs');
  c.innerHTML='';
  if(!messages || !messages.length){
    const empty=document.createElement('div');
    empty.style.padding='18px';
    empty.style.color='var(--muted)';
    empty.style.fontSize='11px';
    empty.style.border='1px dashed var(--border2)';
    empty.style.borderRadius='12px';
    empty.style.background='var(--surface2)';
    empty.textContent='No messages yet. Alerts will appear here automatically.';
    c.appendChild(empty);
    return;
  }
  messages.forEach(msg=>{
    const div=document.createElement('div');
    const msgClass=msg.dir==='out'?'msg-out':'msg-in';
    const align=msg.dir==='out'?' style="text-align:right"':'';
    div.innerHTML=`<div class="msg-bubble ${msgClass}">${msg.text}</div><div class="msg-time"${align}>${msg.time}</div>`;
    c.appendChild(div);
  });
  c.scrollTop=c.scrollHeight;
}

function selectContact(contactId){
  const contacts=getContacts();
  const contact=contacts.find(c=>c.id===contactId);
  if(!contact) return;
  activeContactId=contactId;
  document.querySelectorAll('.contact-item').forEach(item=>item.classList.remove('active'));
  const activeRow=document.querySelector(`.contact-item[data-id="${contactId}"]`);
  renderChatMessages(contact.messages||[]);
}

function renderEmergencyContacts(){
  const wrap=document.getElementById('contact-list-items');
  const contacts=getContacts();
  wrap.innerHTML='';
  contacts.forEach(contact=>{
    const row=document.createElement('div');
    row.className='contact-item'+(contact.id===activeContactId?' active':'');
    row.setAttribute('data-id',contact.id);
    const lastMsg=(contact.messages && contact.messages.length)?contact.messages[contact.messages.length-1].text:contact.subtitle;
    row.innerHTML=`
      <div class="contact-avatar" style="background:${contact.bg};color:${contact.color};">${contact.icon}</div>
      <div style="flex:1;min-width:0;">
        <div class="contact-name" style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${contact.name}</div>
        <div style="font-size:9px;color:var(--green);margin-top:2px;">${contact.phone}</div>
        <div class="contact-last" style="margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${lastMsg}</div>
      </div>
      <div style="font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-left:8px;">${contact.subtitle}</div>
    `;
    row.addEventListener('click',()=>selectContact(contact.id));
    wrap.appendChild(row);
  });
}

function syncAlertMessages(alerts){
  const latestTs = alerts.reduce((max, item) => Math.max(max, Number(item.ts || 0)), 0);
  if(!latestTs || latestTs <= lastAlertSyncTs) return;

  const newAlerts = alerts.filter(item => Number(item.ts || 0) > lastAlertSyncTs);
  if(!newAlerts.length) return;

  const contacts = getContacts();
  let changed = false;

  newAlerts.forEach(alertItem => {
    if(String(alertItem.kind || '').toUpperCase() !== 'ACCIDENT') return;

    const location = `${mapState.lat.toFixed(4)}, ${mapState.lng.toFixed(4)}`;
    const message = `Accident alert: ${alertItem.message || 'impact detected'}. Live location: ${location}.`;
    const contactMap = {
      mom: 'Emergency family alert sent.',
      'police-1': 'Emergency rider alert sent to police control room.',
      'police-2': 'Emergency rider alert sent to nearby police station.',
      'hospital-1': 'Possible accident case shared with nearby hospital.',
      'hospital-2': 'Emergency transport requested from nearby hospital.',
      ambulance: 'Ambulance support requested.'
    };

    contacts.forEach(contact => {
      const template = contactMap[contact.id];
      if(!template) return;
      const alreadyExists = (contact.messages || []).some(msg => msg.text === message);
      if(alreadyExists) return;
      contact.messages = contact.messages || [];
      contact.messages.push({dir:'out', text:`${template} ${message}`, time:'Now - Sent via GSM'});
      changed = true;
    });
  });

  if(changed){
    saveContacts(contacts);
    renderEmergencyContacts();
    if(activeContactId){
      const active = contacts.find(c => c.id === activeContactId);
      if(active) renderChatMessages(active.messages || []);
    }
  }

  lastAlertSyncTs = latestTs;
}

function initEmergencyContacts(){
  const contacts=getContacts();
  if(!contacts.length) return;
  if(!activeContactId) activeContactId=contacts[0].id;
  renderEmergencyContacts();
  selectContact(activeContactId);
}

function initAlertFilters(){
  if(alertFiltersBound) return;
  alertFiltersBound = true;
    });
  });
}

function toast(msg, type='cyan'){
  const tc=document.getElementById('toasts');
  const t=document.createElement('div');
  t.className='toast '+type;
  t.textContent=msg;
  tc.appendChild(t);
  setTimeout(()=>t.remove(),4000);
}

initAlertFilters();

