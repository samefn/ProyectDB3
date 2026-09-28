// ─────────────────────────────────────────────────────────────
//  Inserta un aviso de "Modo demostración" en las páginas HTML.
//  No modifica los archivos de public/: el aviso se agrega al enviarlas.
// ─────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const { DEMO_USER } = require('./seed');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const RESET_MINUTES = Number(process.env.DEMO_RESET_MINUTES || 30);

function bannerHtml(page) {
  const showCredentials = page === 'login.html' || page === 'index.html';
  const credentials = showCredentials
    ? `<div style="margin-top:6px">Entra con <b>usuario:</b> <code style="background:rgba(255,255,255,.15);padding:1px 6px;border-radius:4px">${DEMO_USER.name}</code> · <b>contraseña:</b> <code style="background:rgba(255,255,255,.15);padding:1px 6px;border-radius:4px">${DEMO_USER.password}</code></div>`
    : '';
  return `
<div id="demo-banner" role="status" style="position:fixed;left:16px;bottom:16px;z-index:99999;max-width:min(420px,calc(100vw - 32px));padding:12px 40px 12px 14px;border-radius:12px;background:#1e293b;color:#eef1f6;font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.35);border:1px solid #f37321">
  <div><b style="color:#f37321">Modo demostración</b> · Los datos son de ejemplo y se reinician cada ${RESET_MINUTES} min. No se conecta a bases de datos reales.</div>
  ${credentials}
  <button type="button" aria-label="Cerrar aviso" onclick="this.parentNode.remove()" style="position:absolute;top:6px;right:8px;background:none;border:0;color:#eef1f6;font-size:18px;cursor:pointer;line-height:1">×</button>
</div>`;
}

module.exports = function demoBanner(req, res, next) {
  if (req.method !== 'GET') return next();
  let page = req.path === '/' ? 'index.html' : req.path.replace(/^\//, '');
  if (!page.endsWith('.html')) return next();

  const file = path.join(PUBLIC_DIR, page);
  if (!file.startsWith(PUBLIC_DIR)) return next();

  fs.readFile(file, 'utf8', (err, html) => {
    if (err) return next();
    const injected = html.includes('</body>')
      ? html.replace('</body>', `${bannerHtml(page)}\n</body>`)
      : html + bannerHtml(page);
    res.type('html').send(injected);
  });
};
