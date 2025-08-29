// netlify/functions/send-email.js
const { Resend } = require('resend');

exports.handler = async (event) => {
  // Только POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const TO = process.env.TO_EMAIL || 'taras.ttv@gmail.com';
    // Для быстрого старта используем технический адрес Resend
    const FROM = process.env.FROM_EMAIL || 'IT Solutions <onboarding@resend.dev>';

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
        <h2>${subject}</h2>
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

    await resend.emails.send({
      from: FROM,
      to: TO,
      subject,
      html
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};

// простая экранизация, чтобы не сломать HTML письма
function escapeHtml(s='') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
