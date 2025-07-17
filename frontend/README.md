# Quiz App - Frontend

Frontend da aplicação Quiz App desenvolvido com React, Vite, Tailwind CSS e shadcn/ui.

## 🚀 Tecnologias

- **React 18** - Biblioteca JavaScript para interfaces
- **Vite** - Build tool e dev server
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes de interface reutilizáveis
- **React Router Dom** - Roteamento
- **React Query** - Gerenciamento de estado do servidor
- **Supabase** - Backend como serviço
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **Lucide React** - Ícones

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   └── ui/             # Componentes shadcn/ui
├── pages/              # Páginas da aplicação
├── hooks/              # Hooks personalizados
├── lib/                # Utilitários e configurações
├── types/              # Definições de tipos TypeScript
├── services/           # Serviços de API
└── index.css           # Estilos globais
```

## 🛠️ Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

3. Edite o arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 🏃‍♂️ Executando

### Desenvolvimento
```bash
npm run dev
```

### Build para produção
```bash
npm run build
```

### Preview da build
```bash
npm run preview
```

### Lint
```bash
npm run lint
```

## 📄 Páginas

- **Login** (`/login`) - Página de autenticação
- **Registro** (`/register`) - Página de cadastro
- **Dashboard** (`/dashboard`) - Lista de quizzes do usuário
- **Editor** (`/editor`) - Criação e edição de quizzes

## 🎨 Componentes

O projeto utiliza componentes do shadcn/ui para uma interface consistente:

- **Button** - Botões com diferentes variantes
- **Card** - Cartões para organizar conteúdo
- **Input** - Campos de entrada
- **Label** - Labels para formulários
- **Toast** - Notificações temporárias

## 🔧 Configuração do shadcn/ui

O projeto está configurado para usar o shadcn/ui com:

- **Estilo**: Default
- **Cor base**: Slate
- **CSS Variables**: Habilitado
- **Tailwind**: Configurado

Para adicionar novos componentes:
```bash
npx shadcn-ui@latest add [component-name]
```

## 📱 Responsividade

O design é totalmente responsivo usando as classes do Tailwind CSS:
- **Mobile first**: Design otimizado para dispositivos móveis
- **Breakpoints**: sm, md, lg, xl, 2xl
- **Grid system**: Layout flexível com CSS Grid

## 🔒 Autenticação

A autenticação é gerenciada através do Supabase Auth:
- **Login/Logout**: Autenticação por email e senha
- **Registro**: Criação de novas contas
- **Sessão**: Gerenciamento automático de sessão
- **Proteção de rotas**: Redirecionamento automático

## 🚀 Deploy

O projeto está configurado para deploy em plataformas como:
- **Vercel**
- **Netlify**
- **GitHub Pages**

Certifique-se de configurar as variáveis de ambiente na plataforma escolhida.

## 📄 Licença

Este projeto está licenciado sob a MIT License.