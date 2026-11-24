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

- **Links curtos** (`#/s/<código de 16 caracteres>`): o código é um segredo aleatório. Dele o navegador deriva o id da linha no banco e a chave AES-GCM que decifra o resultado. O banco guarda só o conteúdo cifrado, então nem quem administra o banco consegue ler quem tirou quem sem o link.
- **Links longos** (`#/r/…`, sorteios antigos): o resultado inteiro vai criptografado dentro do link, que não depende do banco. Eles continuam funcionando para sempre, e o botão **“Gerar links curtos”** cria versões curtas com o mesmo resultado.
- Excluir um evento apaga os links curtos dele.
- Segurança no banco: RLS (Row Level Security). Cada organizador só lê e altera os próprios eventos, e visitantes anônimos não acessam nada.

## Configuração (uma vez)

### 1. Supabase
1. Crie uma conta em [supabase.com](https://supabase.com) (plano Free, sem cartão) e um projeto novo. Região sugerida: *South America (São Paulo)*.
2. Vá em **SQL Editor** e rode, em ordem, cada arquivo de [`supabase/migrations/`](supabase/migrations/) (`0001_init.sql`, `0002_short_links.sql`): cole o conteúdo → **Run**.
3. Vá em **Authentication → Sign In / Providers → Email**:
   - deixe **Email** habilitado;
   - **desligue “Confirm email”**. O servidor de e-mail padrão do Supabase só envia para membros do projeto, então a confirmação não chegaria para outros organizadores.
4. Vá em **Project Settings → API** e copie a **Project URL** e a **anon public key**.

### 2. GitHub
1. A URL e a chave publishable do projeto ficam em [`src/lib/supabase.ts`](src/lib/supabase.ts). Elas são públicas por design: vão no JavaScript do site, e quem protege os dados são as políticas RLS. Para usar outro projeto Supabase, troque esses valores ou crie as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em **Settings → Secrets and variables → Actions → Variables**.
2. Vá em **Settings → Pages → Source** e selecione **GitHub Actions**.
3. Faça push na `main`. O site vai ao ar em `https://<seu-usuario>.github.io/tira-secreta/`.
4. (Opcional) Domínio próprio: em **Settings → Pages → Custom domain**, informe o domínio (ex.: `tirasecreta.site`) e marque **Enforce HTTPS**. No provedor do domínio, crie registros `A` para `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153`, e um `CNAME` de `www` para `<seu-usuario>.github.io`. Atualize também as URLs `og:` do [`index.html`](index.html).

### 3. Manter o Supabase ativo
O plano grátis pausa o projeto após 7 dias sem uso. O workflow [`keepalive.yml`](.github/workflows/keepalive.yml) faz uma consulta leve duas vezes por semana para evitar isso, sem precisar de configuração extra. Com o projeto pausado, os links curtos não abrem (os longos, sim), por isso essa tarefa é importante.

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
