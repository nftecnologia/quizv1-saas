# QuizV1 - SaaS de Funis Interativos Gamificados

Sistema completo para criação de funis e quizzes gamificados com editor visual drag-and-drop.

## 🚀 Stack Tecnológico

- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript
- **Banco de Dados:** Supabase PostgreSQL
- **Autenticação:** Supabase Auth
- **Armazenamento:** Supabase Storage
- **Fila:** Upstash Redis
- **Monitoramento:** Sentry + Healthchecks
- **Deploy:** DigitalOcean App Platform

## 📁 Estrutura do Projeto

```
quizv1/
├── frontend/          # React + Vite frontend
├── backend/           # Node.js + Express backend
├── docs/              # Documentação
├── .env.example       # Variáveis de ambiente
└── README.md
```

## 🛠️ Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Supabase
- Conta Upstash Redis

### Instalação
```bash
# Instalar dependências de todos os projetos
npm run install:all

# Copiar variáveis de ambiente
cp .env.example .env
```

### Executar em desenvolvimento
```bash
# Executar frontend e backend simultaneamente
npm run dev

# Ou executar separadamente
npm run dev:frontend
npm run dev:backend
```

### Build para produção
```bash
npm run build
```

## 🔧 Configuração

### Variáveis de Ambiente
Configurar as seguintes variáveis no `.env`:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Sentry
SENTRY_DSN=your_sentry_dsn

# Healthchecks
HEALTHCHECKS_URL=your_healthchecks_url

# App
PORT=3000
NODE_ENV=development
```

## 🌟 Funcionalidades

- ✅ Editor visual drag-and-drop
- ✅ Múltiplos tipos de elementos (texto, múltipla escolha, imagem, vídeo, etc.)
- ✅ Lógica condicional entre etapas
- ✅ Preview em tempo real
- ✅ Auto-save
- ✅ Gestão de leads com filtros avançados
- ✅ Exportação CSV
- ✅ Dashboard de analytics
- ✅ Sistema de templates
- ✅ Upload de arquivos
- ✅ Webhooks para liberação de planos
- ✅ Monitoramento e observabilidade

## 📊 Analytics

O sistema inclui analytics completo com:
- Dashboard de métricas em tempo real
- Funil de conversão por etapa
- Análise de abandono
- Tracking de UTM
- Relatórios exportáveis

## 🎨 Templates

Biblioteca de templates prontos para:
- Quizzes de personalidade
- Funis de vendas
- Pesquisas de satisfação
- Formulários de captura
- E muito mais...

## 🔐 Segurança

- Autenticação JWT via Supabase
- Row Level Security (RLS)
- Sanitização de inputs
- Rate limiting
- Validação de schemas

## 📝 Licença

Este projeto está sob a licença ISC.