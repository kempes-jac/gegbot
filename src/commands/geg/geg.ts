//Importação de bibliotecas da API
import { Message, MessageActionRow, MessageButton, User } from "discord.js";
//Importação da classe de definição do comando
import { Command } from "../../structures/Command";
//Importação da classe de definição da interação
import { ExtendedInteraction } from "../../typings/Command";
import { ChannelManager } from "./channelManager";
//Importação da classe de gerenciamento de usuários
import { GeGManager } from "./playerManger";

//Mensagem de erro para quantidade errada de dados
const WRONG_DICE: string = 'Vovô, só sei contar de 1 a 3 dados. Será que Loriane conta diferente?';
//Texto para ser trocado no reply
const ROLLING: string = 'Rolando dados...';
//Texto para rolagem de dados sem que o atributo tenha sido definido
const NO_ATTRIBUTE: string = 'Eu não sei seu atributo ainda.';
//Texto para exibição no painel
const PANEL_TEXT: string = 'Rolar quantos dados?';
//Regras do G&G
const RULES: string = "Guaxinins & Gambiarras, uma adaptação de Lasers & Sentimentos por Marcelo Guaxinim:" +
"\n\n" +
"**Personagem:**" +
"\n" +
"O jogador escolherá um atributo de 2 a 5. Saiba que atributos como 2 ou 3 correspondem a personagens bons em interações sociais (são mais inteligentes e tem melhor percepção do ambiente), por sua vez personagens com atributos de 4 e 5 tem um porte físico melhor (assim são melhores em atacar, correr, etc). Todo o resto da criação do personagem (nome, descrição, ítens) são meramente pontos estéticos que não interferem na mecânica, devendo se encaixar a narrativa proposta na mesa em questão." +
"\n\n" +
"**Testes:**" +
"\n" +
"Em uma situação normal uma personagem rola 2 dados de 6 lados para executar seus testes. Caso esteja ferido ou em desvantagem, rola-se 1 dado, já em caso de vantagem ou recebendo ajuda de outro jogador rolam-se 3 dados." +
"\n\n" +
"**Ação Guaxinim:** Quando o personagem quer usar seu condicionamento físico para agir (atacar, correr, escalar, etc). Para que tenha sucesso o jogador precisa tirar seu atributo ou um valor MENOR em pelo menos um dado." +
"\n\n" +
"**Ação Gambiarra:** Quando o personagem quer usar suas capacidades psico-sociais e intelectuais para agir (perceber, decifrar, convencer, etc). Para que tenha sucesso o jogador precisa tirar seu atributo ou um valor MAIOR em pelo menos um dado." +
"\n\n" +
"Caso o jogador tire exatamente o valor do seu atributo no dado, isso configura acerto crítico, dando ao jogador uma vantagem ou benefício em sua ação ou contando como dois acertos." +
"\n\n" +
"**Pontos de vida:**" +
"\n" +
"Cada personagem tem 3 pontos de vida. Esses pontos se perdem ao ser atacados por inimigos ou em caso de falhas durante testes com risco de se ferir." +
"\n" +
"Para recuperar basta ter uma justificativa narrativa como cuidados médicos num hospital ou uma noite de sono numa estalagem.";


//Emoje para botões no painel (INÍCIO)
const DICE: Array<string> = [
    '1️⃣',
    '2️⃣',
    '3️⃣'
];
const RACCOON: string = '🦝';
//Emoje para botões no painel (FIM)

/**
 * Classe para realização de rolagens de dados para o GeG
 */
class GeG{
    //Interação a ser respondida
    private interaction: ExtendedInteraction;
    //Gerenciador de jogadores
    private gegManager: GeGManager;
    //Jogador que clicou no botão do painel
    private currentUser: User;
    //Gerenciado de interações de canais
    private channelManager: ChannelManager;

    /**
     * Construtor
     * @constructor
     * @param interaction Interação a ser respondida
     * @param gegManager Singleton do gerenciador de jogadores
     */
    constructor(interaction: ExtendedInteraction){
        this.interaction = interaction;
        //Recuperação do singleton de gerenciamento de jogadores
        this.gegManager = GeGManager.getGeGManager();
        //Recuperação do singleton de gerenciamento de canais
        this.channelManager = ChannelManager.getChannelManager();
    }

