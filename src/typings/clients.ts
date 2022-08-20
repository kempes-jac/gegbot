//Importação de biblioteca da API
import { ApplicationCommandDataResolvable } from "discord.js";

//Interace para registro dos comandos
export interface RegisterCommandsOptions{
    //Identificação opcional do servidor (guild)
    guildID?: string;
    //Comando, de acordo com a definição da API
    commands: ApplicationCommandDataResolvable[];
}