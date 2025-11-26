import 'dotenv/config'; // Garante que as variáveis do .env sejam lidas (PORT)
import { app } from './app'; // Importa a configuração do Express de app.ts

// Pega a porta do .env ou usa 3001 como fallback
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[SERVER] Aplicação rodando em http://localhost:${PORT}`);
});
