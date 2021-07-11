// Coded in Replit

const { Client, Intents, MessageEmbed } = require('discord.js');
const bot_intents = Intents.ALL;
const client = new Client({
  partials: ["MESSAGE", "REACTION", "CHANNEL", "USER"],
  intents: bot_intents
})
const enmap = require('enmap');
const loginToken = process.env['DISCORD_BOT_TOKEN'];
const { prefix } = require('./config.json');

const settings = new enmap({
  name: 'settings',
  autoFetch: true,
  cloneLevel: "deep",
  fetchAll: true
})

client.on('ready', () => {
  console.log('Ticket Test BOT is ready!')
})

client.on('message', async (message) => {
  if(!message.content.startsWith(prefix) || message.author.bot || !message.guild) return;

  const args = message.content.slice(prefix.length).split(/ +/g)
  const command = args.shift().toLowerCase()

   if(command === 'ticket-s') {
    if(!message.member.hasPermission('MANAGE_CHANNELS')) return message.reply("You do not have the `MANAGE_CHANNELS` permission!")
    let channel = message.mentions.channels.first()
    
    if(!channel) return message.reply("**NO CHANNEL PROVIDED** || Please provide a channel for the ticketing system to be put in!")

    message.reply(`Ticket System is now ready! Users of ${message.guild.name} can now open a ticket in ${channel}!`)
    const embed = new MessageEmbed()
     .setColor("BLUE")
     .setTitle("Ticket System")
     .setDescription("React with 🎟️ to open a ticket!")
     .setFooter("Powered by Tickey")
     .setTimestamp()
    
    let sent = await channel.send(embed)
    sent.react('🎟️')

    settings.set(`${message.guild.id}-tickets`, sent.id)
  } else if(command === 'close') {
    if(!message.guild.me.hasPermission('MANAGE_CHANNELS')) return message.reply("I require the `MANAGE_CHANNELS` permission for this command!")
    if(!message.channel.name.includes("ticket-")) return message.reply(`This is **NOT** a ticket channel (a ticket channel would be in this format "ticket-${message.author.username.toLowerCase()} (the username of the user that opened the ticket)")!`)
    message.channel.send("Ticket Closed, deleting channel!")
   await message.channel.delete();
 } else if(command === 'ping') {
   message.reply("Pinging... <a:windows_loading:854438904325472287>").then(resultMessage => {
     const botPing = resultMessage.createdTimestamp - message.createdTimestamp
     const apiPing = client.ws.ping

     resultMessage.edit(`Pong!\n**Bot Latency: ${botPing}**\n**Discord API Latency: ${apiPing}**`)
   })
 } else if(command === 'help') {
   const owner = client.users.cache.get('697414293712273408')
   const embed = new MessageEmbed()
    .setColor("BLUE")
    .setTitle(`${client.user.username} Commands!`)
    .setDescription(`The Bot Prefix is ${prefix}!`)
    .addFields({
      name: 'Ticket',
      value: `ticket-s <#CHANNEL>, close`
    },
    {
      name: 'Other',
      value: 'ping'
    })
    .setFooter(`${client.user.username} By ${owner.tag}`)
    .setTimestamp()
     message.channel.send(embed)
 }
})

client.on('messageReactionAdd', async (messageReaction, user) => {
  if(user.partial) await user.fetch()
  if(messageReaction.partial) await messageReaction.fetch()
  if(messageReaction.message.partial) await messageReaction.message.fetch()

  if(user.bot) return;

  let ticketID = await settings.get(`${messageReaction.message.guild.id}-tickets`);

  if(!ticketID) return;

  if(messageReaction.message.id === ticketID && messageReaction.emoji.name === '🎟️') {
    messageReaction.users.remove(user)

  const channel = messageReaction.message.guild.channels.create(`ticket-${user.username}`, {
      permissionOverwrites: [
        {
          id: user.id,
          allow: ["SEND_MESSAGES","READ_MESSAGE_HISTORY", "VIEW_CHANNEL"]
        },
        {
          id: messageReaction.message.guild.roles.everyone,
          deny: ["VIEW_CHANNEL"]
        }
      ],
      type: 'text'
    }).then(async channel => {
      const openedEmbed = new MessageEmbed()
       .setColor("GREEN")
       .setTitle("Welcome to your Private Ticket!")
       .setDescription(`You can now have a private conversation with the mods of this server! Run ${prefix}close to close this ticket!`)
       .setTimestamp()

       await channel.send(`<@${user.id}>`, openedEmbed)
    })
  }
})

client.login(loginToken)
