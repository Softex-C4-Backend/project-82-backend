# Usa uma imagem Node.js baseada em Debian (mais compatível com Prisma)
FROM node:20

# Cria a pasta de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências primeiro (para aproveitar o cache)
COPY package*.json ./
# Garante que a pasta prisma seja copiada corretamente
COPY prisma/ ./prisma/

# Instala as dependências
RUN npm install

# Gera o cliente do Prisma
RUN npx prisma generate

# Copia todo o resto do código
COPY . .

# Compila o TypeScript para JavaScript
RUN npm run build

# Expõe a porta 3001
EXPOSE 3001

# Comando para iniciar o servidor
CMD ["npm", "start"]