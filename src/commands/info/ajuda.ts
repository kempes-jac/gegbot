import { Command } from "../../structures/Command";

const HELP_TEXT: string = '__**Ajuda**__';
const WRONG_COMMAND: string = 'Comando inexistente.';
const NO_HELP: string = 'Desculpe, sem ajuda disponível.'

/**
 * Objeto para exibição da ajuda dos comandos do bot
 */
 export default new Command({
    //Texto de identificação do comando (no caso será /ajuda)
    name: 'ajuda',
    //Descrição do comando
    description: 'Exibe ajuda sobre os comandos disponíveis',
    //Parâmetro do comando
    options: [
        {
            //Nome do parâmetro
            name: 'comando',
            //Tipo do parâmetro
            type: 'STRING',
            //Descrição do parâmetro
            description: 'Especificação sobre qual comando se deseja ajuda.',
            //Flag de obrigatoriedade do comadno
            required: false
        }
    ],
    //Chamada de execução do comando
    run: async ({interaction, args, client})=>{
        //Inicialização da variável a ser impressa
        let ret: string = '';
        //Caso seja especificado um comando, é exibida a ajuda apenas dele
        if(args.getString('comando')){
            //Recuperação do comando
            const command = client.commands.get(args.getString('comando'));
            //Verificação se é um comando válido
            if(command){
                //Formatação do texto
                ret = (command.help)?(`\n${command.help}\n`):(NO_HELP);
            }else{
                //Identificação que não é um comando válido
                ret = WRONG_COMMAND;
            }
        }
        else{
            //Loop de recuperação de ajuda de todos os comandos registrados
            client.commands.forEach( (value,key)=>{
                if(value.help){
                    ret += `\n${value.help}\n`;
                }
            });
        }
        //Reply
        interaction.editReply({content: HELP_TEXT})
        //Exibição da ajuda
        interaction.channel.send({content: ret});
    },
});