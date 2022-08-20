//Importação de biblioteca da API
import { Collection } from "discord.js";
//Importação da classe de definição de um comando
import { Command } from "../../structures/Command";


//Definição de constantes de texto (INÍCIO)
//Texto para excessões
const TEXTOS_DE_ERROS: Collection<string,string> = new Collection();
TEXTOS_DE_ERROS.
    //Tentativa de execução do comando sem as definições dos dados
    set('ROLAGEM_AUSENTE','Não achei os dados, coelhinha').
    //Caracteres inválidos na definição da rolagem de dados
    set('CARACTERES_INVALIDOS','Paper, eu não sei se isso está escrito certo!').
    //Caracteres válidos, mas expressão incorreta
    set('ROLAGEM_MAL_ESCRITA','É assim que se escreve isso, Loriane?');
//Definição de constantes de texto (FIM)


/**
 * Classe que realiza rolagem de dados de faces numéricas.
 * 
 * Um objeto desse tipo recebe uma expressão com a definição de uma rolagem de dados e faz o parse da expressão.
 * 
 * O parse tenta identificar caracteres e expressões válidas.
 * 
 * Um expressão válida inclui sinais de adição(+) ou subtração(*), <números inteiros> ou expressões do tipo 
 * <número inteiro>d<número inteiro>. Onde o primeiro número inteiro é a identificação da quantidade de dados e o
 * segundo número inteiro é a quantidade de faces do dado.
 * 
 * São exemplos de expressões válidas:
 * 1d6
 * 1d3
 * 1D4
 * 1D6
 * 1d6+2
 * 3d2+5d7+2d20+1+2+1-6-8
 * 2+36-9+8-9
 * 
 */
class DiceRoller{
    
    //Expressão a ser interpretada
    private expression: string;
    //Expressão "quebrada" em termos a serem validados
    private splitedExpression: Array<string> = [];

    /**
     * Construtor
     * @param roll Expressão a ser interpretada
     */
    constructor(roll: string){
        //Remoção de caracteres em branco, do início e do final da expressão
        this.expression = roll.trim();
        //Verificação se é uma expressão em branco
        if (this.expression.length==0){
            throw new Error('ROLAGEM_AUSENTE');
        }
        //Tentativa de quebrar a expressão em termos validáveis
        try{
            this.signalSpliter();
        }catch(error){
            throw error;
        }
    }
    
    /**
     * Quebrar a expressão atual em termos menores e validáveis
     */
    private signalSpliter(){
        //Definição de caracteres válidos
        const validChars: string = '0123456789dD-+';

        //Índice do início do termo atual
        let beg: number = 0;
        //Índice do fim do termo atual
        let end: number = 0;
        
        //Loop sobre todos os characteres da expressão
        for(let i=0; i<this.expression.length; i++){
            //O fim do termo se move para a posição atual do loop
            end=i;
            //Se o caracter atual não estiver na lista de caracteres válidos, é levantada um excessão
            if (validChars.indexOf(this.expression.at(i))==-1){
                throw new Error('CARACTERES_INVALIDOS');
            }
            //Um sinal de adição ou subtração identifica o fim do termo atual
            if(this.expression.at(i)==='+' || this.expression.at(i)==='-'){
                //O termo atual é adicionado a lista de termos
                this.splitedExpression.push(this.expression.substring(beg,end));
                //O sinal identificado é adicionado a lista de termos
                this.splitedExpression.push(this.expression.at(i));
                //O índice de início de termo vai para o próximo caracters após o sinal
                beg=i+1;
            }
        }
        //O último termo é forçado a entrar na lista, já que não há um sinal para identificar o fim do último termo dentro do loop
        this.splitedExpression.push(this.expression.substring(beg,end+1));
    }

    /**
     * Converte texto em um número número, única e exclusivamente, se o texto contiver apenas caracteres relativos a um 
     * número de escrita decimal
     * @param value String a ser convertida
     * @returns Um número ou NaN (se o testo não contiver um número)
     */
    private filterInt(value: string): number {
        if (/^[-+]?(\d+|Infinity)$/.test(value)) {
            return Number(value)
        } else {
            return NaN
        }
    }

