import { ButtonInteraction, Client, Collection,  CommandInteraction,  Interaction,  Message,  MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { Command } from "../../structures/Command";
import { ExtendedInteraction } from "../../typings/Command";

//Tipo para gerenciamento de baralhos
type Deck = {
    timestamp: number,
    deck: Array<number>,
    interaction: Message
}

//Limite máximo de inatividade de um canal (em milissegundos)
const DECK_THRESHOLD: number = 60 * 60 * 1000;
//Limite máximo de inatividade do painel de reembaralhamento de cartas
const PANEL_TIMEOUT: number = 10 * 1000;
//Texto para botão para reembaralhar
const RESHUFLLE: string = 'Embaralhar';
//Emoji para botão de reembaralhar
const SHUFFLE_EMOJI: string = "♻️";
//Texto para botão de não reembaralhar
const STOP_RESHUFFLE: string = 'Não fazer nada';
//Emoji para botão para não reembaralhar
const STOP_SHUFFLE_EMOJI: string = "🛑";
//Texto de indicação de baralho sem cartas
const OUT_OF_DECK_QUESTION = 'Acabaram as cartas do baralho. Deseja embarlhá-lo novamente?';
//Texto exibido para usuário que não solicitou o sorteio de cartas
const WRONG_USER = 'Não foi você que puxou as cartas.';
//Texto para reply
const DRAWING_CARDS = 'Puxando cartas'

/**
 * Classe para gerenciamento de baralhos.
 * Cada canal terá seu pŕoprio baralho de 54 cartas (as 52 padrão, mais 1 coringa vermelho e 1 coringa preto).
 * Quando os jogadores vão puxando as cartas e elas acabam, é oferecido o reembaralhar.
 */
class DeckManager{

    //Coleção de baralhos
    private decks: Collection<string,Deck>;
    //Tempo limite de inatividade do baralho
    private decksThreshold: number;
    //Comentário
    private comment: string;

    /**
     * Construtor
     * @constructor
     */
    constructor(){
        //Inicialização da coleção de baralhos
        this.decks = new Collection();
        this.decksThreshold = DECK_THRESHOLD;
    }

    //Singleton do gerenciador de baralhos
    static deckManager: DeckManager;

    /**
     * Recuperar o singleton do gerenciador de baralhos
     * @returns Singleton
     */
    static getDeckManager(): DeckManager{
        if(!this.deckManager){
            this.deckManager = new DeckManager();
        }
        return this.deckManager;
    }

    /**
     * Gerar um novo baralho
     * @returns Novo baralho com as 54 cartas
     */
    private getNewDeck(): Array<number>{
        let newDeck: Array<number> = [];
        for(let i=0;i<54;i++){
            newDeck.push(i);
        }
        return newDeck;
    }

    /**
     * Reembaralha o baralho de um canal
     * @param deckID ID do canal
     */
    private reloadDeck(deckID: string): void{
        //Recuperação do baralho
        const deck = this.decks.get(deckID);
        //Redefinição do baralho
        deck.deck = this.getNewDeck();
    }

    /**
     * Cria um novo baralho e vincula ao canal atual
     * @param deckID ID do canal que terá o baralho criado
     * @returns 
     */
    private createDeck(deckID: string): Deck{
        const newDeck: Deck = { timestamp: Date.now(), deck: this.getNewDeck(), interaction: undefined };
        this.decks.set(deckID,newDeck);
        return newDeck;
    }

    /**
     * Atualiza o timestamp de um canal
     * @param deckID ID do canal
     */
    private updateDeckTimestamp(deckID: string): void{
        //Recuperação dos dados do canal
        const deck: Deck = this.decks.get(deckID);

        //Atualização do timestamp
        if(deck){
            this.decks.set(deckID,{ timestamp: Date.now(), deck: deck.deck, interaction: deck.interaction});
        }
        //Validação de todos os baralhos
        this.validateDecks();

        //Impressão de debug
        if(process.env.environment==='debug'){
            const LINE: string = '---------------------';
            console.log(LINE);
            console.log('Baralhos disponíveis:');
            console.log(this.decks);
            console.log(LINE);
        }
        
    }

    /**
     * Valida o timestamp de todos os canais registrados. Se o timestamp de um canal estiver defasado em THRESHOLD, ele é excluído.
     */
    private validateDecks(): void{
        const now: number = Date.now();
        for( const [key, deck] of this.decks ){
            if(now-deck.timestamp > this.decksThreshold){
                this.decks.delete(key);
            }

        }
    }

    /**
     * Exibe o painel para reembaralhamento no canal atual.
     * @param currentDraw Lista de cartas já puxadas na solicitação atual
     * @param cards Quantidade de cartas a se puxar
     * @param deckID ID do canal
     * @param interaction Interação que deu origem ao processo atual
     */
    private async confirmReshuffle(currentDraw: Array<number>, cards: number, deckID: string, interaction: ExtendedInteraction){
        //Criação do painel
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('yes')
                    .setEmoji(SHUFFLE_EMOJI)
                    .setLabel(RESHUFLLE)
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('no')
                    .setEmoji(STOP_SHUFFLE_EMOJI)
                    .setLabel(STOP_RESHUFFLE)
                    .setStyle('SECONDARY')
            );
        //Exibição do painel com timeout de PAINEL_TIMEOUT
        interaction.channel.send({content: OUT_OF_DECK_QUESTION, components: [row]})
            .then( msg => {
                //Quando o painel for exibido, ele é vinculado ao canal(INÍCIO)
                const deck = this.decks.get(interaction.channelId);
                deck.interaction = msg;
                this.decks.set(interaction.channelId, deck);
                //Quando o painel for exibido, ele é vinculado ao canal(FIM)
            })
            .catch(  
                console.error
            );

        //Filtragem de usuário (apenas o usuário que puxou as cartas pode interagir com o painel)
        const filter = (finteraction) => {
            //Verificação se o usuário que está clicando é o mesmo que sorteou as cartas
            const userInteraction = finteraction.user.id === interaction.user.id;
            //Pode haver vários coletores simultaneamente no canal, então é necessário fazder a filtragem se
            //a interação que está atuando é a mesma interação que deu origem a esse painel
            const originalMessage = finteraction.message == this.decks.get(finteraction.channelId).interaction;

            //Se não for o mesmo usuário que sorteou as cartas e está tentando embaralhar as cartas, uma mensagem de negação é exibida
            if(!userInteraction){
                finteraction.channel.send({content: WRONG_USER});
            }
            return userInteraction && originalMessage;
        };

        //Definição do coletor de interações, para lidar com a manipulação do painel
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            max: 1
        });
        
        //Vinculação do evento end com o coletor
        collector.on('end', async ButtonInteraction=>{
            //Recuperação da interação
            ButtonInteraction.first().deferUpdate();
            //Se o usuário confirmou que deseja reembaralhar ...
            if(ButtonInteraction.first().customId=='yes'){
                
                //O baralho é recriado
                this.reloadDeck(deckID);
                //As cartas já puxadas são excluídas do baralho
                this.removeCards(currentDraw,deckID);
                
                this.deleteMessage(deckID);
                
                //Continua a puxar o restante das cartas
                this.drawCards(currentDraw, cards, deckID, interaction);

            }else{
                this.deleteMessage(deckID);

                //Se responder que não, as cartas já puxadas são exibidas
                this.showDraw(currentDraw,interaction);
            }
        });

    }


    private deleteMessage(deckID:string){
        const deck = this.decks.get(deckID);
        deck.interaction.delete();
        deck.interaction = undefined;
        this.decks.set(deckID,deck);
    }


    /**
     * Remove cartas de um baralho.
     * Esse método é chamado quando há a necessidade de reembaralhar e já há cartas sorteadas.
     * @param currentDraw Cartas a serem removidas do baralho
     * @param deckID ID do canal
     */
    private removeCards(currentDraw: Array<number>,deckID: string){
        currentDraw.forEach( card =>{
            const deck = this.decks.get(deckID);
            const oldCard = deck.deck.indexOf(card);
            deck.deck.splice(oldCard,1);
        })
    }

    /**
     * Puxa uma carta do baralho
     * @param deckID Identificador do baralho
     * @returns -1 em caso de falha, caso contrário o identificador da carta
     */
    private drawCard(deckID: string): number {
        //Recuperação do baralho
        let deck = this.decks.get(deckID);
        //Se o baralho não existir, ele é criado
        if(!deck){
            deck = this.createDeck(deckID); 
        }
        //Se o baralho ainda tem cartas, uma carta é puxada
        if(deck.deck.length>0){
            //Uma carta é escolhida entre as disponíveis
            const cardIndex = Math.floor(Math.random()*deck.deck.length);
            //O identificador da carta é copiado
            const card = deck.deck.at(cardIndex);
            //O identificador da carta é excluído do baralho
            deck.deck.splice(cardIndex,1);
            //O identificador é retorenado
            return card;
        }
        //Se não houver cartas é retornado o flag de falaha
        return -1;
    }

    /**
     * Puxa uma carta do baralho.
     * Esse método é o responsável por solicitar o sorteio de uma carta e avaliar se ainda há cartas disponíveis.
     * Assim, o sorteio é feito carta a carta e de forma recursiva.
     * @param currentDraw Conjunto de cartas já sorteadas
     * @param cards Quantidade de cartas a sortear
     * @param deckID ID do canal
     * @param interaction Interação que deu origem ao processo
     */
    private async drawCards(currentDraw: Array<number>, cards: number, deckID: string, interaction: ExtendedInteraction){
        //Avalia se ainda há cartas para puxar
        if(cards>0){
            //Sorteia uma carta
            const card = this.drawCard(deckID);
            //Se foi possível sortear uma carta...
            if(card>=0){
                //O total de cartas é decrementado
                --cards;
                //A carta sorteada é adicionada ao conjunto de cartas sorteadas
                currentDraw.push(card);
                //Esta função é chamada novamente com os parâmetros atualizados
                this.drawCards(currentDraw, cards, deckID, interaction);
            }else{
                //Se não foin possível sortear uma carta, é exibido o painel com botões para reembaralhar
                await this.confirmReshuffle(currentDraw, cards, deckID, interaction);
            }
        }else{
            //Se não houver cartas a puxar, as cartas sorteadas são exibidas
            this.showDraw(currentDraw, interaction);
        }
    }

    /**
     * Transorma um número em carta
     * @param card Número da carta
     * @returns Texto contendo a representação das cartas
     */
    private getCardFace(card: number): string{

        //Captura da naipe da carta (INICIO)
        //Variável que conterá o naipe, por padrão será o círculo vermelho
        let cardType: string = ':red_circle:';
        if(card<13){
            cardType=":spades:";
        }else if(card<26){
            cardType=":hearts:";
        }else if(card<39){
            cardType=":clubs:";
        }else if(card<52){
            cardType=":diamonds:";
        }else if(card==52){
            cardType=":black_circle:";
        }
        //Captura da naipe da carta (FIM)

        //Converte o identificador em um valor de carta(INÍCIO)
        let cardValue: string = ':black_joker:';
        if(card<52){
            card %= 13;
            if(card==0){
                cardValue = 'A';
            }else if(card==10){
                cardValue = 'J';
            }else if(card==11){
                cardValue = 'Q';
            }else if(card==12){
                cardValue = 'K'
            }else{
                cardValue = (card+1).toString();
            }
        }
        //Converte o identificador em um valor de carta(FIM)

        //Retorna a string contendo a carta desejada
        return `${cardValue} ${cardType}`;
    }

    /**
     * Cria a e exibe a string contendo as cartas sorteadas.
     * @param currentDraw Cartas sorteada
     * @param interaction Interação que disparou o processo
     */
    private showDraw(currentDraw: Array<number>, interaction: ExtendedInteraction){
        //Inicialização da string de exibição
        let ret: string = '[ '
        //Loop sobre a cartas sorteadas
        currentDraw.forEach( (card) => {
            //Conversão dos índices das cartas nos textos para exibição
            ret += ` **${this.getCardFace(card)}**,`;
        });
        //Remoção da última vírgula
        ret = ret.substring(0,ret.length-1);
        //Adição do colchete de fechamento
        ret += ' ]';
        //Fim da montagem do texto de exibição com a adicição da referência ao usuário que puxou as cartas
        ret = `${interaction.user}\n${ret}`;
        //Reply
        interaction.editReply({content: (this.comment)?(this.comment):(DRAWING_CARDS)});
        //Remoção do comentário já usado (isso é necessário para não ter que empilhar a mensagem inúmeras vezes)
        this.comment = undefined;
        //Exibição do resultado do sorteio
        interaction.channel.send({content: ret});
        
    }

    /**
     * Função que dispara o sorteio de cartas.
     * 
     * @param client O bot 
     * @param interaction O comando disparado
     * @param cards Quantidade de cartas a serem puxadas
     * @param comment Comentário opcional a ser exibido antes do resultado do sorteio das cartas
     */
    public async draw(client: ExtendedClient,interaction: ExtendedInteraction,cards: number, comment: string){
        //Definição do comentário a ser exibido
        this.comment = comment;
        //Chamada de função para fazer o sorteio de cartas propriamente dito.
        this.drawCards([],cards,interaction.channelId,interaction);
        //Atualiza o timestamp do baralho
        this.updateDeckTimestamp(interaction.channelId);
    }
}

/**
 * Objeto com comando para sorteio de cartas
 */
export default new Command({
    name: 'c',
    description: 'Sorteia cartas de um baralho',
    help: '*COMANDO PARA O BARALHO*:\n**/c número**: saca um número de cartas do baralho.\n'+
    'Se o baralho acabar durante o sorteio de cartas, é oferecido o reembaralhamento das cartas.'+
    'Opcionamente, pode-se enviar um comentário, que é exibido jundo ao resultado da primeira partida.',
    options: [
        {
            name: 'cartas',
            description: 'Quantidade de cartas',
            type: 'INTEGER',
            required: true,
            minValue: 1
        },
        {
            name: 'comentário',
            description: 'Comentário opcional a ser exibido junto ao sorteio das cartas',
            required: false,
            type: 'STRING'
        }
    ],
    run: async ({interaction, args, client})=>{
        //Recuperação do gerente de baralhos
        const deckManager = DeckManager.getDeckManager();
        //Sorteio das cartas
        deckManager.draw(client, interaction, args.getInteger('cartas'), args.getString('comentário'));
    },
});