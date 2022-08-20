import { Collection } from "discord.js";


//Limite de tempo para que o atributo de um jogador seja removido
const THRESHOLD = 60 * 60 * 1000;


//Símbolo a ser exibido quando rolar o valor do atributo
const DICE_FACE: Array<string> = [
    ':one:',
    ':two:',
    ':three:',
    ':four:',
    ':five:',
    ':six:',
];

/**
 * Classe para armazenamento dos dados do jogador
 */
class Player {
    //Valor de atributo (de 2 a 5)
    attribute: number;
    //Timestamp para acompanhar quanto tempo faz que o jogador não faz nada 
    timestamp: number;
}

/**
 * Classe para gerenciar os jogadores de Guaxinins & Gambiarras
 */
export class GeGManager{
    
    //Repositório de jogadores ativos
    private players: Collection<string, Player> = new Collection();
    //Singleton do gerenciador
    static gegManager: GeGManager;

    /**
     * Construtor
     * @constructor
     */
    constructor(){
    }
    
    /**
     * Gerenciamento do singleton
     * @returns Singleton
     */
    static getGeGManager(){
        //Se não houver um objeto criado, cria-se
        if(!this.gegManager){
            this.gegManager = new GeGManager();
        }
        //Retorna o singleton
        return this.gegManager;
    }
    /**
     * Define o atributo de um jogador
     * @param playerID ID do jogador no Discord
     * @param attribute Valor do atributo
     */
    public setAtributo( playerID: string, attribute: number){
        //Busca pelos dados do jogador
        let player: Player = this.players.get(playerID);
        //Caso o jogador não esteja no repositório, um novo jogador é criado
        if(!player){
            player = new Player();
        }
        //Define o atributo do jogador
        player.attribute = attribute;
        //Atualiza o timestamp do jogador
        player.timestamp = Date.now();
        //Define os dados do jogador no repositório
        this.players.set(playerID,player);
        //Valida os dados de todos os jogadores
        this.validatePlayers();

        //Impressão de dados para debug
        if(process.env.environment==='debug'){
            const LINE: string = '---------------------';
            console.log(LINE);
            console.log('Atributos de jogadores:');
            console.log(this.players);
            console.log(LINE);
        }
        
    }


    /**
     * Rola a quantidade necessária de dados
     * @param dice Quantidade de dados
     * @returns Lista de dados rolados
     */
    private rollDice(dice: number): Array<number>{
        //Definição da lista a ser retornada
        let ret: Array<number> = [];
        //Loop de jogada de dados
        for(let i=0;i<dice;i++){
            ret.push(Math.floor(Math.random()*6)+1);
        }

        return ret;
    }

    /**
     * Valida os dados dos jogadores no repositório, se a última atuação do jogador for superior a THRESHOLD, 
     * ele é excluído do repositório. Funciona como um garbage collector
     */
    private validatePlayers(){
        //Loop sobre jogadores
        this.players.forEach( (value,key)=>{
            //Validação do timestamp do jogdor
            if(Date.now()-value.timestamp>THRESHOLD){
                this.players.delete(key);
            }
        })
    }

    /**
     * Faz uma jogada de dados para o jogador solicitado
     * @param playerID Identificador do jogador
     * @param dice Quantidade de dados
     * @returns Texto representando a jogada de dados
     */
    public play(playerID: string, dice: number): string{
        //Recuperação do jogador a partir do repositório
        let player: Player = this.players.get(playerID); 
        
        //Se o jogador não estiver no repositório, nada deve ser feito 
        //(pois é necessário comparar o atributo do jogador com a rolagem de dados)
        if(!player){
            return;
        }
        //Execução da rolagem de dados
        const diceRolled = this.rollDice(dice);
        //Definição da variável para retorno da rolagem
        let ret: string = '';
        //Loop sobre os resultados dos dados
        diceRolled.forEach( value =>{
            //Formatação do resultado
            const curVal: string = (value==this.players.get(playerID).attribute)?(`${DICE_FACE[value-1]}`):(`\` ${value} \``);
            //Adição do resultado a string de retorno
            ret += (ret=='')?(curVal):(`, ${curVal}`);
        });
        //Validação dos dados de todos os jogadores
        this.validatePlayers();

        //Impressão de dados de debug
        if(process.env.environment==='debug'){
            const LINE: string ='---------------------';
            console.log(LINE);
            console.log(`ID do jogador: ${playerID}`);
            console.log(`jogador encontrado: ${player}`);
            console.log(`dados a serem rolados: ${dice}`);
            console.log(`rolagem de dados: ${diceRolled}`);
            console.log(`texto da rolagem: ${ret}`);
            console.log(LINE);
        }
        
        
        //Atualização do timestamp do jogador(INÍCIO)
        player.timestamp = Date.now();
        this.players.set(playerID,player);
        //Atualização do timestamp do jogador(FIM)

        return ret;
    }

    

}