    /**
     * Faz o parse de uma expressão e executa a rolagem de dados relativas a mesma, se possível
     * @param comment Comentário opcional a ser exibido antes do resultado da jogada 
     * @returns Identificação dos dados rolados e do valor total do somatório das faces dos dados com algum termo adicionado a expressão
     */
    public roll(comment?: string): string{
        //Acumulador do total rolado para cada dado ou termo numérico da expressão
        let total = 0;
        //Texto que conterá a lista de cada um dos dados rolados, sinais e termos numéricos
        let retString = '';
        //Flag para identificação se o próximo termo será adiconado ou subtraído
        let sum: boolean = true;
        //Flag para identificação se a próxima operação será de adição ou subtração
        let sumNext: boolean = true;

        //Loop sobre os termos da expressão
        for(let i=0; i<this.splitedExpression.length;i++){
            //O flag da operação atual é definido para o identificado previamente
            sum = sumNext;
            
            //Se o próximo termo for um sinal, mas for o último termo da expressão, ele deve ser ignorado
            if ((this.splitedExpression.at(i)=='+' || this.splitedExpression.at(i)=='-') && (i==0 || i==this.splitedExpression.length)){
                continue;
            }
            
            //Caso termo atual seja um sinal negativo, o próximo termo deve ser subtraído. Caso contrário, adicionado.
            sumNext = this.splitedExpression.at(i)!='-';

            //Caso o termo atual seja um sinal, nada mais precisa ser feito na interação atual do loop
            if ((this.splitedExpression.at(i)=='+' || this.splitedExpression.at(i)=='-') ){
                continue;
            }
    

            //Caso contrário...

            //Para não ter que compara com caracteres maiúsculos e minúsculor o termo atual é convertido para maiúsculo
            const item = this.splitedExpression.at(i).toUpperCase();
            
            //Variável para guardar a versão convertida (número ou rolagem de dados) do termo atual
            let str:string ='';
            //Variável para guardar o total do termo atual (número ou somatório das faces dos dados rolados)
            let val:number = 0;
            
            //Há a tentativa de transformar o termo em um número
            const value = this.filterInt(item);

            //Se for possível converte o termo para um número...
            if(!isNaN(value)){
                //O valor é colado na variável numérica...
                val = value;
                //E o termo é copiado para a string de representação
                str = `**${val.toString()}**`;
            //Caso contrário, provavelmente se refere a uma rolagem de dados
            }else{
                //Um termo que contenha a letra D é identificada como uma rolagem de dados. Caso a letra D apareça no 
                //iníco, no fim ou em multiplicade, a expressão está mal definida
                if(item.startsWith('D') ||  item.endsWith('D') || this.getMultipleD(item)){
                    throw new Error('ROLAGEM_MAL_ESCRITA');
                }
                //O primeiro número do termo se refe a quandade de dados a serem rolados
                const dice: number = parseInt(item.substring(0,item.indexOf('D')));
                //O segundo número do termo se refere a quandidade de faces dos dados
                const faces: number = parseInt(item.substring(item.indexOf('D')+1));
                //Após a validação do termo, os dados são rolados
                [ str, val] = this.diceRoll(dice,faces);
                //As rolagens dos dados são convertidos para um texto de representação de lista de jogadas
                str = `**D${faces}**[${str}]`;
                
            }
            //O valor identificado para o termo atual é acumulado
            total += (sum)?(val):(-val);

            //Caso o texto de representação da expressão esteja vazio...
            if(retString.length==0){
                //O texto é inicializado
                retString = str.toString();
            //Caso contrário...
            }else{
                //O texto é acumulado com um sinal que representa a operação realizada com sinal atual da expressão
                retString = retString.concat((sum)?('+'):('-')).concat(str);
            } 
            
        }
        //A representação da interpretação da rolagem e o total são retornados dentro de um único texto
        return `${(comment)?(`*${comment}*\n`):('')}Você rolou : ${retString} = **${total.toString()}**`;
    }

