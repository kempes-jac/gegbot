//Importação de biblioteca da API
import { ClientEvents } from "discord.js";

//Classe de definição de eventos a serem registrados dinamicamente
export class Event<Key extends keyof ClientEvents>{
    
    /**
     * Construtor
     * @constructor
     * @param event Tipo do evento 
     * @param run Parâmetros do evento
     */
    constructor(
        public event: Key,
        public run: (...args: ClientEvents[Key])=> any
    ){  

    }
}