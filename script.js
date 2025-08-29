const containerCheck = document.getElementById('containerCheck');
const canvas = document.getElementById('roletaCanvas');
const ctx = canvas.getContext('2d');
const nomeSorteado = document.getElementById('nomeSorteado');
const velocidadeSlider = document.getElementById('velocidadeSlider');
const tempoSlider = document.getElementById('tempoSlider');
const velocidadeValor = document.getElementById('velocidadeValor');
const tempoValor = document.getElementById('tempoValor');

const btnGirar = document.getElementById('btnGirar');
const btnReset = document.getElementById('btnReset');

const nomesPadrao = ['Weslei', 'Italo', 'Tatiana', 'Enrico', 'Rosana', 'Dasayani', 'Alecio', 'Victor'];
const nomesFerias = ['Maicon'];
const NUM_EXTRA = 5; // checkboxes extras vazios

const CORES_FIXAS = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33A8',
  '#F1C40F', '#8E44AD', '#16A085', '#E67E22',
  '#2C3E50', '#7F8C8D'
];

let nomes = [];
let anguloAtual = 0;
let rodando = false;

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let timerSom = null;
let timerSomInicio = null

let efeitoZoomAtivo = false;
let zoomFrame = 0;
const zoomFramesMax = 30;
const zoomMax = 1.5;
let indexVencedor = -1;


function shuffle(array) {
  for (let i = array.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function criarCheckboxes() {
  containerCheck.innerHTML = '<h3>Selecione os nomes:</h3>';
  // Embaralha nomes para mostrar numa ordem diferente
  let nomesEmbaralhados = shuffle([...nomesPadrao]);

  nomesEmbaralhados.forEach(nome => {
    let label = document.createElement('label');
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.value = nome;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(nome));
    containerCheck.appendChild(label);
  });

  nomesFerias.forEach(nome => {
    let label = document.createElement('label');
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = false;
    checkbox.value = nome;

    // Aplica o estilo de tachado e opacidade diretamente aqui
    label.style.textDecoration = 'line-through';
    label.style.opacity = '0.7'; // Opcional: para um leve destaque visual de "concluído"
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(nome + " Férias"));
    containerCheck.appendChild(label);
  });

  // Adiciona checkboxes extras vazios
  for (let i = 0; i < NUM_EXTRA; i++) {
    let label = document.createElement('label');
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = false;
    checkbox.value = '';
    let inputNome = document.createElement('input');
    inputNome.type = 'text';
    inputNome.placeholder = '(vazio)';
    inputNome.style.flexGrow = '1';
    inputNome.style.marginLeft = '6px';
    inputNome.oninput = () => {
      checkbox.value = inputNome.value.trim();
      if (checkbox.value) {
        checkbox.checked = true;
      } else {
        checkbox.checked = false;
      }
      desenharRoletaComNomesSelecionados();
    };

    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.appendChild(checkbox);
    label.appendChild(inputNome);

    containerCheck.appendChild(label);
  }

  // Adiciona listener para atualizar roleta ao marcar/desmarcar
  containerCheck.querySelectorAll('input[type=checkbox]').forEach(chk => {
    chk.addEventListener('change', () => {
      desenharRoletaComNomesSelecionados();
    });
  });
}

function getNomesSelecionados() {
  let checkedBoxes = Array.from(containerCheck.querySelectorAll('input[type=checkbox]:checked'));
  let selecionados = checkedBoxes.map(cb => cb.value).filter(v => v && v.trim() !== '');
  return selecionados;
}

function desenharRoletaComNomesSelecionados() {
  nomes = getNomesSelecionados();
  if (nomes.length < 2) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nomeSorteado.textContent = 'Rolete de Nomes';
    return;
  }
  desenharRoleta();
}

/*function desenharRoleta() {
  const total = nomes.length;
  const anguloPorFatia = (2 * Math.PI) / total;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  nomes.forEach((nome, i) => {
    const inicio = i * anguloPorFatia + anguloAtual;
    const fim = inicio + anguloPorFatia;

    ctx.fillStyle = CORES_FIXAS[i % CORES_FIXAS.length];

    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 150, inicio, fim);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.translate(150, 150);
    ctx.rotate(inicio + anguloPorFatia / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.fillText(nome, 140, 5);
    ctx.restore();
  });
}*/

