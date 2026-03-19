// =============================================================================
//  ORDOVICIANO — Período 1
// =============================================================================
export const ordovicianoSlides = [
    // Slide 0 - HOME
    {
        type: 'home',
        period: 'ordoviciano',
        section: 'home'
    },

    // Slide 1 - INTRO BIODIVERSIDADE (Canva Pg 2)
    {
        type: 'section_intro',
        period: 'ordoviciano',
        section: 'biodiversidade',
        title: 'A BIODIVERSIDADE DA ÉPOCA',
        description: 'Conheça os representantes da fauna e da flora característicos desse momento geológico.',
        videoSrc: '/assets/placeholder.mp4'
    },

    // Slides 2-8: Espécies (Canva Pg 3 a 9)
    {
        type: 'single_species',
        period: 'ordoviciano',
        section: 'biodiversidade',
        id: 'homotelus',
        name: 'HOMOTELUS SP.',
        subtitle: 'Trilobitas, com cerca de 8 cm de comprimento',
        description: 'A descoberta de muitos fósseis completos de trilobitas do gênero Homotelus juntos, indica que estes animais formavam grandes agregados sazonais, provavelmente para fins reprodutivos. Se alimentavam de restos orgânicos presentes no assoalho oceânico.',
        videoSrc: '/assets/videos/homotelus_sp.mp4'
    },
    {
        type: 'single_species',
        period: 'ordoviciano',
        section: 'biodiversidade',
        id: 'cameroceras',
        name: 'CAMEROCERAS SP.',
        subtitle: 'Molusco predador, podia chegar até 10 m de comprimento',
        description: 'Seu nome significa "chifre com câmaras". Era o maior predador de sua época e assemelhava-se a uma lula, mas com uma imensa concha em forma de cone.',
        videoSrc: '/assets/videos/cameroceras_sp.mp4'
    },
    {
        type: 'single_species',
        period: 'ordoviciano',
        section: 'biodiversidade',
        id: 'megalograptus',
        name: 'MEGALOGRAPTUS SP.',
        subtitle: 'Artrópode predador, com cerca de 1,2 m de comprimento',
        description: 'Conhecido também como "escorpião-marinho", era relativamente grande para um predador desse período e um dos escorpiões-marinhos mais antigos que se conhecem.',
        videoSrc: '/assets/videos/megalograptus_sp.mp4'
    },
    {
        type: 'single_species',
        period: 'ordoviciano',
        section: 'biodiversidade',
        id: 'balacrinus',
        name: 'BALACRINUS SP.',
        subtitle: 'Equinodermo filtrador, com cerca de 5 cm de comprimento',
        description: 'Animais marinhos conhecidos como lírios-do-mar. Esses organismos possuem um corpo com uma base calcária e longos braços que se estendem para capturar alimento. Viviam aderidos no substrato oceânico.',
        videoSrc: '/assets/videos/balacrinus_sp.mp4'
    },
    {
        type: 'single_species',
        period: 'ordoviciano',
        section: 'biodiversidade',
        id: 'sacabambaspis',
        name: 'SACABAMBASPIS SP.',
        subtitle: 'Peixe sem mandíbula, com aproximadamente 25 cm de comprimento',
        description: 'Sua boca em forma de colher, tinha pequenas fileiras de plaqueta ósseas para raspar algas e lodo do fundo do mar, bem como se alimentar realizando sucção (sugando). Habitaba águas rasas nas margens continentais de Gondwana.',
        videoSrc: '/assets/videos/sacabambaspis_sp.mp4'
    },
    {
        type: 'single_species',
        period: 'ordoviciano',
        section: 'biodiversidade',
        id: 'promissum',
        name: 'PROMISSUM SP.',
        subtitle: 'Conodonte predador, com aproximadamente 40 cm de comprimento',
        description: 'Estes animais apresentavam uma boca primitiva sob os olhos, com dentes mineralizados e uma espinha dorsal primitiva. Parecia uma pequena enguia ou um grande verme, sem nenhum tipo de barbatana.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'ordoviciano',
        section: 'biodiversidade',
        id: 'sowerbyella',
        name: 'SOWERBYELLA SP.',
        subtitle: 'Braquiópodes filtradores, com 1,5 cm de comprimento',
        description: 'Animais solitários, exclusivamente marinhos e bentônicos. Apresentam corpo mole incluso numa carapaça composta por duas valvas com espinhos, viviam aderidos no fundo oceânico.',
        videoSrc: '/assets/placeholder.mp4'
    },

    // Slide 9: Extinction Intro (Canva Pg 10)
    {
        type: 'section_intro',
        period: 'ordoviciano',
        section: 'extincao',
        title: 'A EXTINÇÃO',
        content: 'Nesse momento geológico, os níveis de dióxido de carbono no planeta diminuíram, reduzindo o efeito estufa e causando o resfriamento do planeta, o que, somado ao deslocamento de Gondwana em direção ao Polo Sul, criou uma cobertura de gelo nessa região, que também se alastrou sobre algumas áreas continentais e costeiras, como na imagem a seguir:',
        bgImage: '/assets/extinction_map.png'
    },

    // Slide 10: Extinction Content (Canva Pg 11)
    {
        type: 'extinction_content',
        period: 'ordoviciano',
        section: 'extincao',
        title: 'A EXTINÇÃO',
        topText: 'Nesse momento geológico, os níveis de dióxido de carbono no planeta diminuíram, reduzindo o efeito estufa e causando o resfriamento do planeta, o que, somado ao deslocamento de Gondwana em direção ao Polo Sul, criou uma cobertura de gelo nessa região, que também se alastrou sobre algumas áreas continentais e costeiras, como na imagem abaixo:',
        imageSrc: '/assets/extinction_map.png',
        imageCaption: 'Aparência do planeta Terra durante o final do período Ordoviciano, com a cobertura de gelo alastrada devido as baixas temperaturas.',
        bottomText: 'Gradualmente a temperatura diminui, o nível do mar baixa e os invertebrados marinhos começam a morrer. Cerca de 85% de todas as espécies que habitavam as águas rasas pereceram congeladas. Aqueles poucos que sobreviveram se refugiaram nas águas profundas.',
    },

    // Slide 11 - E DEPOIS? Intro (Canva Pg 12)
    {
        type: 'section_intro',
        period: 'ordoviciano',
        section: 'pos_extincao',
        title: 'E DEPOIS?',
        periodLabel: 'PERÍODO',
        periodName: 'ORDOVICIANO',
        content: 'Aparência do planeta Terra durante o início do período Siluriano, com a cobertura de gelo sendo reduzida devido ao aumento nas temperaturas do globo terrestre.',
        bgImage: '/assets/extinction_map.png'
    },

    // Slide 12 - E DEPOIS? Globe (Canva Pg 13)
    {
        type: 'silurian_globe',
        period: 'ordoviciano',
        section: 'pos_extincao',
        title: 'E DEPOIS?',
        content: 'Vista do globo terrestre, com a disposição da massa continental correspondente à nova época retratada: Período Siluriano. No início desse período, cerca de 200 mil anos após a primeira extinção em massa, houve um aumento no nível de gás carbônico atmosférico. Como consequência, a temperatura do planeta voltou a aumentar, fazendo com que as enormes geleiras derretessem e a vida tomasse um novo curso.',
        imageSrc: '/assets/mapa-depois.png'
    },

    // Slide 13 - Dalmanites sp. (Canva Pg 14)
    {
        type: 'silurian_specimen',
        period: 'ordoviciano',
        section: 'pos_extincao',
        name: 'DALMANITES SP.',
        subtitle: 'Trilobita, com cerca de 8 cm de comprimento',
        introText: 'As novas mudanças alteraram a biota, com novas espécies tornando-se abundantes (novo zoom para demonstrar o ambiente oceânico). Na representação do Siluriano, sugerimos retratar os animais que seguem:',
        description: 'Possuíam exoesqueleto levemente convexos, terminados em uma cauda com extremidade pontiaguda. Se alimentava de matéria orgânica em decomposição, como restos de plantas e outros organismos. Se alimentavam de restos orgânicos presentes no assoalho oceânico.',
        imageSrc: 'assets/dalmanites.png'
    },

    // Slide 14 - Double Species (Halysites + Cyrtograptus) (Canva Pg 15)
    {
        type: 'silurian_double_specimen',
        period: 'ordoviciano',
        section: 'pos_extincao',
        speciesLeft: {
            name: 'HALYSITES SP.',
            subtitle: 'Corais, que podiam chegar a 40 cm de altura',
            description: 'Conhecidos por suas estruturas em colônias ramificadas e tabulados, que se assemelham a colmeias. Seu alimento era composto basicamente por plâncton.',
            imageSrc: 'assets/halysites.png'
        },
        speciesRight: {
            name: 'CYRTOGRAPTUS SP.',
            subtitle: 'Graptólitos filtradores, com cerca de 12 cm de diâmetro',
            description: 'Um dos primeiros animais a colonizar ambientes de mar aberto. Formado por uma espiral helicoidal baixa com 1,5 voltas firmemente enroladas, munidos de espinhos dorsolaterais.',
            imageSrc: 'https://media.canva.com/v2/image-resize/format:PNG/height:169/quality:100/uri:ifs%3A%2F%2FM%2Fb213e829-7294-4d36-8486-805bc3f8ae3d/watermark:F/width:309?csig=AAAAAAAAAAAAAAAAAAAAAFYB_VYBWuQY-AU_EHXQ8f3XRnWK6LxqhJAwWZ7cHcZC&exp=1773807571&osig=AAAAAAAAAAAAAAAAAAAAABl4Ydo9nmS_PSHapdv_SURkDNhz-FX7R2zpgvOXYJs2&signer=media-rpc&x-canva-quality=screen'
        }
    },

    // Slide 15 - Double Species (Favosites + Heliolites) (Canva Pg 16)
    {
        type: 'silurian_double_specimen',
        period: 'ordoviciano',
        section: 'pos_extincao',
        speciesLeft: {
            name: 'FAVOSITES SP.',
            subtitle: 'Corais filtradores, podendo chegar a 30 cm de altura',
            description: 'A estrutura deste coral era parecida com um favo-de-mel, dando-lhes o nome de "corais favos-de-mel". As paredes deste coral apresentavam poros, que facilitavam a troca de nutrientes entre os organismos coloniais.',
            imageSrc: 'assets/favosites.png'
        },
        speciesRight: {
            name: 'HELIOLITES SP.',
            subtitle: 'Corais filtradores, com cerca de 15 cm de altura',
            description: 'Os membros do gênero são distinguidos por um coenênquima tubular proeminente (o tecido que liga os pólipos vizinhos) com 14-17 túbulos ao redor de cada coralito (a "taça calcárea" na qual cada pólipo fica).',
            imageSrc: 'assets/heliolites.png'
        }
    },

    // Slide 16 - Atrypa sp. (Canva Pg 17)
    {
        type: 'silurian_specimen',
        period: 'ordoviciano',
        section: 'pos_extincao',
        id: 'atrypa',
        name: 'ATRYPA SP.',
        subtitle: 'braquiópode filtrador, com cerca de 3 cm de comprimento',
        description: 'Apresentavam conchas redondas a curtas em forma de ovo, cobertas com muitas cristas radiais finas (ou costae), que se dividem mais para fora e linhas de crescimento perpendiculares às costae e 2-3 vezes mais espaçadas. Viviam aderidos ao substrato oceânico.',
        imageSrc: 'assets/atrypa.png'
    },
];

