//Importação de classe padrão da API do Discord.js
import { ApplicationCommandDataResolvable, Client, ClientEvents, Collection, Intents } from "discord.js";
//Importação da classe de definição da módulos dos comandos
import { CommandType } from "../typings/Command";
//Importação de tipo para registro de comandos
import { RegisterCommandsOptions } from "../typings/clients";
//Importação de classe para definição de módulos de eventos
import { Event } from "./Events";

//Importação de classe para auxílio no "parse" do caminho onde estão os módulos
import { glob } from "glob";
//Importação de função para conversar de um tipo de dado em um Promess
import { promisify } from "util";

const globPromise = promisify(glob);


/**
 * Classe com a lógica de funcionamento do bot.
 * 
 * A base dessa classe é a classe Client. Essa classe contém a API básica para execução de bots do Discord. 
 * Assim, é obrigatória a definição das Intents do bot. Ele é definido para fazer parse sobre as Interactions, não sobre todas mensagens.
 * Essa diferença permite maior compatibilidade com as regras hoje vigentes na políticas do Discord.
 * 
 * Apesar de funcionamento gerencial complexo, a classe funciona de forma simples: após iniciado, o bot varre diretórios específicos
 * para identificação de módulos que contenham comandos e eventos. Os eventos são registrados como eventos válidos. Já os comandos, 
 * são agrupados em uma coleção, tendo como chave o "nome" do comando e valor a classe do contendo a lógica do comando.
 */
export class ExtendedClient extends Client{

    //Coleção de comandos (a chave é o nome do comando e o valor é a classe de definição do comando)
    commands: Collection<string, CommandType> =new Collection();

    /**
     * Construtor. Por ser subclasse de Client, deve-se passar para o construtor da superclasse as flags das Intents necessárias 
     * (no caso, os 15 primeiros bits).
     * @constructor
     */
    constructor(){
        super({
            intents: [Intents.FLAGS.GUILDS]
        });
    }

    /**
     * Inicializa o bot.
     */
    start(){
        //Carrega todos os módulos de eventos e comandos disponíveis
        this.registerModules();
        //Faz login (inicío propriamente dito do bot). O token é carregado a partir das variáveis de ambiente presente em .env
        this.login(process.env.botToken)
    }    

    /**
     * Importa um arquivo. Devido haver a necessidade de carregar arquivos, esse método é definido como assíncrono.
     * @param filePath Caminho para o arquivo a ser importado
     * @returns Arquico importado
     */
    async importFile(filePath: string){
        return (await import(filePath))?.default;
    }

    /**
     * Registrar os comandos. Caso o bot seja vinculado a um servidor específico (guild), o bot registrará os 
     * comando apenas para o servidor.
     * 
     * @param commands Comando a ser registrado 
     * @param guildID ID do servidor a que seraõ vinculados os comando (opcional)
     */
    async registerCommands({ commands, guildID}: RegisterCommandsOptions ){
        if(guildID){
            this.guilds.cache.get(guildID)?.commands.set(commands);
        }else{
            this.application?.commands.set(commands);
        }
    }

    /**
     * Registro de módulos.
     * 
     * Este método é carregado durante a inicialização do bot.
     */
    async registerModules(){
        //Carga dos módulos dos comandos (INÍCIO)
        //Lista com comandos a serem registrados na API
        const slashCommands: ApplicationCommandDataResolvable[] = [];
        //Identificação de arquivos disponíveis do caminho
        const commandFiles = await globPromise(`${__dirname}/../commands/*/*{.ts,.js}`);

        //Validação de cada um dos arquivos
        commandFiles.forEach( async filePath => {
            //Importação de um módulo como um CommandType
            const command = await this.importFile(filePath);
            //Validação se o módulo é um comando válido (name é uma propriedade herdada de ChatInputApplicationCommandData),
            //que faz parte de CommandType
            //OBSERVAÇÃO: o código original apenas faz o teste (!command.name). Mas, depois de adicionar ao path um módulo
            //com um não comando, o teste se mostrou insuficiente e levanta uma excessão, interrompendo o funcionamento do bot.
            //Assim, foi adicionado o try-catch, para dar a volta nesse problema.
            try {
                if(!command.name) return;
            } catch (error) {
                return;                
            }

            //Adicição do comando validado a coleção de comandos disponíveis
            this.commands.set(command.name, command);
            //Adicição do comando a lista de comandos a serem registrados na API
            slashCommands.push(command);
        });

        //Os comandos só podem ser registrados na API quando o bot estiver online. Assim, é adicionado um novo evento (por fora da 
        //estrutura de funcionamento modular do bot)
        this.on("ready", () => {
            this.registerCommands({
                commands: slashCommands,
                guildID: process.env.guildID
            });
        });
        //Carga dos módulos dos comandos (FIM)
        
        //Carga dos módulos de eventos (INÍCIO)
        //Identificação dos arquivos disponíveis no caminho
        const eventFiles = await globPromise(`${__dirname}/../events/*{.ts,.js}`);
        //Importação dos módulos de eventos
        eventFiles.forEach( async filePath =>{
            //Importação de um módulo de evento
            const event:Event<keyof ClientEvents> = await this.importFile(filePath);
            //Registro do evento na API
            this.on(event.event, event.run);
        });
        //Carga dos módulos de eventos (FIM)


    }
}