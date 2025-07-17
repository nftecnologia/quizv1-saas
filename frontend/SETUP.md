# 🚀 Setup do Frontend - Quiz App

## Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta no Supabase (para backend)

## 📋 Checklist de Instalação

### 1. Navegue para o diretório do frontend
```bash
cd /Users/oliveira/Desktop/quizv1/frontend
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Execute o servidor de desenvolvimento
```bash
npm run dev
```

### 5. Acesse a aplicação
Abra http://localhost:3000 no seu navegador

## 🏗️ Estrutura Criada

### ✅ Configuração Base
- [x] Vite configurado com TypeScript
- [x] Tailwind CSS configurado
- [x] shadcn/ui configurado
- [x] React Router Dom configurado
- [x] React Query configurado

### ✅ Componentes UI
- [x] Button
- [x] Card
- [x] Input
- [x] Label
- [x] Toast/Toaster

### ✅ Páginas
- [x] LoginPage - Página de login
- [x] RegisterPage - Página de registro
- [x] DashboardPage - Lista de quizzes
- [x] EditorPage - Editor de quiz

### ✅ Hooks
- [x] useAuth - Gerenciamento de autenticação
- [x] useToast - Sistema de notificações

### ✅ Serviços
- [x] API service com Supabase
- [x] Auth service
- [x] Quiz service

### ✅ Tipos
- [x] User, Quiz, Question, QuestionOption
- [x] QuizResponse, QuestionAnswer

## 🎨 Design System

### Cores (Tailwind)
- **Primary**: Azul principal
- **Secondary**: Cinza secundário
- **Destructive**: Vermelho para ações perigosas
- **Muted**: Cinza claro para texto secundário

### Componentes
- **Cards**: Para organizar conteúdo
- **Buttons**: Diferentes variantes (default, outline, ghost)
- **Forms**: Inputs com labels consistentes
- **Toast**: Notificações temporárias

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint
```

## 📱 Funcionalidades Implementadas

### Autenticação
- Login com email/senha
- Registro de novos usuários
- Logout
- Proteção de rotas

### Dashboard
- Lista de quizzes do usuário
- Busca de quizzes
- Navegação para editor
- Ações de editar/deletar

### Editor
- Criação de novos quizzes
- Edição de quizzes existentes
- Adição/remoção de perguntas
- Configurações do quiz

## 🚀 Próximos Passos

1. **Configurar Supabase**: Criar tabelas e políticas RLS
2. **Implementar funcionalidades**: Conectar com API real
3. **Adicionar componentes**: Mais componentes shadcn/ui
4. **Melhorar UX**: Validações, loading states, etc.
5. **Testes**: Implementar testes unitários

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### Erro: "shadcn/ui component not found"
```bash
npx shadcn-ui@latest add [component-name]
```

### Erro: "Supabase not configured"
- Verifique as variáveis de ambiente no `.env`
- Certifique-se de que o Supabase está configurado corretamente

## 💡 Dicas

- Use `npm run dev` para desenvolvimento
- Componentes shadcn/ui estão em `/src/components/ui/`
- Páginas estão em `/src/pages/`
- Hooks personalizados em `/src/hooks/`
- Tipos TypeScript em `/src/types/`