document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. MAPEAMENTO DE ELEMENTOS ---
    const form = document.getElementById('form-institucional');
    const btnEnviar = document.getElementById('btn-enviar');
    
    // Campos
    const inputs = {
        nome: document.getElementById('nome'),
        email: document.getElementById('email'),
        telefone: document.getElementById('telefone'),
        curso: document.getElementById('curso'),
        turnos: document.querySelectorAll('input[name="turno"]')
    };

    // Telas de Feedback
    const telaLoading = document.getElementById('tela-loading');
    const telaSucesso = document.getElementById('tela-sucesso');
    const erroRede = document.getElementById('erro-rede');

    // --- 2. RECUPERAÇÃO DE DADOS (SESSION STORAGE) ---
    // Conforme exigido no fluxograma: Repopular campos se houver dados salvos
    const carregarDadosSalvos = () => {
        const dadosSalvos = JSON.parse(sessionStorage.getItem('dadosFormularioUndf'));
        if (dadosSalvos) {
            if (dadosSalvos.nome) inputs.nome.value = dadosSalvos.nome;
            if (dadosSalvos.email) inputs.email.value = dadosSalvos.email;
            if (dadosSalvos.telefone) inputs.telefone.value = dadosSalvos.telefone;
            if (dadosSalvos.curso) inputs.curso.value = dadosSalvos.curso;
            if (dadosSalvos.turno) {
                const radioAtivo = document.querySelector(`input[name="turno"][value="${dadosSalvos.turno}"]`);
                if (radioAtivo) radioAtivo.checked = true;
            }
            verificarFormularioCompleto();
        }
    };

    // Salvar dados em tempo real
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

    // --- 3. FUNÇÕES DE FEEDBACK VISUAL (UX) ---
    const mostrarErro = (input, mensagem) => {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        
        // Pega o ID da mensagem através do aria-describedby
        const idMensagem = input.getAttribute('aria-describedby') || input.closest('fieldset').getAttribute('aria-describedby');
        const spanErro = document.getElementById(idMensagem);
        spanErro.textContent = mensagem;
    };

    const mostrarSucesso = (input) => {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        input.setAttribute('aria-invalid', 'false');
    };

    // --- 4. REGRAS DE VALIDAÇÃO (O que o sistema espera) ---
    const validarNome = () => {
        const valor = inputs.nome.value.trim();
        // Exige pelo menos duas palavras (Nome e Sobrenome)
        if (valor.split(' ').length < 2) {
            mostrarErro(inputs.nome, "Erro: Digite seu nome e pelo menos um sobrenome.");
            return false;
        }
        mostrarSucesso(inputs.nome);
        return true;
    };

    const validarEmail = () => {
        const valor = inputs.email.value.trim();
        // Regex básica para verificar formato de e-mail
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(valor)) {
            mostrarErro(inputs.email, "Erro: Formato de e-mail inválido. Verifique se digitou seu email institucional.");
            return false;
        }
        mostrarSucesso(inputs.email);
        return true;
    };

    const validarTelefone = () => {
        let valor = inputs.telefone.value.trim();
        // Remove tudo que não for número para contar os dígitos
        const apenasNumeros = valor.replace(/\D/g, '');
        
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
        const algumSelecionado = Array.from(inputs.turnos).some(radio => radio.checked);
        const fieldset = document.querySelector('.group-radios');
        
        if (!algumSelecionado) {
            // Aplicamos a classe no fieldset para o rádio
            fieldset.classList.remove('is-valid');
            fieldset.classList.add('is-invalid');
            document.getElementById('erro-turno').textContent = "Erro: Selecione em qual turno você pretende estudar.";
            return false;
        }
        fieldset.classList.remove('is-invalid');
        fieldset.classList.add('is-valid');
        return true;
    };

    // --- 5. EVENTOS DE TEMPO REAL (Eventos de Blur) ---
    // O evento 'blur' dispara assim que o usuário clica fora do campo
    inputs.nome.addEventListener('blur', () => { validarNome(); verificarFormularioCompleto(); });
    inputs.email.addEventListener('blur', () => { validarEmail(); verificarFormularioCompleto(); });
    inputs.telefone.addEventListener('blur', () => { validarTelefone(); verificarFormularioCompleto(); });
    inputs.curso.addEventListener('change', () => { validarCurso(); verificarFormularioCompleto(); });
    
    inputs.turnos.forEach(radio => {
        radio.addEventListener('change', () => { validarTurno(); verificarFormularioCompleto(); });
    });

    // --- 6. GERENCIADOR DO BOTÃO DE ENVIO ---
    const verificarFormularioCompleto = () => {
        // Só habilita o botão se TODOS os campos passarem na validação
        const isValid = validarNome() && validarEmail() && validarTelefone() && validarCurso() && validarTurno();
        btnEnviar.disabled = !isValid;
    };

    // --- 7. ENVIO ASSÍNCRONO (FETCH API) ---
    form.addEventListener('submit', async (evento) => {
        evento.preventDefault(); // Impede o recarregamento da página

        // Esconde erro de rede caso estivesse aparecendo de uma tentativa falha anterior
        erroRede.classList.add('hidden');

        // Mostra o estado de Loading e desabilita o botão para evitar duplo clique
        telaLoading.classList.remove('hidden');
        btnEnviar.disabled = true;

        // Prepara os dados para o envio
        const dadosEnvio = {
            nome: inputs.nome.value,
            email: inputs.email.value,
            telefone: inputs.telefone.value.replace(/\D/g, ''),
            curso: inputs.curso.value,
            turno: document.querySelector('input[name="turno"]:checked').value
        };

        try {
            // Simulando um Endpoint Público com a Fetch API
            // O JSONPlaceholder é ótimo para testes, ele aceita POST e devolve um sucesso fictício.
            const resposta = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosEnvio)
            });

            if (!resposta.ok) throw new Error('Falha na resposta do servidor');

            // --- CAMINHO DE SUCESSO ---
            telaLoading.classList.add('hidden');       // Esconde o loading
            form.classList.add('hidden');              // Esconde o formulário
            document.querySelector('.form-header').classList.add('hidden'); // Esconde o cabeçalho
            telaSucesso.classList.remove('hidden');    // Mostra a tela de sucesso inequívoco!

            // Limpa o sessionStorage já que o cadastro foi concluído com sucesso
            sessionStorage.removeItem('dadosFormularioUndf');

        } catch (erro) {
            // --- CAMINHO DE ERRO DE REDE ---
            console.error('Erro ao enviar:', erro);
            telaLoading.classList.add('hidden');       // Tira o loading
            erroRede.classList.remove('hidden');       // Mostra a barra vermelha de erro
            btnEnviar.disabled = false;                // Habilita o botão para "tentar novamente"
        }
    });

    // --- 8. INICIALIZAÇÃO ---
    carregarDadosSalvos();

});