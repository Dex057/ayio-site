/* ============================================================
   Seu Cartório pelo Brasil — mapa de presença
   Monta o SVG dentro de [data-mapa-cartorios] a partir dos
   contornos em brasil-mapa.js. Dados estáticos: os cartórios
   clientes listados na seção "Quem já usa" desta página.
   ============================================================ */
(function () {
  'use strict';

  var raiz = document.querySelector('[data-mapa-cartorios]');
  if (!raiz || !window.AYIO_BRASIL) return;

  var VIEWBOX = window.AYIO_BRASIL.VIEWBOX;
  var UFS = window.AYIO_BRASIL.UFS_PATHS;

  var NOMES = {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
    DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
    MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
    PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
    RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
    SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins'
  };

  /* Estados de traçado pequeno: só a sigla cabe (o número invadiria o vizinho) */
  var COMPACTOS = { DF: 1, SE: 1, AL: 1, RJ: 1, ES: 1, RN: 1, PB: 1, PE: 1 };

  /* Cartórios clientes — mesma lista da seção "Quem já usa" */
  var CARTORIOS = [
    { nome: 'Ofício de Registro de Imóveis da Comarca de Marabá', cidade: 'Marabá', uf: 'PA' },
    { nome: '5º Tabelionato de Notas de Belém', cidade: 'Belém', uf: 'PA' },
    { nome: '1º Tabelionato de Notas de Jaraguá', cidade: 'Jaraguá', uf: 'GO' },
    { nome: '2º Registro de Imóveis do Recife', cidade: 'Recife', uf: 'PE' },
    { nome: 'Cartório Alison Rodrigo', cidade: 'Miguel Alves', uf: 'PI' },
    { nome: 'Cartório de Registro de Imóveis da Comarca de Assis', cidade: 'Assis', uf: 'SP' },
    { nome: 'Registro de Imóveis de Socorro', cidade: 'Socorro', uf: 'SP' },
    { nome: 'Cartório Lago do Junco', cidade: 'Lago do Junco', uf: 'MA' },
    { nome: 'Tabelionato de Notas e Protesto de Bandeirantes', cidade: 'Bandeirantes', uf: 'PR' }
  ];

  /* --- agrega por estado --- */
  var porUf = {};
  CARTORIOS.forEach(function (c) {
    (porUf[c.uf] || (porUf[c.uf] = [])).push(c);
  });
  var ufsComPresenca = Object.keys(porUf);
  var maxPorUf = ufsComPresenca.reduce(function (m, uf) {
    return Math.max(m, porUf[uf].length);
  }, 1);

  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
    return el;
  }
  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function plural(n) { return n === 1 ? '1 cartório' : n + ' cartórios'; }

  /* Intensidade do preenchimento: 1 cartório = tom base, o topo = tom cheio */
  function intensidade(total) {
    if (!total) return 0;
    return maxPorUf > 1 ? (total - 1) / (maxPorUf - 1) : 1;
  }

  /* ---------------------------------------------------------
     Estrutura
     --------------------------------------------------------- */
  var palco = el('div', 'mapa__palco');
  var svg = svgEl('svg', {
    viewBox: VIEWBOX,
    class: 'mapa__svg',
    role: 'img',
    'aria-label': 'Mapa do Brasil com os estados onde o Seu Cartório já atende'
  });

  var tooltip = el('div', 'mapa__tip');
  tooltip.setAttribute('aria-hidden', 'true');

  var painel = el('div', 'mapa__painel');
  palco.appendChild(svg);
  palco.appendChild(tooltip);

  var legenda = el('div', 'mapa__legenda');
  [
    ['<i class="mapa__chip mapa__chip--off"></i>', 'ainda não atendido'],
    ['<i class="mapa__chip mapa__chip--min"></i>', '1 cartório'],
    ['<i class="mapa__chip mapa__chip--max"></i>', 'mais cartórios']
  ].forEach(function (par) {
    var s = el('span');
    s.innerHTML = par[0] + '<span>' + par[1] + '</span>';
    legenda.appendChild(s);
  });
  palco.appendChild(legenda);

  raiz.appendChild(palco);
  raiz.appendChild(painel);

  /* ---------------------------------------------------------
     Desenho — estados sem presença primeiro, presentes por cima
     --------------------------------------------------------- */
  var formas = {};
  var siglas = Object.keys(UFS).sort(function (a, b) {
    return (porUf[a] ? 1 : 0) - (porUf[b] ? 1 : 0);
  });

  siglas.forEach(function (uf) {
    var lista = porUf[uf];
    var path = svgEl('path', {
      d: UFS[uf].d,
      class: 'mapa__uf' + (lista ? ' is-on' : ''),
      style: lista ? '--i:' + intensidade(lista.length).toFixed(3) : null
    });
    if (lista) {
      path.setAttribute('tabindex', '0');
      path.setAttribute('role', 'button');
      path.setAttribute('aria-label', NOMES[uf] + ' — ' + plural(lista.length));
      path.addEventListener('click', function () { selecionar(uf); });
      path.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selecionar(uf); }
      });
      path.addEventListener('focus', function () { mostrarTip(uf); });
      path.addEventListener('blur', esconderTip);
    }
    path.addEventListener('mouseenter', function () { mostrarTip(uf); });
    path.addEventListener('mouseleave', esconderTip);
    formas[uf] = path;
    svg.appendChild(path);
  });

  /* Rótulos por cima de todos os contornos */
  Object.keys(UFS).forEach(function (uf) {
    var info = UFS[uf];
    var lista = porUf[uf];
    var compacto = !!COMPACTOS[uf];
    var g = svgEl('g', { class: 'mapa__rotulo' + (lista ? ' is-on' : '') });

    var t = svgEl('text', {
      x: info.cx, y: info.cy, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      class: 'mapa__sigla', 'font-size': compacto ? 11 : lista ? 17 : 14
    });
    t.textContent = uf;
    g.appendChild(t);

    if (lista && !compacto) {
      var n = svgEl('text', {
        x: info.cx, y: info.cy + 16, 'text-anchor': 'middle', 'dominant-baseline': 'central',
        class: 'mapa__qtd', 'font-size': 11
      });
      n.textContent = lista.length + (lista.length === 1 ? ' cart.' : ' carts.');
      g.appendChild(n);
    }

    if (lista) {
      g.appendChild(svgEl('circle', {
        class: 'mapa__pulso',
        cx: info.cx + (compacto ? 10 : 26),
        cy: info.cy - (compacto ? 8 : 12),
        r: 3.5
      }));
    }

    svg.appendChild(g);
  });

  /* ---------------------------------------------------------
     Tooltip
     --------------------------------------------------------- */
  function mostrarTip(uf) {
    if (uf === selecionado) return;
    var lista = porUf[uf];
    tooltip.innerHTML = '<b>' + NOMES[uf] + '</b><span>' +
      (lista ? plural(lista.length) : 'ainda não atendido') + '</span>';
    tooltip.classList.add('is-on');
  }
  function esconderTip() { tooltip.classList.remove('is-on'); }

  /* ---------------------------------------------------------
     Painel lateral: ranking ↔ detalhe do estado
     --------------------------------------------------------- */
  var selecionado = null;

  function ranking() {
    var box = el('div', 'mapa__box');
    box.appendChild(el('h3', 'mapa__box-tit', 'Onde o Seu Cartório já está'));

    var ul = el('ul', 'mapa__rank');
    ufsComPresenca
      .sort(function (a, b) {
        return porUf[b].length - porUf[a].length || NOMES[a].localeCompare(NOMES[b]);
      })
      .forEach(function (uf) {
        var li = el('li');
        var b = el('button');
        b.type = 'button';
        b.innerHTML = '<span class="uf">' + uf + '</span>' +
          '<span class="nome">' + NOMES[uf] + '</span>' +
          '<span class="n">' + porUf[uf].length + '</span>';
        b.addEventListener('click', function () { selecionar(uf); });
        li.appendChild(b);
        ul.appendChild(li);
      });
    box.appendChild(ul);
    box.appendChild(el('p', 'mapa__nota', 'Clique num estado do mapa para ver os cartórios atendidos.'));
    return box;
  }

  function detalhe(uf) {
    var lista = porUf[uf];
    var box = el('div', 'mapa__box');

    var topo = el('div', 'mapa__box-topo');
    var h = el('h3', 'mapa__box-tit', NOMES[uf] + ' (' + uf + ')');
    var fechar = el('button', 'mapa__fechar', '×');
    fechar.type = 'button';
    fechar.setAttribute('aria-label', 'Voltar para a lista de estados');
    fechar.addEventListener('click', function () { selecionar(null); });
    topo.appendChild(h);
    topo.appendChild(fechar);
    box.appendChild(topo);

    box.appendChild(el('p', 'mapa__box-sub', plural(lista.length)));

    var ul = el('ul', 'mapa__lista');
    lista.forEach(function (c) {
      var li = el('li');
      li.innerHTML = '<span class="n">' + c.nome + '</span>' +
        '<span class="c">' + c.cidade + ' · ' + c.uf + '</span>';
      ul.appendChild(li);
    });
    box.appendChild(ul);
    return box;
  }

  function selecionar(uf) {
    if (uf && !porUf[uf]) uf = null;
    selecionado = selecionado === uf ? null : uf;
    Object.keys(formas).forEach(function (k) {
      formas[k].classList.toggle('is-sel', k === selecionado);
    });
    esconderTip();
    painel.innerHTML = '';
    painel.appendChild(selecionado ? detalhe(selecionado) : ranking());
  }

  selecionar(null);

  /* Números do cabeçalho preenchidos a partir dos mesmos dados */
  var alvos = {
    cartorios: CARTORIOS.length,
    estados: ufsComPresenca.length,
    cidades: Object.keys(CARTORIOS.reduce(function (m, c) {
      m[c.cidade + '/' + c.uf] = 1; return m;
    }, {})).length
  };
  document.querySelectorAll('[data-mapa-num]').forEach(function (n) {
    var v = alvos[n.dataset.mapaNum];
    if (v == null) return;
    n.textContent = v;
    n.dataset.count = v; // site.js anima a contagem quando a seção entra em tela
  });
})();
