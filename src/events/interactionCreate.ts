//Importação de biblioteca da API
import { CommandInteractionOptionResolver } from "discord.js";
//Importação da classe de lógica do bot
import { client } from "..";
//Importação da definição de classe de eventos
import { Event } from "../structures/Events";
//Importação das definições de comando
import { CommandType, ExtendedInteraction } from "../typings/Command";

//Objeto para definição de evento de criação de interação qualquer
export default new Event('interactionCreate', async (interaction)=>{
    //Para diminiur a possibilidade de incompatibilidade com as políticas atualmente vigentes, apenas os comandos são avaliados
    if(interaction.isCommand()){
        //É sinalizado que o comando pode ter uma resposta longa (demorada). Isso é útil, caso o comando venha necessitar de mais
        // tempo de processamento ou de interação com o usuário
        await interaction.deferReply();

        //Recuperação de um dos comandos pré-carregados pelo bot
        const command: CommandType = client.commands.get(interaction.commandName); 

        //Caso não tenha nenhum comando com o texto especificado, o bot deve responder com um negativa de execução
        if(!command) 
            return interaction.followUp('Isso não é um comando válido');


        //Se for um comando válido, o evento executa o comando
        command.run( {
            //Parâmetros do comando
            args: interaction.options as CommandInteractionOptionResolver,
            //O bot em execução (caso o comando precise)
            client: client,
            //Interação que disparou o evento
            interaction: interaction as ExtendedInteraction
        });

    }
});