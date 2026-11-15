// Manual imports stay in the editor's origin; projects only store a content ID.
async function store() {
  return new Promise<IDBDatabase>((resolve,reject)=>{
    const open=indexedDB.open('audio-lab-imports',1);
    open.onupgradeneeded=()=>open.result.createObjectStore('files');
    open.onsuccess=()=>resolve(open.result);
    open.onerror=()=>reject(open.error);
  });
}
export async function saveImport(file: File) {
  const bytes=await file.arrayBuffer();
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const id=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const db=await store();
  try {
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction('files','readwrite');
      tx.oncomplete=()=>resolve();
      tx.onabort=()=>reject(tx.error);
      tx.objectStore('files').put(file,id);
    });
    return {id:'import:'+id,bytes};
  } finally { db.close(); }
}
export async function readSource(id:string): Promise<ArrayBuffer> {
  if(/^\/audio-lab\/library-[a-f0-9]{24}\.wav$/.test(id)){
    const response=await fetch(id);
    if(!response.ok)throw Error('Falta el segmento de biblioteca');
    return response.arrayBuffer();
  }
  if(!/^import:[a-f0-9]{64}$/.test(id))throw Error('Referencia de audio inválida');
  const db=await store();
  try{
    const blob=await new Promise<Blob>((resolve,reject)=>{
      const request=db.transaction('files').objectStore('files').get(id.slice(7));
      request.onsuccess=()=>request.result?resolve(request.result):reject(Error('Importación ausente'));
      request.onerror=()=>reject(request.error);
    });
    return blob.arrayBuffer();
  }finally{db.close()}
}

