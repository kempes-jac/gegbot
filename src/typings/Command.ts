//Importação de bibliotecas da API
import { ChatInputApplicationCommandData, CommandInteraction, CommandInteractionOptionResolver, GuildMember, PermissionOverwriteResolvable } from "discord.js";
//Importação de biblioteca de definição do bot
import { ExtendedClient } from "../structures/Client";


/**
 * Interface de definição das Interactions a serem usadas para consultas aos eventos ocorridos em um canal.
 */
export interface ExtendedInteraction extends CommandInteraction{
    member: GuildMember,
}

/**
 * Interface de definição dos dados disponíveis a execução de comando, enviados pelo bot
 */
interface RunOptions{
    //O próprio bot
    client: ExtendedClient,
    //A Interaction que disparou a execução do bot
    interaction: ExtendedInteraction,
    //Os argumentos a serem enviados ao comando
    args: CommandInteractionOptionResolver,
}

//Definição da assinatura de execução da funções de execução dos comandos
type RunFunction = (options: RunOptions) => any;

//Definição do tipo que identifica um comando válido
export type CommandType = {
    //Permições necessárias ao comando (opcional)
    userPermissions?: PermissionOverwriteResolvable[];
    //Texto de ajuda sobre o comando
    help?: string;
    //Chamado padronizada a execução dos comandos
    run: RunFunction;
    //Adição ao tipo básico da API para definição de comandos
} & ChatInputApplicationCommandData;