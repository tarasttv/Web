// netlify/functions/send-email.js
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;      // пример: IT Solutions <no-reply@itsolutions.team>
  const to = process.env.TO_EMAIL;          // пример: info@itsolutions.team

  if (!key || !from || !to) {
    console.error('Missing env', { hasKey: !!key, from, to });
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: 'Missing environment variables' }) };
  }

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch {}

  const { name = '', phone = '', email = '', comment = '', calc = '' } = payload;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to], // можно указать несколько адресов, если надо
        subject: `Новая заявка с сайта itsolutions.team`,
        text: `Имя: ${name || '-'}\nТелефон: ${phone || '-'}\nEmail: ${email || '-'}\nКомментарий: ${comment || '-'}\n\nКалькулятор:\n${calc || '(нет)'}`,
      }),
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
