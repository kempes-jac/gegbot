/**
 * Este bot é tem o mesmo código fonte do apresentado em https://www.youtube.com/watch?v=4IxLBKPVyXE
 * 
 * A vantagem desse bot é que ele tem estrutura modularizável, permitindo adicionar comandos e eventos como módulos e sem
 * interferência no restante do código do bot.
 */


//Carregamento de variáveis de ambiente
require('dotenv').config();
//Importação da classe que fará toda a lógica do bot para importação e uso dos módulos
import { ExtendedClient } from "./structures/Client";

//Criação do bot
export const client = new ExtendedClient();

//Início da execução
client.start();