    /**
     * Exibe o painel do G&G
     * @param comment Comentário opcional a ser exibido junto a primeira rolagem de dados
     */
    public async showPanel(comment?: string){
        //Definição do painel
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('1')
                    .setEmoji(DICE[0])
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('2')
                    .setEmoji(DICE[1])
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('3')
                    .setEmoji(DICE[2])
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('0')
                    .setEmoji(RACCOON)
                    .setStyle('SECONDARY')
            );
        //Exibição do painel
        this.interaction.channel.send({content: PANEL_TEXT, components: [row]})
            .then( async msg => {

                //Recuperação de informações de algum painel de mesmo tipo ainda existente
                const interaction: Message = this.channelManager.getChannelInteraction(this.interaction.channelId);
                //Quando um painel for exibido, o anterior deve ser excluído
                if( interaction ) {
                    await interaction.delete();
                }
                //O canal é atualizado, para dizer que o painel ativo é o que acabou de ser criado.
                this.channelManager.setChannelInteraction(this.interaction.channelId, msg);
            })
            .catch(  
                console.error
        );

        
        //Função de filtragem de usuários.
        //OBSERVAÇÃO: Não haverá uma filtragem propriamente dita, mas sim a captura de que usuário está interagindo com o painel.
        const filter = (finteraction) => {
            //Recuperação de que usuário está interagindo agora com o painel
            this.currentUser = finteraction.user;

            //Impressão de debug
            if(process.env.environment==='debug'){
                const LINE: string = '---------------------';
                console.log(LINE);
                console.log('Função: filter');
                console.log(`currentUser:${this.currentUser}`);
                console.log(`interactionUser:${this.interaction.user.id}`);
                console.log(LINE);
            }

            //Pode haver vários coletores simultaneamente no canal, então é necessário fazder a filtragem se
            //a interação que está atuando é a mesma interação que deu origem a esse painel
            return finteraction.message == this.channelManager.getChannelInteraction(finteraction.channelId);
        };

        
        //Definição do coletor de interações com o painel
        const collector = this.interaction.channel.createMessageComponentCollector({
            filter,
            max: 1
        });
        
        
        //Definição de envento para captura de interação com os botões no painel
        collector.on('end', async ButtonInteraction=>{
            
            ButtonInteraction.first().deferUpdate();

            //Caso se tenha apertado o botão do guaxinim, deve-se imprimir a ajuda
            if (ButtonInteraction.first().customId=='0'){
                this.interaction.channel.send({content: RULES});
            }else{
                //Caso contrário, deve-se fazer a rolagem de dados
                if(!this.rollDice(parseInt(ButtonInteraction.first().customId),comment)){
                    const interaction: Message = this.channelManager.getChannelInteraction(this.interaction.channelId);
                    //Quando um painel for exibido, o anterior deve ser excluído
                    if( interaction ) {
                        await interaction.delete();
                    }
                    return;
                };
                //Após o processamento da interação, a informação do usuário atual deve ser descartada
                this.currentUser = undefined;
            }

            //Impressão de debug
            if(process.env.environment==='debug'){
                const LINE: string = '---------------------';
                console.log(LINE);
                console.log('FUnção: evento on end');
                console.log(`currentUser:${this.currentUser}`);
                console.log(`interactionUser:${this.interaction.user.id}`);
                console.log(LINE);
            }

            //Exibição de novo painel
            this.showPanel(comment);
        });

    }

    /**
     * Realiza uma rolagem de dados
     * @param dice Quantidade de dados a ser rolada
     * @param comment Comentário opcional a ser exibido junto a rolagem de dados
     */
    public rollDice(dice: number, comment?: string): boolean{
        //IMpressão de debug
        if(process.env.environment==='debug'){
            const LINE: string = '---------------------';
            console.log(LINE);
            console.log('FUnção: rollDice');
            console.log(`currentUser:${this.currentUser}`);
            console.log(`interactionUser:${this.interaction.user.id}`);
            console.log(LINE);
        }
        //Validação da quantidade de dados
        if(dice<1 || dice>3){
            this.interaction.editReply({content: WRONG_DICE});
        }
        //Rolagem dos dados
        const diceRolled = this.gegManager.play(this.interaction.user.id, dice);
        //Validação se quem fez a rolagem já tinha definido atributo
        if(!diceRolled){
            //Reply
            this.interaction.editReply({content: '.'});
            //Impressão de mensagem de erro
            this.interaction.channel.send({content: `${(this.currentUser)?(this.currentUser):(this.interaction.user)}! ${NO_ATTRIBUTE}`});

            return false;
        }

        //Reply
        this.interaction.editReply({content: (comment)?(comment):(ROLLING)});

        //Exibição do resultado
        this.interaction.channel.send({content: `${(this.currentUser)?(this.currentUser):(this.interaction.user)}, você rolou: [${diceRolled}]`});
        return true;
    }
}


/**
 * Objeto com comando de rolagem de dados
 */
 export default new Command({
    //Texto de identificação do comando (no caso será /geg)
    name: 'geg',
    //Descrição do comando
    description: 'Rolagem de dados para Guaxinins & Gambiarras',
    //Ajuda
    help: '*COMANDO PARA GUAXININS & GAMBIARRAS*\n**/geg**: exibe o painel de interação para rolagem de dados e ajuda\nou\n'+
        '**/geg número**: rola o número de dados solicitado (entre 1 e 3)',
    //Argumento
    options: [
        {
            name: 'dados',
            type: 'INTEGER',
            required: false,
            description: 'Quantidade de dados a serem rolados',
            choices:[
                {
                    value: 1,
                    name: '1'
                },
                {
                    value: 2,
                    name: '2'
                },
                {
                    value: 3,
                    name: '3'
                }
            ],
            maxValue: 3,
            minValue: 1
        },
        {
            name: 'comentário',
            type: 'STRING',
            required: false,
            description: 'Comentário opcional a ser exbido junto a primeira rolagem de dados.'
        }
    ],
    
    //Chamada de execução do comando
    run: async ({interaction, args})=>{
        //Criação do objeto para lidar com a(s) rolgem(ns)
        const geg: GeG = new GeG(interaction);
        //Verificação se foi passado o argumento relativo a quantidade de dados
        if(args.getInteger('dados')){
            //Rollagem de dados a partir dos argumentos do comando
            geg.rollDice(args.getInteger('dados'), args.getString('comentário'));
        }else{
            //Exibir painel
            geg.showPanel(args.getString('comentário'));
        }
    },
});