# Site AYIO — AI Software Studio

Site institucional estático (HTML + CSS + JS puro, sem build e sem gerenciador de pacotes).
Única dependência: GSAP + ScrollTrigger, versionados em `assets/vendor/` — nada é
baixado em runtime, nenhuma requisição sai para terceiros.

## Rodar

```bash
cd siteAyio
python3 -m http.server 8000
# abra http://localhost:8000
```

> Precisa de um servidor HTTP simples — abrir o `index.html` direto pelo `file://`
> funciona, mas alguns caminhos relativos e o preload de fontes ficam melhores servidos.

## Estrutura

```
index.html                  Home (hero, studio, produtos, método, contato)
produtos/seu-cartorio.html  Carro-chefe: atendimento com IA + Ata Notarial
produtos/licensys.html      Gestão ambiental inteligente
produtos/adaptai.html       Educação inclusiva
assets/css/site.css         Design system + todos os efeitos
assets/js/site.js           Efeitos
assets/vendor/              GSAP 3.13 + ScrollTrigger (licença gratuita, uso comercial)
assets/brand/               Logos extraídos dos arquivos de referência
assets/img/                 Imagens de conteúdo
ref/                        Arquivos de referência originais (não usados em runtime)
```

## Demos vivas dos produtos

Cada card da home mostra o produto funcionando, não o logo dele. As três micro-demos
são amarradas ao scroll (`scrub`): quem rola controla a animação.

| Produto | Demo |
|---|---|
| Seu Cartório | conversa: pergunta → IA digitando → resposta |
| LicenSys | barras de prazo enchendo + alerta preventivo acendendo |
| AdaptAI | página densa → página adaptada: menos linhas, tipografia maior, pictogramas |

A barra de título de cada janela é a barra da marca do produto, com o fundo que a
própria identidade pede: o Seu Cartório é knockout e usa fundo escuro; LicenSys e
AdaptAI são coloridos sobre claro e usam o branco/off-white dos seus originais.
Os lockups horizontais (`assets/brand/hdr-*.png`) foram montados a partir dos
arquivos de referência, sem a tagline, para caber legíveis a 26px de altura.

No mobile o empilhamento sticky é desligado e a demo sobe para logo abaixo do
título — sem ela no meio, o card vira uma parede de texto até o rodapé.

A janela é a **entrada** do card, terminando pouco antes de ele encostar no topo:
dali em diante o card seguinte já começa a cobri-lo, e uma demo rodando embaixo de
outro card é história contada pela metade.

Sem GSAP, ou com `prefers-reduced-motion: reduce`, o estado final é o estado natural
do CSS — as demos aparecem montadas e legíveis, sem nenhum salto.

## Efeitos implementados

| Efeito | Onde |
|---|---|
| Preloader com contador | home |
| Scroll com inércia (lerp) | todas — desktop, respeita `prefers-reduced-motion` |
| Cursor customizado (ponto + anel que cresce) | todas — desktop |
| Canvas de rede neural interativa | heros (ecoa o banner da marca) |
| Reveal de título palavra a palavra com máscara | todos os `[data-split]` |
| Reveal por scroll (rise / clip / grow) | `[data-rise]`, `[data-clip]`, `[data-grow]` |
| Cards de produto empilhados com escala e escurecimento | home `#produtos` |
| Troca de cor de acento por seção | home — cada produto pinta o site com sua identidade |
| Parallax | `[data-speed]` |
| Botões magnéticos | `[data-magnet]` |
| Glow que segue o mouse nos cards | `.card` |
| Marquee infinito | home |
| Barra de progresso de scroll | todas |
| Nav que some ao descer e volta ao subir | todas |
| Demo de chat animado | Seu Cartório |
| Waveform da Ata Notarial | Seu Cartório |
| Acordeão | Seu Cartório |
| Máscara de revelação em imagens | LicenSys / AdaptAI |

Tudo degrada com `prefers-reduced-motion: reduce` e desliga o que é ponteiro-dependente
em telas de toque.

## Identidade visual usada

| Marca | Cores |
|---|---|
| AYIO | navy `#1B2A5E` · off-white `#F8F7F5` · acento ciano `#4FD1E0` (do banner) |
| Seu Cartório | navy `#1E3A5F` · vermelho `#B00000` · coral `#C94D4D` |
| LicenSys | `#081F30` `#298268` `#23757A` `#086C8A` `#468D51` `#22816A` `#F8F7F5` |
| AdaptAI | `#164A67` `#7BD3BD` `#A783EB` `#6EB7EB` `#EB70A4` `#ECC75F` `#66C5E1` `#B974E6` `#E567B9` `#FFEE08` |

## Sobre as referências

- `ref/bannerAyio.jpeg`, `ref/LogoAyio.jpeg` — marca AYIO. Os logos em PNG com
  transparência foram gerados a partir do banner (supersampling + threshold).
- `ref/Licensys.pdf`, `ref/logoLicenSys.pdf`, `ref/ resumo_licensys` — conteúdo e
  identidade da LicenSys. **A tabela de planos e valores do PDF foi deliberadamente
  omitida do site.**
- `ref/AdaptaiProd1-3.png`, `ref/Logo AdaptAI .pdf` — conteúdo e identidade do AdaptAI.
- **Não existe `logoSeuCartorio` em `ref/`.** A identidade do Seu Cartório foi
  extraída do próprio produto, em
  `../Seu cartório/seucartorio/frontend/public/page1.png` e
  `frontend/src/components/Logo.js` (paleta navy + coral, tagline
  "Soluções Cartorárias Digitais").

## Contato publicado no site

Site `ayio.com.br` · E-mail `comercial@ayio.com.br` · WhatsApp `(11) 97179-7155`
(extraídos da última página de `ref/Licensys.pdf`).