    /**
     * Identificar se o termo possui mais de um D
     * @param term Termo a ser validado
     * @returns Flag se há mais de 1 D
     */
    private getMultipleD(term: string): boolean{
        //O contador de Ds
        let d: number = 0;
        //Loop sobre os caracteres do termo
        for(let i=0;i<term.length;i++){
            //Se o caracter atual for um D, o contador de Ds é incrementado
            d += (term.at(i)=='D')?(1):(0);
        }
        return d!=1;
    }

    /**
     * Realiza a rolagem de um conjunto de dados
     * @param dice Quantidade de dados a serem rolados
     * @param faces Quantidade de faces dos dados
     * @returns [ texto com a representação da rolagens, o somatório das faces roladas ]
     */
    private diceRoll(dice: number, faces: number): Array<any>{
        //Vetor de dados rolados
        let diceSet: Array<number> = [];
        //Valor acumulado com as rolagens
        let value: number =0;

        //Loop de rolagens de dados
        for(let i=0;i<dice;i++){
            //Rolagem de 1 dado
            const roll =  Math.floor(Math.random()*faces)+1;
            //Incremento do acumulador das rolagens
            value += roll;
            //Adição a rolagem ao vetor de rolagens
            diceSet.push( roll );
        }
        //Retorno das rolagens e total acumulado
        return [diceSet.toString(), value];
    }
}

/**
 * Objeto com comando de rolagem de dados
 */
export default new Command({
    //Texto de identificação do comando (no caso será /r)
    name: 'r',
    //Descrição do comando
    description: 'Rola qualquer combinação de dados ([ex.1: 1d6], [ex.2: 2d4+3], [ex.3: 2d3+6D7+5d20-2])',
    //Ajuda
    help: '*COMANDO PARA ROLAGEM DE DADOS*\n'+
        '**/r quantidade de dados + d + faces**: rola o número de dados especificados da quantidade solicitada de faces.\n'+
        'EXemplos'+
        '**/r 3d6**: rola 3 dados de 6 faces\n'+
        '**/r 2d4+8D8**: rola 2 dados de 4 faces e soma ao resultado de da rolagem de 8 dados de 8 faces.\n'+
        '**/r 1d6+6d8-2**: rola 1 dado de 6 faces, soma aos resultados da rolagem de 6 dados 8 faces e subtrai 2 do total.'+
        'Opcionamente, pode-se enviar um comentário, que é exibido jundo ao resultado da rolagem.',
    //Parâmetro do comando
    options: [
        {
            //Nome do parâmetro
            name: 'rolagem',
            //Descrição do parâmetro
            description: 'Quantidades e tipos de dados a serem rolados',
            //Tipo do parâmetro
            type: 'STRING',
            //Flag de obrigatoriedade do comando
            required: true
        },
        {
            //Nome do parâmetro
            name: 'comentário',
            //Tipo do parâmetro
            type: 'STRING',
            //Descrição do parâmetro
            description: 'Comentário opcional a ser exibido antes do resultado da jogada',
            //Flag de obrigatoriedade do comadno
            required: false
        }
    ],
    //Chamada de execução do comando
    run: async ({interaction, args})=>{

        //É tentado fazer a rolagem com o parâmetro enviado...
        try {
            //Inicialização do objeto de rolagme de dados
            const dados = new DiceRoller(args.getString('rolagem'));
            //A rolagem é exibida como reply
            interaction.followUp(`/r ${args.getString('rolagem')}`);
            //O resultado da rolagem é formatado para exbição
            const ret:string = `${interaction.user}\n${dados.roll(args.getString('comentário'))}`;
            //A roalgem é exibida
            interaction.channel.send({content: ret});
        //Se de errado, uma mensagem de erro é exibida, com o comando que foi enviado
        } catch (error) {
            interaction.followUp(`${TEXTOS_DE_ERROS.get(error.message)} (/r ${args.getString('rolagem')})`);
        }
    },
});