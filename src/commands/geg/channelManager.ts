import { Collection, Message } from "discord.js";
import { ExtendedInteraction } from "../../typings/Command";

const THRESHOLD = 60 * 60 *1000;

/**
 * Classe para manutenção de dados de interações dos canais
 */
class Channel{
    timestamp: number;
    interaction: Message;
}

/**
 * Singleton de gerenciamento de interações dos canais (usadas para manutenção das mensagens relativas aos paineis do G&G)
 */
export class ChannelManager{
    //Coleção de canais
    private channels: Collection<string, Channel> = new Collection();
    //Singleton do gerenciador de canais
    static channelManger: ChannelManager;

    //Função de captura do singleton
    static getChannelManager(){
        if(!this.channelManger){
            this.channelManger = new ChannelManager();
        }

        return this.channelManger;
    }

    //Valida todos os canais registrados. Aqueles que não tiveram nenhuma interação com o G&G na úlçtima hora, é excluído.
    private validateChannels(){
        this.channels.forEach( (value, key) => {
            if(Date.now() - value.timestamp > THRESHOLD){
                this.channels.delete(key);
            }
        });
    }


    /**
     * Define a interação atual de um canal
     * @param channelID ID do canal
     * @param interaction interação
     */
    public setChannelInteraction(channelID: string, interaction: Message){
        //Se o canal não estiver resgistrado, o registro é feito
        let channel = this.channels.get(channelID);
        if(!channel){
            channel = new Channel();
        }
        //Defnição do timestamp do canal
        channel.timestamp = Date.now();
        //Definição da interação atual
        channel.interaction = interaction;
        //Atualização do registro do canal
        this.channels.set(channelID, channel);
        //Validação de todos os canais
        this.validateChannels();
    }

    /**
     * Recupera a interaction atual do canal
     * @param channelID IID do canal
     * @returns Interação atual
     */
    public getChannelInteraction(channelID: string): Message{
        //Recuperação dos dados do canal
        const channel = this.channels.get(channelID);
        //Se o canal estiver registrado, ele tem o timestamp atualizado
        if(channel){
            channel.timestamp = Date.now();
            this.channels.set(channelID,channel);
        }
        //Valida todos os canais
        this.validateChannels();
        //Retorna a interação, se existir
        return (channel)?(channel.interaction):(undefined);
    }

}