//Importação da classe de definição de um Evento
import { Event } from "../structures/Events";

/**
 * Objeto para evento "ready" (disparado pós o bot ficar online)
 */
export default new Event('ready', ()=>{
    //Nada precisa ser feito, mas caso esteja em modo de debug, uma mensagem é enviada ao console
    if(process.env.environment==='debug'){
         console.log('Bot online');
    }
 })