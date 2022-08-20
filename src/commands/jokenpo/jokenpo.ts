//Importação de bibliotecas da API
import { ButtonInteraction, Collection, Message, MessageActionRow, MessageButton, User } from "discord.js";
//Importação da classe de definição do comando
import { Command } from "../../structures/Command";
//Importação da classe de definição da Interaction
import { ExtendedInteraction } from "../../typings/Command";


//Definições de contantes de texto (INÍCIO)
//Emojis das mãos
const HANDS: Array<string> = ["👊","✌️","🖐"];
//Texto de reply (substitui o painel de botões, de pois da jogada)
const REPLY_TEXT: string = "Jo Ken Pô";
//Texto para quando houver empate
const DRAW: string = "WoW! Empatamos!";
//Texto para quando o jogador vence
const USER_WINS: string = "Você ganhou";
//Texto para quando o jogador perde
const USER_LOOSES: string = "Você perdeu";
//Emoji para botão de fechamento do painel
const CLOSE_EMOJI: string ='❌';
//Texto para botão de fechamento do painel
const CLOSE: string = 'Fechar';
//Match canceled
const CANCEL: string = '___';
const THRESHOLD: number = 60 * 60 * 1000;
//Definições de contantes de texto (FIM)



type ChannelMatch = {
    timestamp: number,
    interaction: Message
}

/**
 * Classe para jogo de Jokenpô.
 * 
 * O usuário do Discord é um jogador e o bot é o outro, escolhendo, aleatoriamente, uma das três possibilidade.
 */
class Jokenpo{

    private channelMatches: Collection<string, ChannelMatch> = new Collection();

    private currentUser: User;

    /**
     * Construtor
     * @constructor
     */
    constructor(){
    }

