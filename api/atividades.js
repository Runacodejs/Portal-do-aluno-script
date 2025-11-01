const axios = require('axios');

// Função para buscar detalhes de uma única tarefa
async function fetchTaskDetails(taskId, headers) {
    const detailUrl = `https://edusp-api.ip.tv/tms/task/${taskId}`;
    try {
        // A resposta real da API pode ter uma estrutura diferente
        // Esta é uma suposição baseada em APIs comuns
        const response = await axios.get(detailUrl, { headers });
        const data = response.data;
        
        // Mapeia a resposta da API para uma estrutura consistente
        return {
            title: data.title || `Detalhes da Tarefa ${taskId}`,
            questions: (data.items || []).map(item => ({
                text: item.statement,
                alternatives: (item.alternatives || []).map(alt => ({ text: alt.text }))
            }))
        };
    } catch (error) {
        console.error(`Erro ao buscar detalhes da tarefa ${taskId}:`, error.message);
        // Retorna um objeto de erro estruturado
        return { 
            title: `Detalhes da Tarefa ${taskId}`, 
            questions: [], 
            error: "Não foi possível carregar as perguntas." 
        };
    }
}

module.exports = async (req, res) => {
    const { status, id } = req.query;

    // Se um ID de atividade for fornecido, busque os detalhes dessa atividade
    if (id) {
        try {
            // Headers para a requisição de detalhes da atividade
            const detailHeaders = {
                'x-api-key': process.env.EDUSP_API_KEY,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Android 12; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
            };
            const details = await fetchTaskDetails(id, detailHeaders);
            return res.status(200).json(details);
        } catch (error) {
            return res.status(500).json({ message: 'Erro ao buscar detalhes da atividade.' });
        }
    }

    let url;
    let headers;
    let dataMapper;

    // Define a URL e os headers com base no status solicitado
    if (status === 'expiradas') {
        url = 'https://edusp-api.ip.tv/tms/task/todo?expired_only=true&limit=100&offset=0';
        headers = {
            'x-api-key': process.env.EDUSP_API_KEY,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Android 12; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
            'Referer': 'https://saladofuturo.educacao.sp.gov.br/tarefas?status=Expiradas',
        };
        // Mapeia os dados das atividades expiradas
        dataMapper = (response) => ({
            expiradas: response.data.map(item => ({
                title: item.task?.title || 'Atividade Sem Título',
                id: item.task?.id,
            })),
            pendentes: [],
        });
    } else { // Padrão para atividades pendentes
        url = 'https://edusp-api.ip.tv/tms/task?type=model&limit=25&offset=0&orderBy=id';
        headers = {
            'x-api-key': process.env.EDUSP_API_KEY,
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Android 12; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
        };
        // Mapeia os dados das atividades pendentes
        dataMapper = (response) => {
            const items = response.data.items || [];
            return {
                pendentes: items.map(task => ({ title: task.title, id: task.id })),
                expiradas: [],
            };
        };
    }

    try {
        const response = await axios.get(url, { headers });
        const data = dataMapper(response);
        res.status(200).json(data);
    } catch (error) {
        console.error('Erro na API da Vercel:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Erro ao buscar dados da API externa.' });
    }
};