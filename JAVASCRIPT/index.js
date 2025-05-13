var btnEntrar = document.querySelector("#entrar");
var btnInscrever = document.querySelector("#inscrever");
var body = document.querySelector("body");

btnEntrar.addEventListener("click", function () {
  body.className = "entrar-js";
});
btnInscrever.addEventListener("click", function () {
  body.className = "inscrever-js";
});

//botao pra entrar na pagina 2
function redirecionarParaPaginaPrincipal() { 
    const urlDaPaginaPrincipal = 'main.html';
    window.location.href = urlDaPaginaPrincipal;

}

document.addEventListener('DOMContentLoaded', function() {

    const botaoRedirecionar = document.getElementById('btn-login'); 

    if (botaoRedirecionar) {
        botaoRedirecionar.addEventListener('click', function(event) {
            event.preventDefault();
            redirecionarParaPaginaPrincipal();
        });

    } else {
        console.error('Botão de redirecionamento (ID "btn-login") não encontrado no HTML/index.html.'); 
    }
});


