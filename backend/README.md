# Quiz Backend API

Backend API para sistema de Quiz/Funil desenvolvido com Node.js, Express e TypeScript.

## Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **Supabase** - Banco de dados PostgreSQL
- **Upstash Redis** - Cache e sessões
- **Sentry** - Monitoramento de erros
- **Winston** - Sistema de logs
- **Zod** - Validação de schemas
- **Jest** - Testes

## Estrutura do Projeto

```
backend/
├── src/
│   ├── controllers/     # Controladores da API
│   ├── middleware/      # Middlewares personalizados
│   ├── routes/          # Definição de rotas
│   ├── services/        # Serviços de negócio
│   ├── types/           # Definições de tipos TypeScript
│   ├── utils/           # Utilitários e helpers
│   ├── config/          # Configurações
│   ├── tests/           # Testes
│   ├── app.ts           # Configuração do Express
│   └── server.ts        # Servidor HTTP
├── dist/                # Código compilado
├── logs/                # Arquivos de log
├── package.json
├── tsconfig.json
├── nodemon.json
└── README.md
```

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

### 3. Configurar Supabase

- Crie um projeto no [Supabase](https://supabase.com)
- Configure as variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_KEY`

### 4. Configurar Redis

- Crie um banco Redis no [Upstash](https://upstash.com)
- Configure as variáveis `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`

### 5. Configurar JWT

```bash
# Gerar uma chave secreta forte
openssl rand -hex 32
```

Configure a variável `JWT_SECRET` com a chave gerada.

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start

# Testes
npm test

# Linting
npm run lint
npm run lint:fix
```

## Endpoints da API

### Autenticação (`/api/v1/auth`)

- `POST /register` - Registrar usuário
- `POST /login` - Login
- `POST /logout` - Logout
- `POST /refresh` - Renovar token
- `GET /profile` - Perfil do usuário

### Funis (`/api/v1/funnels`)

- `GET /` - Listar funis
- `POST /` - Criar funil
- `GET /:id` - Buscar funil
- `PUT /:id` - Atualizar funil
- `DELETE /:id` - Deletar funil
- `POST /:id/publish` - Publicar funil
- `POST /:id/unpublish` - Despublicar funil

### Leads (`/api/v1/leads`)

- `GET /` - Listar leads
- `POST /` - Criar lead (público)
- `GET /:id` - Buscar lead
- `GET /quiz/:quizId` - Leads por quiz
- `PUT /:id` - Atualizar lead
- `DELETE /:id` - Deletar lead

### Analytics (`/api/v1/analytics`)

- `GET /dashboard` - Métricas do dashboard
- `GET /quiz/:quizId` - Analytics do quiz
- `GET /leads` - Analytics de leads

### Webhooks (`/api/v1/webhooks`)

- `POST /` - Receber webhook (público)
- `GET /events` - Listar eventos
- `POST /events/:id/retry` - Reprocessar evento

### Sistema (`/api/v1`)

- `GET /health` - Health check

## Middleware

### Segurança

- **Helmet** - Headers de segurança
- **CORS** - Controle de origem
- **Rate Limiting** - Limite de requisições

### Autenticação

- **JWT** - Autenticação por token
- **Supabase Auth** - Integração com Supabase

### Validação

- **Zod** - Validação de schemas
- **Express Validator** - Validação adicional

## Monitoramento

### Logs

- **Winston** - Sistema de logs estruturados
- **Morgan** - Logs de requisições HTTP

### Errors

- **Sentry** - Monitoramento de erros em produção
- **Error Handlers** - Tratamento centralizado de erros

### Performance

- **Compression** - Compressão de respostas
- **Redis Cache** - Cache de dados

## Testes

```bash
# Executar testes
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes em modo watch
npm run test:watch
```

## Deploy

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm run build
npm start
```

### Docker (Opcional)

```bash
# Build da imagem
docker build -t quiz-backend .

# Executar container
docker run -p 5000:5000 --env-file .env quiz-backend
```

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença ISC.