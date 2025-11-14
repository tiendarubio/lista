// app.js — Config & helpers
const googleSheetsApiKey = 'AIzaSyAvWylEG-2jRlgYXZBEcPtAWvV-fyBPZgo';
const jsonBinApiKey = '$2a$10$CyV/uYa20LDnSOfu7H/tTOsf96pmltAC/RkQTx73zfXsbCsXk7BxW';

/** BINs por tienda (principal y alterna) */
const STORE_BINS = {
  lista_sexta_calle:      { base:'68c5b46ed0ea881f407ce556', alterna:'69174e9943b1c97be9ad5f6b' },
  lista_centro_comercial: { base:'68c5b4add0ea881f407ce586', alterna:'69174eb7d0ea881f40e85786' },
  lista_avenida_morazan:  { base:'68c5b4e043b1c97be941f83f', alterna:'69174e1ad0ea881f40e8565f' }
};

function getBinId(storeKey, versionKey='base'){
  const rec = STORE_BINS[storeKey];
  if (!rec) return null;
  return rec[versionKey] || rec.base;
}

let CATALOGO_CACHE = null;
function preloadCatalog(){
  if (CATALOGO_CACHE) return Promise.resolve(CATALOGO_CACHE);
  const sheetId = '1b5B9vp0GKc4T_mORssdj-J2vgc-xEO5YAFkcrVX-nHI';
  const sheetRange = 'bd!A2:D5000';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetRange}?key=${googleSheetsApiKey}`;
  return fetch(url).then(r => { if(!r.ok) throw new Error(r.statusText); return r.json(); })
    .then(d => { CATALOGO_CACHE = Array.isArray(d.values) ? d.values : []; return CATALOGO_CACHE; })
    .catch(e => { console.error('Sheets catálogo error:', e); CATALOGO_CACHE = []; return CATALOGO_CACHE; });
}
function loadProductsFromGoogleSheets(){ return preloadCatalog(); }

// JSONBin helpers
function saveToBin(binId, payload){
  if(!binId){ return Promise.reject(new Error('BIN no configurado para esta tienda.')); }
  return fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
    method:'PUT',
    headers:{'Content-Type':'application/json','X-Access-Key':jsonBinApiKey},
    body: JSON.stringify(payload)
  }).then(r => { if(!r.ok) throw new Error(r.statusText); return r.json(); });
}

function loadFromBin(binId){
  if(!binId){ return Promise.resolve(null); }
  return fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
    headers:{'X-Access-Key': jsonBinApiKey}
  }).then(r => { if(!r.ok) throw new Error(r.statusText); return r.json(); })
    .then(d => d.record || null)
    .catch(e => { console.error('JSONBin load error:', e); return null; });
}

// Format datetime in SV
function formatSV(iso){
  if(!iso) return 'Aún no guardado.';
  try{
    const dt = new Date(iso);
    return dt.toLocaleString('es-SV',{ timeZone:'America/El_Salvador', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' });
  }catch(e){ return 'Aún no guardado.'; }
}
