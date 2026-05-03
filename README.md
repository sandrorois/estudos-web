# 📚 Estudos — Câmara dos Deputados (Web)

Sistema de acompanhamento de estudos para concurso público.  
**Stack:** React 18 + TypeScript + Tailwind CSS + Zustand + Supabase + Vite

---

## 🚀 Colocar no ar em 4 passos

### 1. Supabase
1. Crie conta gratuita em [supabase.com](https://supabase.com)
2. Novo projeto → **SQL Editor** → cole e execute `supabase/schema.sql`
3. Copie em **Project Settings → API**:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

### 2. Variáveis de ambiente
```bash
cp .env.example .env
# Edite .env com suas chaves do Supabase
```

### 3. Rodar local
```bash
npm install
npm run dev
# Acesse http://localhost:5173
```

### 4. Deploy (Vercel)
1. Push para GitHub
2. [vercel.com](https://vercel.com) → Import → selecione o repositório
3. Em **Environment Variables** adicione as duas variáveis do `.env`
4. **Deploy** — pronto! URL gerada automaticamente

---

## 📁 Estrutura

```
src/
├── lib/
│   ├── constants.ts   # dados padrão, utilitários, catálogo de conteúdos
│   ├── supabase.ts    # cliente Supabase
│   └── db.ts          # todas as queries ao banco
├── store/
│   ├── app.ts         # estado global (Zustand + persist localStorage)
│   └── timer.ts       # máquina de estados do timer Pomodoro
├── types/index.ts     # todos os tipos TypeScript
├── components/
│   ├── ui/index.tsx   # componentes reutilizáveis (Card, Btn, Modal, etc.)
│   └── Layout.tsx     # nav + tema + logout
└── pages/
    ├── AuthPage.tsx   # login / cadastro
    ├── TimerPage.tsx  # timer Pomodoro completo
    ├── MateriasPage.tsx
    ├── SemanaPage.tsx
    ├── MensalPage.tsx
    ├── ErrosPage.tsx
    └── DashboardPage.tsx
```

## ⚙️ Comandos
```bash
npm run dev      # desenvolvimento
npm run build    # build de produção → pasta dist/
npm run preview  # preview do build
```

## 📌 Funcionalidades implementadas

- ✅ Timer Pomodoro com máquina de estados completa
- ✅ Finalizar sessão antecipado (salva tempo exato)
- ✅ Modal de questões ao finalizar sessão com questões marcadas
- ✅ Observação por sessão (no modal de questões ou no alerta final)
- ✅ Popup de alerta com ☕ Iniciar Pausa / ✓ Continuar
- ✅ Alerta sonoro + flash do título da aba
- ✅ Registrar sessão manualmente (para quando esqueceu o timer)
- ✅ Editar qualquer sessão após o registro
- ✅ Tema claro/escuro com persistência
- ✅ Dados salvos no localStorage (sem backend obrigatório)
- ✅ Pronto para Supabase quando precisar de auth + sync
