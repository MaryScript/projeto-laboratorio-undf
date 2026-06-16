document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. MAPEAMENTO DE ELEMENTOS ---
    const form = document.getElementById('form-institucional');
    const btnEnviar = document.getElementById('btn-enviar');
    
    const inputs = {
        nome: document.getElementById('nome'),
        email: document.getElementById('email'),
        telefone: document.getElementById('telefone'),
        curso: document.getElementById('curso'),
        turnos: document.querySelectorAll('input[name="turno"]')
    };
      // Tabela de cursos e turnos 
const cursosTurnos = {
    pedagogia: ["matutino"],
    matematica: ["matutino"],
    eng_software: ["matutino"],
    sistemas_informacao: ["matutino"],
    gestao_ambiental: ["matutino", "vespertino"],
    letras_portugues: ["matutino", "noturno"],

    letras_ingles: ["vespertino"],
    atuacao_cenica: ["vespertino"],

    servico_social: ["noturno"],
    producao_cultural: ["noturno"],
    gestao_publica: ["noturno"],
    gestao_ti: ["noturno"],
    danca: ["noturno"],
    ciencia_computacao: ["noturno"],
    ciencias_economicas: ["noturno"],
    psicologia: ["noturno"],
    nutricao: ["noturno"]
};
// --- FUNÇÃO QUE FILTRA OS TURNOS ---
    const atualizarTurnosDisponiveis = () => {
        const cursoSelecionado = inputs.curso.value;
        
        // Se ainda não escolheu nenhum curso, assumimos que todos aparecem
        const turnosPermitidos = cursoSelecionado ? cursosTurnos[cursoSelecionado] : ["matutino", "vespertino", "noturno"];

        inputs.turnos.forEach(radio => {
            const label = radio.closest('label'); // Pega o <label> inteiro para esconder o texto também

            if (turnosPermitidos.includes(radio.value)) {
                label.style.display = ''; // Mostra o turno
                radio.disabled = false;
            } else {
                label.style.display = 'none'; // Esconde o turno
                radio.disabled = true;
                radio.checked = false; // Desmarca automaticamente se estiver marcado
            }
        });

        // Como podemos ter desmarcado um turno inválido, chamamos a validação para atualizar o botão
        if (typeof validarTurno === "function") {
            validarTurno();
            verificarFormularioCompleto();
        }
    };

    const telaLoading = document.getElementById('tela-loading');
    const telaSucesso = document.getElementById('tela-sucesso');
    const erroRede = document.getElementById('erro-rede');

    // Garante que o erro de rede possa receber foco via JavaScript (Acessibilidade)
    if(erroRede) erroRede.setAttribute('tabindex', '-1');

    // --- 2. MÁSCARA DE TELEFONE (Input Forgiveness - Luke Wroblewski) ---
    inputs.telefone.addEventListener('input', (e) => {
        let valor = e.target.value.replace(/\D/g, ''); // Remove letras
        if (valor.length > 11) valor = valor.slice(0, 11); // Limita a 11 dígitos
        
        // Aplica a formatação (XX) XXXXX-XXXX
        let formatado = valor.replace(/^(\d{2})(\d{4,5})?(\d{0,4})?.*/, (match, p1, p2, p3) => {
            let res = p1 ? '(' + p1 + ') ' : '';
            res += p2 ? p2 : '';
            res += p3 ? '-' + p3 : '';
            return res;
        });
        e.target.value = formatado;
    });

    // --- 3. RECUPERAÇÃO E SALVAMENTO DE DADOS (SESSION STORAGE) ---
    const carregarDadosSalvos = () => {
        const dadosSalvos = JSON.parse(sessionStorage.getItem('dadosFormularioUndf'));
        if (dadosSalvos) {
            if (dadosSalvos.nome) inputs.nome.value = dadosSalvos.nome;
            if (dadosSalvos.email) inputs.email.value = dadosSalvos.email;
            if (dadosSalvos.telefone) inputs.telefone.value = dadosSalvos.telefone; // Máscara já salva
            if (dadosSalvos.curso) inputs.curso.value = dadosSalvos.curso;
            if (dadosSalvos.turno) {
                const radioAtivo = document.querySelector(`input[name="turno"][value="${dadosSalvos.turno}"]`);
                if (radioAtivo) radioAtivo.checked = true;
            }
            verificarFormularioCompleto();
        }
    };

    form.addEventListener('input', () => {
        const turnoSelecionado = document.querySelector('input[name="turno"]:checked');
        const dados = {
            nome: inputs.nome.value,
            email: inputs.email.value,
            telefone: inputs.telefone.value,
            curso: inputs.curso.value,
            turno: turnoSelecionado ? turnoSelecionado.value : null
        };
        sessionStorage.setItem('dadosFormularioUndf', JSON.stringify(dados));
    });

    // --- 4. FUNÇÕES DE FEEDBACK VISUAL (UX) ---
    const mostrarErro = (input, mensagem) => {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        
        const idMensagem = input.getAttribute('aria-describedby') || input.closest('fieldset').getAttribute('aria-describedby');
        const spanMensagem = document.getElementById(idMensagem);
        if(spanMensagem) spanMensagem.textContent = mensagem;
    };

    const mostrarSucesso = (input) => {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        input.setAttribute('aria-invalid', 'false');
        
        const idMensagem = input.getAttribute('aria-describedby') || input.closest('fieldset').getAttribute('aria-describedby');
        const spanMensagem = document.getElementById(idMensagem);
        if(spanMensagem) spanMensagem.textContent = ""; // Limpa a mensagem de erro
    };

    // --- 5. REGRAS DE VALIDAÇÃO (Atualizadas conforme Fluxograma) ---
    const validarNome = () => {
        const valor = inputs.nome.value.trim();
        const palavras = valor.split(/\s+/);
        const regexNomeValido = /^[a-zA-ZÀ-ÿ\s']+$/; // Permite letras, espaços e apóstrofos
        
        if (valor === "") {
            mostrarErro(inputs.nome, "Erro: Campo vazio. Insira seu nome completo.");
            return false;
        } else if (!regexNomeValido.test(valor)) {
            mostrarErro(inputs.nome, "Erro: Símbolos e números não são permitidos.");
            return false;
        } else if (palavras.length < 2) {
            mostrarErro(inputs.nome, "Erro: Falta o sobrenome. Digite seu nome e sobrenome.");
            return false;
        } else if (!palavras.every(p => p.length >= 2)) {
            mostrarErro(inputs.nome, "Erro: Cada nome ou sobrenome deve ter no mínimo 2 letras.");
            return false;
        }
        mostrarSucesso(inputs.nome);
        return true;
    };

    const validarEmail = () => {
        const valor = inputs.email.value.trim();
        // Regex exige nome.sobrenome (aceita números no final, ex: joao.silva2)
        const regexNomeSobrenome = /^[a-zA-ZÀ-ÿ0-9]+(?:\.[a-zA-ZÀ-ÿ0-9]+)+$/;
        
        if (valor === "") {
            mostrarErro(inputs.email, "Erro: Campo vazio. Insira o seu nome.sobrenome");
            return false;
        } else if (valor.includes('@')) {
            mostrarErro(inputs.email, "Erro: Não digite o @. O sistema já completa com @undf.edu.br.");
            return false;
        } else if (!regexNomeSobrenome.test(valor)) {
            mostrarErro(inputs.email, "Erro: Formato incorreto. Use o padrão exato: nome.sobrenome");
            return false;
        }
        mostrarSucesso(inputs.email);
        return true;
    };

    const validarTelefone = () => {
        const apenasNumeros = inputs.telefone.value.replace(/\D/g, '');
        if (apenasNumeros.length !== 11) {
            mostrarErro(inputs.telefone, "Erro: O telefone deve ter 11 dígitos, incluindo o DDD.");
            return false;
        }
        mostrarSucesso(inputs.telefone);
        return true;
    };

    const validarCurso = () => {
        if (inputs.curso.value === "") {
            mostrarErro(inputs.curso, "Erro: Por favor, selecione um curso na lista.");
            return false;
        }
        mostrarSucesso(inputs.curso);
        return true;
    };

    const validarTurno = () => {
        const fieldset = document.querySelector('.group-radios');
        if (!Array.from(inputs.turnos).some(radio => radio.checked)) {
            fieldset.classList.remove('is-valid');
            fieldset.classList.add('is-invalid');
            document.getElementById('erro-turno').textContent = "Erro: Selecione em qual turno você pretende estudar.";
            return false;
        }
        fieldset.classList.remove('is-invalid');
        fieldset.classList.add('is-valid');
        return true;
    };

    // --- 6. EVENTOS EM TEMPO REAL ---
    inputs.nome.addEventListener('blur', () => { validarNome(); verificarFormularioCompleto(); });
    inputs.email.addEventListener('blur', () => { validarEmail(); verificarFormularioCompleto(); });
    inputs.telefone.addEventListener('blur', () => { validarTelefone(); verificarFormularioCompleto(); });
    inputs.curso.addEventListener('change', () => { validarCurso(); verificarFormularioCompleto(); });
    inputs.turnos.forEach(radio => radio.addEventListener('change', () => { validarTurno(); verificarFormularioCompleto(); }));
    inputs.curso.addEventListener('change', atualizarTurnosDisponiveis);
    const verificarFormularioCompleto = () => {
        // O botão só ativa se TODOS retornarem true
        btnEnviar.disabled = !(validarNome() && validarEmail() && validarTelefone() && validarCurso() && validarTurno());
    };

    // --- 7. ENVIO ASSÍNCRONO COM SIMULAÇÃO PARA A BANCA ---
    form.addEventListener('submit', async (evento) => {
        evento.preventDefault(); 

        erroRede.classList.add('hidden');
        telaLoading.classList.remove('hidden');
        btnEnviar.disabled = true;

        const dadosEnvio = {
            nome: inputs.nome.value,
            email: inputs.email.value,
            telefone: inputs.telefone.value.replace(/\D/g, ''),
            curso: inputs.curso.value,
            turno: document.querySelector('input[name="turno"]:checked').value
        };

        try {
            // Atraso de 2 segundos para o professor ver o visual de Loading
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simula uma queda de rede em 30% das vezes
            if (Math.random() < 0.3) throw new Error('Simulação: Servidor indisponível.');

            const resposta = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosEnvio)
            });

            if (!resposta.ok) throw new Error('Falha no servidor');

            telaLoading.classList.add('hidden');       
            form.classList.add('hidden');              
            document.querySelector('.form-header').classList.add('hidden'); 
            telaSucesso.classList.remove('hidden');    

            sessionStorage.removeItem('dadosFormularioUndf');

        } catch (erro) {
            console.warn(erro.message);
            telaLoading.classList.add('hidden');       
            
            // Aplica o texto EXATO do fluxograma do seu colega no bloco de erro
            if(erroRede) {
                erroRede.textContent = "Ocorreu um erro na rede. Verifique sua conexão e tente enviar novamente.";
                erroRede.classList.remove('hidden'); 
                erroRede.focus(); 
            }
            
            btnEnviar.disabled = false; 
        }
    });

    // --- 8. INICIAÇÃO ---
    carregarDadosSalvos();
});