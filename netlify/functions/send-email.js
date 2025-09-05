import Resend from 'resend';

export async function handler(event) {
  try {
    const { name, phone, email, comment } = JSON.parse(event.body);

    // ✅ читаем только из переменных окружения
    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL;    // IT Solutions <no-reply@itsolutions.team>
    const to = process.env.TO_EMAIL;        // info@itsolutions.team

    if (!resendApiKey || !from || !to) {
      console.error("Missing environment variables", { resendApiKey: !!resendApiKey, from, to });
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, error: "Missing environment variables" }),
      };
    }

    const resend = new Resend(resendApiKey);

    const result = await resend.emails.send({
      from,
      to,
      subject: `Новая заявка с сайта от ${name || "клиент"}`,
      text: `
Имя: ${name || "-"}
Телефон: ${phone || "-"}
Email: ${email || "-"}
Комментарий: ${comment || "-"}
      `,
    });

    console.log("Resend response:", result);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, result }),
    };
  } catch (err) {
    console.error("Resend error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
}
