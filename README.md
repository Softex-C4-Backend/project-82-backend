# project-82-backend

PARA RODAR O PROJETO: 

# 1. Instale as dependências
  npm install
# 2. Configure as variáveis de ambiente
  cp .env.example .env
# 3. Suba a infraestrutura (Banco de Dados)
  docker-compose up -d
# 4. Crie as tabelas no Banco (Migração)
  npx prisma migrate dev
# 5. Inicie o servidor
  npm run dev 


Explicação:
1 - Lê o arquivo package.json e baixa todas as bibliotecas necessárias (Express, Prisma, Zod, etc.) para a pasta node_modules
2 - Cria o seu arquivo de configuração local. O .env contém segredos (senhas, chaves) e nunca é enviado para o GitHub
3 - Inicia o container do PostgreSQL em segundo plano. Atenção: Neste momento, o banco de dados liga, mas está vazio (sem tabelas)
4 - Este é o comando que conecta no banco vazio e cria as tabelas (como a tabela User) baseadas no histórico da pasta prisma/migrations
5 - Inicia o servidor Node.js/Express na porta 3001

