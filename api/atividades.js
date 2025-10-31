const axios = require('axios');

module.exports = async (req, res) => {
    try {
        const response = await axios.get('https://edusp-api.ip.tv/tms/task?type=model&limit=25&offset=0&orderBy=id&with_public=true&deleted_only=false', {
            headers: {
                'x-api-key': process.env.EDUSP_API_KEY, // A chave da API será uma variável de ambiente
                'Accept': 'application/json, text/plain, */*',
                'x-dash-version': '1.1.1076',
                'User-Agent': 'Mozilla/5.0 (Android 12; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
                'Referer': 'https://cmsp.ip.tv/tms/model',
            }
        });

        const data = response.data;
        
        // Presumindo a mesma estrutura de antes
        const pendentes = data.items.filter(task => !task.expired).map(task => task.title);
        const expiradas = data.items.filter(task => task.expired).map(task => task.title);

        res.status(200).json({ pendentes, expiradas });

    } catch (error) {
        console.error('Erro na API da Vercel:', error);
        res.status(500).json({ message: 'Erro ao buscar dados da API externa.' });
    }
};