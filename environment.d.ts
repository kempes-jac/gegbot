declare global{
    namespace NodeJS{
        interface ProcessEnv{
             botToken: string;
             guildID: string;
             environment: "debug"|"prod"|"dev";
        }
    }
}