// =============================================================================
//  DEVONIANO — Período 2
// =============================================================================
export const devonianoSlides = [
    // Slide 0 - HOME DEVONIANO
    {
        type: 'home_devonian',
        period: 'devoniano',
        section: 'home'
    },

    // Slide 1 - INTRO BIODIVERSIDADE (Canva Pg 2)
    {
        type: 'section_intro',
        period: 'devoniano',
        section: 'biodiversidade',
        title: 'A BIODIVERSIDADE DA ÉPOCA',
        description: 'Conheça os representantes da fauna e da flora característicos desse momento geológico.',
        videoSrc: '/assets/placeholder.mp4'
    },

    // Slides 2-12: Espécies (Canva Pg 3 a 13)
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'biodiversidade',
        id: 'dunkleosteus',
        name: 'DUNKLEOSTEUS SP.',
        subtitle: 'Peixe predador, com cerca de 4 a 10 m de comprimento',
        description: 'Um dos maiores predadores da época, com um corpo dotado de placas que formavam uma armadura óssea. Era capaz de partir um tubarão ao meio com uma única mordida.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'biodiversidade',
        id: 'campbellodus',
        name: 'CAMPBELLODUS SP.',
        subtitle: 'Peixe carnívoro, com cerca de 40 cm de comprimento',
        description: 'Era um peixe dotado de placas ósseas. Seu fóssil foi encontrado em perfeita forma tridimensional. Seus dentes eram feitos de placas ósseas para quebrar e triturar conchas.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'biodiversidade',
        id: 'ctenacanthus',
        name: 'CTENACANTHUS SP.',
        subtitle: 'Peixe cartilaginoso predador, com cerca de 2 m de comprimento',
        description: 'Tubarão com uma mandíbula poderosa, que apresentava as espinhas das nadadeiras cobertas por fileiras de tubérculos, apresentando uma aparência de "pente".',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'biodiversidade',
        id: 'gogonasus',
        name: 'GOGONASUS SP.',
        subtitle: 'Peixe carnívoro, com cerca de 30 cm de comprimento',
        description: 'Possuía dois pares de nadadeiras lobadas e musculosas, além de um par de narinas externas.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'biodiversidade',
        id: 'griphognatus',
        name: 'GRIPHOGNATUS SP.',
        subtitle: 'Peixe dipnoico carnívoro, com cerca de 60 centímetros de comprimento',
        description: 'Peixe conhecido por apresentar um focinho em forma de "bico de pato", que era usado para procurar vermes e artrópodes no lodo do assoalho marinho.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'biodiversidade',
        id: 'furcaster',
        name: 'FURCASTER SP.',
        subtitle: 'Equinodermo carnívoro, com cerca de 60 cm de comprimento',
        description: 'Gênero extinto de "Brittle Stars" (estrelas frágeis). Seus 5 longos e finos braços eram utilizados para locomoção, de forma rastejante, no fundo do mar.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'biodiversidade',
        id: 'palaeoisopus',
        name: 'PALAEOISOPUS PROBLEMATICUS',
        subtitle: 'Artrópode predador, com cerca de 20 cm de comprimento',
        description: 'Era um picnogônida — parente ancestral das aranhas-do-mar. Seu corpo era sustentado por longas pernas articuladas, utilizadas para se mover sobre o fundo oceânico e capturar presas como corais e hidroides.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'biodiversidade',
        id: 'archaeopteris',
        name: 'ARCHAEOPTERIS SP.',
        subtitle: 'Árvore, com porte de até 30 m',
        description: 'Progimnosperma, com folhas semelhantes às das samambaias. Conhecida por ser considerada a primeira árvore lenhosa e primeira árvore a formar florestas.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'biodiversidade',
        id: 'tiktaalik',
        name: 'TIKTAALIK ROSEAE',
        subtitle: 'Peixe predador, de aproximadamente 1 a 2 m de comprimento',
        description: 'Vivia em lagos e rios de água doce, próximo à beira d\'água. Era um predador de emboscada. Utilizava suas nadadeiras para se elevar no raso e poderia sobreviver por curtos períodos fora d\'água, mecanismo desenvolvido para sobreviver dos grandes predadores marinhos da época, sendo um precursor dos tetrápodes.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'biodiversidade',
        id: 'ichthyostega',
        name: 'ICHTHYOSTEGA GUNNARI',
        subtitle: 'Tetrapodomorfo predador, de aproximadamente 1 m de comprimento',
        description: 'Um dos primeiros vertebrados terrestres. Se alimentavam de pequenos animais, como insetos, crustáceos e peixes, e viviam em pântanos e ambientes alagados, os quais capturava através de emboscadas. Seus olhos eram no topo da cabeça, possibilitando uma boa visão para caça.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'biodiversidade',
        id: 'drepanophycus',
        name: 'DREPANOPHYCUS SP.',
        subtitle: 'Planta vascular, com aproximadamente 50 cm',
        description: 'Plantas vasculares de folhas micrófilas (pequenas folhinhas) extintas do gênero Lycopodiophyta. Seu talo era decumbente, fazendo-o crescer rasteiro ao solo.',
        videoSrc: '/assets/placeholder.mp4'
    },

    // Slide 13 - Extinction (Canva Pg 14-15) — mesmo componente do Ordoviciano
    {
        type: 'section_intro',
        period: 'devoniano',
        section: 'extincao',
        title: 'A EXTINÇÃO',
        content: 'Erupções vulcânicas soltam fuligem no ar. A nuvem de fuligem vai gradualmente tapando o Sol. As plantas começam a murchar e morrer. Ao mesmo tempo, os níveis de oxigênio do oceano baixam e os seres vivos aquáticos são os que mais sofrem. Os únicos grupos que conseguiram sobreviver foram alguns representantes dos peixes ósseos e alguns poucos tubarões. A fuligem e a falta de alimento ocasionam também na extinção de animais terrestres, por intoxicação e fome. Neste caso, restaram apenas alguns poucos sobreviventes, que mais tarde originarão a linhagem dos tetrápodes, a qual dominará a terra.',
        bgImage: '/assets/extinction_map.png',
    },

    // Slide 14 - Ambientes Aquático + Terrestre (Canva Pg 15)
    {
        type: 'silurian_double_specimen',
        period: 'devoniano',
        section: 'extincao',
        speciesLeft: {
            name: 'AMBIENTE AQUÁTICO',
            subtitle: 'Representação do ambiente aquático no final do Devoniano.',
            description: '',
            imageSrc: '/assets/placeholder.mp4'
        },
        speciesRight: {
            name: 'AMBIENTE TERRESTRE',
            subtitle: 'Representação do ambiente terrestre do Devoniano.',
            description: '',
            imageSrc: '/assets/placeholder.mp4'
        }
    },

    // Slide 14 - E DEPOIS? Intro (Canva Pg 16)
    {
        type: 'section_intro',
        period: 'devoniano',
        section: 'pos_extincao',
        title: 'E DEPOIS?',
        periodLabel: 'PERÍODO',
        periodName: 'DEVONIANO',
        content: '',
        bgImage: '/assets/extinction_map.png'
    },

    // Slide 15 - E DEPOIS? Globe (Canva Pg 17)
    {
        type: 'silurian_globe',
        period: 'devoniano',
        section: 'pos_extincao',
        title: 'E DEPOIS?',
        content: 'Vista do globo terrestre, com a disposição da massa continental correspondente à nova época retratada: o Período Carbonífero. Nesse período, os continentes se juntaram para formar a Pangeia. “Carbonífero”, é uma referência às grandes formações de jazidas de carvão que datam desse período, marcado também por uma notável proliferação de animais e plantas terrestres. Grupos outrora dominantes, como peixes sarcopterígios, placodermes e acantoides, deram lugar a tetrápodes, peixes actinopterígeos e peixes condrictes. O Carbonífero também foi marcado por grandes quantidades do oxigênio presente na atmosfera, o que possibilitou o surgimento de animais com tamanhos grandes, como a Meganeura. Embora a maioria da vida marinha tenha sido extinta, alguns animais sobreviveram e se diversificaram posteriormente.',
        imageSrc: '/assets/mapa-depois.png',
        imageCaption: 'Aparência do planeta Terra durante o início do período Carbonífero. Imagem de referência. A cor dos continentes no mapa preto e branco (continentes todos em branco) não representa gelo em sua grande maioria e os pontos verdes devem ser desconsiderados. Observe a cobertura de gelo no mapa superior, que reflete a correta distribuição deste.',
    },

    // Slide 16 - Meganeura (Canva Pg 18)
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'pos_extincao',
        id: 'meganeura',
        name: 'MEGANEURA MONYI',
        subtitle: 'Libélula gigante, com cerca de 70 cm de envergadura de asa',
        description: 'Semelhantes às libélulas atuais, porém muito maior. Seu tamanho era similar ao de um pombo-comum e pesava cerca de 1,2 kg.',
        videoSrc: '/assets/placeholder.mp4'
    },

    // Slide 17 - Stethacanthus (Canva Pg 19)
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'pos_extincao',
        id: 'stethacanthus',
        name: 'STETHACANTHUS SP.',
        subtitle: 'Peixe cartilaginoso carnívoro, com cerca de 70 cm de comprimento',
        description: 'Similar aos tubarões de hoje em dia, acredita-se que a sua barbatana dorsal, além de hidrodinâmica, tenha servido para proteção passiva contra os predadores e para cortejo de fêmeas, pois só os machos possuíam esta estrutura.',
        videoSrc: '/assets/placeholder.mp4'
    },

    // Slide 18 - Arthropleura (Canva Pg 20)
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'pos_extincao',
        id: 'arthropleura',
        name: 'ARTHROPLEURA SP.',
        subtitle: 'Artrópode herbívoro, com aproximadamente 2,5 m de comprimento',
        description: 'Maior invertebrado terrestre que já existiu. Acredita-se que possuía pouquíssimos predadores, devido ao seu tamanho massivo. Como as meganeuras, seu tamanho se dá devido à alta abundância de oxigênio na época.',
        videoSrc: '/assets/placeholder.mp4'
    },

    // Slide 19 - Amphibamus (Canva Pg 21)
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'pos_extincao',
        id: 'amphibamus',
        name: 'AMPHIBAMUS SP.',
        subtitle: 'Anfíbio ancestral carnívoro, com cerca de 20 cm de comprimento',
        description: 'Estudos indicam que ele seja o ancestral dos anfíbios atuais. Como os anfíbios, precisavam por seus ovos em corpos d\'água pois eles não possuíam uma casca protetora.',
        videoSrc: '/assets/placeholder.mp4'
    },


    // Slide 20 - Sphenophyllum (Canva Pg 22)
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'pos_extincao',
        id: 'sphenophyllum',
        name: 'SPHENOPHYLLUM SP.',
        subtitle: 'Cavalinha, com porte de até 1 m de altura',
        description: 'Planta vascular que crescia em ambientes úmidos das florestas carboníferas. Seus caules apresentavam nós distintos e folhas em formato de cunha dispostas em verticilo ao redor do caule.',
        videoSrc: '/assets/placeholder.mp4'
    },

    // Slide 21 - Calamites (Canva Pg 23)
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'pos_extincao',
        id: 'calamites',
        name: 'CALAMITES SP.',
        subtitle: 'Cavalinha, com porte de até 30 a 50 m de altura',
        description: 'Era uma espécie de cavalinha primitiva que apresentava uma arquitetura nó-entrenó bem definida, semelhante às cavalinhas modernas, e seus galhos e folhas emergiam em espirais desses nós. Se situavam principalmente ao longo das margens arenosas dos rios, e tinham a capacidade de brotar vigorosamente de rizomas subterrâneos quando as porções superiores da planta eram danificadas.',
        videoSrc: '/assets/placeholder.mp4'
    },

    // Slide 22 - Cordaites (Canva Pg 24)
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'pos_extincao',
        id: 'cordaites',
        name: 'CORDAITES SP.',
        subtitle: 'Árvore, com porte de até 30 m de altura',
        description: 'Plantas com sementes consideradas relacionadas às coníferas (ou podem ser as primeiras coníferas). Acredita-se que os cordaites cresciam como árvores e arbustos lenhosos, e alguns propuseram que eles até desenvolveram um hábito de mangue com raízes sustentadas. Os cordaites cresceram tanto em terra seca quanto em pântanos úmidos em toda a sua área de distribuição.',
        videoSrc: '/assets/placeholder.mp4'
    },

    // Slide 23 - Sigillaria (Canva Pg 25)
    {
        type: 'single_species',
        period: 'devoniano',
        section: 'pos_extincao',
        id: 'sigillaria',
        name: 'SIGILLARIA SP.',
        subtitle: 'Árvore, com porte de até 30 a 50 m de altura',
        description: 'Licopódios gigantes que estão relacionados aos musgos atuais que dominavam os manguezais que deram origem as famosas jazidas de carvão do carbonífero. Caracterizado por um fino fio de madeira e casca grossa. Folhas longas e finas cresciam em espiral ao longo do tronco, onde permanecia a cicatriz foliar quando a folha caía. Situava-se em solos ais bem drenados, sobrevivendo à secagem dos grandes pântanos de carvão.',
        videoSrc: '/assets/placeholder.mp4'
    },
];

