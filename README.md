# ZPL Label Designer

Editor visual de etiquetas para impressoras Zebra. A aplicação transforma uma composição criada por drag and drop em código ZPL pronto para copiar e integrar a fluxos de impressão.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-Jest-C21325?logo=jest)](https://jestjs.io/)

> Projeto de portfólio que explora edição gráfica no navegador, modelagem de estado, conversão entre unidades físicas e geração segura de uma linguagem de impressão.

## Sobre o projeto

Criar layouts ZPL manualmente exige trabalhar com coordenadas, densidade da impressora e comandos pouco visuais. O ZPL Label Designer reduz esse atrito com uma interface WYSIWYG: o usuário posiciona e redimensiona os elementos no canvas, ajusta suas propriedades e recebe o código correspondente.

Todo o processamento acontece no navegador. O desenho é persistido no `localStorage`, sem necessidade de backend ou envio de dados para um servidor.

## Principais recursos

- Canvas interativo com seleção, arraste e redimensionamento de elementos.
- Textos, variáveis de template, retângulos, linhas e códigos de barras EAN-13.
- Configuração da etiqueta em milímetros e suporte a 152, 203, 300 e 600 dpi.
- Conversão de medidas físicas para dots, mantendo o preview coerente com a resolução de impressão.
- Edição precisa de posição, dimensões e propriedades específicas de cada elemento.
- Painel de camadas sincronizado com a seleção do canvas.
- Preview de EAN-13 renderizado com `bwip-js`.
- Geração de comandos ZPL para texto (`^A`, `^FB`), formas (`^GB`) e barcode (`^BE`).
- Escape de caracteres de controle para reduzir o risco de injeção de comandos ZPL.
- Exportação em modal e cópia do resultado para a área de transferência.
- Persistência automática do layout e das configurações no navegador.
- Confirmação antes de limpar todo o canvas.

## Stack e decisões técnicas

| Tecnologia | Papel no projeto |
| --- | --- |
| Next.js 16 + React 19 | Estrutura da aplicação e composição da interface |
| TypeScript | Tipagem do domínio, elementos e configurações de impressão |
| React Konva / Konva | Canvas, drag and drop e transformações visuais |
| Zustand | Estado global enxuto com persistência em `localStorage` |
| bwip-js | Renderização do preview do código de barras |
| Tailwind CSS 4 | Estilização responsiva baseada em utilitários |
| Radix UI | Primitivos acessíveis para dialogs, tabs, selects e painéis |
| Jest + Testing Library | Testes das regras de domínio e da geração de ZPL |

Algumas escolhas de implementação que merecem destaque:

- O canvas trabalha em **dots**, a mesma unidade usada pelo ZPL, evitando perda de precisão na exportação.
- A criação de elementos fica centralizada em uma factory pura, mantendo defaults consistentes e regras fáceis de testar.
- O gerador de ZPL também é uma função pura, desacoplada da interface e do estado global.
- O canvas é carregado apenas no cliente, pois Konva depende das APIs do navegador.
- A largura do EAN-13 respeita seus 95 módulos e é ajustada para múltiplos válidos durante o redimensionamento.
- O estado possui ações pequenas e explícitas, uma base preparada para evoluções como histórico de undo/redo.

## Arquitetura

```text
src/
├── app/                         # App Router, layout e estilos globais
├── components/
│   ├── canvas-elements/         # Renderização e transformação de cada elemento
│   ├── label-designer/          # Canvas, toolbar e painéis da aplicação
│   └── ui/                      # Componentes reutilizáveis de interface
├── constants/                   # Variáveis disponíveis para os templates
├── lib/
│   ├── element-factory.ts       # Defaults, criação e validações de domínio
│   └── zpl-generator.ts         # Conversão do layout em comandos ZPL
├── store/useLabelStore.ts       # Estado global e persistência
├── types.ts                     # Contratos TypeScript do domínio
└── __tests__/                   # Testes unitários
```

O fluxo principal é direto:

```text
Interação no editor → Zustand → componentes do canvas
                         ↓
                  gerador de ZPL → copiar/exportar
```

## Como executar

### Pré-requisitos

- Node.js 20.9 ou superior
- npm

```bash
# Clone o repositório
git clone https://github.com/kayokalinauskas/zpl-label-designer.git
cd zpl-label-designer

# Instale as dependências
npm install

# Inicie o ambiente de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Qualidade e build

```bash
# Testes unitários
npm exec jest -- --runInBand

# Análise estática
npm run lint

# Build de produção
npm run build
```

## Exemplo de saída

Um texto e um retângulo posicionados no editor produzem uma saída semelhante a esta:

```zpl
^XA
^FO40,37
^A0N,24,24
^FB240,99,0,L,0
^FDPedido: ${pedido.numero}^FS
^FO30,80
^GB300,2,2^FS
^XZ
```

As variáveis são mantidas no ZPL para que outro sistema possa substituí-las antes da impressão. No barcode, o valor visual de exemplo é exportado como `${etiqueta.barra}`.

## Testes

A suíte cobre os pontos mais sensíveis do domínio:

- conversões entre milímetros e dots;
- criação, clonagem e defaults dos elementos;
- validação de valores EAN-13;
- semântica de dimensões de linhas;
- geração de ZPL para todos os tipos de elemento;
- arredondamento de coordenadas, compensação visual de fonte e escape de caracteres especiais.

## Próximas evoluções

- Histórico de undo/redo.
- Reordenação manual das camadas.
- Importação de código ZPL existente.
- Mais formatos de códigos de barras e opções tipográficas.
- Salvamento e carregamento de múltiplos templates.
- Testes end-to-end dos fluxos do editor.

## Autor

Desenvolvido por [Kayo Kalinauskas](https://github.com/kayokalinauskas).

Se este projeto foi útil ou chamou sua atenção, considere deixar uma estrela no repositório.
