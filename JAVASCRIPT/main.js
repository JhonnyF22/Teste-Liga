// ------- main.js (Conteúdo principal da lógica) -------
document.addEventListener('DOMContentLoaded', inicializarPagina);

// --- Constantes para seletores do DOM ---
const formularioAgendamentoContainer = document.getElementById('formulario-agendamento-direto-container');
const formAgendamentoDireto = document.getElementById('form-agendamento-direto');
const agendamentoDataInput = document.getElementById('agendamento-data');
const dataSelecionadaFormularioSpan = document.getElementById('data-selecionada-formulario');
const agendamentoEspecialidadeSelect = document.getElementById('agendamento-especialidade');
const agendamentoProfissionalSelect = document.getElementById('agendamento-profissional');
const agendamentoHorarioSelect = document.getElementById('agendamento-horario');
const agendamentoNomePacienteInput = document.getElementById('agendamento-nome-paciente');
const agendamentoConvenioSelect = document.getElementById('agendamento-convenio');
const btnCancelarAgendamentoDireto = document.getElementById('btn-cancelar-agendamento-direto');
const agendamentoDiretoMensagem = document.getElementById('agendamento-direto-mensagem');

const listaAgendamentosUl = document.getElementById('lista-agendamentos');
const atualizarListaAgendamentosBtn = document.getElementById('atualizar-lista-agendamentos');
const anoCorrenteSpan = document.getElementById('ano-corrente');

const daysTagCalendario = document.querySelector(".days"); 

let especialidadesCache = [];
let conveniosCache = [];
let profissionaisCache = [];
const API_BASE_URL = 'http://localhost:3000/api'; 

async function fetchEspecialidadesAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/especialidades`);
        if (!response.ok) throw new Error('Não foi possível carregar especialidades.');
        especialidadesCache = await response.json();
        return especialidadesCache;
    } catch (error) {
        console.error("Erro ao buscar especialidades:", error);
        agendamentoDiretoMensagem.textContent = `Erro ao carregar especialidades: ${error.message}`;
        agendamentoDiretoMensagem.style.display = 'block';
        return [];
    }
}

async function fetchConveniosAPI() {
     try {
        const response = await fetch(`${API_BASE_URL}/convenios`);
        if (!response.ok) throw new Error('Não foi possível carregar convênios.');
        conveniosCache = await response.json();
        return conveniosCache;
    } catch (error) {
        console.error("Erro ao buscar convênios:", error);
        agendamentoDiretoMensagem.textContent = `Erro ao carregar convênios: ${error.message}`;
        agendamentoDiretoMensagem.style.display = 'block';
        return [];
    }
}

async function fetchProfissionaisAPI(especialidadeId = null) {
    try {
        let url = `${API_BASE_URL}/profissionais`;
        if (especialidadeId) {
            url += `?especialidadeId=${especialidadeId}`; // Adapte conforme sua API
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Não foi possível carregar profissionais.');
        // Se não houver filtro por especialidade na API, filtre aqui ou armazene todos
        profissionaisCache = await response.json();
        return especialidadeId ? profissionaisCache.filter(p => p.especialidadeId === parseInt(especialidadeId)) : profissionaisCache;

    } catch (error) {
        console.error("Erro ao buscar profissionais:", error);
        agendamentoDiretoMensagem.textContent = `Erro ao carregar profissionais: ${error.message}`;
        agendamentoDiretoMensagem.style.display = 'block';
        return [];
    }
}

async function fetchHorariosDisponiveisAPI(dataISO, especialidadeId, profissionalId) {
    if (!dataISO || !especialidadeId || !profissionalId) {
        console.warn("Dados insuficientes para buscar horários.");
        return [];
    }
    try {
        const response = await fetch(`${API_BASE_URL}/disponibilidades`, { // Assumindo POST como no PDF
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: dataISO,
                especialidadeId: parseInt(especialidadeId),
                medico: profissionalId // Ou o nome/ID do médico conforme a API espera
            }),
        });
        if (!response.ok) throw new Error('Não foi possível carregar os horários disponíveis.');
        const horariosCompletos = await response.json();
        return horariosCompletos.filter(h => h.disponivel); // Retorna apenas os disponíveis
    } catch (error) {
        console.error("Erro ao buscar horários:", error);
        agendamentoDiretoMensagem.textContent = `Erro ao carregar horários: ${error.message}`;
        agendamentoDiretoMensagem.style.display = 'block';
        return [];
    }
}

async function agendarConsultaAPI(dadosConsulta) {
    console.log("Enviando para API agendamento:", dadosConsulta);
    
     try {
        const response = await fetch(`${API_BASE_URL}/agendamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosConsulta),
        });
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao agendar.' }));
            throw new Error(errorData.message || `Erro ${response.status}`);
        }
        const data = await response.json();
        return { success: true, message: "Consulta agendada com sucesso!", data };
    } catch (error) {
        console.error("Falha no agendamento API:", error);
        return { success: false, message: error.message };
    }
}