// =============================================================================
//  PERMIANO — Período 3
// =============================================================================
export const permianoSlides = [
    {
        type: 'home_permiano',
        period: 'permiano',
        section: 'home'
    },
    {
        type: 'section_intro',
        period: 'permiano',
        section: 'biodiversidade',
        title: 'A BIODIVERSIDADE DA ÉPOCA',
        description: 'Conheça os representantes da fauna e da flora característicos desse momento geológico.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'permiano',
        section: 'biodiversidade',
        id: 'archosaurus',
        name: 'ARCHOSAURUS ROSSICUS',
        subtitle: 'Arcossauriforme predador, com cerca de 1-3m de comprimento',
        description: 'Possuiam membros curtos e postura semelhante a crocodilianos modernos. Foi um dos primeiros arcossauriformes descobertos.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'permiano',
        section: 'biodiversidade',
        id: 'scutosaurus',
        name: 'SCUTOSAURUS SP.',
        subtitle: 'Réptil herbívoro, com cerca de 2m de comprimento',
        description: 'Maior herbívoro de sua época, seu crânio em forma de capacete e seu corpo revestido por placas ósseas ofereciam uma forte defesa contra os predadores da época.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'permiano',
        section: 'biodiversidade',
        id: 'dvinia',
        name: 'DVINIA PRIMA',
        subtitle: 'Cinodonte onívoro, com cerca de 50cm de comprimento',
        description: 'Como todos os cinodontes, eles eram relacionados aos mamíferos. Grande parte de sua dieta era composta por plantas. Vivia próximo a corpos d’água, provavelmente em tocas.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'permiano',
        section: 'biodiversidade',
        id: 'arctotypus',
        name: 'ARCTOTYPUS SYLVAENSIS',
        subtitle: 'Libélula gigante, com cerca de 30cm de envergadura de asa',
        description: 'Depositava seus ovos em plantas similares as cavalinhas atuais. Viviam em regiões de floresta ou pantanosas, com água fresca, onde caçavam pequenos insetos e animais. Também serviam de alimento a outros animais.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'permiano',
        section: 'biodiversidade',
        id: 'dicynodon',
        name: 'DICYNODON SP.',
        subtitle: 'Dicinodonte herbívoro, com aproximadamente 1.2m',
        description: 'Foi o primeiro fóssil descrito da África e que mostrou evidências de características mamalianas em animais fora do grupo dos mamíferos. Além dos dois dentes canídeos, possuíam um tipo de bico, para ajudar a cortar a vegetação.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'permiano',
        section: 'biodiversidade',
        id: 'glossopteris',
        name: 'GLOSSOPTERIS SP.',
        subtitle: 'Árvore, com porte de até 30m de altura',
        description: 'As folhas desta gimnosperma semelhante a samambaia são alongadas, lembrando o formato de uma língua e com um veio central proeminente. Formavam grandes florestas durante este período.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'permiano',
        section: 'biodiversidade',
        id: 'phyllotheca',
        name: 'PHYLLOTHECA SP.',
        subtitle: 'Cavalinha, com porte de até 3m de altura',
        description: 'Era uma espécie de cavalinha primitiva que era bastante comum nas florestas glossopterídeas. Caracteriza-se por folhas finas dispostas em espiral, que partem da planta, deixando as folhas aglomeradas em discos.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'section_intro',
        period: 'permiano',
        section: 'extincao',
        title: 'A EXTINÇÃO',
        content: 'Movimentos tectônicos desencadearam eventos vulcânicos, levando a derrames maciços de lava basáltica que cobriram milhões de quilômetros, destruindo todo o ambiente que alcançaram. Segue um movimento de zoom in, mostrando o continente devastado.\n\nPode-se, então, observar que a grande atividade vulcânica resultou em uma forte emissão de gases envolvidos no efeito estufa, desencadeando um acentuado aquecimento global. Nos mares, os movimentos tectônicos liberaram grandes quantidades de gás metano preso no assoalho oceânico, tornando as águas oceânicas rapidamente anóxicas e eliminando a maioria da vida terrestre e aquática. Apenas alguns poucos animais sobreviveram e herdaram uma terra desolada para seguirem a vida.',
        bgImage: '/assets/extinction_map.png'
    },
    {
        type: 'silurian_double_specimen',
        period: 'permiano',
        section: 'extincao',
        speciesLeft: {
            name: 'CONTINENTE DEVASTADO',
            subtitle: 'Representação de como deveria ter sido a aparência do continente durante a grande extinção',
            description: '',
            imageSrc: '/assets/placeholder.mp4'
        },
        speciesRight: {
            name: 'DIVERSIFICAÇÃO',
            subtitle: 'Representação de algumas espécies que sobreviveram a grande extinção e como se diversificaram posteriormente.',
            description: '',
            imageSrc: '/assets/placeholder.mp4'
        }
    },
    {
        type: 'section_intro',
        period: 'permiano',
        section: 'pos_extincao',
        title: 'E DEPOIS?',
        periodLabel: 'PERÍODO',
        periodName: 'PERMIANO',
        content: '',
        bgImage: '/assets/extinction_map.png'
    },
    {
        type: 'silurian_globe',
        period: 'permiano',
        section: 'pos_extincao',
        title: 'E DEPOIS?',
        content: 'Vista do globo terrestre com a disposição da massa continental correspondente à nova época retratada: Período Triássico. Após a extinção do final do Permiano, as temperaturas dispararam de 15ºC para 22ºC, o que fez com que as calotas polares desaparecessem por completo. No período Triássico, o ambiente se tornou mais árido e as chuva sazonais formavam rios, planícies de inundação e lagos. Os répteis foram duramente atingidos e apenas alguns representantes de pequeno porte sobreviveram. Os seres que dominavam a paisagem eram basicamente raros peixes, anfíbios primitivos aquáticos de cerca de 1m e alguns poucos dicinodontes.',
        imageSrc: '/assets/mapa-depois.png',
        imageCaption: 'Aparência do planeta Terra durante o início do período Triássico. Imagem de referência. A cor dos continentes no mapa preto e branco (continentes todos em branco) não representa gelo e os pontos roxos devem ser desconsiderados.',
    },
    {
        type: 'silurian_specimen',
        period: 'permiano',
        section: 'pos_extincao',
        id: 'benthosuchus',
        name: 'BENTHOSUCHUS SP.',
        subtitle: 'Anfíbio predador, com 1,80m de comprimento',
        introText: 'As novas mudanças alteraram a biota, com novas espécies tornando-se abundantes (novo zoom para demonstrar o ambiente terrestre). Na representação do Triássico, sugerimos retratar os animais que seguem:',
        description: 'Vivia em lagos, se alimentando de peixes e pequenos anfíbios como um predador de emboscada, com os olhos posicionados no topo da cabeça.',
        imageSrc: '/assets/placeholder.png'
    },
    {
        type: 'single_species',
        period: 'permiano',
        section: 'pos_extincao',
        id: 'lystrosaurus',
        name: 'LYSTROSAURUS SP.',
        subtitle: 'Dicinodonte herbívoro, entre 1m e 2.5m de comprimento',
        description: 'Eram animais que poderiam apresentar hábito semiaquático. Alguns estudos indicam que cavavam tocas para se abrigar e se alimentavam de plantas resistentes a secas, como as cavalinhas primitivas.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'permiano',
        section: 'pos_extincao',
        id: 'thrinaxodon',
        name: 'THRINAXODON SP.',
        subtitle: 'Cinodonte carnívoro, com aproximadamente 50cm de comprimento',
        description: 'Se alimentava de pequenos insetos e répteis, vermes e outros cinodontes. Seu tamanho era próximo ao de um gato e apresenta mudanças importantes para a trajetória dos mamíferos, como modificações do crânio, na mandíbula, no dorso e cauda fina.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'permiano',
        section: 'pos_extincao',
        id: 'procolophon',
        name: 'PROCOLOPHON SP.',
        subtitle: 'Réptil herbívoro, com até 40cm de comprimento',
        description: 'Procolofonídeo que viviam em grupos, se abrigando em tocos ou buracos no solo. Pertencentes a um gênero que sobreviveu a extinção do permiano. Alguns estudos indicam que este animal também pode ter apresentado uma boa visão noturna.',
        videoSrc: '/assets/placeholder.mp4'
    },
    {
        type: 'single_species',
        period: 'permiano',
        section: 'pos_extincao',
        id: 'voltziopsis',
        name: 'VOLTZIOPSIS SP.',
        subtitle: 'Árvore, com aproximadamente 5 a 10m de altitude',
        description: 'Formavam florestas de baixa altitude, próximas a cursos d’água. São plantas que pertencem a linhagem ancestral das quais surgiram os grupos modernos de coníferas.',
        videoSrc: '/assets/placeholder.mp4'
    }
];

// =============================================================================
//  EXPORT UNIFICADO
// =============================================================================
export const slidesData = [...ordovicianoSlides, ...devonianoSlides, ...permianoSlides];

export const periodStartIndex = {
    ordoviciano: 0,
    devoniano: ordovicianoSlides.length,
    permiano: ordovicianoSlides.length + devonianoSlides.length,
};