function desenharRoleta() {
  const total = nomes.length;
  const anguloPorFatia = (2 * Math.PI) / total;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  nomes.forEach((nome, i) => {
    const inicio = i * anguloPorFatia + anguloAtual;
    const fim = inicio + anguloPorFatia;

    if (i === indexVencedor && efeitoZoomAtivo) {
      // Desenha fatia com brilho para o vencedor
      ctx.shadowColor = 'yellow';
      ctx.shadowBlur = 20;
      ctx.fillStyle = CORES_FIXAS[i % CORES_FIXAS.length];
      ctx.beginPath();
      ctx.moveTo(150, 150);
      ctx.arc(150, 150, 150, inicio, fim);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = CORES_FIXAS[i % CORES_FIXAS.length];
      ctx.beginPath();
      ctx.moveTo(150, 150);
      ctx.arc(150, 150, 150, inicio, fim);
      ctx.closePath();
      ctx.fill();
    }

    ctx.save();
    ctx.translate(150, 150);
    ctx.rotate(inicio + anguloPorFatia / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.fillText(nome, 140, 5);
    ctx.restore();
  });
}

function animarZoomNome() {
  if (!efeitoZoomAtivo) return;

  zoomFrame++;
  let escala;
  if (zoomFrame <= zoomFramesMax / 2) {
    escala = 1 + (zoomMax - 1) * (zoomFrame / (zoomFramesMax / 2));
  } else {
    escala = zoomMax - (zoomMax - 1) * ((zoomFrame - zoomFramesMax / 2) / (zoomFramesMax / 2));
  }

  nomeSorteado.style.transform = `scale(${escala})`;
  nomeSorteado.style.transition = 'transform 0s';

  if (zoomFrame < zoomFramesMax) {
    requestAnimationFrame(animarZoomNome);
  } else {
    efeitoZoomAtivo = false;
    nomeSorteado.style.transform = 'scale(1)';
  }
}

function girarRoleta() {
  if (rodando) return;

  nomes = getNomesSelecionados();

  if (nomes.length < 2) {
    alert('Selecione pelo menos dois nomes para girar a roleta!');
    return;
  }

  desenharRoleta();

  let velocidade = Number(velocidadeSlider.value);
  let tempo = Number(tempoSlider.value);

  let voltas = Math.floor(velocidade * 2) + 3;
  let destino = Math.random() * 2 * Math.PI;
  let anguloFinal = voltas * 2 * Math.PI + destino;

  rodando = true;

  let inicio = null;

  function animar(timestamp) {
    if (!inicio) inicio = timestamp;
    let progresso = timestamp - inicio;
    let duracao = tempo * 1000;
    let fracao = Math.min(progresso / duracao, 1);

    anguloAtual = anguloFinal * easeOut(fracao);
    desenharRoleta();

    if (fracao < 1) {
      requestAnimationFrame(animar);
    } else {
      rodando = false;
      mostrarResultado(destino);
      tocarSomFinal();
    }
  }

  requestAnimationFrame(animar);
}

function tocarSomCurto() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);

  gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.06);
}

function tocarSomFinal() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  for (let i = 0; i < 5; i++) {
    const startTime = now + i * 0.3;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // Frequência entre 600 e 1200Hz, decrescendo a cada explosão
    osc.frequency.setValueAtTime(1200 - i * 120, startTime);

    osc.type = 'triangle';

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.15);
  }
}

function tocarSomRoleta(duracao) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = 'square'; // som parecido com "tic"
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);

  gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.06);
}

function mostrarResultado(destino) {
  let total = nomes.length;
  let anguloPorFatia = (2 * Math.PI) / total;

  // A seta aponta para cima, 270 graus = 1.5 * PI radianos
  let anguloSeta = 1.5 * Math.PI;

  let anguloRelativo = (anguloSeta - anguloAtual) % (2 * Math.PI);
  if (anguloRelativo < 0) anguloRelativo += 2 * Math.PI;

  let index = Math.floor(anguloRelativo / anguloPorFatia) % total;

  nomeSorteado.textContent = `Parabéns ${nomes[index]}`;
  // Ativa o efeito visual
  efeitoZoomAtivo = true;
  zoomFrame = 0;
  animarZoomNome();
  desenharRoleta();
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function resetRoleta() {
  anguloAtual = 0;
  rodando = false;
  nomeSorteado.textContent = 'Rolete de Nomes';

  criarCheckboxes();
  nomes = getNomesSelecionados();
  desenharRoleta();
  velocidadeSlider.value = 3;
  tempoSlider.value = 2.5;
  velocidadeValor.textContent = '3';
  tempoValor.textContent = '2.5';
}

// Atualiza o texto dos sliders
velocidadeSlider.oninput = () => {
  velocidadeValor.textContent = velocidadeSlider.value;
};
tempoSlider.oninput = () => {
  tempoValor.textContent = tempoSlider.value;
};

btnGirar.onclick = () => {
  tocarSomCurto(); // bipe rápido no clique
  girarRoleta();
};
btnReset.onclick = resetRoleta;

window.onload = () => {
  resetRoleta();
};
