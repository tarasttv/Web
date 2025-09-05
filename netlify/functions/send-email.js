// netlify/functions/send-email.js
const { Resend } = require('resend');

function stripHtml(s='') {
  return String(s).replace(/<[^>]+>/g, '').replace(/\s+\n/g, '\n').trim();
}
function escapeHtml(s='') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const hasKey = !!process.env.RESEND_API_KEY;
  const TO = process.env.TO_EMAIL || 'info@itfix.kz';
  const FROM = process.env.FROM_EMAIL || 'IT Solutions <onboarding@resend.dev>';

  let attempted = false;
  let dataId = null;

  try {
    const data = JSON.parse(event.body || '{}');
    const {
      source = 'lead',
      name = '-',
      phone = '-',
      email = '-',
      service = '-',
      message = '-',
      comment = '-',
      calc_type = '-',
      calc_price = '-',
      calc_details = '-',
      site_url = '-'
    } = data;

    const subject = source === 'calc-lead'
      ? `[Калькулятор] ${calc_type} — IT Solutions`
      : `[Заявка] ${service} — IT Solutions`;

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6">
        <h2>${escapeHtml(subject)}</h2>
        <p><b>Имя:</b> ${escapeHtml(name)}</p>
        <p><b>Телефон:</b> ${escapeHtml(phone)}</p>
        ${email && email !== '-' ? `<p><b>E-mail:</b> ${escapeHtml(email)}</p>` : ''}
        ${service && service !== '-' ? `<p><b>Услуга:</b> ${escapeHtml(service)}</p>` : ''}
        ${message && message !== '-' ? `<p><b>Сообщение:</b> ${escapeHtml(message)}</p>` : ''}
        ${comment && comment !== '-' ? `<p><b>Комментарий:</b> ${escapeHtml(comment)}</p>` : ''}
        ${source === 'calc-lead' ? `
          <hr/>
          <p><b>Расчёт:</b> ₸ ${escapeHtml(String(calc_price))}</p>
          <pre style="white-space:pre-wrap">${escapeHtml(calc_details)}</pre>
        ` : ''}
        <hr/>
        <p><i>Источник:</i> ${escapeHtml(source)} · <i>Страница:</i> ${escapeHtml(site_url)}</p>
      </div>
    `;

    if (!hasKey) {
      // Ключа нет — возвращаем диагностику 500, чтобы это было видно сразу
      return {
        statusCode: 500,
        body: JSON.stringify({
          ok: false,
          error: 'Missing RESEND_API_KEY',
          hasKey,
          to: TO,
          from: FROM,
          attempted
        })
      };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    attempted = true;

    const { data: sendData, error } = await resend.emails.send({
      from: FROM,
      to: [TO],
      subject,
      html,
      text: stripHtml(html),
      reply_to: (email && email !== '-') ? [email] : undefined
    });

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          ok: false,
          error: error.message || String(error),
          hasKey,
          to: TO,
          from: FROM,
          attempted
        })
      };
    }

    dataId = sendData?.id || null;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        id: dataId,
        hasKey,
        to: TO,
        from: FROM,
        attempted
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err.message || String(err),
        hasKey,
        to: TO,
        from: FROM,
        attempted,
        id: dataId
      })
    };
  }
};
