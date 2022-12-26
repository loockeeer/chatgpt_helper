import {Colors, EmbedBuilder, Guild, User} from "discord.js";

// Heavily inspired from https://github.com/danielglennross/mutex-js/blob/master/lib/index.js
export class Mutex {
  private locks: ((value?: any) => void)[]
  private callCount: number
  constructor() {
    this.locks = []
    this.callCount = 0
  }
  acquireLock(): Promise<any> {
    const ret = this.callCount === 0 ? Promise.resolve() : new Promise(resolve => this.locks.push(resolve))
    this.callCount++
    return ret
  }
  releaseLock() {
    this.locks.shift()?.()
    this.callCount--
  }
}

export enum EmbedUtilType {
  ERROR = Colors.Red,
  INFO = Colors.Blue,
  SUCCESS = Colors.Green,
  BLANK = Colors.DarkButNotBlack
}

export class EmbedUtil extends EmbedBuilder {
  private type: EmbedUtilType

  constructor(type: EmbedUtilType) {
    super()
    this.type = type
    this.setColor(type)
  }

  setContent(content: string): EmbedUtil {
    this.setDescription(content)
    return this
  }

  setTarget(target: Guild | User): EmbedUtil {
    if (target instanceof Guild) {
      this.setAuthor({
        name: target.name,
        iconURL: target.iconURL({
          extension: "png"
        }) || undefined
      })
    } else if (target instanceof User) {
      this.setAuthor({
        name: target.tag,
        iconURL: target.avatarURL({
          extension: "png"
        }) || undefined
      })
    }
    return this
  }
}