import { Command } from "../../structures/Command";
import { ExtendedInteraction } from "../../typings/Command";
import { GeGManager } from "./playerManger";


//Frase a serem exibidas, quando o atributo for 4
const SHELLY: Array<string> = [
    "4, 4 pra toda sua família, 4 pra tu, 4 pra tua vaca, 4 pra todo mundo!",
    "O número de seguidores do Shellynismo ultrapassou a metade da humanidade",
    "No Anel pode-se ler: \n _um número para todos governar,_ \n _um número para encontrá-los,_ \n _um número para todos trazer_ \n _e no atributo 4 aprisioná-los._",
    "A sindrome de Shelly está se espalhando pelo mundo rapiadamente.",
  ];


//Links para arquétipos, para serem exibidas, de acordo com o valor do atributo
const ARQUETIPOS: Array<string> = [
    "https://tenor.com/view/raccoon-playful-playing-bored-music-gif-14245228",
    "https://tenor.com/view/raccoon-playing-piano-focused-amazing-engrossed-funny-gif-13573672",
    "https://tenor.com/view/raccoon-roll-rolling-gif-9052103",
    "https://tenor.com/view/raccoon-flying-gif-9031574",
  ];

//Texto para reply
const REPLY_TEXT: string = 'Estou olhando a bola de cristal e ...'


/**
 * Classe para interação com dados de definição do atributo do usuário
 */
class Atributo{

    //Singleton do gerenciador de jogadores
    private gegManager: GeGManager;
    //Interacton da messagem a ser respondida
    private interaction: ExtendedInteraction;

    /**
     * Constructor
     * @constructor
     * @param interaction Interação a ser respondida
     * @param gegManager Singleton do gerenciador de jogadores
     */
    constructor(interaction: ExtendedInteraction, gegManager: GeGManager){
        this.gegManager = gegManager;
        this.interaction = interaction;
    }


    /**
     * Definir o valor do atributo do jogador
     * @param value Valor do atributo
     */
    public setAtributo(value: number){
        //Solicitação de mudança do valor do atributo
        this.gegManager.setAtributo(this.interaction.user.id, value);
        //Definição da mensagem a ser exibida como resposta
        const ret: string = `${this.interaction.user}, seu atributo é \` ${value} \``;
        //Reply
        this.interaction.editReply({content: REPLY_TEXT});
        //Se o atributo for 4, deve-se exibir uma das mensagens relativas a esse atributo
        if(value==4){
            //A mesngem deve ser escolhida aleatoriamente
            const randValue = Math.floor(Math.random()*SHELLY.length);
            //Exibição da mensagem para atributo 4
            this.interaction.channel.send({content: SHELLY[randValue]});
        }
        //Exibição de texto com o atributo definido
        this.interaction.channel.send({content: ret});
        //Exibição de link para imagem do arquétipo do atributo
        this.interaction.channel.send({content: ARQUETIPOS[value-2]});
    }
}

/**
 * Objeto de definição de atributo do jogador
 */
 export default new Command({
    //Texto de identificação do comando (no caso será /atributo)
    name: 'atributo',
    //Descrição do comando
    description: 'Guaxinins & Gambiarras',
    //Ajuda
    help: '*COMANDO PARA GUAXININS & GAMBIARRAS*\n**/atributo número**: define o valor do atributo do jogador.',
    //Parâmetro do comando
    options: [
        {
            //Nome do parâmetro
            name: 'valor',
            //Tipo do parâmetro
            type: 'INTEGER',
            //Descrição do parâmetro
            description: 'Valor do atributo (mínimo de 2 e máximo de 5)',
            //Flag de obrigatoriedade do comadno
            required: true,
            //Valor máximo
            maxValue: 5,
            //Valor mínimo
            minValue: 2,
            choices: [
                {
                    value: 2,
                    name: '2'
                },
                {
                    value: 3,
                    name: '3'
                },
                {
                    value: 4,
                    name: '4'
                },
                {
                    value: 5,
                    name: '5'
                }
            ]
        }
    ],
    //Chamada de execução do comando
    run: async ({interaction, args, client})=>{
        //Recuperação do parâmetro relativo ao valor do atributo
        const valorAtributo: number = args.getInteger('valor');
        //REcuperação do singleton do gerenciador de jogadores
        const playersManager = GeGManager.getGeGManager();

        //Criação do objeto para lidar com a mudança do valor do atributo do jogador
        const atributo = new Atributo(interaction, playersManager);

        //Mudança do valor do atributo do jogador
        atributo.setAtributo(valorAtributo);
    },
});