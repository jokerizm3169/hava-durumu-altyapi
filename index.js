const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

// Create a new client instance
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// Create a collection for commands
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
        console.log(`⚠️ The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Deploy commands
async function deployCommands() {
    const commands = [];
    
    for (const command of client.commands.values()) {
        commands.push(command.data.toJSON());
    }
    
    const rest = new REST().setToken(config.token);
    
    try {
        console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);
        
        // Deploy commands globally or to a specific guild
        if (config.guildId) {
            await rest.put(
                Routes.applicationGuildCommands(config.clientId, config.guildId),
                { body: commands },
            );
            console.log(`✅ Successfully reloaded ${commands.length} guild application (/) commands.`);
        } else {
            await rest.put(
                Routes.applicationCommands(config.clientId),
                { body: commands },
            );
            console.log(`✅ Successfully reloaded ${commands.length} global application (/) commands.`);
        }
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
        
        if (error.code === 10002) {
            console.error('💡 Çözüm: config.json dosyasındaki clientId değerini kontrol edin.');
            console.error('💡 clientId, bot tokenınızın başındaki sayılar ile aynı olmalıdır.');
            console.error(`💡 Token: ${config.token.split('.')[0]} -> clientId olmalı`);
        } else if (error.code === 50001) {
            console.error('💡 Çözüm: Bot\'un sunucuda applications.commands yetkisi olduğundan emin olun.');
        } else if (error.code === 10004) {
            console.error('💡 Çözüm: config.json dosyasındaki guildId değerini kontrol edin.');
        }
    }
}

// When the client is ready
client.once('ready', async () => {
    console.log(`🤖 Bot is ready! Logged in as ${client.user.tag}`);
    await deployCommands();
});

// Handle interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.commands.get(interaction.commandName);
    
    if (!command) {
        console.error(`❌ No command matching ${interaction.commandName} was found.`);
        return;
    }
    
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('❌ Error executing command:', error);
        
        const errorMessage = 'Komut çalıştırılırken bir hata oluştu!';
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ 
                    content: errorMessage, 
                    flags: 64 // MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({ 
                    content: errorMessage, 
                    flags: 64 // MessageFlags.Ephemeral
                });
            }
        } catch (followUpError) {
            console.error('❌ Error sending error message:', followUpError);
        }
    }
});

// Error handling
client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Login to Discord
client.login(config.token);
