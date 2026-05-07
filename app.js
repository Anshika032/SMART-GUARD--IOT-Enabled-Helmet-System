let currentUser = null;
const speeds = [10,18,25,32,42,58,72,85,78,38,42];
let miniMap = null;
let fullMap = null;
let miniMarker = null;
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


function getContacts(){
  return readDb(STORAGE_KEYS.contacts,defaultEmergencyContacts);
}

function saveContacts(contacts){
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

