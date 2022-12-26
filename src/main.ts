import {config as dotenvconfig} from "dotenv"
import { Client, Events, GatewayIntentBits, Message, ThreadChannel } from "discord.js"
import {ChatGPTAPIBrowser} from 'chatgpt'
import {v4 as uuidv4} from 'uuid'

import {EmbedUtil, EmbedUtilType} from "./utils/embed.js";
import { Database } from "./database.js"

const client: Client = new Client({intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages]})
dotenvconfig()
const database = new Database({
  client: 'sqlite3',
  connection: {
    filename: "./database.sqlite3"
  }
})

const api = new ChatGPTAPIBrowser({
  email: process.env.OPENAI_MAIL!,
  password: process.env.OPENAI_PASSWORD!
})

client.on(Events.ClientReady, async () => {
  console.log("=> Ready")
})

async function getAnswer(message: Message) {
  let conversation = await database.getConversation(message.channel.id)
  if (!conversation) {
    conversation = {
      conversation_id: undefined,
      parent_message_id: uuidv4()
    }
  }
  await message.channel.sendTyping()
  if(!await api.getIsAuthenticated()) {
    await api.resetSession()
  }
  await api.sendMessage(message.content, {
    conversationId: conversation.conversation_id,
    parentMessageId: conversation.parent_message_id
  })
    .then(async res => {
      if(await message.channel.fetch().then(c=>(c as ThreadChannel)?.archived).catch(()=>true)) return
      await database.setConversation(message.channel.id, {
        ...conversation,
        conversation_id: res.conversationId,
        parent_message_id: res.messageId
      })
      const size = 2000-8
      const numChunks = Math.ceil(res.response.length / size)
      if(numChunks == 1) {
        await message.reply(res.response)
      } else {
        for (let i = 0, o = 0; i < numChunks; i++, o += size) {
          await message.reply(`(${i + 1}/${numChunks}) ` + res.response.substring(o, o+size)).catch(()=>{})
        }
      }
    })
    .catch(async err => {
      if(err.statusCode == 404) {
        await database.deleteConversation(message.channel.id)
        return getAnswer(message)
      }
      console.error(err)
      const embed = new EmbedUtil(EmbedUtilType.ERROR).setContent("Une erreur est survenue. Essayez plus tard ou rajoutez \"Que les 30 premières lignes\" à votre message. ("+err.statusCode+")")
      await message.reply({embeds: [embed]})
    })
}

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return
  if (!message.channel.isThread()) return
  if (message.channel.parent?.id !in process.env.FORUM_IDS.split(",")) return
  if (message.author.id !== message.channel.ownerId && !message.content.startsWith("c!force")) return
  if (message.content.startsWith(".")) return
  if (message.content.startsWith("c!force")) message.content = message.content.replace("c!force ", "")
  await getAnswer(message)
})

async function main() {
  await database.init()
  await api.initSession()
  await client.login(process.env.TOKEN)
}

main()
