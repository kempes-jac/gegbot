import { Command } from "../../structures/Command";


//Texto de regras
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

/**
 * Objeto com comando para exibição de regras do G&G
 */
 export default new Command({
    //Texto de identificação do comando (no caso será /regras)
    name: 'regras',
    //Descrição do comando
    description: 'Exibe as regras do sistema Guaxinins & Gambiarras',
    //Ajuda
    help: '*COMANDO PARA GUAXININS & GAMBIARRAS*\n**/regras**: exibe as regras do sistema Guaxinins & Gambiarras',
    //Chamada de execução do comando
    run: async ({interaction})=>{
        interaction.editReply({content: RULES});
    },
});