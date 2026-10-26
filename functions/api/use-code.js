// ============================================================
// 激活码核销 API —— EdgeOne Pages Functions + KV
// 路由：POST /api/use-code
// 要求：在 EdgeOne Pages 控制台为本项目创建 KV 命名空间，
//       并绑定到函数，变量名必须是 KV_STORE
// 请求：{ "code": "TEST123" }
// 返回：{ ok:true, remaining:2 } 或 { ok:false, reason:'not_found'|'exhausted' }
// ============================================================

// 预置激活码（新增激活码直接在这里加，推送后自动生效）
const SEED = {
  TEST123: 3,
  TOXIC666: 3,
  LIZHI888: 3,
  GONGWEI01: 3,
  YASHI2026: 3,
  NEIJUAN99: 3,
  MOYU520: 3,
  FANNEI01: 3
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const json = (data, status) => new Response(JSON.stringify(data), {
  status: status || 200,
  headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS)
});

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== 'POST') {
    return json({ ok: false, reason: 'method_not_allowed' }, 405);
  }
  try {
    const kv = env && env.KV_STORE;
    if (!kv) return json({ ok: false, reason: 'kv_not_bound' }, 500);

    let code = '';
    try {
      const body = await request.json();
      code = String(body.code || '').trim().toUpperCase();
    } catch (e) { return json({ ok: false, reason: 'bad_request' }, 400); }
    if (!code) return json({ ok: false, reason: 'bad_request' }, 400);

    let rec = await kv.get(code, 'json');
    if (!rec) {
      if (!(code in SEED)) return json({ ok: false, reason: 'not_found' });
      rec = { used: 0, max: SEED[code] || 3 };
    }
    if (rec.used >= rec.max) {
      return json({ ok: false, reason: 'exhausted', remaining: 0 });
    }
    rec.used += 1;
    await kv.put(code, JSON.stringify(rec));
    return json({ ok: true, remaining: rec.max - rec.used });
  } catch (e) {
    return json({ ok: false, reason: 'server_error' }, 500);
  }
}
