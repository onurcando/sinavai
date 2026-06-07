export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin.' });
  }

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        listIds: [Number(process.env.BREVO_LIST_SINAVAI || 2)],
        updateEnabled: true,
        attributes: { KAYNAK: 'SinavAI' },
      }),
    });

    if (brevoRes.status === 201 || brevoRes.status === 204) {
      return res.status(200).json({ success: true, message: 'Başarıyla abone oldunuz! 🎉' });
    }
    const data = await brevoRes.json();
    if (data?.code === 'duplicate_parameter') {
      return res.status(200).json({ success: true, message: 'Zaten abonesiniz! ✅' });
    }
    console.error('Brevo error:', data);
    return res.status(500).json({ error: 'Bir hata oluştu, tekrar deneyin.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}
