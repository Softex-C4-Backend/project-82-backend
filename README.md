# project-82-backend

Para rodar o projeto: 
1. npm install
2. cp .env.example .env
3. docker-compose up -d

Explicação:
1 - lê o arquivo package.json e instala todos os pacotes necessários para o funcionamento da aplicação Node.js (bibliotecas, frameworks, etc.)
2 - Copia um arquivo de exemplo (.env.example) para .env, onde você pode colocar as configurações reais (como URL do banco, chave JWT, etc.) que sua aplicação vai usar em tempo de execução.
3 - Inicia todos os serviços definidos no arquivo docker-compose.yml em modo “detached” (em segundo plano)