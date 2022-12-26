import {Client as FaunaClient, query as q} from "faunadb"
import {ThreadChannel, User} from "discord.js";
import knex, { Knex } from "knex"

interface Conversation {
  thread_id: string
  conversation_id?: string
  parent_message_id: string
}

export class Database {
  private db: Knex<any, unknown[]>
  constructor(config: Knex.Config) {
    this.db = knex({...config, useNullAsDefault: true})
  }

  async init() {
    if (!await this.db.schema.hasTable("conversation")) {
      await this.db.schema.createTable("conversation", table => {
        table.string("thread_id").primary()
        table.string("conversation_id").unique()
        table.string("parent_message_id").unique().notNullable()
      }).catch(() => {
      })
    }
  }

  setConversation(thread_id: string, conversation: Omit<Conversation, "thread_id">) {
    return this.db("conversation").insert({
      thread_id,
      ...conversation
    }).onConflict("thread_id").merge()
  }

  getConversation(thread_id: string) {
    return this.db<Conversation>("conversation")
      .select("conversation_id", "parent_message_id")
      .where("thread_id", thread_id)
      .first()
  }

  deleteConversation(thread_id: string) {
    return this.db("conversation").where("thread_id", thread_id).delete()
  }
}