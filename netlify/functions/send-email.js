// netlify/functions/send-email.js
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const key = process.env.RESEND_API_KEY || '';
  const rawFrom = process.env.FROM_EMAIL || 'IT Solutions <info@itsolutions.team>';
  const toList = (process.env.TO_EMAIL || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Страховка: если from указывает на не верифицированный домен — шлём с resend.dev
  const from = /@itsolutions\.team>/i.test(rawFrom)
    ? 'IT Solutions <onboarding@resend.dev>'
    : rawFrom;

  // Логи для Netlify → Functions → send-email → Logs
  console.log('send-email env', { hasKey: !!key, from, toList });

  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error:'Missing RESEND_API_KEY' }) };
  }
  if (!toList.length) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error:'Missing TO_EMAIL' }) };
  }

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch { /* ignore */ }

  const { name = '', phone = '', email = '', comment = '', calc = '' } = payload;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: toList,
        subject: 'Новая заявка с сайта itsolutions.team',
        text: `Имя: ${name}\nТелефон: ${phone}\nEmail: ${email}\nКомментарий: ${comment}\n\nКалькулятор:\n${calc || '(нет)'}`
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const reason = data?.message || data?.error || data?.name || JSON.stringify(data);
      console.error('Resend error:', reason);
      return { statusCode: 500, body: JSON.stringify({ ok:false, error: reason }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok:true, id: data?.id || null }) };
  } catch (e) {
    console.error('send-email exception:', e);
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: e?.message || 'send_failed' }) };
  }
};