    /**
     * Realiza o conjunto de jogadas para uma partida de jokenpô
     * @param interaction Interação que disparou a partida
     * @param comment Comentário opcional a ser exibido antes da avaliação da partida
     */
    public play(interaction: ExtendedInteraction, comment?: string){
        
        //Criação de painel 
        const row = new MessageActionRow()
            .addComponents(
                //Adição do botão relativo a pedra
                new MessageButton()
                    .setCustomId('0')
                    .setEmoji(HANDS[0])
                    .setStyle('SECONDARY'),
                //Adição do botão relativo a tesoura
                new MessageButton()
                    .setCustomId('1')
                    .setEmoji(HANDS[1])
                    .setStyle('SECONDARY'),
                //Adição do botão relativo a tesoura
                new MessageButton()
                    .setCustomId('2')
                    .setEmoji(HANDS[2])
                    .setStyle('SECONDARY'),
                //Adição do botão para fechar painel
                new MessageButton()
                    .setCustomId('3')
                    .setEmoji(CLOSE_EMOJI)
                    .setLabel(CLOSE)
                    .setStyle('SECONDARY'),
            );
        
        interaction.channel.send({content: '...', components: [row]})
            .then( msg => {
                //Recuperação das informações do canal
                const match = this.channelMatches.get(interaction.channelId);
                //SE já houver alguma informação sobre o canal, o painel anterior deve ser excluído
                if(match && match.interaction){
                    this.deleteMessage(interaction.channelId);
                }
                //Atualiza as informações do canal, indicando que o painel ativo é o que acabou de ser criado
                this.updateChannel(interaction.channelId, msg);
            })
            .catch(  
                //Se houver algum erro, ele é direcionado ao console
                console.error
            );

        const filter = (finteraction ) => {
            this.currentUser = finteraction.user;

            //Pode haver vários coletores simultaneamente no canal, então é necessário fazder a filtragem se
            //a interação que está atuando é a mesma interação que deu origem a esse painel
            return finteraction.message == this.channelMatches.get(finteraction.channelId).interaction;
        };

        //Cria um coletor de interações para interageir com o painel
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            max: 1
        });

        //Vindula o evento de interação com o painel e o coletor de interações
        collector.on('end', async (ButtonInteraction)=>{
            
            ButtonInteraction.first().deferUpdate();
            //Transforma o CustomID do botão clicado na escolha do jogador
            const userHand: number = parseInt(ButtonInteraction.first().customId);

            //Se o usuário escolher a opção de fechar, o painel é excluído e nada mais será feito
            if(userHand==3){
                const match = this.channelMatches.get(interaction.channelId);
                if(match && match.interaction){
                    match.interaction.delete();
                }
                // //Exclusão da mensagem contendo o painel
                this.channelMatches.delete(interaction.channelId);
                //Edição do reply, para evitar mensagem de que o bot ainda está processando
                interaction.editReply({content: CANCEL});
                
                return;
            }

            //Ecolhe aleatoriamente a jogada do bot (A multiplicação de Math.random por Date.now pode deixar o resultadao mais eleatória)
            const botHand: number = Math.floor(Math.random()*Date.now())%3;
            //Recupera o texto da avaliação da partida
            const result = this.conditions(userHand,botHand);
            
            //Faz um reply para evitar as reticências, como se o bot ainda estivesse agindo
            interaction.editReply({content: REPLY_TEXT});
            //Definição da variável com o texto a ser exibido com o resultado
            let ret: string = '';
            //Define o texto a ser exibido

            

            ret = `*-${(comment)?(comment):('')}*\n${this.currentUser} escolheu ${HANDS[userHand]}\n`+
                `Eu escolhi ${HANDS[botHand]}\n**${(result==-1)?(USER_LOOSES):((result==0)?(DRAW):(USER_WINS))}**`;
            //Publica o resultado
            interaction.channel.send({content: ret});

            //Exibição de um novo painel
            this.play(interaction);
        });
    }


    /**
     * Exclui uma mensagem que contenha um painel
     * @param matchID ID do canal
     */
    private deleteMessage(matchID:string){
        //As informações do canal são recuperadas
        const match = this.channelMatches.get(matchID);
        //A mensagem é excluída
        match.interaction.delete();
        //O canal é atualziado
        this.updateChannel(matchID, undefined);
    }

    /**
     * Valida todos os canais no bot. Se algum canal apresenta inatividade por um tempo superior a THRESHOLD, ele é excluído
     */
    private validateChannels(){
        this.channelMatches.forEach( (value, key) =>{
            if(Date.now() - value.timestamp > THRESHOLD){
                this.channelMatches.delete(key);
            }
        });
    }

    /**
     * Atualiza os dados de uma partida
     * @param matchID Identificador do canal da partida
     * @param interaction Parâmetro opcional para identificar uma interação que exibiu um painel
     */
    private updateChannel(matchID: string, interaction?: Message){
        //Recuperação de uma partida
        const match = this.channelMatches.get(matchID);
        //Se nenhuma partida foi encontrada...
        if(!match){
            //Ela é criada
            this.channelMatches.set(matchID,{timestamp: Date.now(), interaction: interaction});
        }else{
            //Caso contrário, os dados são atualizados
            match.timestamp = Date.now();
            match.interaction = interaction;
            this.channelMatches.set(matchID, match);
        }
        //Validação de todos os canais registrados no bot
        this.validateChannels();

    }

    /**
     * Faz a avaliação de quem ganho a jogada.
     * @param userHand Escolha do usuário
     * @param botHand Escolha do bot
     * @returns Avaliação de quem ganho (-1 se o bot ganhar, 0 se houver empate e 1 se o usuário ganhar)
     */
    private conditions( userHand: number, botHand: number): number{
        //Avaliação se foi empate
        if(userHand == botHand){
            return 0;
        }
        //Avaliação do resultado se o jogador escolheu pedra
        if(userHand==0){
            return (botHand==1)?(1):(-1);
        //Avaliação do resultado se o jogador escolheu tesoura
        }else if(userHand==1){
            return (botHand==0)?(-1):(1);
        //Avaliação do resultado se o jogador escolheu papel
        }else if(userHand==2){
            return (botHand==0)?(1):(-1);
        }
    }
  
}

/**
 * Objeto com comando para exibição do painel para partidas de jokenpô
 */
export default new Command({
    name: 'j',
    description: 'Faz uma disputa de Jokenpô',
    help: '*JOGAR JOKENPÔ*\n'+
    '**/j**: Dá início a uma partida de Jokenpô.\nBasta clicar nos botões relativos a sua opção'+
    ' (pedra, papel ou tesoura) no painel que aparece.\nSe quiser fechar o painel, basta clicar no botão Fechar.\n'+
    'Opcionamente, pode-se enviar um comentário, que é exibido jundo ao resultado da primeira partida.',
    options:[{
        name: 'comentário',
        type: 'STRING',
        required: false,
        description: 'Comentário opcional (impresso antes do resultado da jogada)'
    }],
    //Execução do comando
    run: async ({interaction, args})=>{
        //Criação de nova partida
        const jokenpo: Jokenpo = new Jokenpo();
        //Execução da nova partida
        jokenpo.play(interaction, args.getString('comentário'));
    },
});