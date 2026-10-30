/* Pinpoint — headless mobile gameplay safe-area regression tests.
   Run: node --test layout.test.cjs
   Pure layout formula is sourced from the real index.html to catch drift. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync(require('node:path').join(__dirname,'index.html'),'utf8');
const start = html.indexOf('function portraitGameplayLayout(');
const end = html.indexOf('\nfunction resize(){',start);
assert.ok(start>0 && end>start,'measured portrait layout function must exist');
const layout = new Function(html.slice(start,end)+'\nreturn portraitGameplayLayout;')();
assert.match(html, /id="stage"/,'canvas has a measured viewport stage');
assert.match(html, /height:100dvh/,'stage uses dynamic viewport height');
assert.match(html, /stageEl\.clientHeight/,'canvas uses measured stage height');

const devices = [
  ['iPhone compact',320,568,47,21],
  ['iPhone SE',375,667,20,0],
  ['iPhone 15',390,844,59,34],
  ['iPhone 17 Pro',402,874,62,34],
  ['iPhone Plus',430,932,59,34],
  ['iPhone safe area fallback',414,896,0,0],
  ['Android compact',360,740,24,24]
];
for (const [name,w,h,safeTop,safeBottom] of devices) {
  test('layout avoids HUD / launcher / notch collisions on '+name,()=>{
    const k = w/420;
    const p = layout(w,h,safeTop,safeBottom,k);
    const scoreBottom=p.scoreY+p.scoreFont/2;
    const bestTextY=p.centerY-(p.radius+44*k)-11*k;
    assert.ok(p.scoreY-p.scoreFont/2>safeTop+4,'top score clears system status region');
    assert.ok(bestTextY>scoreBottom+12,'wheel BEST label clears live score');
    assert.ok(p.launcherY+25<h-Math.max(24,safeBottom),'launcher clears home indicator');
    assert.ok(p.launcherY-(p.centerY+p.radius)>48,'safe playable distance from wheel to launcher');
    assert.ok(p.radius>32,'wheel still playable');
  });
}
test('desktop and menu keep distinct layout branches',()=>{
  assert.match(html,/if\(state !== ST\.menu && W <= 720 && H > W\)/);
  assert.match(html,/if\(state === ST\.menu\)/);
});

test('standalone iPhone background seam matches canvas fade',()=>{
  const manifest = JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'manifest.json'),'utf8'));
  assert.equal(manifest.background_color,'#120d19');
  assert.equal(manifest.theme_color,'#120d19');
  assert.match(html,/--edge:#120d19/);
  assert.match(html,/html,body\{[^}]*background:var\(--edge\)/);
  assert.match(html,/#stage\{[^}]*background:var\(--edge\)/);
  assert.match(html,/bottomFade\.addColorStop\(1, 'rgba\(18,13,25,1\)'\)/);
  assert.match(html,/<meta name="theme-color" content="#120d19">/);
});
