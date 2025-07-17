# Supabase Database Structure

Este diretório contém a estrutura completa do banco de dados PostgreSQL para a aplicação QuizV1 usando Supabase.

## Estrutura do Banco de Dados

### Tabelas Principais

1. **users** - Dados dos usuários (extends auth.users)
2. **funnels** - Funis/questionários criados pelos usuários
3. **steps** - Etapas/passos de cada funil
4. **elements** - Elementos dentro de cada etapa
5. **leads** - Leads capturados pelos funis
6. **analytics** - Dados de analytics e métricas
7. **templates** - Templates prontos para uso
8. **user_plans** - Planos de usuário e assinaturas
9. **user_actions** - Log de ações dos usuários (auditoria)

### Storage Buckets

- **funnel-images** - Imagens dos funis (público)
- **funnel-videos** - Vídeos dos funis (público)
- **user-uploads** - Uploads privados dos usuários
- **templates** - Arquivos de templates (público)

## Configuração

### 1. Instalação do Supabase CLI

```bash
npm install -g supabase
```

### 2. Inicialização do Projeto

```bash
supabase init
```

### 3. Configuração Local

```bash
supabase start
```

### 4. Executar Migrações

```bash
supabase db reset
```

### 5. Popular com Dados de Teste

```bash
supabase db seed
```

## Migrações

As migrações estão organizadas em ordem sequencial:

1. **001_initial_schema.sql** - Criação das tabelas principais
2. **002_enable_rls.sql** - Configuração do Row Level Security
3. **003_analytics_functions.sql** - Funções para analytics e relatórios
4. **004_storage_setup.sql** - Configuração dos buckets de storage
5. **005_seed_data.sql** - Dados de exemplo para desenvolvimento
6. **006_auth_policies.sql** - Políticas de autenticação e autorização

## Funções Principais

### Analytics

- `get_funnel_analytics(funnel_uuid)` - Obter analytics de um funil
- `get_user_dashboard_stats(user_uuid)` - Estatísticas do dashboard do usuário
- `record_funnel_view(funnel_uuid)` - Registrar visualização de funil
- `record_funnel_conversion(funnel_uuid, completion_rate)` - Registrar conversão

### Gerenciamento de Dados

- `get_funnel_with_structure(funnel_uuid)` - Obter funil com toda estrutura
- `duplicate_funnel(source_funnel_id, new_title)` - Duplicar funil
- `get_funnel_leads(funnel_uuid, limit, offset)` - Obter leads paginados

### Autenticação e Autorização

- `get_user_plan_status(user_uuid)` - Status do plano do usuário
- `check_user_plan_limits(user_uuid, resource_type)` - Verificar limites do plano
- `upgrade_user_plan(user_uuid, new_plan, expires_at)` - Atualizar plano

### Utilitários

- `get_user_storage_usage(user_uuid)` - Uso de storage do usuário
- `cleanup_unused_files()` - Limpar arquivos não utilizados
- `check_rate_limit(user_uuid, action, time_window, max_requests)` - Rate limiting

## Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com as seguintes regras:

- Usuários só podem ver/editar seus próprios dados
- Funis publicados são visíveis para usuários anônimos
- Leads podem ser inseridos em funis publicados
- Admins têm acesso total aos dados

## Planos de Usuário

### Free Plan
- Até 3 funis
- Até 100 leads/mês
- 100MB de storage

### Pro Plan
- Até 50 funis
- Até 5.000 leads/mês
- 10GB de storage

### Enterprise Plan
- Funis ilimitados
- Leads ilimitados
- Storage ilimitado

## Tipos de Elementos Suportados

- **text** - Texto formatado
- **image** - Imagens
- **video** - Vídeos
- **button** - Botões de ação
- **input** - Campos de entrada
- **multiple_choice** - Múltipla escolha
- **rating** - Avaliação/rating
- **comparison** - Comparação de itens
- **carousel** - Carrossel de imagens
- **testimonial** - Depoimentos
- **chart** - Gráficos
- **price** - Tabela de preços

## Variáveis de Ambiente

Configure as seguintes variáveis no seu `.env`:

```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Triggers e Automações

- **handle_new_user()** - Trigger para novos usuários
- **handle_user_delete()** - Trigger para exclusão de usuários
- **handle_updated_at()** - Trigger para atualizar timestamps

## Backup e Recuperação

```bash
# Backup
supabase db dump > backup.sql

# Restaurar
supabase db reset
psql -f backup.sql
```

## Monitoramento

Use as seguintes queries para monitorar o sistema:

```sql
-- Usuários ativos
SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '30 days';

-- Funis mais populares
SELECT f.title, SUM(a.views) as total_views
FROM funnels f
JOIN analytics a ON a.funnel_id = f.id
GROUP BY f.id, f.title
ORDER BY total_views DESC
LIMIT 10;

-- Conversões por dia
SELECT DATE(created_at), SUM(conversions)
FROM analytics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at);
```

## Segurança

- Todas as queries são protegidas por RLS
- Funções usam SECURITY DEFINER
- Rate limiting implementado
- Logs de auditoria habilitados
- Validação de entrada nos triggers

## Desenvolvimento

Para desenvolvimento local:

1. Execute `supabase start` para iniciar o stack local
2. Acesse o Supabase Studio em `http://localhost:54323`
3. Use as migrações para configurar o schema
4. Popule com dados de teste usando `seed.sql`

## Produção

Para deploy em produção:

1. Configure seu projeto no Supabase
2. Execute as migrações via Dashboard ou CLI
3. Configure as variáveis de ambiente
4. Teste todas as funcionalidades
5. Configure backups automáticos