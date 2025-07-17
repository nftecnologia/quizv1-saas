# 🚀 Quiz Platform - Guia Completo de Deploy

Este guia fornece instruções detalhadas para deploy da plataforma Quiz em diferentes ambientes, com foco principal no **DigitalOcean App Platform**.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração de Ambiente](#configuração-de-ambiente)
3. [Deploy Local (Desenvolvimento)](#deploy-local-desenvolvimento)
4. [Deploy para Staging](#deploy-para-staging)
5. [Deploy para Produção](#deploy-para-produção)
6. [Monitoramento e Manutenção](#monitoramento-e-manutenção)
7. [Troubleshooting](#troubleshooting)
8. [Rollback e Recovery](#rollback-e-recovery)

## 🔧 Pré-requisitos

### Ferramentas Necessárias

```bash
# Node.js 18+
node --version  # v18.0.0+

# DigitalOcean CLI
curl -sL https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz | tar -xzv
sudo mv doctl /usr/local/bin

# Git
git --version

# Docker (opcional, para desenvolvimento local)
docker --version
docker-compose --version
```

### Contas e Serviços

1. **DigitalOcean Account**
   - Criar conta em [digitalocean.com](https://digitalocean.com)
   - Gerar Access Token em API → Tokens & Keys

2. **Supabase Project**
   - Criar projeto em [supabase.com](https://supabase.com)
   - Configurar banco de dados
   - Obter URL e chaves da API

3. **Domínio (Produção)**
   - Registrar domínio
   - Configurar DNS para apontar para DigitalOcean

## ⚙️ Configuração de Ambiente

### 1. Configurar DigitalOcean CLI

```bash
# Autenticar com DigitalOcean
doctl auth init

# Verificar autenticação
doctl account get
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure:

```bash
cp .env.production.example .env.production
```

**Variáveis Críticas:**

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Segurança
JWT_SECRET=your_32_char_minimum_secret_key

# URLs da Aplicação
FRONTEND_URL=https://quizv1.com
BACKEND_URL=https://quiz-platform-api.ondigitalocean.app

# Redis (Upstash recomendado)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Monitoramento
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 3. Configurar Apps no DigitalOcean

#### Criar App de Staging

```bash
doctl apps create --spec .do/app.yaml
```

#### Criar App de Produção

```bash
# Modificar .do/app.yaml para produção
# Alterar domínios e configurações
doctl apps create --spec .do/app.yaml
```

### 4. Configurar Secrets no GitHub

Para CI/CD automático, configure os seguintes secrets:

```
DIGITALOCEAN_ACCESS_TOKEN=your_do_token
DO_APP_ID_PRODUCTION=your_production_app_id
DO_APP_ID_STAGING=your_staging_app_id
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=your_api_url
PRODUCTION_URL=https://quizv1.com
STAGING_URL=https://staging.quizv1.com
SLACK_WEBHOOK=your_slack_webhook (opcional)
```

## 🏠 Deploy Local (Desenvolvimento)

### Opção 1: Desenvolvimento Nativo

```bash
# 1. Instalar dependências
cd backend && npm install
cd ../frontend && npm install

# 2. Configurar ambiente local
cp .env.example .env.local

# 3. Iniciar backend
cd backend && npm run dev

# 4. Iniciar frontend (nova aba)
cd frontend && npm run dev
```

### Opção 2: Docker Compose

```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env

# 2. Iniciar stack completo
docker-compose up -d

# 3. Apenas aplicação principal
docker-compose up backend frontend redis

# 4. Com monitoramento
docker-compose --profile monitoring up -d

# 5. Com banco local
docker-compose --profile local-db up -d
```

**URLs Locais:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Grafana: http://localhost:3001 (admin/admin123)
- PgAdmin: http://localhost:5050 (admin@quiz.com/admin123)

## 🧪 Deploy para Staging

### Deploy Manual

```bash
# 1. Fazer pre-build checks
./scripts/pre-build.sh

# 2. Executar deploy para staging
./scripts/deploy.sh --environment staging --branch develop

# 3. Verificar deploy
./scripts/health-check.sh --api-url https://staging-api.quizv1.com --frontend-url https://staging.quizv1.com
```

### Deploy Automático (CI/CD)

O deploy automático acontece quando:
- Push para branch `develop`
- Pull request aprovado

**Processo automático:**
1. Executa testes
2. Build das aplicações
3. Deploy para staging
4. Verificação de saúde
5. Notificação no Slack (se configurado)

## 🚀 Deploy para Produção

### Deploy Manual

```bash
# 1. Verificar branch e commits
git checkout main
git pull origin main

# 2. Executar testes completos
npm test

# 3. Deploy para produção
./scripts/deploy.sh --environment production --branch main

# 4. Monitorar deployment
./scripts/monitor.sh --interval 60 --api-url https://quiz-platform-api.ondigitalocean.app
```

### Deploy Automático (CI/CD)

**Trigger:** Push para branch `main`

**Pipeline:**
1. **Testes e Qualidade**
   - Testes unitários
   - Lint de código
   - Análise de segurança
   - TypeScript check

2. **Build e Verificação**
   - Build backend e frontend
   - Verificação de artefatos
   - Testes de integração

3. **Security Scan**
   - Trivy vulnerability scan
   - Dependency audit

4. **Deploy**
   - Deploy para DigitalOcean
   - Health checks
   - Smoke tests

5. **Verificação Pós-Deploy**
   - Monitoramento de métricas
   - Alerts configurados

### Checklist Pré-Produção

- [ ] Todos os testes passando
- [ ] Variáveis de ambiente configuradas
- [ ] Backup do estado atual
- [ ] DNS configurado corretamente
- [ ] Certificados SSL válidos
- [ ] Monitoramento ativo
- [ ] Plano de rollback definido

## 📊 Monitoramento e Manutenção

### Health Checks Automáticos

```bash
# Health check pontual
./scripts/health-check.sh

# Monitoramento contínuo
./scripts/monitor.sh --interval 300 --slack-webhook $SLACK_WEBHOOK
```

### Métricas Importantes

1. **Application Health**
   - API response time
   - Error rate
   - Uptime

2. **Infrastructure**
   - CPU usage
   - Memory usage
   - Disk usage

3. **Business Metrics**
   - Quiz creation rate
   - User engagement
   - Conversion funnel

### Logs e Debugging

```bash
# Ver logs da aplicação
doctl apps logs $DO_APP_ID_PRODUCTION --type run

# Ver logs de deploy
doctl apps logs $DO_APP_ID_PRODUCTION --type deploy

# Ver logs de build
doctl apps logs $DO_APP_ID_PRODUCTION --type build
```

### Alertas Configurados

1. **Critical Alerts**
   - Aplicação down (> 3 falhas consecutivas)
   - Alta taxa de erro (> 5%)
   - Resposta lenta (> 3s)

2. **Warning Alerts**
   - Alto uso de CPU (> 80%)
   - Alto uso de memória (> 80%)
   - Falha em health check

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Deploy Falha

```bash
# Verificar logs de build
doctl apps get-deployment $APP_ID $DEPLOYMENT_ID

# Verificar configuração
doctl apps spec get $APP_ID

# Validar app spec
doctl apps spec validate .do/app.yaml
```

#### 2. Aplicação Não Responde

```bash
# Verificar status do app
doctl apps get $APP_ID

# Reiniciar serviços
doctl apps restart $APP_ID

# Verificar logs
doctl apps logs $APP_ID --type run --tail
```

#### 3. Problemas de Performance

```bash
# Verificar métricas
./scripts/health-check.sh --api-url $API_URL

# Monitorar recursos
doctl apps list-deployments $APP_ID

# Escalar horizontalmente (se necessário)
# Editar .do/app.yaml e aumentar instance_count
```

#### 4. Problemas de Conectividade

```bash
# Verificar DNS
nslookup quizv1.com

# Verificar SSL
openssl s_client -connect quizv1.com:443

# Verificar conectividade com Supabase
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" $SUPABASE_URL/rest/v1/
```

### Debug Mode

Para ativar debug em produção (use com cuidado):

```bash
# Temporariamente ativar logs verbosos
doctl apps update $APP_ID --spec .do/app.yaml
# (modificar variável LOG_LEVEL=debug no app.yaml)
```

## 🔄 Rollback e Recovery

### Rollback Automático

O sistema possui rollback automático em caso de falha na verificação pós-deploy.

### Rollback Manual

```bash
# Listar deployments
doctl apps list-deployments $APP_ID

# Rollback para deployment anterior
# (DigitalOcean não tem rollback direto, precisa redeploy)
git checkout previous_working_commit
./scripts/deploy.sh --environment production
```

### Recovery Procedures

#### 1. Falha Total da Aplicação

```bash
# 1. Verificar status dos serviços
./scripts/health-check.sh

# 2. Verificar logs
doctl apps logs $APP_ID --type run

# 3. Restart se necessário
doctl apps restart $APP_ID

# 4. Se persistir, fazer rollback
git checkout last_known_good_commit
./scripts/deploy.sh --environment production
```

#### 2. Falha de Base de Dados

```bash
# Verificar conectividade Supabase
curl -f $SUPABASE_URL/rest/v1/health

# Verificar configuração RLS
# Através do dashboard Supabase

# Backup e restore se necessário
# Usar funcionalidades nativas do Supabase
```

#### 3. Falha de Performance

```bash
# Escalar recursos temporariamente
# Modificar .do/app.yaml:
# instance_size_slug: basic-m (ao invés de basic-s)
# instance_count: 3 (ao invés de 1)

doctl apps update $APP_ID --spec .do/app.yaml
```

## 📈 Otimizações de Performance

### Frontend

```bash
# Build otimizado
npm run build

# Análise de bundle
npm run build -- --analyze

# Compressão de assets
# (já incluída no pipeline)
```

### Backend

```bash
# Otimização de dependências
npm prune --production

# Compressão de resposta
# (já configurada via middleware)

# Cache de resposta
# (configurado via Redis)
```

## 🔐 Segurança

### Checklist de Segurança

- [ ] HTTPS obrigatório
- [ ] Headers de segurança configurados
- [ ] Rate limiting ativo
- [ ] CORS configurado corretamente
- [ ] Secrets em variáveis de ambiente
- [ ] Logs não contêm dados sensíveis
- [ ] Dependências atualizadas

### Monitoramento de Segurança

```bash
# Audit de dependências
npm audit

# Scan de vulnerabilidades
./scripts/security-scan.sh

# Verificação de headers
curl -I https://quizv1.com
```

## 📞 Suporte e Contatos

- **Documentação Técnica:** [link para docs]
- **Repositório:** [link para GitHub]
- **Issues:** [link para GitHub Issues]
- **Slack:** [link para workspace]

## 📝 Histórico de Versões

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0.0 | 2024-01-XX | Deploy inicial |
| 1.1.0 | 2024-XX-XX | Melhorias de performance |

---

**⚠️ Importante:** Sempre teste deploys em staging antes de produção. Mantenha backups atualizados e monitore a aplicação continuamente.