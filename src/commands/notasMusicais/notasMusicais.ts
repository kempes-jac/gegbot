import { Command } from "../../structures/Command";
import { ExtendedInteraction } from "../../typings/Command";

//Conjunto de notas musicais válidas
const MUSICAL_NOTES: Array<string> = [
    'A',
    '**A#**',
    'B',
    'C',
    '**C#**',
    'D',
    '**D#**',
    'E',
    'F',
    '**F#**',
    'G',
    '**G#**'
];

//Reply
const NOTES: string = '🎶';


/**
 * Classe para sorteio de notas musicais
 */
class MusicaNotes{

    /**
     * SOrteia um conjunto de notas musicais
     * @param notes Quantidade de notas
     * @param interaction Interação que disparou o processo
     * @param comment Comentário opcional
     */
    public drawNotes(notes: number, interaction: ExtendedInteraction, comment?:string){
        //Inicialização da string de retorno
        let ret:string  = '';
        //Loop de escolha de notas
        for(let i=0;i<notes;i++){
            ret += ' '+MUSICAL_NOTES[Math.floor(Math.random()*MUSICAL_NOTES.length)]+',';
        }
        //Exclusão da última vírgula
        ret = ret.substring(0,ret.length-1);
        //Reply
        interaction.editReply({content: `${(comment)?(comment):(NOTES)}`});
        //Formatação da string de retorno
        ret = `${interaction.user}, [${ret} ]`;
        //Exibição do resultado do sorteio
        interaction.channel.send({content: ret});
    } 
}



/**
 * Objeto com comando para sorteio de notas musicais
 */
export default new Command({
    name: 'n',
    description: 'Sorteia notas busicais',
    help: '*COMANDO PARA NOTAS MUSICAIS*:\n**/n número**: sorteia um número de notas musicais naturais e seus acidentes',
    options: [
        {
            name: 'notas',
            description: 'Quantidade de notas',
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
    run: async ({interaction, args})=>{
        //Criação objeto para sorteio de notas        
        const musical: MusicaNotes = new MusicaNotes();
        //Sorteio das notas
        musical.drawNotes(args.getInteger('notas'),interaction,args.getString('comentário'))
    },
});