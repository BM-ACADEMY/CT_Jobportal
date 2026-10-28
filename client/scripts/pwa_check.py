"""PWA browser check: installability, service worker, offline page, safe caching and the update prompt.
Run from the client folder:   python3 scripts/pwa_check.py
Needs: python3 + `pip install playwright` (with Chromium available) and esbuild (installed with vite).
Optional env: ESBUILD=path/to/esbuild  CHROMIUM=path/to/chrome
It copies public/ to a temp site, bundles the real src/utils/pwa.js (sonner stubbed) and drives Chromium.
"""
import os, sys, tempfile, shutil, subprocess
CLIENT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TMP = tempfile.mkdtemp(prefix='pwa-check-')
SITE = os.path.join(TMP, 'site')
shutil.copytree(os.path.join(CLIENT, 'public'), SITE)
open(os.path.join(TMP, 'sonner-stub.js'), 'w').write("export const toast = (msg, opts) => { (window.__toasts = window.__toasts || []).push({ msg, opts }); };\n")
open(os.path.join(TMP, 'entry.js'), 'w').write("import { initPwa } from '%s';\ninitPwa();\n" % os.path.join(CLIENT, 'src/utils/pwa.js'))
esbuild = os.environ.get('ESBUILD', 'npx esbuild').split()
subprocess.check_call(esbuild + [os.path.join(TMP, 'entry.js'), '--bundle', '--format=iife', '--alias:sonner=' + os.path.join(TMP, 'sonner-stub.js'),
    '--define:import.meta.env.PROD=true', '--define:import.meta.env.VITE_GA_MEASUREMENT_ID=undefined', '--define:import.meta.env.VITE_META_PIXEL_ID=undefined',
    '--outfile=' + os.path.join(SITE, 'app.js'), '--log-level=error'])
head = open(os.path.join(CLIENT, 'index.html')).read()
open(os.path.join(SITE, 'index.html'), 'w').write(head[:head.index('</head>')] + '</head><body><div id="root">home</div><script src="/app.js"></script></body></html>')
CHROMIUM = os.environ.get('CHROMIUM') or next((p for p in ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'] if os.path.exists(p)), None)
import threading, http.server, socketserver, os, json, time, functools
from playwright.sync_api import sync_playwright

ROOT=SITE
DOWN=[False]
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT,**k)
    def log_message(s,*a): pass
    def do_GET(s):
        p=s.path.split('?')[0]
        if DOWN[0] and not p.startswith('/offline') and not p.startswith('/icons') and p!='/sw.js':
            s.connection.close(); return
        if p.startswith('/api/'):
            s.send_response(200); s.send_header('Content-Type','application/json'); s.end_headers(); s.wfile.write(b'{"ok":true}'); return
        if p.endswith('.webmanifest'):
            data=open(ROOT+p,'rb').read(); s.send_response(200); s.send_header('Content-Type','application/manifest+json'); s.end_headers(); s.wfile.write(data); return
        if not os.path.isfile(ROOT+p) or p=='/':
            # SPA fallback like Vercel
            if not p.startswith('/assets') and not p.startswith('/icons'):
                data=open(ROOT+'/index.html','rb').read(); s.send_response(200); s.send_header('Content-Type','text/html'); s.end_headers(); s.wfile.write(data); return
        return super().do_GET()
socketserver.TCPServer.allow_reuse_address=True
srv=socketserver.ThreadingTCPServer(('127.0.0.1',8765),H)
threading.Thread(target=srv.serve_forever,daemon=True).start()

results=[]
def check(name,ok,detail=''):
    results.append((name,ok,detail)); print(('PASS' if ok else 'FAIL'),name,detail)

with sync_playwright() as p:
    ctx=p.chromium.launch_persistent_context(tempfile.mkdtemp(), executable_path=CHROMIUM, viewport={'width':390,'height':800})
    b=ctx
    page=ctx.new_page()
    page.goto('http://127.0.0.1:8765/')
    page.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.ready.then(()=>true)")
    page.wait_for_timeout(500)
    check('first visit does not force a reload', page.evaluate('performance.getEntriesByType("navigation").length')==1 and page.evaluate('performance.navigation.type')==0)
    page.reload(); page.wait_for_load_state('load')
    page.wait_for_function("!!navigator.serviceWorker.controller", timeout=10000)
    check('service worker active and controlling the page', True)

    cdp=ctx.new_cdp_session(page)
    cdp.send('Page.enable')
    errs=cdp.send('Page.getInstallabilityErrors').get('installabilityErrors',[])
    check('no installability errors', errs==[], str(errs))
    man=cdp.send('Page.getAppManifest')
    check('manifest parsed without errors', not man.get('errors'), str(man.get('errors')))
    m=json.loads(man['data']) if man.get('data') else {}
    check('manifest has 192, 512 and maskable icons', {(i['sizes'],i.get('purpose','any')) for i in m.get('icons',[])}>={('192x192','any'),('512x512','any'),('512x512','maskable')})
    check('display standalone and start_url set', m.get('display')=='standalone' and 'source=pwa' in m.get('start_url',''))

    keys=page.evaluate("caches.keys().then(async ks=>{const out=[];for(const k of ks){const c=await caches.open(k);out.push(...(await c.keys()).map(r=>new URL(r.url).pathname))}return out})")
    check('precache holds offline page and icons only', '/offline.html' in keys and all(not k.startswith('/api') for k in keys), str(keys))

    page.evaluate("fetch('/api/ping').then(r=>r.json())")
    page.wait_for_timeout(300)
    page.evaluate("fetch('/api/ping')")
    keys=page.evaluate("caches.keys().then(async ks=>{const out=[];for(const k of ks){const c=await caches.open(k);out.push(...(await c.keys()).map(r=>new URL(r.url).pathname))}return out})")
    check('API responses are never cached', not any(k.startswith('/api') for k in keys))
    check('HTML pages are never cached', not any(k.endswith('.html') and k!='/offline.html' for k in keys) and '/' not in keys)

    DOWN[0]=True
    page.goto('http://127.0.0.1:8765/candidate/jobs-x', wait_until='domcontentloaded')
    check('offline navigation shows the offline page', 'You are offline' in page.content())
    DOWN[0]=False

    # update flow
    page.goto('http://127.0.0.1:8765/'); page.wait_for_load_state('load')
    page.wait_for_function("!!navigator.serviceWorker.controller")
    open(ROOT+'/sw.js','a').write('\n// new deploy %s\n'%time.time())
    page.evaluate("navigator.serviceWorker.getRegistration().then(r=>r.update())")
    page.wait_for_function("(window.__toasts||[]).length>0", timeout=10000)
    t=page.evaluate("window.__toasts[0].msg")
    check('update prompt appears after a new deploy', 'new version' in t.lower(), t)
    with page.expect_navigation(timeout=10000):
        page.evaluate("window.__toasts[0].opts.action.onClick()")
    check('page reloads onto the new version after Refresh', True)
    b.close()
bad=[r for r in results if not r[1]]
print('\n%d checks, %d failed'%(len(results),len(bad)))
sys.exit(1 if bad else 0)
