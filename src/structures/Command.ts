//Importação da tipo de definição de um comando
import { CommandType } from "../typings/Command";


/**
 * Classe de definição de um comando
 */
export class Command{

    /**
     * Constructor
     * @constructor
     * @param commandOptions Definições do comando a ser criado
     */
    constructor(commandOptions: CommandType){
        //Vínculo entre o objeto enviado como parâmetro e o objeto sendo criado
        Object.assign(this, commandOptions);
    }
}