async function fetchAgendamentosAPI(filtros = {}) {
    try {
        const queryParams = new URLSearchParams(filtros).toString();
        const response = await fetch(`${API_BASE_URL}/agendamentos${queryParams ? '?' + queryParams : ''}`);
        if (!response.ok) throw new Error('Não foi possível carregar agendamentos.');
        return await response.json();
    } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
        return [];
    }
}

// --- Funções de UI e Manipulação do DOM ---
function popularSelect(selectElement, data, valorKey = 'id', textoKey = 'nome', placeholderPrimeiraOpcao = "Selecione") {
    if (!selectElement) return;
    selectElement.innerHTML = `<option value="">${placeholderPrimeiraOpcao}</option>`;
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valorKey];
        option.textContent = item[textoKey];
        selectElement.appendChild(option);
    });
}

function resetarSelect(selectElement, placeholderMensagem) {
    if (!selectElement) return;
    selectElement.innerHTML = `<option value="">${placeholderMensagem}</option>`;
}

async function atualizarProfissionaisNoFormulario() {
    const especialidadeId = agendamentoEspecialidadeSelect.value;
    resetarSelect(agendamentoProfissionalSelect, "Selecione a Especialidade Primeiro");
    resetarSelect(agendamentoHorarioSelect, "Selecione Especialidade e Médico");
    if (especialidadeId) {
        const profissionais = await fetchProfissionaisAPI(especialidadeId);
        popularSelect(agendamentoProfissionalSelect, profissionais, 'id', 'nome', "Selecione o Profissional");
    }
}

async function atualizarHorariosNoFormulario() {
    const dataISO = agendamentoDataInput.value;
    const especialidadeId = agendamentoEspecialidadeSelect.value;
    const profissionalId = agendamentoProfissionalSelect.value; // Assumindo que o value do select é o ID do profissional

    resetarSelect(agendamentoHorarioSelect, "Carregando horários...");

    if (dataISO && especialidadeId && profissionalId) {
        const horariosDisponiveis = await fetchHorariosDisponiveisAPI(dataISO, especialidadeId, profissionalId);
        if (horariosDisponiveis.length > 0) {
            popularSelect(agendamentoHorarioSelect, horariosDisponiveis, 'horaInicio', 'horaInicio', "Selecione um Horário");
        } else {
            resetarSelect(agendamentoHorarioSelect, "Nenhum horário disponível");
        }
    } else {
        resetarSelect(agendamentoHorarioSelect, "Preencha Data, Especialidade e Médico");
    }
}

function abrirFormularioAgendamentoDireto(selectedDate) {
    if (!formularioAgendamentoContainer || !agendamentoDataInput || !dataSelecionadaFormularioSpan) return;

    const dataFormatada = selectedDate.toLocaleDateString('pt-BR');
    const dataISO = selectedDate.toISOString().split('T')[0];

    dataSelecionadaFormularioSpan.textContent = dataFormatada;
    agendamentoDataInput.value = dataISO;

    // Resetar e popular campos dependentes
    popularSelect(agendamentoEspecialidadeSelect, especialidadesCache, 'id', 'nome', "Selecione a Especialidade");
    resetarSelect(agendamentoProfissionalSelect, "Selecione a Especialidade Primeiro");
    resetarSelect(agendamentoHorarioSelect, "Selecione Especialidade e Médico");
    popularSelect(agendamentoConvenioSelect, conveniosCache, 'id', 'nome', "Selecione o Convênio");


    formAgendamentoDireto.reset(); // Limpa outros campos como nome do paciente
    agendamentoDataInput.value = dataISO; // Re-seta a data pois o reset geral a limpa
    agendamentoEspecialidadeSelect.value = ""; // Garante que o placeholder seja exibido


    agendamentoDiretoMensagem.style.display = 'none';
    formularioAgendamentoContainer.style.display = 'block';
    agendamentoNomePacienteInput.focus();
}

