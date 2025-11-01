const axios = require('axios');

// Função auxiliar para buscar detalhes de uma única tarefa (com estrutura simulada)
const fetchTaskDetails = async (taskId, headers) => {
    // Esta é uma simulação. A URL e a estrutura da resposta real podem ser diferentes.
    // A URL real para os detalhes de uma tarefa precisaria ser descoberta.
    const detailUrl = `https://edusp-api.ip.tv/tms/task/${taskId}`;

    // Para fins de demonstração, retornaremos dados de exemplo, 
    // já que o endpoint real e a estrutura da resposta são desconhecidos.
    return Promise.resolve({
        title: `Detalhes da Tarefa ${taskId}`,
        questions: [
            {
                text: "Qual é a capital do Brasil?",
                alternatives: [{ text: "São Paulo" }, { text: "Rio de Janeiro" }, { text: "Brasília" }]
            },
            {
                text: "Quanto é 2 + 2?",
                alternatives: [{ text: "3" }, { text: "4" }, { text: "5" }]
            }
        ]
    });

    /*
    // Exemplo de como seria com uma chamada de API real:
    try {
        const response = await axios.get(detailUrl, { headers });
        // O mapeamento abaixo dependeria da estrutura da resposta real
        return {
            title: response.data.title,
            questions: response.data.items.map(item => ({
                text: item.statement,
                alternatives: item.alternatives.map(alt => ({ text: alt.text }))
            }))
        };
    } catch (error) {
        console.error(`Erro ao buscar detalhes da tarefa ${taskId}:`, error);
        // Se a API falhar, retorne um erro ou dados de fallback
        return { title: `Detalhes da Tarefa ${taskId}`, questions: [], error: "Não foi possível carregar as perguntas." };
    }
    */
};

module.exports = async (req, res) => {
    const { status, id } = req.query;

    let url;
    let headers;
    let dataMapper;

    // Caso 1: Buscar detalhes de uma atividade específica
    if (id) {
        try {
            const details = await fetchTaskDetails(id, { /* headers aqui se necessário */ });
            return res.status(200).json(details);
        } catch (error) {
            return res.status(500).json({ message: 'Erro ao buscar detalhes da atividade.' });
        }
    }

    // Caso 2: Buscar atividades expiradas
    if (status === 'expiradas') {
        url = 'https://edusp-api.ip.tv/tms/task/todo?expired_only=true&limit=100&offset=0&filter_expired=false&is_exam=false&with_answer=true&is_essay=false&publication_target=rfbb63012c04a6ac4f-l&publication_target=rfbb63012c04a6ac4f-l:kelvisrodri114991594-sp&publication_target=1175&publication_target=1786&publication_target=1766&publication_target=1709&publication_target=762&publication_target=1566&publication_target=1769&publication_target=1793&publication_target=1712&answer_statuses=draft&answer_statuses=pending&with_apply_moment=true';
        headers = {
            'x-api-key': process.env.EDUSP_API_KEY,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Android 12; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
            'Referer': 'https://saladofuturo.educacao.sp.gov.br/tarefas?status=Expiradas',
        };
        dataMapper = (response) => {
            return {
                expiradas: response.data.map(item => ({
                    title: item.task ? item.task.title : (item.title || 'Atividade Sem Título'),
                    id: item.task ? item.task.id : null
                })),
                pendentes: []
            };
        };
    } 
    // Caso 3: Buscar atividades pendentes (padrão)
    else {
        url = 'https://edusp-api.ip.tv/tms/task?type=model&limit=25&offset=0&orderBy=id&with_public=true&deleted_only=false';
        headers = {
            'x-api-key': process.env.EDUSP_API_KEY, // Usando variável de ambiente aqui
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Android 12; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
        };
        dataMapper = (response) => {
            const items = response.data.items || [];
            return {
                pendentes: items.filter(task => !task.expired).map(task => ({ title: task.title, id: task.id })),
                expiradas: items.filter(task => task.expired).map(task => ({ title: task.title, id: task.id }))
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