# 🩴 Tira Secreta

Amigo secreto de chinelos. O organizador entra com login, cadastra os participantes (nome, e-mail, número que calça e dicas) e sorteia. Cada participante recebe um **link único**, sem precisar criar conta.

- Histórico de eventos por organizador: participantes, número que calçam, descrições e links.
- Restrições opcionais (“A não pode tirar B”, com opção de vice-versa).
- De 3 a 200 participantes por evento.
- Links para copiar, para enviar por e-mail (`mailto:`) ou exportados em CSV para mala direta.
- Nem o organizador vê quem tirou quem, a não ser que abra o link de alguém.

## Arquitetura

```
GitHub Pages (site estático)  ──►  Supabase (Postgres + login)
        │                              eventos, participantes, restrições, links
        └─ #/r/<link>  →  página de revelação, que NÃO consulta o banco
```

- O resultado de cada pessoa vai **criptografado dentro do próprio link** (AES-GCM, chave aleatória por link, no fragmento `#` da URL, que nunca é enviado a servidor nenhum).
- O banco guarda os links, mas nunca guarda “quem tirou quem” em texto aberto.
- Os links continuam funcionando mesmo se o Supabase estiver fora do ar ou se o evento for excluído.
- Segurança no banco: RLS (Row Level Security). Cada organizador só lê e altera os próprios eventos, e visitantes anônimos não acessam nada.

## Configuração (uma vez)

### 1. Supabase
1. Crie uma conta em [supabase.com](https://supabase.com) (plano Free, sem cartão) e um projeto novo. Região sugerida: *South America (São Paulo)*.
2. Vá em **SQL Editor** → cole o conteúdo de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → **Run**.
3. Vá em **Authentication → Sign In / Providers → Email**:
   - deixe **Email** habilitado;
   - **desligue “Confirm email”**. O servidor de e-mail padrão do Supabase só envia para membros do projeto, então a confirmação não chegaria para outros organizadores.
4. Vá em **Project Settings → API** e copie a **Project URL** e a **anon public key**.

### 2. GitHub
1. A URL e a chave publishable do projeto ficam em [`src/lib/supabase.ts`](src/lib/supabase.ts). Elas são públicas por design: vão no JavaScript do site, e quem protege os dados são as políticas RLS. Para usar outro projeto Supabase, troque esses valores ou crie as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em **Settings → Secrets and variables → Actions → Variables**.
2. Vá em **Settings → Pages → Source** e selecione **GitHub Actions**.
3. Faça push na `main`. O site vai ao ar em `https://<seu-usuario>.github.io/tira-secreta/`.

### 3. Manter o Supabase ativo
O plano grátis pausa o projeto após 7 dias sem uso. O workflow [`keepalive.yml`](.github/workflows/keepalive.yml) faz uma consulta leve duas vezes por semana para evitar isso, sem precisar de configuração extra. Mesmo com o projeto pausado, os links já enviados continuam funcionando.

## Desenvolvimento

```bash
npm install
npm run dev                  # http://localhost:5173
npm test                     # testes do sorteio, da criptografia e da importação
npm run build
```

Stack: React 18, TypeScript, Vite, Tailwind CSS, Supabase e Vitest.

```
src/
  lib/draw.ts       algoritmo de sorteio (ciclo único → fallback por emparelhamento bipartido)
  lib/crypto.ts     seal/open do resultado em cada link
  lib/api.ts        acesso ao banco (listar, carregar, salvar, excluir eventos)
  lib/import.ts     importação de lista colada (Excel/Planilhas)
  lib/links.ts      URL, mailto e exportação CSV
  pages/            Login, Dashboard (histórico), EventEditor, Reveal
supabase/migrations/  esquema do banco + políticas de segurança
```
