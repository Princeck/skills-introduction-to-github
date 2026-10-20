/* ============================================================
   ZERO — FILES

   The real answer to "connect Zero to my files" and "use my PC's
   storage". The File System Access API lets a page — with your
   explicit pick each time — read a file off your disk, write one
   back, and hold a handle to a whole folder it can then work
   inside. This is your actual filesystem, not a 5 MB browser box.

   Two honest limits:
   • You choose what it can touch. The browser will not let a page
     roam your disk on its own, and that restriction is a feature,
     not a bug — it is what keeps a web page safe to open.
   • It needs a Chromium browser (Chrome, Edge, Brave, Arc). Where
     it is missing, Zero falls back to download/upload, which works
     everywhere but cannot write back in place.
   ============================================================ */

const Files = (() => {
  const supported = () => 'showOpenFilePicker' in window;
  const dirSupported = () => 'showDirectoryPicker' in window;

  let folder = null;              // a connected directory handle, if any

  async function openFile() {
    if (!supported()) return fallbackOpen();
    const [handle] = await window.showOpenFilePicker();
    const file = await handle.getFile();
    return { name: file.name, size: file.size, text: await file.text(), handle };
  }

  /* Save text back to the same file the handle points at. */
  async function writeFile(handle, text) {
    const w = await handle.createWritable();
    await w.write(text);
    await w.close();
  }

  async function saveAs(suggestedName, text) {
    if (!supported()) return fallbackSave(suggestedName, text);
    const handle = await window.showSaveFilePicker({ suggestedName });
    await writeFile(handle, text);
    return handle.name;
  }

  /* Connect a folder. Zero can then list, read and write inside it —
     and only it — for the rest of the session. */
  async function connectFolder() {
    if (!dirSupported()) throw new Error('This browser cannot connect a folder. Chrome, Edge, Brave or Arc can.');
    folder = await window.showDirectoryPicker({ mode: 'readwrite' });
    return folder.name;
  }

  function folderName() { return folder ? folder.name : null; }
  function disconnectFolder() { folder = null; }

  async function list() {
    if (!folder) throw new Error('No folder connected.');
    const out = [];
    for await (const [name, handle] of folder.entries()) {
      let size = null;
      if (handle.kind === 'file') { try { size = (await handle.getFile()).size; } catch {} }
      out.push({ name, kind: handle.kind, size });
    }
    return out.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'directory' ? -1 : 1));
  }

  async function readFrom(name) {
    if (!folder) throw new Error('No folder connected.');
    const handle = await folder.getFileHandle(name);
    const file = await handle.getFile();
    return { name, size: file.size, text: await file.text(), handle };
  }

  async function writeTo(name, text) {
    if (!folder) throw new Error('No folder connected.');
    const handle = await folder.getFileHandle(name, { create: true });
    await writeFile(handle, text);
    return name;
  }

  /* ---- Fallbacks for non-Chromium browsers ---- */
  function fallbackOpen() {
    return new Promise((resolve, reject) => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.onchange = () => {
        const file = inp.files[0];
        if (!file) { reject(new Error('No file chosen.')); return; }
        const rd = new FileReader();
        rd.onload = () => resolve({ name: file.name, size: file.size, text: rd.result, handle: null });
        rd.onerror = () => reject(rd.error);
        rd.readAsText(file);
      };
      inp.click();
    });
  }

  function fallbackSave(name, text) {
    // A normal download: works everywhere, but cannot write back in place.
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    return name;
  }

  const fmtSize = n => {
    if (n == null) return '';
    const u = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return n.toFixed(n < 10 && i ? 1 : 0) + ' ' + u[i];
  };

  return {
    supported, dirSupported, openFile, saveAs, writeFile,
    connectFolder, disconnectFolder, folderName, list, readFrom, writeTo, fmtSize,
  };
})();