function renderizarAgendamentos(agendamentos) {
    if (!listaAgendamentosUl) return;
    listaAgendamentosUl.innerHTML = '';
    if (!agendamentos || agendamentos.length === 0) {
        listaAgendamentosUl.innerHTML = '<li>Nenhum agendamento encontrado.</li>';
        return;
    }
    agendamentos.forEach(ag => {
        const li = document.createElement('li');
        try {
            const dataHora = new Date(ag.dataHora); // dataHora deve ser uma string ISO válida
            li.textContent = `Paciente: ${ag.paciente} - ${ag.especialidadeNome || 'N/A'} com ${ag.medico || 'N/A'} em ${dataHora.toLocaleDateString('pt-BR')} ${dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        } catch (e) {
            li.textContent = `Agendamento com dados inválidos: ${ag.paciente || 'Paciente Desconhecido'}`;
            console.error("Erro ao formatar data do agendamento:", ag.dataHora, e);
        }
        listaAgendamentosUl.appendChild(li);
    });
}

// --- Event Handlers ---
function addDayClickListeners() { // Esta função é chamada por renderCalendar
    if (!daysTagCalendario) return;
    const dayElements = daysTagCalendario.querySelectorAll("li:not(.inactive)");
    dayElements.forEach(dayElement => {
        dayElement.addEventListener("click", () => {
            // Remove a classe 'selected' de qualquer outro dia
            daysTagCalendario.querySelectorAll("li.selected").forEach(el => el.classList.remove("selected"));
            // Adiciona a classe 'selected' ao dia clicado
            dayElement.classList.add("selected");

            const day = parseInt(dayElement.dataset.day);
            // Usa as variáveis globais do calendário (currYearCal, currMonthCal)
            const selectedDate = new Date(currYearCal, currMonthCal, day);
            abrirFormularioAgendamentoDireto(selectedDate);
        });
    });
};

if (agendamentoEspecialidadeSelect) {
    agendamentoEspecialidadeSelect.addEventListener('change', atualizarProfissionaisNoFormulario);
}
if (agendamentoProfissionalSelect) {
    // Também atualiza horários se a data já estiver selecionada e a especialidade também
    agendamentoProfissionalSelect.addEventListener('change', atualizarHorariosNoFormulario);
}

if (formAgendamentoDireto) {
    formAgendamentoDireto.addEventListener('submit', async (event) => {
        event.preventDefault();
        agendamentoDiretoMensagem.style.display = 'none';

        const dadosConsulta = {
            paciente: agendamentoNomePacienteInput.value,
            especialidadeId: parseInt(agendamentoEspecialidadeSelect.value),
            convenioId: parseInt(agendamentoConvenioSelect.value),
            dataHora: `${agendamentoDataInput.value}T${agendamentoHorarioSelect.value}:00`, // Adiciona segundos :00
            medico: agendamentoProfissionalSelect.options[agendamentoProfissionalSelect.selectedIndex].text, 
        };

        if (!dadosConsulta.paciente || !dadosConsulta.especialidadeId || !dadosConsulta.convenioId || !dadosConsulta.dataHora || !agendamentoProfissionalSelect.value || !agendamentoHorarioSelect.value) {
            agendamentoDiretoMensagem.textContent = "Por favor, preencha todos os campos obrigatórios.";
            agendamentoDiretoMensagem.style.display = 'block';
            return;
        }

        const resultado = await agendarConsultaAPI(dadosConsulta);
        if (resultado.success) {
            agendamentoDiretoMensagem.textContent = resultado.message;
            agendamentoDiretoMensagem.classList.remove('erro');
            agendamentoDiretoMensagem.classList.add('sucesso');
            formAgendamentoDireto.reset();
            formularioAgendamentoContainer.style.display = 'none';
            // Remover classe 'selected' do calendário
            daysTagCalendario.querySelectorAll("li.selected").forEach(el => el.classList.remove("selected"));
            await carregarAgendamentos(); // Atualizar lista de agendamentos
        } else {
            agendamentoDiretoMensagem.textContent = `Falha: ${resultado.message}`;
            agendamentoDiretoMensagem.classList.remove('sucesso');
            agendamentoDiretoMensagem.classList.add('erro');
        }
        agendamentoDiretoMensagem.style.display = 'block';
    });
}

if (btnCancelarAgendamentoDireto) {
    btnCancelarAgendamentoDireto.addEventListener('click', () => {
        formAgendamentoDireto.reset();
        formularioAgendamentoContainer.style.display = 'none';
        agendamentoDiretoMensagem.style.display = 'none';
        // Remover classe 'selected' do calendário
        daysTagCalendario.querySelectorAll("li.selected").forEach(el => el.classList.remove("selected"));
    });
}

if (atualizarListaAgendamentosBtn) {
    atualizarListaAgendamentosBtn.addEventListener('click', carregarAgendamentos);
}

async function carregarAgendamentos() {
    const agendamentos = await fetchAgendamentosAPI();
    renderizarAgendamentos(agendamentos);
}

// --- Inicialização ---
async function inicializarPagina() {
    if (anoCorrenteSpan) anoCorrenteSpan.textContent = new Date().getFullYear();

    renderCalendar(); 
    especialidadesCache = await fetchEspecialidadesAPI();
    conveniosCache = await fetchConveniosAPI();
    await carregarAgendamentos(); 
}