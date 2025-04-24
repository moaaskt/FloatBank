document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const atmContent = document.getElementById('atmContent');
    const timeDisplay = document.getElementById('timeDisplay');
    const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    
    // Estado do sistema
    let currentScreen = 'welcome';
    let currentPin = '';
    let accountBalance = 5000; // Saldo inicial fictício
    let inputEnabled = false;
    let lastTransactionAmount = 0;

    // Sons
    const sounds = {
        'click': 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3',
        'card': 'https://assets.mixkit.co/sfx/preview/mixkit-insert-credit-card-1679.mp3',
        'error': 'https://assets.mixkit.co/sfx/preview/mixkit-warning-alarm-688.mp3',
        'success': 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'
    };

    // Função para tocar sons
    function playSound(soundName) {
        // Verificar se o navegador suporta Web Audio API
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            try {
                const audio = new Audio(sounds[soundName]);
                audio.volume = 0.3; // Volume reduzido para não ser intrusivo
                audio.play().catch(e => console.log("Reprodução de áudio não autorizada pelo usuário:", e));
            } catch (e) {
                console.log("Erro ao reproduzir som:", e);
            }
        }
    }

    // Atualizar relógio
    function updateClock() {
        const now = new Date();
        timeDisplay.textContent = now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    }
    
    setInterval(updateClock, 1000);
    updateClock();
    
    // Mostrar mensagem no modal
    function showMessage(title, message, sound = null) {
        document.getElementById('messageModalTitle').textContent = title;
        document.getElementById('messageModalBody').textContent = message;
        messageModal.show();
        
        if (sound) {
            playSound(sound);
        }
    }
    
    // Mostrar tela específica
    function showScreen(screen) {
        currentScreen = screen;
        inputEnabled = false;
        
        // Efeito de transição
        atmContent.classList.remove('animate__fadeIn');
        void atmContent.offsetWidth; // Trigger reflow
        atmContent.classList.add('animate__fadeIn');
        
        // Mostrar/ocultar botões de função
        const footer = document.querySelector('.atm-footer');
        if (screen === 'pin') {
            footer.classList.remove('hidden');
        } else if (screen !== 'welcome') {
            footer.classList.add('hidden');
        }
        
        switch(screen) {
            case 'welcome':
                atmContent.innerHTML = `
                    <div class="welcome-screen animate__animated animate__fadeIn">
                        <h2>Bem-vindo ao Float Bank</h2>
                        <p>Por favor, insira seu cartão</p>
                        <div class="card-slot">
                            <div class="card-insert animate__animated animate__pulse animate__infinite" id="insertCard"></div>
                        </div>
                    </div>
                `;
                
                document.getElementById('insertCard').addEventListener('click', function() {
                    playSound('card');
                    showScreen('pin');
                });
                break;
                
            case 'pin':
                atmContent.innerHTML = `
                    <div class="pin-screen animate__animated animate__fadeIn">
                        <h3>Insira sua senha (1234)</h3>
                        <div class="pin-display">${'•'.repeat(currentPin.length)}</div>
                        <p class="text-muted">Use o teclado para digitar sua senha de 4 dígitos</p>
                    </div>
                `;
                inputEnabled = true;
                break;
                
            case 'menu':
                atmContent.innerHTML = `
                    <div class="menu-screen animate__animated animate__fadeIn">
                        <h3>Selecione uma opção</h3>
                        <button class="menu-option" data-option="balance">Saldo</button>
                        <button class="menu-option" data-option="withdraw">Saque</button>
                        <button class="menu-option" data-option="deposit">Depósito</button>
                        <button class="menu-option" data-option="exit">Sair</button>
                    </div>
                `;
                
                document.querySelectorAll('.menu-option').forEach(option => {
                    option.addEventListener('click', function() {
                        playSound('click');
                        const selectedOption = this.getAttribute('data-option');
                        handleMenuOption(selectedOption);
                    });
                });
                break;
                
            case 'balance':
                atmContent.innerHTML = `
                    <div class="balance-screen animate__animated animate__fadeIn">
                        <h3>Seu saldo atual</h3>
                        <div class="balance-amount">R$ ${accountBalance.toFixed(2).replace('.', ',')}</div>
                        <p>Deseja realizar outra operação?</p>
                        <div class="d-flex justify-content-between mt-4">
                            <button class="btn btn-primary" id="anotherOperation">Sim</button>
                            <button class="btn btn-secondary" id="exitAfterBalance">Não</button>
                        </div>
                    </div>
                `;
                
                document.getElementById('anotherOperation').addEventListener('click', function() {
                    playSound('click');
                    showScreen('menu');
                });
                
                document.getElementById('exitAfterBalance').addEventListener('click', function() {
                    playSound('click');
                    logout();
                });
                break;
                
            case 'withdraw':
                atmContent.innerHTML = `
                    <div class="withdraw-screen animate__animated animate__fadeIn">
                        <h3>Selecione o valor do saque</h3>
                        <div class="amount-options">
                            <div class="amount-option" data-amount="50">R$ 50,00</div>
                            <div class="amount-option" data-amount="100">R$ 100,00</div>
                            <div class="amount-option" data-amount="200">R$ 200,00</div>
                            <div class="amount-option" data-amount="500">R$ 500,00</div>
                            <input type="number" class="custom-amount" placeholder="Outro valor" min="10" max="1000">
                        </div>
                        <div class="d-flex justify-content-between mt-4">
                            <button class="btn btn-secondary" id="backToMenu">Voltar</button>
                            <button class="btn btn-primary" id="confirmWithdraw">Continuar</button>
                        </div>
                    </div>
                `;
                
                document.querySelectorAll('.amount-option').forEach(option => {
                    option.addEventListener('click', function() {
                        playSound('click');
                        document.querySelector('.custom-amount').value = '';
                        document.querySelectorAll('.amount-option').forEach(o => o.style.backgroundColor = '');
                        this.style.backgroundColor = 'var(--secondary-color)';
                        this.style.color = 'white';
                    });
                });
                
                document.getElementById('backToMenu').addEventListener('click', function() {
                    playSound('click');
                    showScreen('menu');
                });
                
                document.getElementById('confirmWithdraw').addEventListener('click', function() {
                    playSound('click');
                    const selectedOption = document.querySelector('.amount-option[style*="background-color"]');
                    const customAmount = document.querySelector('.custom-amount').value;
                    
                    let amount = 0;
                    
                    if (selectedOption) {
                        amount = parseFloat(selectedOption.getAttribute('data-amount'));
                    } else if (customAmount) {
                        amount = parseFloat(customAmount);
                    }
                    
                    if (amount <= 0 || isNaN(amount)) {
                        showMessage('Erro', 'Por favor, selecione ou informe um valor válido.', 'error');
                        return;
                    }
                    
                    if (amount > accountBalance) {
                        showMessage('Saldo Insuficiente', 'Você não tem saldo suficiente para esta operação.', 'error');
                        return;
                    }
                    
                    if (amount > 1000) {
                        showMessage('Limite Excedido', 'O valor máximo por saque é R$ 1.000,00.', 'error');
                        return;
                    }
                    
                    // Processar saque
                    processWithdrawal(amount);
                });
                break;
                
            case 'deposit':
                atmContent.innerHTML = `
                    <div class="deposit-screen animate__animated animate__fadeIn">
                        <h3>Depósito</h3>
                        <div class="deposit-options">
                            <div class="deposit-option" data-type="cash">
                                <i class="fas fa-money-bill-wave fa-3x"></i>
                                <p>Depósito em Espécie</p>
                            </div>
                            <div class="deposit-option" data-type="check">
                                <i class="fas fa-money-check-alt fa-3x"></i>
                                <p>Depósito de Cheque</p>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between mt-4">
                            <button class="btn btn-secondary" id="backToMenuFromDeposit">Voltar</button>
                        </div>
                    </div>
                `;
                
                // Event listeners para as opções de depósito
                document.querySelectorAll('.deposit-option').forEach(option => {
                    option.addEventListener('click', function() {
                        playSound('click');
                        const depositType = this.getAttribute('data-type');
                        showDepositAmountScreen(depositType);
                    });
                });
                
                document.getElementById('backToMenuFromDeposit').addEventListener('click', function() {
                    playSound('click');
                    showScreen('menu');
                });
                break;
                
            case 'deposit-amount':
                // Esta tela agora é tratada pela função showDepositAmountScreen
                break;
                
            case 'processing':
                atmContent.innerHTML = `
                    <div class="processing-screen animate__animated animate__fadeIn text-center">
                        <div class="transaction-animation">
                            <i class="fas fa-circle-notch fa-spin fa-4x" style="color: var(--secondary-color);"></i>
                        </div>
                        <h3>Processando sua transação...</h3>
                        <p>Aguarde um momento</p>
                    </div>
                `;
                break;
                
            case 'receipt':
                atmContent.innerHTML = `
                    <div class="receipt-screen animate__animated animate__fadeIn">
                        <h3>Transação concluída</h3>
                        <div class="receipt">
                            <p>BANCO Float Bank</p>
                            <p>-----------------------------</p>
                            <p>DATA: ${new Date().toLocaleDateString('pt-BR')}</p>
                            <p>HORA: ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                            <p>-----------------------------</p>
                            <p>SAQUE: R$ ${lastTransactionAmount.toFixed(2).replace('.', ',')}</p>
                            <p>SALDO: R$ ${accountBalance.toFixed(2).replace('.', ',')}</p>
                            <p>-----------------------------</p>
                            <p>OBRIGADO POR UTILIZAR</p>
                            <p>NOSSO CAIXA ELETRÔNICO</p>
                        </div>
                        <div class="d-flex justify-content-between mt-4">
                            <button class="btn btn-primary" id="anotherOperationAfterReceipt">Nova operação</button>
                            <button class="btn btn-secondary" id="exitAfterReceipt">Sair</button>
                        </div>
                    </div>
                `;
                
                playSound('success');
                
                document.getElementById('anotherOperationAfterReceipt').addEventListener('click', function() {
                    playSound('click');
                    showScreen('menu');
                });
                
                document.getElementById('exitAfterReceipt').addEventListener('click', function() {
                    playSound('click');
                    logout();
                });
                break;
                
            case 'deposit-receipt':
                // Esta tela agora é tratada pela função processDeposit
                break;
        }
    }
    
    // Processar saque
    function processWithdrawal(amount) {
        lastTransactionAmount = amount;
        showScreen('processing');
        
        // Simular processamento
        setTimeout(() => {
            accountBalance -= amount;
            showScreen('receipt');
        }, 3000);
    }
    
    // Mostrar tela de valor do depósito
    function showDepositAmountScreen(depositType) {
        atmContent.innerHTML = `
            <div class="deposit-amount-screen animate__animated animate__fadeIn">
                <h3>Depósito ${depositType === 'cash' ? 'em Espécie' : 'de Cheque'}</h3>
                <div class="amount-options">
                    <div class="amount-option" data-amount="50">R$ 50,00</div>
                    <div class="amount-option" data-amount="100">R$ 100,00</div>
                    <div class="amount-option" data-amount="200">R$ 200,00</div>
                    <div class="amount-option" data-amount="500">R$ 500,00</div>
                    <input type="number" class="custom-amount" placeholder="Outro valor" min="10">
                </div>
                <div class="d-flex justify-content-between mt-4">
                    <button class="btn btn-secondary" id="backToDepositOptions">Voltar</button>
                    <button class="btn btn-primary" id="confirmDeposit">Confirmar</button>
                </div>
            </div>
        `;
        
        document.querySelectorAll('.amount-option').forEach(option => {
            option.addEventListener('click', function() {
                playSound('click');
                document.querySelector('.custom-amount').value = '';
                document.querySelectorAll('.amount-option').forEach(o => o.style.backgroundColor = '');
                this.style.backgroundColor = 'var(--secondary-color)';
                this.style.color = 'white';
            });
        });
        
        document.getElementById('backToDepositOptions').addEventListener('click', function() {
            playSound('click');
            showScreen('deposit');
        });
        
        document.getElementById('confirmDeposit').addEventListener('click', function() {
            playSound('click');
            const selectedOption = document.querySelector('.amount-option[style*="background-color"]');
            const customAmount = document.querySelector('.custom-amount').value;
            
            let amount = 0;
            
            if (selectedOption) {
                amount = parseFloat(selectedOption.getAttribute('data-amount'));
            } else if (customAmount) {
                amount = parseFloat(customAmount);
            }
            
            if (amount <= 0 || isNaN(amount)) {
                showMessage('Erro', 'Por favor, selecione ou informe um valor válido.', 'error');
                return;
            }
            
            // Processar depósito
            processDeposit(amount, depositType);
        });
    }
    
    // Processar depósito
    function processDeposit(amount, depositType) {
        lastTransactionAmount = amount;
        showScreen('processing');
        
        // Simular processamento
        setTimeout(() => {
            accountBalance += amount;
            
            // Mostrar recibo específico para depósito
            atmContent.innerHTML = `
                <div class="receipt-screen animate__animated animate__fadeIn">
                    <h3>Depósito realizado</h3>
                    <div class="receipt">
                        <p>BANCO Float Bank</p>
                        <p>-----------------------------</p>
                        <p>DATA: ${new Date().toLocaleDateString('pt-BR')}</p>
                        <p>HORA: ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                        <p>TIPO: ${depositType === 'cash' ? 'Espécie' : 'Cheque'}</p>
                        <p>-----------------------------</p>
                        <p>DEPÓSITO: R$ ${amount.toFixed(2).replace('.', ',')}</p>
                        <p>SALDO: R$ ${accountBalance.toFixed(2).replace('.', ',')}</p>
                        <p>-----------------------------</p>
                        <p>OBRIGADO POR UTILIZAR</p>
                        <p>NOSSO CAIXA ELETRÔNICO</p>
                    </div>
                    <div class="d-flex justify-content-between mt-4">
                        <button class="btn btn-primary" id="anotherOperationAfterDeposit">Nova operação</button>
                        <button class="btn btn-secondary" id="exitAfterDeposit">Sair</button>
                    </div>
                </div>
            `;
            
            playSound('success');
            
            document.getElementById('anotherOperationAfterDeposit').addEventListener('click', function() {
                playSound('click');
                showScreen('menu');
            });
            
            document.getElementById('exitAfterDeposit').addEventListener('click', function() {
                playSound('click');
                logout();
            });
        }, 3000);
    }
    
    // Manipular opção do menu
    function handleMenuOption(option) {
        switch(option) {
            case 'balance':
                showScreen('balance');
                break;
            case 'withdraw':
                showScreen('withdraw');
                break;
            case 'deposit':
                showScreen('deposit'); // Agora mostra a tela de depósito em vez da mensagem
                break;
            case 'exit':
                logout();
                break;
        }
    }
    
    // Logout
    function logout() {
        currentPin = '';
        
        // Mostrar animação de saída do cartão
        const cardEject = document.getElementById('cardEjectAnimation');
        cardEject.style.display = 'flex';
        playSound('card');
        
        setTimeout(() => {
            cardEject.style.display = 'none';
            showMessage('Obrigado', 'Retire seu cartão. Obrigado por utilizar nossos serviços.');
        }, 1500);
        
        setTimeout(() => {
            showScreen('welcome');
        }, 3500);
    }
    
    // Event listeners para teclas numéricas
    document.querySelectorAll('.btn-key[data-value]').forEach(button => {
        button.addEventListener('click', function() {
            playSound('click');
            
            if (!inputEnabled) return;
            
            if (currentScreen === 'pin' && currentPin.length < 4) {
                currentPin += this.getAttribute('data-value');
                showScreen('pin');
                
                if (currentPin.length === 4) {
                    // Simular verificação de PIN
                    setTimeout(() => {
                        if (currentPin === '1234') { // PIN fixo para demonstração
                            currentPin = '';
                            playSound('success');
                            showScreen('menu');
                        } else {
                            currentPin = '';
                            showMessage('Erro', 'Senha incorreta. Tente novamente.', 'error');
                            showScreen('pin');
                        }
                    }, 500);
                }
            }
        });
    });
    
    // Event listener para tecla de apagar
    document.querySelector('.btn-key[data-action="backspace"]').addEventListener('click', function() {
        playSound('click');
        
        if (!inputEnabled) return;
        
        if (currentScreen === 'pin' && currentPin.length > 0) {
            currentPin = currentPin.slice(0, -1);
            showScreen('pin');
        }
    });
    
    // Event listener para tecla Enter
    document.querySelector('.btn-key[data-action="enter"]').addEventListener('click', function() {
        playSound('click');
        
        if (!inputEnabled) return;
        
        if (currentScreen === 'pin' && currentPin.length === 4) {
            // A verificação já é feita no listener das teclas numéricas
        }
    });
    
    // Event listeners para botões de função
    document.querySelectorAll('.btn-function').forEach(button => {
        button.addEventListener('click', function() {
            playSound('click');
            const action = this.getAttribute('data-action');
            
            switch(action) {
                case 'cancel':
                    if (currentScreen !== 'welcome') {
                        logout();
                    }
                    break;
                case 'clear':
                    if (currentScreen === 'pin') {
                        currentPin = '';
                        showScreen('pin');
                    }
                    break;
                case 'confirm':
                    if (currentScreen === 'pin' && currentPin.length === 4) {
                        // A verificação já é feita no listener das teclas numéricas
                    }
                    break;
            }
        });
    });
    
    // Fechar animação ao clicar
    document.getElementById('cardEjectAnimation').addEventListener('click', function() {
        this.style.display = 'none';
    });
    
    // Iniciar com a tela de boas-vindas
    showScreen('welcome');
});